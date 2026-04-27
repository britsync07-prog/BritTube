import os
import shutil
import socket
import toml
from loguru import logger

# Base directory for the backend
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.realpath(__file__))))
config_dir = os.path.join(backend_dir, "config")
config_file = os.path.join(config_dir, "config.toml")
storage_dir = os.path.join(backend_dir, "storage")

if not os.path.exists(storage_dir):
    os.makedirs(storage_dir)

def load_config():
    if not os.path.isfile(config_file):
        logger.warning(f"config file not found: {config_file}")
        return {}

    logger.info(f"load config from file: {config_file}")

    try:
        _config_ = toml.load(config_file)
    except Exception as e:
        logger.warning(f"load config failed: {str(e)}, try to load as utf-8-sig")
        # toml module might not be available or fails
        try:
            with open(config_file, mode="r", encoding="utf-8-sig") as fp:
                _cfg_content = fp.read()
                _config_ = toml.loads(_cfg_content)
        except:
             return {}
    return _config_

class Config:
    def __init__(self, data):
        self._data = data
        self.app = data.get("app", {})
        self.whisper = data.get("whisper", {})
        self.proxy = data.get("proxy", {})
        self.azure = data.get("azure", {})
        self.siliconflow = data.get("siliconflow", {})
        self.ui = data.get("ui", {"hide_log": False})
        self.log_level = data.get("log_level", "DEBUG")
        self.listen_host = data.get("listen_host", "0.0.0.0")
        self.listen_port = data.get("listen_port", 9090)
        self.project_name = data.get("project_name", "BritTube-Backend")
        self.project_version = data.get("project_version", "1.0.0")

    def get(self, key, default=None):
        return self._data.get(key, default)

_cfg_data = load_config()
config = Config(_cfg_data)

# Re-export for compatibility
app = config.app
ui = config.ui
listen_host = config.listen_host
listen_port = config.listen_port
project_name = config.project_name
project_version = config.project_version

hostname = socket.gethostname()

imagemagick_path = app.get("imagemagick_path", "")
if imagemagick_path and os.path.isfile(imagemagick_path):
    os.environ["IMAGEMAGICK_BINARY"] = imagemagick_path

ffmpeg_path = app.get("ffmpeg_path", "")
if ffmpeg_path and os.path.isfile(ffmpeg_path):
    os.environ["IMAGEIO_FFMPEG_EXE"] = ffmpeg_path

logger.info(f"{project_name} v{project_version}")
