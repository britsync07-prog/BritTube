import os
import sys
import uuid
from loguru import logger

# Add current directory to sys.path
sys.path.append(os.path.dirname(os.path.realpath(__file__)))

from app.services import task
from app.models.schema import VideoParams, VideoAspect

def generate_demo():
    task_id = str(uuid.uuid4())
    logger.info(f"Starting FULL AI demo video generation: {task_id}")
    
    params = VideoParams()
    params.video_subject = "The future of space travel"
    params.video_language = "en-US"
    params.voice_name = "en-US-AvaNeural-Female" # Edge TTS
    params.video_aspect = VideoAspect.portrait.value
    params.video_clip_duration = 5
    params.video_count = 1
    params.paragraph_number = 1
    
    try:
        logger.info("Triggering video generation process (Automatic Script + Terms)...")
        result = task.start(task_id=task_id, params=params)
        
        if result and "videos" in result:
            print("\n" + "="*50)
            print("✨ FULL AI VIDEO GENERATED SUCCESSFULLY! ✨")
            print(f"Task ID: {task_id}")
            print("Generated Videos:")
            for v in result["videos"]:
                print(f" - {v}")
            print("="*50)
        else:
            print("\n❌ Video generation failed. Check if your Groq API key is valid.")
            
    except Exception as e:
        logger.error(f"Error during demo generation: {e}")
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    generate_demo()
