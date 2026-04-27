import requests
import time
import sys
import json

BASE_URL = "http://localhost:9090"

def create_task():
    print("🚀 Triggering Professional Demo Video Task...")
    payload = {
        "video_subject": "The Future of Mars Colonization",
        "video_language": "en-US",
        "video_aspect": "9:16",
        "voice_name": "en-US-AvaNeural-Female",
        "video_count": 1,
        "subtitle_enabled": True,
        "enable_word_highlighting": True,
        "video_concat_mode": "random",
        "paragraph_number": 1
    }
    try:
        response = requests.post(f"{BASE_URL}/api/v1/tasks", json=payload)
        if response.status_code != 200:
            print(f"❌ Failed to create task: {response.status_code} - {response.text}")
            return None
        
        task_id = response.json().get("task_id")
        print(f"✅ Task created successfully! Task ID: {task_id}")
        return task_id
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return None

def poll_status(task_id):
    if not task_id:
        return
    
    print(f"⏳ Waiting for task initialization...")
    time.sleep(2)
    print(f"⏳ Monitoring Task Progress...")
    last_progress = -1
    retry_count = 0
    
    while True:
        try:
            response = requests.get(f"{BASE_URL}/api/v1/tasks/{task_id}")
            if response.status_code == 404 and retry_count < 10:
                retry_count += 1
                time.sleep(1)
                continue
            
            if response.status_code != 200:
                print(f"\n❌ Error polling status: {response.status_code}")
                break
                
            data = response.json()
            # state: 1=Complete, 2=Running, 3=Failed
            # In this project state values might vary, but we can look at 'progress' and 'message'
            state = data.get("state")
            progress = data.get("progress", 0)
            message = data.get("message", "")
            
            if progress != last_progress:
                print(f"📊 Progress: {progress}% | Stage: {message}")
                last_progress = progress
            
            # Assuming state 1 is success, -1 is failure (based on common patterns and VideoGenerator.tsx)
            # Actually VideoGenerator.tsx says: status.state === 1 ? "Video Ready!"
            if state == 1:
                print(f"\n✨ Video Generation COMPLETE!")
                print("🔗 Downloads:")
                for video in data.get("videos", []):
                    print(f"   - {video}")
                break
            elif state == -1:
                print(f"\n❌ Task FAILED! Message: {message}")
                break
            
            time.sleep(5)
        except KeyboardInterrupt:
            print("\n🛑 Polling stopped by user.")
            break
        except Exception as e:
            print(f"\n❌ Loop error: {e}")
            break

if __name__ == "__main__":
    # Wait for server to be fully ready
    time.sleep(3)
    tid = create_task()
    if tid:
        poll_status(tid)
