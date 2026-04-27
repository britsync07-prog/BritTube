import pytest
from httpx import AsyncClient
from main import app
import os
import sys

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.realpath(__file__)))))

@pytest.mark.asyncio
async def test_read_root():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/")
    assert response.status_code == 200
    assert "version" in response.json()

@pytest.mark.asyncio
async def test_create_task_validation_error():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post("/api/v1/tasks", json={})
    assert response.status_code == 422  # Unprocessable Entity for missing fields
