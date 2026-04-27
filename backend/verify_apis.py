import requests
import json
import time

BASE_URL = "http://localhost:9090"

def test_root():
    print("Testing Root Endpoint...")
    response = requests.get(f"{BASE_URL}/")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    assert response.status_code == 200

def test_create_task():
    print("\nTesting Create Task Endpoint...")
    payload = {
        "video_subject": "Test Subject",
        "video_count": 1,
        "subtitle_enabled": True
    }
    response = requests.post(f"{BASE_URL}/api/v1/tasks", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    assert response.status_code == 200
    return response.json()["task_id"]

def test_get_task(task_id):
    print(f"\nTesting Get Task Status Endpoint for task_id: {task_id}")
    response = requests.get(f"{BASE_URL}/api/v1/tasks/{task_id}")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    assert response.status_code == 200

if __name__ == "__main__":
    try:
        test_root()
        task_id = test_create_task()
        test_get_task(task_id)
        print("\nAll API tests PASSED!")
    except Exception as e:
        print(f"\nAPI tests FAILED: {str(e)}")
