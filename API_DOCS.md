# BritTube API Documentation

This backend handles user authentication and AI video generation tasks.

**Base URL**: `https://your-vps-ip:9090/api/v1`

---

## 🔐 Authentication

### Register
`POST /auth/register`
*   **Body**:
    ```json
    {
      "email": "user@example.com",
      "password": "strongpassword",
      "full_name": "John Doe"
    }
    ```

### Login
`POST /auth/login`
*   **Body**:
    ```json
    {
      "email": "user@example.com",
      "password": "strongpassword"
    }
    ```
*   **Response**: Returns a JWT `access_token`.

### Get Current User
`GET /auth/me`
*   **Headers**: `Authorization: Bearer <token>`

---

## 🎬 Video Generation

### Create Video Task
`POST /tasks`
*   **Headers**: `Authorization: Bearer <token>`
*   **Body** (Example):
    ```json
    {
      "video_subject": "Space Exploration",
      "video_language": "en-US",
      "voice_name": "en-US-AndrewNeural",
      "video_aspect": "9:16"
    }
    ```

### Get Task Status
`GET /tasks/{task_id}`
*   **Response**:
    ```json
    {
      "id": "uuid",
      "state": 1, 
      "progress": 100,
      "video_url": "/tasks/uuid/final.mp4",
      "message": "Complete"
    }
    ```
    *States: 4 = Processing, 1 = Success, -1 = Failed.*

### Get Task History
`GET /tasks/history`
*   **Headers**: `Authorization: Bearer <token>`
*   **Response**: Array of previous tasks for the authenticated user.

---

## 📁 Static Files
Generated videos are served at:
`https://your-vps-ip:9090/tasks/{task_id}/{filename}`
