# BritTube MCP — Universal Video Generation

## What is this?

The BritTube MCP server lets any AI tool generate videos. Ask your AI to create a video and it will:
1. Generate a script about your topic
2. Find stock footage from Pexels/Pixabay
3. Create AI voiceover narration
4. Add subtitles
5. Combine everything into a finished video

## Supported AI Tools

| Tool | Config File | Config Location |
|------|------------|----------------|
| Claude Desktop | `config_claude_desktop.json` | `%APPDATA%/Claude/claude_desktop_config.json` (Windows) or `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac) |
| Cursor | `config_cursor.json` | Settings > MCP > Add new MCP server |
| Windsurf | `config_windsurf.json` | Settings > MCP Servers |
| Cline | `config_cline.json` | `~/.cline/cline_mcp_settings.json` |
| Continue | (same format) | `~/.continue/config.json` under `mcpServers` |
| OpenAI Agents | (same format) | Any MCP-compatible client |
| Any MCP client | (same format) | Uses standard MCP stdio protocol |

## Quick Start

### 1. Create an API key
Go to `http://localhost:3000/admin/api-keys` and create one. Copy it immediately.

### 2. Install dependencies
```bash
pip install mcp httpx
```

### 3. Configure your AI tool
Pick the config file for your tool and replace `bt_REPLACE_WITH_YOUR_KEY` with your actual key.

### 4. Use it
Just ask your AI: "Generate a video about cats"

## Setup by Tool

### Claude Desktop
1. Open `%APPDATA%/Claude/claude_desktop_config.json` (Windows) or `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac)
2. Add the `mcpServers` section from `config_claude_desktop.json`
3. Restart Claude Desktop
4. Ask Claude: "Generate a video about the future of AI"

### Cursor
1. Open Cursor Settings (Ctrl+,)
2. Go to MCP section
3. Click "Add new MCP server"
4. Paste the contents of `config_cursor.json`
5. Restart Cursor

### Windsurf
1. Open Windsurf Settings
2. Go to MCP Servers
3. Add a new server with the contents of `config_windsurf.json`
4. Restart Windsurf

### Cline (VS Code)
1. Open `~/.cline/cline_mcp_settings.json`
2. Add the contents of `config_cline.json`
3. Reload VS Code

### Continue
1. Open `~/.continue/config.json`
2. Add the `mcpServers` section
3. Reload VS Code

### Command Line (any MCP client)
```bash
python G:/myjob/BritTube/mcp/mcp_server.py --api-key bt_YOUR_KEY --base-url http://localhost:9090
```

## Available Tools

### generate_video
Create a video with these parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| subject | string | required | Video topic |
| script | string | "" | Custom script (AI generates if empty) |
| language | string | "en-US" | Narration language |
| aspect_ratio | string | "16:9" | 16:9, 9:16, or 1:1 |
| voice | string | "en-US-AvaNeural-Female" | TTS voice |
| duration | int | 60 | Target seconds |
| source | string | "pexels" | pexels or pixabay |
| subtitle | bool | true | Show subtitles |

### check_video_status
Check progress of a video task. Returns download URL when complete.

### list_voices
List all available TTS voices by language.

## Direct API (No MCP)

```bash
# Generate
curl -X POST http://localhost:9090/api/external/v1/generate \
  -H "X-API-Key: bt_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"video_subject": "Cats are wonderful"}'

# Check status
curl http://localhost:9090/api/external/v1/status/TASK_ID \
  -H "X-API-Key: bt_YOUR_KEY"
```

## Available Voices

**English**: Ava (F), Andrew (M), Sonia (UK-F), Natasha (AU-F)
**Spanish**: Elvira (Spain-F), Dalia (Mexico-F)
**French**: Denise (F), Henri (M)
**German**: Katja (F), Conrad (M)
**Japanese**: Nanami (F), Keita (M)
**Chinese**: Xiaoxiao (F), Yunxi (M)
**Portuguese**: Francisca (Brazil-F), Antonio (Brazil-M)
**Hindi**: Swara (F), Madhur (M)
