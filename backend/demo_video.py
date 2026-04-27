import requests
import time
import sys

BASE_URL = "http://localhost:8080"

def create_task():
    print("Creating Demo Video Task...")
    payload = {
        "video_subject": "AI and the Future of Work",
        "video_script": "Artificial Intelligence is transforming the way we work. From automating mundane tasks to providing deep insights from data, AI is becoming an essential partner in the modern workplace. As we move forward, the collaboration between humans and machines will only grow stronger, reshaping industries and creating new opportunities for innovation.",
        "video_terms": "artificial intelligence workplace, future of work, human robot collaboration, automation technology, digital innovation",
        "video_aspect": "9:16",
        "voice_name": "en-US-AriaNeural",
        "video_count": 1,
        "subtitle_enabled": True
    }
    try:
        response = requests.post(f"{BASE_URL}/api/v1/tasks", json=payload)
        response.raise_for_status()
        task_id = response.json()["task_id"]
        print(f"Task created successfully! Task ID: {task_id}")
        return task_id
    except Exception as e:
        print(f"Failed to create task: {e}")
        sys.exit(1)

def poll_status(task_id):
    print(f"Monitoring Task: {task_id}")
    while True:
        try:
            response = requests.get(f"{BASE_URL}/api/v1/tasks/{task_id}")
            response.raise_for_status()
            data = response.json()
            state = data.get("state")
            progress = data.get("progress", 0)
            
            print(f"Progress: {progress}%", end="\r")
            
            if state == 2: # Complete
                print(f"\nTask COMPLETE!")
                print("Generated Videos:")
                for video in data.get("videos", []):
                    print(f" - {video}")
                break
            elif state == 3: # Failed
                print(f"\nTask FAILED!")
                break
            
            time.sleep(5)
        except Exception as e:
            print(f"\nError polling status: {e}")
            break

if __name__ == "__main__":
    task_id = create_task()
    poll_status(task_id)
