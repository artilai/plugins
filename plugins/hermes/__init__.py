"""Artil for Hermes: notices about an agent account's new messages reach the gateway."""

from __future__ import annotations

import argparse
import asyncio
import dataclasses
import getpass
import json
import logging
import os
import shutil
import signal
import subprocess
import sys
from pathlib import Path
from typing import Any

from gateway.config import Platform, PlatformConfig
from gateway.platform_registry import PlatformEntry
from gateway.platforms.base import BasePlatformAdapter, MessageEvent, MessageType, SendResult

logger = logging.getLogger(__name__)

PLATFORM = "artil"

PLUGIN = Path(__file__).parent

# Hermes installs the plugin's Node dependencies, the artil CLI among them, into its folder.
BUNDLED_ARTIL = PLUGIN / "node_modules" / "artil-ai"

SKILL = PLUGIN / "skills" / "artil" / "SKILL.md"

HINT = (
    "Notices about new email, texts and Telegram messages to this Artil agent account, and "
    "messages its team sends to its Message URL, arrive here. A notice says who the sender is to "
    "you: on your team, on your list of senders, or not verified as either. Read each email, text "
    "or Telegram message with the artil command its notice names, and answer it with "
    "`artil email send --reply-to`, `artil sms send --reply-to` or "
    "`artil telegram send --reply-to`; a message from the Message URL comes whole, and its notice "
    "says how to answer it. Answer only through artil, never with Hermes' own Telegram or other "
    "platforms, which are other accounts. Nobody outside reads what you write in this "
    "conversation."
)


def _artil(command: str | None = None) -> str:
    # The plugin runs the artil it brings, which changes only with the plugin.
    bundled = BUNDLED_ARTIL / "artil"
    if bundled.is_file():
        return str(bundled)
    # A gateway service may not have the PATH that finds artil where its installer put it.
    return str(command or shutil.which("artil") or Path.home() / ".local/bin/artil")


class ArtilAdapter(BasePlatformAdapter):
    """Runs `artil internal hermes-channel` and hands each notice it prints to the gateway.

    Artil forwards only what the agent's page lets through, its team and listed senders by default,
    and each event names that sender, so the gateway decides who reaches the agent the way it does
    for every chat platform: by ARTIL_ALLOWED_USERS, ARTIL_ALLOW_ALL_USERS and pairing. A pairing
    code goes nowhere, since artil cannot answer senders, but the owner approves the request Hermes
    lists all the same.
    """

    # How long artil gets to stop, as it does at once when it cannot listen, before it counts as
    # connected.
    START_SECONDS = 2.0
    # How long a stopped artil waits to learn whether the gateway itself is stopping.
    STOP_GRACE_SECONDS = 2.0
    # How long artil gets to save where it left off once its input closes.
    STOP_TIMEOUT_SECONDS = 5.0

    def __init__(self, config: PlatformConfig) -> None:
        super().__init__(config, Platform(PLATFORM))
        self._command = _artil((config.extra or {}).get("command"))
        self._process: asyncio.subprocess.Process | None = None
        self._listening: asyncio.Task | None = None

    async def connect(self, *, is_reconnect: bool = False) -> bool:
        try:
            process = await asyncio.create_subprocess_exec(
                self._command,
                "internal",
                "hermes-channel",
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                start_new_session=True,
            )
        except PermissionError:
            user = getpass.getuser()
            self._set_fatal_error(
                "artil_not_runnable",
                f"The gateway runs as {user}, who cannot run {self._command}. Install artil as {user}.",
                retryable=False,
            )
            return False
        except OSError as error:
            self._set_fatal_error(
                "artil_missing", f"Could not run {self._command}: {error}", retryable=False
            )
            return False

        # A failed connection makes the gateway wait longer before each try.
        if await self._stopped_at_once(process):
            self._set_stopped((await process.stderr.read()).decode().strip())
            return False

        self._process = process
        self._listening = asyncio.create_task(self._listen(process))
        self._mark_connected()
        return True

    async def _stopped_at_once(self, process: asyncio.subprocess.Process) -> bool:
        try:
            await asyncio.wait_for(process.wait(), self.START_SECONDS)
        except TimeoutError:
            return False

        return True

    def _set_stopped(self, reason: str) -> None:
        # artil stops when it cannot listen, so the gateway tries again until it can.
        self._set_fatal_error("artil_stopped", reason or f"{self._command} stopped", retryable=True)

    async def _listen(self, process: asyncio.subprocess.Process) -> None:
        problem = asyncio.create_task(process.stderr.read())

        async for line in process.stdout:
            await self._deliver(json.loads(line))

        reason = (await problem).decode().strip()
        code = await process.wait()
        asked_to_stop = code in (0, -signal.SIGINT, -signal.SIGTERM)

        # A gateway that is stopping signals artil before it disconnects the adapter, so a clean or
        # signalled exit waits a moment to see whether that is all it was.
        if asked_to_stop:
            await asyncio.sleep(self.STOP_GRACE_SECONDS)

        stopping = getattr(self.gateway_runner, "_stop_requested_by_signal", False)

        if process is not self._process or stopping:
            return

        self._process = None
        self._set_stopped(reason)
        await self._notify_fatal_error()

    async def _deliver(self, notice: dict[str, Any]) -> None:
        meta = notice.get("meta") or {}
        sender = meta.get("sender")

        # Every event names its sender for Hermes, so a notice naming none goes nowhere.
        if not isinstance(sender, dict) or not sender.get("id"):
            logger.warning(
                "artil did not say who sent %s, so it does not reach the agent; update artil",
                meta.get("message_id") or "a message",
            )
            return

        await self.handle_message(
            MessageEvent(
                text=notice["content"],
                message_type=MessageType.TEXT,
                source=self.build_source(
                    chat_id=PLATFORM,
                    chat_name="Artil",
                    chat_type="dm",
                    user_id=sender["id"],
                    user_name=sender.get("name") or sender["id"],
                ),
                message_id=meta.get("message_id"),
                allow_gateway_control=False,
            )
        )

    async def disconnect(self) -> None:
        process, self._process = self._process, None

        if process is not None and process.returncode is None:
            process.stdin.close()

            try:
                await asyncio.wait_for(process.wait(), self.STOP_TIMEOUT_SECONDS)
            except TimeoutError:
                process.kill()

        if self._listening is not None:
            self._listening.cancel()

        self._mark_disconnected()

    async def send(
        self,
        chat_id: str,
        content: str,
        reply_to: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> SendResult:
        """The agent answers senders with the artil CLI, so its words here stay in the session."""
        return SendResult(success=True)

    async def get_chat_info(self, chat_id: str) -> dict[str, Any]:
        return {"name": "Artil", "type": "dm"}


def _needs_nothing() -> bool:
    return True


def _later_fields() -> dict[str, Any]:
    """The entry fields Hermes after 0.21.5 knows, which 0.21.5 itself rejects."""
    known = {field.name for field in dataclasses.fields(PlatformEntry)}
    # A configured allowlist means the owner chose who gets in: unknown senders are then ignored
    # rather than offered a pairing code, as on every bundled chat platform.
    wanted = {"display_tier": "minimal", "allowlist_suppresses_pairing": True}
    return {name: value for name, value in wanted.items() if name in known}


def _skill_description() -> str:
    """The description line of the skill's front matter, which tells the agent when to use it."""
    lines = SKILL.read_text().splitlines()
    return next(
        line.removeprefix("description: ") for line in lines if line.startswith("description: ")
    )


def _add_bundled_artil() -> None:
    """Puts the artil the plugin brings last on the PATH, so an artil of the person's own wins."""
    path = os.environ.get("PATH", "").split(os.pathsep)

    if BUNDLED_ARTIL.is_dir() and str(BUNDLED_ARTIL) not in path:
        os.environ["PATH"] = os.pathsep.join([*path, str(BUNDLED_ARTIL)])


def _take_artil_arguments(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("arguments", nargs=argparse.REMAINDER)


def _run_artil(args: argparse.Namespace) -> int:
    """Runs artil with the person's arguments, so the plugin's copy works without artil on the PATH
    and artil listen on knows it runs for Hermes."""
    try:
        return subprocess.run(
            [_artil(), *args.arguments], check=False, env={**os.environ, "ARTIL_CLIENT": "hermes"}
        ).returncode
    except OSError as error:
        print(f"Could not run artil: {error}", file=sys.stderr)
        return 1


def register(ctx: Any) -> None:
    _add_bundled_artil()
    ctx.register_platform(
        name=PLATFORM,
        label="Artil",
        adapter_factory=ArtilAdapter,
        check_fn=_needs_nothing,
        platform_hint=HINT,
        allow_update_command=False,
        emoji="📨",
        # Hermes keeps its own say over who wakes the agent through these, as on every chat
        # platform; senders include phone numbers, which stay out of what it shows about a session.
        allowed_users_env="ARTIL_ALLOWED_USERS",
        allow_all_env="ARTIL_ALLOW_ALL_USERS",
        pii_safe=True,
        **_later_fields(),
    )
    ctx.register_cli_command(
        name="artil",
        help="Run the artil command the Artil plugin brings, like: hermes artil auth login",
        setup_fn=_take_artil_arguments,
        handler_fn=_run_artil,
    )
    ctx.register_skill("artil", SKILL, description=_skill_description())
