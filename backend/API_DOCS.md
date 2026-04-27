# API Documentation - MoneyPrinterTurbo Backend

## Core APIs

### 1. Create Video Task
- **Endpoint**: `POST /api/v1/tasks`
- **Description**: Starts a new video generation task.
- **Request Body**: `VideoParams` (JSON)
- **Response**:
  ```json
  {
    "task_id": "uuid-string"
  }
  ```

### 2. Get Task Status
- **Endpoint**: `GET /api/v1/tasks/{task_id}`
- **Description**: Retrieves the current state and progress of a task.
- **Response**:
  ```json
  {
    "state": 1,
    "progress": 50,
    "videos": [],
    "combined_videos": [],
    "script": "...",
    "terms": "...",
    ...
  }
  ```

### 3. Root Endpoint
- **Endpoint**: `GET /`
- **Description**: Basic health check.

## Automated Documentation
When the backend is running, interactive docs are available at:
- **Swagger UI**: `http://localhost:8080/docs`
- **ReDoc**: `http://localhost:8080/redoc`

## Data Models

### VideoParams
| Field | Type | Required | Description |
|---|---|---|---|
| `video_subject` | string | Yes | The topic of the video |
| `video_script` | string | No | Custom script to use |
| `video_language` | string | No | Language code |
| `voice_name` | string | No | TTS voice name |
| `video_aspect` | string | No | Aspect ratio (16:9, 9:16, 1:1) |
| `video_count` | integer | No | Number of videos to generate |
| `subtitle_enabled` | boolean | No | Whether to include subtitles |
