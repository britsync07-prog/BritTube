"""Backward-compatible re-export from the new config location.

The old BritTube code uses `from app.core.config import config` where `config`
is an object with `.app`, `.proxy`, `.azure` attributes. The new MPT config
exports these as module-level variables. This wrapper provides compatibility.
"""
from app.config.config import (  # noqa: F401
    app, whisper, proxy, azure, siliconflow, elevenlabs, chatterbox, ui,
    listen_host, listen_port, project_name, project_version, hostname, log_level,
    root_dir, config_file,
)


class _ConfigCompat:
    """Compatibility wrapper that makes module-level vars accessible as attributes."""
    def __init__(self):
        self.app = app
        self.whisper = whisper
        self.proxy = proxy
        self.azure = azure
        self.siliconflow = siliconflow
        self.elevenlabs = elevenlabs
        self.chatterbox = chatterbox
        self.ui = ui

    def get(self, key, default=None):
        return app.get(key, default)


config = _ConfigCompat()
