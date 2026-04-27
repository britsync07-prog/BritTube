# MoneyPrinterTurbo Independent Backend

This is a 100% self-contained backend for MoneyPrinterTurbo, rebuilt using FastAPI.

## Features
- Fully decoupled from the original project.
- RESTful APIs for video generation, script generation, and task management.
- Self-contained storage and configuration.
- Simplified and scalable architecture.

## Directory Structure
- `app/`: Core application logic.
  - `routes/`: API endpoint definitions.
  - `controllers/`: Route handlers.
  - `services/`: Business logic.
  - `models/`: Data schemas.
  - `core/`: Core settings and configuration.
  - `utils/`: Utility functions.
- `config/`: Configuration files.
- `storage/`: Generated assets storage.
- `resource/`: Internal resources (fonts, songs, etc.).
- `tests/`: Automated test suite.
- `main.py`: Entry point for the FastAPI application.

## Getting Started

### Prerequisites
- Python 3.10+
- FFmpeg and ImageMagick installed on your system.

### Installation
1. Clone or copy the `backend/` folder to your target machine.
2. Install dependencies:
   ```bash
   # Standard installation (includes local AI models, ~5GB+)
   pip install -r requirements.txt
   
   # Lightweight installation (recommended for Ubuntu/small machines, uses online APIs)
   pip install -r requirements-light.txt
   ```

### Configuration
1. Edit `config/config.toml` to set your API keys and project settings.

### Running the Backend
```bash
python main.py
```
The API will be available at `http://localhost:8080`.
You can access the interactive documentation (Swagger UI) at `http://localhost:8080/docs`.

## API Documentation

### Create Video Task
- **Endpoint**: `POST /api/v1/tasks`
- **Request Body**: `VideoParams` (JSON)
- **Response**: `{"task_id": "..."}`

### Get Task Status
- **Endpoint**: `GET /api/v1/tasks/{task_id}`
- **Response**: Task details including state, progress, and generated video links.

## Testing
Run the test suite with:
```bash
pytest tests/
```
