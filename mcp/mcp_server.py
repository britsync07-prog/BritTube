"""
BritTube MCP Server — Universal Video Generation for Any AI.

Works with: Claude Desktop, Cursor, Windsurf, Cline, Continue, 
OpenAI, Gemini, Llama, or any MCP-compatible client.

Usage:
    python mcp_server.py --api-key bt_YOUR_KEY --base-url http://localhost:9090

Environment variables:
    BRITTUBE_API_KEY  — Your API key
    BRITTUBE_BASE_URL — Server URL (default: http://localhost:9090)
"""

import os
import sys
import json
import asyncio
import argparse
from typing import Any, Dict

try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "mcp"])
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent

import httpx


class BritTubeMCP:
    """MCP server that wraps the BritTube video generation API."""

    VOICES = {
        "English": [
            {"id": "en-US-AvaNeural-Female", "name": "Ava (Female, US)"},
            {"id": "en-US-AndrewNeural-Male", "name": "Andrew (Male, US)"},
            {"id": "en-GB-SoniaNeural-Female", "name": "Sonia (Female, UK)"},
            {"id": "en-AU-NatashaNeural-Female", "name": "Natasha (Female, AU)"},
        ],
        "Spanish": [
            {"id": "es-ES-ElviraNeural-Female", "name": "Elvira (Female, Spain)"},
            {"id": "es-MX-DaliaNeural-Female", "name": "Dalia (Female, Mexico)"},
        ],
        "French": [
            {"id": "fr-FR-DeniseNeural-Female", "name": "Denise (Female, France)"},
            {"id": "fr-FR-HenriNeural-Male", "name": "Henri (Male, France)"},
        ],
        "German": [
            {"id": "de-DE-KatjaNeural-Female", "name": "Katja (Female, Germany)"},
            {"id": "de-DE-ConradNeural-Male", "name": "Conrad (Male, Germany)"},
        ],
        "Japanese": [
            {"id": "ja-JP-NanamiNeural-Female", "name": "Nanami (Female, Japan)"},
            {"id": "ja-JP-KeitaNeural-Male", "name": "Keita (Male, Japan)"},
        ],
        "Chinese": [
            {"id": "zh-CN-XiaoxiaoNeural-Female", "name": "Xiaoxiao (Female, China)"},
            {"id": "zh-CN-YunxiNeural-Male", "name": "Yunxi (Male, China)"},
        ],
        "Portuguese": [
            {"id": "pt-BR-FranciscaNeural-Female", "name": "Francisca (Female, Brazil)"},
            {"id": "pt-BR-AntonioNeural-Male", "name": "Antonio (Male, Brazil)"},
        ],
        "Hindi": [
            {"id": "hi-IN-SwaraNeural-Female", "name": "Swara (Female, India)"},
            {"id": "hi-IN-MadhurNeural-Male", "name": "Madhur (Male, India)"},
        ],
    }

    TOOLS = [
        Tool(
            name="generate_video",
            description="Generate a complete video with AI narration, stock footage, and subtitles. Provide a topic and the system creates a professional video.",
            inputSchema={
                "type": "object",
                "properties": {
                    "subject": {
                        "type": "string",
                        "description": "Video topic (e.g., 'The future of AI', 'How cats communicate')"
                    },
                    "script": {
                        "type": "string",
                        "description": "Custom narration script. If empty, AI generates one automatically.",
                        "default": ""
                    },
                    "language": {
                        "type": "string",
                        "description": "Narration language code. Examples: en-US, es-ES, fr-FR, de-DE, ja-JP, zh-CN, pt-BR, hi-IN",
                        "default": "en-US"
                    },
                    "aspect_ratio": {
                        "type": "string",
                        "enum": ["16:9", "9:16", "1:1"],
                        "description": "Video shape: 16:9 (YouTube), 9:16 (TikTok/Reels/Shorts), 1:1 (Instagram)",
                        "default": "16:9"
                    },
                    "voice": {
                        "type": "string",
                        "description": "TTS voice ID. Examples: en-US-AvaNeural-Female, en-US-AndrewNeural-Male, es-ES-ElviraNeural-Female",
                        "default": "en-US-AvaNeural-Female"
                    },
                    "duration": {
                        "type": "integer",
                        "description": "Target video length in seconds",
                        "default": 60
                    },
                    "source": {
                        "type": "string",
                        "enum": ["pexels", "pixabay"],
                        "description": "Stock footage provider",
                        "default": "pexels"
                    },
                    "subtitle": {
                        "type": "boolean",
                        "description": "Show subtitles on the video",
                        "default": True
                    }
                },
                "required": ["subject"]
            }
        ),
        Tool(
            name="check_video_status",
            description="Check if a video is ready. Returns progress percentage and download link when complete.",
            inputSchema={
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "string",
                        "description": "The task ID returned by generate_video"
                    }
                },
                "required": ["task_id"]
            }
        ),
        Tool(
            name="list_voices",
            description="List all available text-to-speech voices grouped by language.",
            inputSchema={"type": "object", "properties": {}}
        ),
    ]

    def __init__(self, api_key: str, base_url: str = "http://localhost:9090"):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.external_api = f"{self.base_url}/api/external/v1"
        self.headers = {"X-API-Key": api_key}
        self.server = Server("brittube-video-generator")

    def _request(self, method: str, path: str, **kwargs) -> Dict[str, Any]:
        url = f"{self.external_api}{path}"
        with httpx.Client(timeout=120) as client:
            resp = client.request(method, url, headers=self.headers, **kwargs)
            resp.raise_for_status()
            return resp.json()

    async def generate_video(self, **kwargs) -> str:
        body = {
            "video_subject": kwargs.get("subject", ""),
            "video_script": kwargs.get("script", ""),
            "video_language": kwargs.get("language", "en-US"),
            "video_aspect": kwargs.get("aspect_ratio", "16:9"),
            "video_source": kwargs.get("source", "pexels"),
            "video_concat_mode": "random",
            "video_clip_duration": 5,
            "video_count": 1,
            "voice_name": kwargs.get("voice", "en-US-AvaNeural-Female"),
            "voice_volume": 1.0,
            "voice_rate": 1.0,
            "bgm_type": "none",
            "bgm_volume": 0.2,
            "subtitle_enabled": kwargs.get("subtitle", True),
            "subtitle_position": "bottom",
            "font_size": 48,
            "paragraph_number": 1,
            "video_duration": kwargs.get("duration", 60),
        }
        result = self._request("POST", "/generate", json=body)
        task_id = result.get("task_id")
        if not task_id:
            return json.dumps(result, indent=2)

        max_wait = 600
        elapsed = 0
        while elapsed < max_wait:
            await asyncio.sleep(10)
            elapsed += 10
            status = self._request("GET", f"/status/{task_id}")
            state = status.get("state", 4)
            if state == 1:
                videos = status.get("videos", [])
                url = videos[0] if videos else ""
                if url and not url.startswith("http"):
                    url = f"{self.base_url}{url}"
                return json.dumps({"status": "completed", "task_id": task_id, "download_url": url, "duration_seconds": status.get("audio_duration", 0)}, indent=2)
            elif state == -1:
                return json.dumps({"status": "failed", "task_id": task_id, "error": status.get("message", "Generation failed")}, indent=2)
        return json.dumps({"status": "timeout", "task_id": task_id, "progress": status.get("progress", 0)}, indent=2)

    def check_status(self, task_id: str) -> str:
        status = self._request("GET", f"/status/{task_id}")
        state_map = {1: "completed", 4: "processing", -1: "failed"}
        status["status_text"] = state_map.get(status.get("state", 4), "unknown")
        if status.get("videos"):
            v = status["videos"][0]
            if not v.startswith("http"):
                status["download_url"] = f"{self.base_url}{v}"
            else:
                status["download_url"] = v
        return json.dumps(status, indent=2)

    def list_voices(self) -> str:
        return json.dumps(self.VOICES, indent=2)

    def register_tools(self):
        @self.server.list_tools()
        async def list_tools():
            return self.TOOLS

        @self.server.call_tool()
        async def call_tool(name: str, arguments: Dict[str, Any]):
            if name == "generate_video":
                result = await self.generate_video(**arguments)
            elif name == "check_video_status":
                result = self.check_status(arguments.get("task_id", ""))
            elif name == "list_voices":
                result = self.list_voices()
            else:
                result = json.dumps({"error": f"Unknown tool: {name}"})
            return [TextContent(type="text", text=result)]

    async def run(self):
        self.register_tools()
        async with stdio_server() as (read_stream, write_stream):
            await self.server.run(read_stream, write_stream, self.server.create_initialization_options())


def main():
    parser = argparse.ArgumentParser(description="BritTube MCP Video Generator")
    parser.add_argument("--api-key", default=os.getenv("BRITTUBE_API_KEY"), help="API key (bt_...)")
    parser.add_argument("--base-url", default=os.getenv("BRITTUBE_BASE_URL", "http://localhost:9090"), help="Server URL")
    args = parser.parse_args()

    if not args.api_key:
        print("Error: Provide --api-key or set BRITTUBE_API_KEY env var")
        print("  python mcp_server.py --api-key bt_YOUR_KEY_HERE")
        sys.exit(1)

    print(f"BritTube MCP Server starting...")
    print(f"  Server: {args.base_url}")
    print(f"  Key: {args.api_key[:8]}...")
    print(f"  Tools: generate_video, check_video_status, list_voices")

    mcp = BritTubeMCP(api_key=args.api_key, base_url=args.base_url)
    asyncio.run(mcp.run())


if __name__ == "__main__":
    main()
