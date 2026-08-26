# BritTube
<div align="center">

![License](https://img.shields.io/github/license/britsync07-prog/BritTube?style=flat-square&label=license&color=06b6d4) ![Language](https://img.shields.io/github/languages/top/britsync07-prog/BritTube?style=flat-square&color=0ea5e9) ![Stars](https://img.shields.io/github/stars/britsync07-prog/BritTube?style=flat-square&color=f59e0b) ![Last commit](https://img.shields.io/github/last-commit/britsync07-prog/BritTube?style=flat-square&color=22c55e) ![Repo size](https://img.shields.io/github/repo-size/britsync07-prog/BritTube?style=flat-square&color=94a3b8)

</div>

> AI video generation platform — script, footage, voiceover, and subtitles assembled into finished videos, exposed via API and MCP.

BritTube turns a text subject into a publishable video. A FastAPI backend orchestrates LLM script generation, stock-footage retrieval from Pexels/Pixabay, neural text-to-speech (Edge TTS/Azure), subtitle burning, and MoviePy assembly, while a Next.js frontend provides the landing page, generator dashboard, history, and an admin panel for users, tasks, and API keys. An included MCP server lets any MCP-capable AI tool (Claude Desktop, Cursor, Windsurf, Cline) generate videos conversationally.

## Overview

The backend is a production-hardened FastAPI service (default port 9090, base path `/api/v1`) with JWT authentication, per-user task queues backed by memory or Redis, tiered rate limiting, request-logging middleware with metrics, scheduled storage cleanup (7-day max age / 10 GB cap), and an external REST API authenticated by `bt_`-prefixed API keys. The pipeline is derived from a MoneyPrinterTurbo-style architecture and is configurable across dozens of LLM/TTS/stock providers through a single `config.toml`. The repository's final commit marks the milestone "Production-ready: full backend integration, admin panel, MCP server, rate limiting, monitoring."

## Features

- End-to-end AI video generation: script -> stock footage (Pexels/Pixabay/Coverr) -> AI voiceover -> subtitles -> final MP4
- Task lifecycle API with progress states (processing/success/failed), per-user task history, and static video serving
- External API v1 with `X-API-Key` authentication (`/api/external/v1/generate`, `/status`) and admin-managed keys (`bt_` prefix)
- MCP server (`mcp/mcp_server.py`, stdio) exposing `generate_video`, `check_video_status`, and `list_voices` tools with ready-made config files for Claude Desktop, Cursor, Windsurf, Cline, and Continue
- Multi-provider LLM support selected by config: OpenAI, Gemini, Groq, DeepSeek, Qwen, Moonshot, Azure, Ollama, Pollinations, g4f, and more
- Multi-language neural voices (English, Spanish, French, German, Japanese, Chinese, Portuguese, Hindi) via Edge TTS/Azure
- Optional semantic video matching mode (Whisper/sentence-transformers) behind a separate requirements file
- Admin panel pages for users, tasks, and API keys; JWT auth with register/login/me endpoints
- Tiered rate limiting (auth 5/min, video 3/min, general 30/min, admin 60/min), Redis-backed queue option, APScheduler cleanup job, structured logging and metrics middleware
- Animated Next.js 16 marketing site with 3D/particle hero effects (Three.js, GSAP, Framer Motion)

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI, Uvicorn, SQLAlchemy, Pydantic, APScheduler, Loguru |
| Auth/Security | JWT (`python-jose`), bcrypt/passlib, scoped API-key model, rate limiter |
| Media | MoviePy, Edge TTS, Azure Cognitive Services, Pillow, pydub |
| AI Providers | OpenAI-compatible APIs, Gemini, Groq, DeepSeek, Qwen, Ollama, g4f, Pollinations (config-selected) |
| Queue/Cache | In-memory manager or Redis 5 |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Framer Motion, GSAP, Three.js/@react-three |
| Integration | MCP (Model Context Protocol) stdio server + client config templates |
| Testing | pytest / pytest-asyncio |

## Architecture

`main.py` boots FastAPI, auto-creates SQLAlchemy tables (User, Task, ApiKey), mounts route modules (auth, video, admin, api-keys, external), installs CORS, exception handling, logging middleware, metrics, and the rate limiter, then starts an APScheduler job that prunes old videos and reports storage usage. Task execution flows through a controller layer with pluggable state managers (`memory_manager` or `redis_manager`), delegating to services: `llm.py` for scripts, `material.py` for footage downloads, `voice.py` for TTS, `subtitle.py` for captions, and `video.py` for final assembly. Generated artifacts are served statically under `/tasks/{task_id}/`.

The MCP server is a thin stdio client of the same external REST API, so AI tools and direct HTTP consumers share identical capabilities.

## Project Structure

```text
BritTube/
├── backend/
│   ├── main.py                     # FastAPI bootstrap, scheduler, middleware
│   ├── requirements.txt            # Lightweight dependency set
│   ├── requirements-light.txt      # Alternate minimal install
│   ├── app/
│   │   ├── routes/                 # auth, video, admin, api_keys, external_api
│   │   ├── controllers/            # Video orchestration + memory/redis managers
│   │   ├── services/               # llm, material, voice, subtitle, video,
│   │   │                           # twelvelabs, semantic_video, upload_post,
│   │   │                           # cleanup, image_similarity, state
│   │   ├── core/                   # config, security, rate_limit, monitoring
│   │   ├── models/                 # User, Task, ApiKey, schemas
│   │   ├── db/                     # SQLAlchemy engine
│   │   └── utils/                  # file_security, helpers
│   ├── config/config.toml          # Provider keys/options (see Security Notes)
│   └── resource/                   # Fonts and background songs
├── frontend/
│   ├── app/                        # Landing, (auth) login/signup, dashboard,
│   │   └── admin/                  # users, tasks, api-keys pages
│   ├── components/                 # Hero, Features, Showcase, VideoGenerator,
│   │                               # VideoHistory, FAQ, 3D/particle UI
│   ├── hooks/                      # useAuth, useTaskStatus polling
│   └── lib/                        # api client, auth helpers
├── mcp/
│   ├── mcp_server.py               # MCP stdio server (generate/status/voices)
│   ├── README.md                   # Per-tool setup guide
│   └── config_*.json               # Claude Desktop/Cursor/Windsurf/Cline templates
├── API_DOCS.md                     # REST contract (/api/v1)
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.10+ and pip
- Node.js 18+ and npm (frontend)
- At least one stock-footage API key (Pexels or Pixabay) and a chosen LLM provider key
- Redis (optional; enables the persistent task-queue manager)
- FFmpeg available on PATH (required by MoviePy)

### Installation

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

### Environment Variables

The backend reads `.env` (e.g., `GROQ_API_KEY` fallback added in commit history) plus `backend/config/config.toml`. Key configuration names (values must be supplied locally):

| Name | Purpose | Example Placeholder |
|---|---|---|
| GROQ_API_KEY | Groq LLM key (env fallback supported) | `gsk_...` |
| pexels_api_keys | Stock footage access (config.toml list) | `your_pexels_key` |
| pixabay_api_keys | Stock footage access (config.toml list) | `your_pixabay_key` |
| llm_provider | Active script-generation provider | `groq` |
| openai_api_key | OpenAI-compatible provider key slot | `sk_...` |
| gemini_api_key | Google Gemini key slot | `your_gemini_key` |
| azure_speech_key / speech_region | Azure TTS credentials | `your_azure_speech_key` / `eastus` |
| subtitle_provider | Caption source selection | `edge` |
| enable_redis / redis_host / redis_port / redis_password | Queue backend toggle and connection | `true` / `localhost` / `6379` / `your_redis_password` |
| max_concurrent_tasks / max_queued_tasks | Worker throughput limits | `3` / `20` |
| endpoint | Public base URL used in returned video links | `https://your-vps-ip:9090` |

Frontend environment (if overriding API target): configure the base URL inside `frontend/lib/api.ts` build-time variables as needed.

### Running

```bash
# Backend (serves API on :9090)
cd backend
uvicorn main:app --host 0.0.0.0 --port 9090

# Frontend
cd frontend
npm run dev       # http://localhost:3000

# MCP server against a running backend
pip install mcp httpx
python mcp/mcp_server.py --api-key bt_YOUR_KEY --base-url http://localhost:9090
```

Create an API key at `/admin/api-keys`, then call:

```bash
curl -X POST http://localhost:9090/api/external/v1/generate \
  -H "X-API-Key: bt_YOUR_KEY" -H "Content-Type: application/json" \
  -d '{"video_subject": "Cats are wonderful"}'
```

## Challenges Faced & Solutions

- **Streaming quality and broken links** — returned video URLs were relative and bitrate was too high for smooth playback, and downloads failed cross-origin. **Solution:** absolute URLs in the History API (`209ec5e`), URL fixes plus bitrate optimization for streaming (`b6b52ca`), and corrected cross-origin download behavior (`52e5a33`).
- **Pipeline crashes on provider failures** — a `material.py` AttributeError killed tasks when footage lookup failed, and the VideoGenerator crashed on failed generations. **Solution:** hardened `material.py` with an AttributeError fix and env fallback (`19045ae`) and made VideoGenerator resilient to failed generation runs (`3877591`).
- **Provider key could not be injected securely** — the Groq key was not read from the environment. **Solution:** allowed `GROQ_API_KEY` to be loaded from `.env` (`0af5774`) instead of hardcoding.
- **Auth token mismatch locked users out** — the frontend/API token check used different keys. **Solution:** fixed the API token auth key mismatch (`37aaf11`) so issued JWTs validate consistently.
- **Frontend build fragility on static hosts** — path aliases broke Cloudflare Pages exports and lib files were missing from git. **Solution:** bypassed aliases with relative imports for guaranteed builds (`878bb12`), restored missing `lib/` modules (`2d13034`), configured static export for Cloudflare Pages (`bf96dfb`), and fixed the final dashboard path (`0567785`).
- **Abuse resistance before launch** — generation endpoints were unthrottled and unmonitored. **Solution:** the production-ready milestone introduced tiered rate limits (auth 5/min, video 3/min), request-logging middleware with metrics, an admin panel, and the MCP integration surface (`ec9eed7`).

## Known Limitations & Roadmap

- The heavy semantic-matching stack (faster-whisper, sentence-transformers, torch) is intentionally commented out of `requirements.txt`; enable it only when the semantic concat mode is needed.
- `backend/app/services/video.py.bak` indicates in-progress refactoring of the assembly service.
- Upload-to-social publishing hooks (`upload_post`) exist in config/services but are opt-in and untested paths.
- Root `README.md` is still a stub and `error.txt` is a leftover debug artifact; both need attention.
- Roadmap candidates surfaced by the codebase: Redis-by-default deployment, multi-tenant quotas beyond per-minute rate limits, and expanding MCP tool coverage (voice listing already done).

## Security Notes

Observed practices: JWT authentication with bcrypt hashing, scoped `bt_`-prefixed API keys managed through an admin UI, tiered per-IP/per-user rate limiting, request logging and metrics middleware, a dedicated `file_security` utility module, scheduled deletion of generated media, and MCP config templates shipped with placeholder keys (`bt_REPLACE_WITH_YOUR_KEY`).

Hygiene warnings (filenames only):

- `backend/config/config.toml` — tracked in git while containing dozens of credential slots (stock-footage, LLM, TTS, Redis password). Audit it and rotate/remove any live values before publishing; move secrets to environment variables.
- `error.txt` — committed error log at repo root; remove and ignore.
- `backend/app/services/video.py.bak` — backup file tracked in git; remove and ignore.
- No `LICENSE` file currently exists in the repository.

## License

MIT License — Copyright (c) 2026 Musfiqur Rahman Saimon. See [LICENSE](./LICENSE).
