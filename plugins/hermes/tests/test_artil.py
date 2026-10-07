from __future__ import annotations

import asyncio
import os
import signal
from pathlib import Path

from gateway.config import PlatformConfig

from conftest import context, plugin


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


def adapter_running(command: str):
    adapter = plugin.ArtilAdapter(PlatformConfig(enabled=True, extra={"command": command}))
    adapter.STOP_GRACE_SECONDS = 0.05
    events = []

    async def handle_message(event):
        events.append(event)

    adapter.handle_message = handle_message
    return adapter, events


def test_registers_the_artil_platform_with_a_hint_on_answering():
    assert context.entry["name"] == "artil"
    assert "artil email send --reply-to" in context.entry["platform_hint"]


def test_lets_artil_itself_through_the_gateways_sender_allowlist(tmp_path):
    adapter, _ = adapter_running(str(tmp_path / "artil"))

    assert adapter.config.extra["allow_from"] == ["artil"]


def test_hands_each_notice_to_the_gateway_until_it_disconnects(tmp_path):
    artil = artil_running(
        tmp_path,
        """echo "$*" > "$0.args"; """
        """printf '%s\\n' '{"content":"Ada sent an email","meta":{"message_id":"mail:1"}}'; exec cat""",
    )

    async def scenario():
        adapter, events = adapter_running(artil)

        assert await adapter.connect()
        await eventually(lambda: events)
        await adapter.disconnect()

        return adapter, events

    adapter, [event] = asyncio.run(scenario())

    assert event.text == "Ada sent an email"
    assert event.message_id == "mail:1"
    assert event.source.chat_id == "artil"
    assert event.source.user_id == "artil"
    assert event.allow_gateway_control is False
    assert (tmp_path / "artil.args").read_text() == "internal hermes-channel\n"
    assert not adapter.has_fatal_error


def test_stops_with_the_reason_artil_gave(tmp_path):
    artil = artil_running(tmp_path, 'echo "This needs a login as one agent account." >&2; exit 1')

    async def scenario():
        adapter, _ = adapter_running(artil)

        assert await adapter.connect()
        await eventually(lambda: adapter.has_fatal_error)

        return adapter

    adapter = asyncio.run(scenario())

    assert adapter.fatal_error_message == "This needs a login as one agent account."
    assert adapter.fatal_error_retryable is False


def test_tries_again_when_artil_stops_while_the_gateway_runs(tmp_path):
    artil = artil_running(tmp_path, "exit 0")

    async def scenario():
        adapter, _ = adapter_running(artil)

        assert await adapter.connect()
        await eventually(lambda: adapter.has_fatal_error)

        return adapter

    assert asyncio.run(scenario()).fatal_error_retryable is True


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
    assert adapter.fatal_error_message.startswith(f"Could not run {tmp_path / 'missing' / 'artil'}")


def test_keeps_the_agents_words_in_the_session(tmp_path):
    adapter, _ = adapter_running(str(tmp_path / "artil"))

    result = asyncio.run(adapter.send("artil", "I answered Ada."))

    assert result.success is True
