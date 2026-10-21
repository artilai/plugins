"""Artil for Hermes: notices about an agent account's new messages reach the gateway."""

from __future__ import annotations

import asyncio
import dataclasses
import getpass
import json
import shutil
import signal
from pathlib import Path
from typing import Any

from gateway.config import Platform, PlatformConfig
from gateway.platform_registry import PlatformEntry
from gateway.platforms.base import BasePlatformAdapter, MessageEvent, MessageType, SendResult

PLATFORM = "artil"

HINT = (
    "Notices about new email, texts and Telegram messages to this Artil agent account, and "
    "messages its team sends to its Message URL, arrive here. Read each email, text or Telegram "
    "message with the artil command its notice names, and answer it with "
    "`artil email send --reply-to`, `artil sms send --reply-to` or "
    "`artil telegram send --reply-to`; a message from the Message URL comes whole, and its notice "
    "says how to answer it. Answer only through artil, never with Hermes' own Telegram or other "
    "platforms, which are other accounts. Nobody outside reads what you write in this "
    "conversation."
)


class ArtilAdapter(BasePlatformAdapter):
    """Runs `artil internal hermes-channel` and hands each notice it prints to the gateway."""

    # How long a stopped artil waits to learn whether the gateway itself is stopping.
    STOP_GRACE_SECONDS = 2.0
    # How long artil gets to save where it left off once its input closes.
    STOP_TIMEOUT_SECONDS = 5.0

    def __init__(self, config: PlatformConfig) -> None:
        config.extra = {**(config.extra or {}), "allow_from": [PLATFORM]}
        super().__init__(config, Platform(PLATFORM))
        # A gateway service may not have the PATH that finds artil where its installer put it.
        self._command = str(
            config.extra.get("command") or shutil.which("artil") or Path.home() / ".local/bin/artil"
        )
        self._source = self.build_source(
            chat_id=PLATFORM,
            chat_name="Artil",
            chat_type="dm",
            user_id=PLATFORM,
            user_name="Artil",
        )
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

        self._process = process
        self._listening = asyncio.create_task(self._listen(process))
        self._mark_connected()
        return True

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
        self._set_fatal_error(
            "artil_stopped", reason or f"{self._command} stopped", retryable=asked_to_stop
        )
        await self._notify_fatal_error()

    async def _deliver(self, notice: dict[str, Any]) -> None:
        meta = notice.get("meta") or {}

        await self.handle_message(
            MessageEvent(
                text=notice["content"],
                message_type=MessageType.TEXT,
                source=self._source,
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


def _service_fields() -> dict[str, Any]:
    """The entry fields Hermes after 0.21.5 knows, which 0.21.5 itself rejects."""
    known = {field.name for field in dataclasses.fields(PlatformEntry)}
    wanted = {"trusted_inbound": True, "display_tier": "minimal"}
    return {name: value for name, value in wanted.items() if name in known}


def register(ctx: Any) -> None:
    ctx.register_platform(
        name=PLATFORM,
        label="Artil",
        adapter_factory=ArtilAdapter,
        check_fn=_needs_nothing,
        platform_hint=HINT,
        allow_update_command=False,
        emoji="📨",
        **_service_fields(),
    )
