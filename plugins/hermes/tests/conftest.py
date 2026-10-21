"""Load the plugin directory as the package Hermes would import, and register its platform."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

PLUGIN = Path(__file__).resolve().parents[1]


def _load_plugin():
    spec = importlib.util.spec_from_file_location(
        "artil_plugin",
        PLUGIN / "__init__.py",
        submodule_search_locations=[str(PLUGIN)],
    )
    module = importlib.util.module_from_spec(spec)
    sys.modules["artil_plugin"] = module
    spec.loader.exec_module(module)
    return module


class _Context:
    def register_platform(self, **entry):
        from gateway.platform_registry import PlatformEntry, platform_registry

        self.entry = entry
        platform_registry.register(PlatformEntry(source="plugin", **entry))

    def register_cli_command(self, **command):
        self.command = command

    def register_skill(self, name, path, **options):
        self.skill = {"name": name, "path": path, **options}


plugin = _load_plugin()
context = _Context()
plugin.register(context)
