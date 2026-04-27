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
    logger.info(f"Starting demo video generation: {task_id}")
    
    # 20 seconds of script approx
    script = (
        "In a world where technology moves faster than ever, "
        "simplicity becomes the ultimate sophistication. "
        "Experience the power of lightweight AI, "
        "designed to run seamlessly on your machine."
    )
    
    params = VideoParams()
    params.video_subject = "Lightweight AI Demo"
    params.video_script = script
    params.video_terms = ["minimal technology", "abstract coding", "fast connection", "simple design"]
    params.video_language = "en-US"
    params.voice_name = "en-US-AvaNeural-Female" # Edge TTS
    params.video_aspect = VideoAspect.portrait.value
    params.video_clip_duration = 5
    params.video_duration = 20
    
    try:
        logger.info("Triggering video generation process...")
        # This will follow the Research -> Strategy -> Execution cycle internally
        result = task.start(task_id=task_id, params=params)
        
        if result and "videos" in result:
            print("\n" + "="*50)
            print("✨ DEMO VIDEO GENERATED SUCCESSFULLY! ✨")
            print(f"Task ID: {task_id}")
            print("Generated Videos:")
            for v in result["videos"]:
                print(f" - {v}")
            print("="*50)
        else:
            print("\n❌ Video generation failed or returned no results.")
            
    except Exception as e:
        logger.error(f"Error during demo generation: {e}")
        print(f"\n❌ Error: {e}")
        print("Make sure you have installed requirements-light.txt first!")

if __name__ == "__main__":
    generate_demo()
