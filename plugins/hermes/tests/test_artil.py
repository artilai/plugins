from __future__ import annotations

import argparse
import asyncio
import getpass
import json
import logging
import os
import signal
from pathlib import Path

import pytest
from gateway.config import Platform, PlatformConfig

from conftest import context, plugin


@pytest.fixture(autouse=True)
def without_the_bundled_artil(tmp_path, monkeypatch):
    monkeypatch.setattr(plugin, "BUNDLED_ARTIL", tmp_path / "node_modules" / "artil-ai")


def artil_running(tmp_path: Path, script: str) -> str:
    artil = tmp_path / "artil"
    artil.write_text(f"#!/bin/sh\n{script}\n")
    artil.chmod(0o755)
    return str(artil)


async def eventually(check) -> None:
    for _ in range(400):
        if check():
            return
        await asyncio.sleep(0.01)
    assert check()


def adapter_running(command: str | None):
    adapter = plugin.ArtilAdapter(PlatformConfig(enabled=True, extra={"command": command}))
    adapter.START_SECONDS = 0.2
    adapter.STOP_GRACE_SECONDS = 0.05
    events = []

    async def handle_message(event):
        events.append(event)

    adapter.handle_message = handle_message
    return adapter, events


def test_registers_the_artil_platform_with_a_hint_on_answering():
    assert context.entry["name"] == "artil"
    assert "artil email send --reply-to" in context.entry["platform_hint"]


def test_leaves_who_may_wake_the_agent_to_hermes(tmp_path):
    adapter, _ = adapter_running(str(tmp_path / "artil"))

    assert "trusted_inbound" not in context.entry
    assert context.entry["allowed_users_env"] == "ARTIL_ALLOWED_USERS"
    assert context.entry["allow_all_env"] == "ARTIL_ALLOW_ALL_USERS"
    assert context.entry["allowlist_suppresses_pairing"] is True
    assert context.entry["pii_safe"] is True
    assert adapter.authorization_is_upstream is False
    assert "allow_from" not in adapter.config.extra


def hermes_deciding(adapter):
    """A gateway runner with just what its authorization reads: our adapter and no pairing store."""
    from gateway.run import GatewayRunner

    runner = object.__new__(GatewayRunner)
    runner.pairing_store = None
    runner.adapters = {Platform(plugin.PLATFORM): adapter}
    return runner


def source_of(adapter, sender: str):
    return adapter.build_source(
        chat_id="artil", chat_name="Artil", chat_type="dm", user_id=sender, user_name=sender
    )


def test_hermes_refuses_a_sender_until_its_own_allowlist_names_them(tmp_path, monkeypatch):
    for name in (
        "ARTIL_ALLOWED_USERS",
        "ARTIL_ALLOW_ALL_USERS",
        "GATEWAY_ALLOWED_USERS",
        "GATEWAY_ALLOW_ALL_USERS",
    ):
        monkeypatch.delenv(name, raising=False)
    adapter, _ = adapter_running(str(tmp_path / "artil"))
    hermes = hermes_deciding(adapter)
    artil = Platform(plugin.PLATFORM)
    ada = source_of(adapter, "ada@example.com")
    stranger = source_of(adapter, "+14155550101")

    assert hermes._is_user_authorized(ada) is False
    assert hermes._get_unauthorized_dm_behavior(artil) == "pair"

    monkeypatch.setenv("ARTIL_ALLOWED_USERS", "ada@example.com")

    assert hermes._is_user_authorized(ada) is True
    assert hermes._is_user_authorized(stranger) is False
    assert hermes._get_unauthorized_dm_behavior(artil) == "ignore"

    monkeypatch.delenv("ARTIL_ALLOWED_USERS")
    monkeypatch.setenv("ARTIL_ALLOW_ALL_USERS", "true")

    assert hermes._is_user_authorized(stranger) is True


def notice(content: str, sender: dict[str, str | None] | None, message_id: str = "mail:1") -> str:
    meta = {"message_id": message_id, "channel": "email"}
    if sender is not None:
        meta["sender"] = sender
    return json.dumps({"content": content, "meta": meta})


def test_hands_each_notice_to_the_gateway_as_its_sender_until_it_disconnects(tmp_path):
    ada = notice("Ada sent an email", {"id": "ada@example.com", "name": "Ada", "admission": "team"})
    stranger = notice(
        "Someone sent an email",
        {"id": "x@example.org", "name": None, "admission": "anyone"},
        "mail:2",
    )
    artil = artil_running(
        tmp_path,
        f"""echo "$*" > "$0.args"; printf '%s\\n' '{ada}' '{stranger}'; exec cat""",
    )

    async def scenario():
        adapter, events = adapter_running(artil)

        assert await adapter.connect()
        await eventually(lambda: len(events) == 2)
        await adapter.disconnect()

        return adapter, events

    adapter, [event, other] = asyncio.run(scenario())

    assert event.text == "Ada sent an email"
    assert event.message_id == "mail:1"
    assert event.source.chat_id == "artil"
    assert event.source.chat_type == "dm"
    assert event.source.user_id == "ada@example.com"
    assert event.source.user_name == "Ada"
    assert event.allow_gateway_control is False
    assert other.source.user_id == "x@example.org"
    assert other.source.user_name == "x@example.org"
    assert (tmp_path / "artil.args").read_text() == "internal hermes-channel\n"
    assert not adapter.has_fatal_error


def test_keeps_a_notice_that_names_no_sender_from_the_agent(tmp_path, caplog):
    artil = artil_running(
        tmp_path, f"""printf '%s\\n' '{notice("An email arrived", None)}'; exec cat"""
    )

    async def scenario():
        adapter, events = adapter_running(artil)

        assert await adapter.connect()
        await eventually(lambda: "update artil" in caplog.text)
        await adapter.disconnect()

        return events

    with caplog.at_level(logging.WARNING):
        events = asyncio.run(scenario())

    assert events == []
    assert "artil did not say who sent mail:1" in caplog.text


def test_fails_to_connect_with_the_reason_artil_gave_and_tries_again(tmp_path):
    artil = artil_running(tmp_path, 'echo "You are not signed in." >&2; exit 1')
    adapter, _ = adapter_running(artil)

    assert asyncio.run(adapter.connect()) is False
    assert adapter.fatal_error_message == "You are not signed in."
    assert adapter.fatal_error_retryable is True


def test_tries_again_when_artil_stops_while_the_gateway_runs(tmp_path):
    artil = artil_running(tmp_path, 'sleep 0.5; echo "Could not reach Artil." >&2; exit 1')

    async def scenario():
        adapter, _ = adapter_running(artil)

        assert await adapter.connect()
        await eventually(lambda: adapter.has_fatal_error)

        return adapter

    adapter = asyncio.run(scenario())

    assert adapter.fatal_error_message == "Could not reach Artil."
    assert adapter.fatal_error_retryable is True


def test_lets_artil_go_quietly_when_the_gateway_disconnects_it_while_stopping(tmp_path):
    artil = artil_running(tmp_path, 'echo $$ > "$0.pid"; exec cat')

    async def scenario():
        adapter, _ = adapter_running(artil)

        assert await adapter.connect()
        await eventually(lambda: (tmp_path / "artil.pid").exists())
        os.kill(int((tmp_path / "artil.pid").read_text()), signal.SIGTERM)
        await adapter.disconnect()
        await asyncio.sleep(adapter.STOP_GRACE_SECONDS * 2)

        return adapter

    assert not asyncio.run(scenario()).has_fatal_error


def test_lets_artil_go_quietly_when_a_signal_stops_the_gateway(tmp_path):
    artil = artil_running(tmp_path, 'echo $$ > "$0.pid"; exec cat')

    async def scenario():
        adapter, _ = adapter_running(artil)
        adapter.gateway_runner = type("Runner", (), {"_stop_requested_by_signal": True})()

        assert await adapter.connect()
        await eventually(lambda: (tmp_path / "artil.pid").exists())
        os.kill(int((tmp_path / "artil.pid").read_text()), signal.SIGTERM)
        await asyncio.sleep(adapter.STOP_GRACE_SECONDS * 2)

        return adapter

    assert not asyncio.run(scenario()).has_fatal_error


def test_says_when_the_artil_command_is_missing(tmp_path):
    adapter, _ = adapter_running(str(tmp_path / "missing" / "artil"))

    assert asyncio.run(adapter.connect()) is False
    assert adapter.fatal_error_code == "artil_missing"
    assert adapter.fatal_error_message.startswith(f"Could not run {tmp_path / 'missing' / 'artil'}")


def test_says_when_the_gateways_user_cannot_run_artil(tmp_path):
    artil = artil_running(tmp_path, "exec cat")
    Path(artil).chmod(0o644)
    adapter, _ = adapter_running(artil)

    assert asyncio.run(adapter.connect()) is False
    assert adapter.fatal_error_code == "artil_not_runnable"
    user = getpass.getuser()
    assert adapter.fatal_error_message == (
        f"The gateway runs as {user}, who cannot run {artil}. Install artil as {user}."
    )


def test_runs_the_artil_its_installer_put_in_local_bin_without_a_command(tmp_path, monkeypatch):
    installed = tmp_path / ".local" / "bin"
    installed.mkdir(parents=True)
    artil = artil_running(installed, 'echo "$*" > "$0.args"; exec cat')
    monkeypatch.setenv("HOME", str(tmp_path))
    monkeypatch.setenv("PATH", "/usr/bin:/bin")

    async def scenario():
        adapter, _ = adapter_running(None)

        assert await adapter.connect()
        await eventually(lambda: Path(f"{artil}.args").exists())
        await adapter.disconnect()

    asyncio.run(scenario())


def test_runs_the_artil_the_plugin_brings_ahead_of_any_other(tmp_path, monkeypatch):
    bundled = tmp_path / "node_modules" / "artil-ai"
    bundled.mkdir(parents=True)
    artil = artil_running(bundled, 'echo "$*" > "$0.args"; exec cat')
    other = artil_running(tmp_path, "exit 1")
    monkeypatch.setenv("PATH", f"{tmp_path}:/usr/bin:/bin")

    async def scenario():
        adapter, _ = adapter_running(other)

        assert await adapter.connect()
        await eventually(lambda: Path(f"{artil}.args").exists())
        await adapter.disconnect()

    asyncio.run(scenario())


def test_keeps_the_agents_words_in_the_session(tmp_path):
    adapter, _ = adapter_running(str(tmp_path / "artil"))

    result = asyncio.run(adapter.send("artil", "I answered Ada."))

    assert result.success is True


def test_puts_the_artil_the_plugin_brings_last_on_the_path_once(tmp_path, monkeypatch):
    monkeypatch.setattr(plugin, "BUNDLED_ARTIL", tmp_path)
    monkeypatch.setenv("PATH", "/usr/bin:/bin")

    plugin._add_bundled_artil()
    plugin._add_bundled_artil()

    assert os.environ["PATH"] == f"/usr/bin:/bin:{tmp_path}"


def test_leaves_the_path_alone_when_hermes_skipped_the_plugins_dependencies(tmp_path, monkeypatch):
    monkeypatch.setattr(plugin, "BUNDLED_ARTIL", tmp_path / "missing")
    monkeypatch.setenv("PATH", "/usr/bin:/bin")

    plugin._add_bundled_artil()

    assert os.environ["PATH"] == "/usr/bin:/bin"


def test_hermes_artil_runs_artil_with_its_arguments_and_exits_as_it_does(tmp_path, monkeypatch):
    artil = artil_running(tmp_path, 'echo "$ARTIL_CLIENT $*" > "$0.args"; exit 3')
    monkeypatch.setenv("PATH", f"{tmp_path}:/usr/bin:/bin")
    parser = argparse.ArgumentParser()
    context.command["setup_fn"](parser)

    args = parser.parse_args(["auth", "login", "--token", "artil_secret"])

    assert context.command["name"] == "artil"
    assert context.command["handler_fn"](args) == 3
    assert Path(f"{artil}.args").read_text() == "hermes auth login --token artil_secret\n"


def set_up_choosing(monkeypatch, choice: int, senders: str = "") -> dict[str, str]:
    import hermes_cli.cli_output
    import hermes_cli.config
    import hermes_cli.gateway_setup_wizard
    import hermes_cli.setup

    saved: dict[str, str] = {}
    asked: list[str] = []
    monkeypatch.setattr(hermes_cli.config, "get_env_value", lambda name: None)
    monkeypatch.setattr(hermes_cli.gateway_setup_wizard, "print_setup_header", lambda title: None)
    monkeypatch.setattr(
        hermes_cli.gateway_setup_wizard, "save_env_values", lambda **v: saved.update(v)
    )
    monkeypatch.setattr(
        hermes_cli.gateway_setup_wizard, "prompt_csv", lambda text, default: senders
    )
    monkeypatch.setattr(
        hermes_cli.setup, "prompt_choice", lambda q, choices, default: asked.append(q) or choice
    )
    monkeypatch.setattr(hermes_cli.cli_output, "print_info", lambda text: None)
    monkeypatch.setattr(hermes_cli.cli_output, "print_success", lambda text: None)

    context.entry["setup_fn"]()

    assert asked == ["  Who may wake the agent?"]
    return saved


def test_setup_lets_the_agents_page_in_artil_decide_by_default(monkeypatch):
    assert set_up_choosing(monkeypatch, 0) == {"ARTIL_ALLOW_ALL_USERS": "true"}


def test_setup_keeps_the_senders_named_instead(monkeypatch):
    saved = set_up_choosing(monkeypatch, 1, "ada@example.com,+14155550101")

    assert saved == {
        "ARTIL_ALLOWED_USERS": "ada@example.com,+14155550101",
        "ARTIL_ALLOW_ALL_USERS": "false",
    }
    assert set_up_choosing(monkeypatch, 1, "") == {}


def test_setup_leaves_approving_senders_to_pairing(monkeypatch):
    assert set_up_choosing(monkeypatch, 2) == {"ARTIL_ALLOW_ALL_USERS": "false"}


def test_offers_the_artil_skill_with_the_description_its_file_gives():
    assert context.skill["name"] == "artil"
    assert context.skill["path"].read_text().startswith("---\nname: artil\n")
    assert context.skill["description"].startswith("Read and answer the agent account's email")
