from app.models.schema import VideoParams
from app.services import task as task_service
import uuid

params = VideoParams(
    video_subject="test",
    video_script="This is a test script.",
    video_language="en-US",
    video_aspect="16:9",
    video_concat_mode="random",
    video_source="pexels",
    video_clip_duration=5,
    video_count=1,
    voice_name="en-US-AvaNeural-Female",
    voice_volume=1.0,
    voice_rate=1.0,
    bgm_type="random",
    bgm_volume=0.2,
    subtitle_enabled=True,
    font_size=60,
    text_fore_color="#FFFFFF",
    stroke_color="#000000",
    enable_word_highlighting=False,
    word_highlight_color="#FFFF00",
    video_transition_mode="none",
    segmentation_method="sentences",
    similarity_threshold=0.5
)

task_id = str(uuid.uuid4())
print(f"Starting task {task_id}")
try:
    task_service.start(task_id, params)
    print("Task finished")
except Exception as e:
    print(f"Task failed: {e}")
    import traceback
    traceback.print_exc()
