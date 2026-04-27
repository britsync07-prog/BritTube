#!/usr/bin/env python3

import glob
import itertools
import os
import random
import gc
import shutil
import json
import subprocess
from typing import List
from loguru import logger
import numpy as np
from moviepy import (
    AudioFileClip,
    ColorClip,
    CompositeAudioClip,
    CompositeVideoClip,
    ImageClip,
    TextClip,
    VideoFileClip,
    afx,
    concatenate_videoclips,
)
from moviepy.video.tools.subtitles import SubtitlesClip
from PIL import ImageFont, ImageDraw, Image

from app.models import const
from app.models.schema import (
    MaterialInfo,
    VideoAspect,
    VideoConcatMode,
    VideoParams,
    VideoTransitionMode,
)
from app.services.utils import video_effects
from app.utils import utils
from app.services import semantic_video

# High-quality video encoding settings
audio_codec = "aac"
video_codec = "libx264"
fps = 30

# High-quality encoding parameters
video_bitrate = "8000k"  # High bitrate for excellent quality
audio_bitrate = "320k"   # High audio bitrate
crf = 18                 # Constant Rate Factor - lower = higher quality (18-23 is excellent range)
preset = "medium"        # Balance between encoding speed and compression efficiency

# FFmpeg parameters for maximum quality
quality_params = [
    "-crf", str(crf),
    "-preset", preset,
    "-profile:v", "high",
    "-level", "4.1",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart"
]

class SubClippedVideoClip:
    def __init__(self, file_path, start_time=None, end_time=None, width=None, height=None, duration=None):
        self.file_path = file_path
        self.start_time = start_time
        self.end_time = end_time
        self.width = width
        self.height = height
        if duration is None:
            self.duration = end_time - start_time
        else:
            self.duration = duration

    def __str__(self):
        return f"SubClippedVideoClip(file_path={self.file_path}, start_time={self.start_time}, end_time={self.end_time}, duration={self.duration}, width={self.width}, height={self.height})"


def close_clip(clip):
    if clip is None:
        return
        
    try:
        # close main resources
        if hasattr(clip, 'reader') and clip.reader is not None:
            clip.reader.close()
            
        # close audio resources
        if hasattr(clip, 'audio') and clip.audio is not None:
            if hasattr(clip.audio, 'reader') and clip.audio.reader is not None:
                clip.audio.reader.close()
            del clip.audio
            
        # close mask resources
        if hasattr(clip, 'mask') and clip.mask is not None:
            if hasattr(clip.mask, 'reader') and clip.mask.reader is not None:
                clip.mask.reader.close()
            del clip.mask
            
        # handle child clips in composite clips
        if hasattr(clip, 'clips') and clip.clips:
            for child_clip in clip.clips:
                if child_clip is not clip:  # avoid possible circular references
                    close_clip(child_clip)
            
        # clear clip list
        if hasattr(clip, 'clips'):
            clip.clips = []
            
    except Exception as e:
        logger.error(f"failed to close clip: {str(e)}")
    
    del clip
    gc.collect()

def delete_files(files: List[str] | str):
    if isinstance(files, str):
        files = [files]
        
    for file in files:
        try:
            os.remove(file)
        except OSError:
            pass

def get_bgm_file(bgm_type: str = "random", bgm_file: str = ""):
    if not bgm_type or bgm_type == "none":
        return ""

    if bgm_file and os.path.exists(bgm_file):
        return bgm_file

    suffix = "*.mp3"
    song_dir = utils.song_dir()
    
    # Try to find type-specific folder if it exists
    type_dir = os.path.join(song_dir, bgm_type)
    if os.path.isdir(type_dir):
        files = glob.glob(os.path.join(type_dir, suffix))
        if files:
            return random.choice(files)

    # Fallback to random if no specific files found or if type is random
    files = glob.glob(os.path.join(song_dir, suffix))
    if files:
        return random.choice(files)

    return ""


def combine_videos(
    combined_video_path: str,
    video_paths: List[str],
    audio_file: str,
    video_aspect: VideoAspect = VideoAspect.portrait,
    video_concat_mode: VideoConcatMode = VideoConcatMode.random,
    video_transition_mode: VideoTransitionMode = None,
    max_clip_duration: int = 5,
    threads: int = 2,
    script: str = "",
    params: VideoParams = None
) -> str:
    audio_clip = AudioFileClip(audio_file)
    audio_duration = audio_clip.duration
    logger.info(f"audio duration: {audio_duration} seconds")
    # Required duration of each clip
    req_dur = audio_duration / len(video_paths)
    req_dur = max_clip_duration
    logger.info(f"maximum clip duration: {req_dur} seconds")
    output_dir = os.path.dirname(combined_video_path)

    aspect = VideoAspect(video_aspect)
    video_width, video_height = aspect.to_resolution()

    # Check if semantic mode is enabled
    if video_concat_mode.value == "semantic" and script:
        logger.info("Using semantic video selection mode")
        
        # Load video metadata
        video_metadata = []
        for video_path in video_paths:
            metadata = semantic_video.load_video_metadata(video_path)
            if metadata:
                video_metadata.append(metadata)
            else:
                logger.debug(f"No metadata found for {video_path}, using filename")
                filename = os.path.splitext(os.path.basename(video_path))[0]
                metadata = {
                    'video_path': video_path,
                    'search_term': filename,
                    'file_size': os.path.getsize(video_path) if os.path.exists(video_path) else 0,
                    'created_at': os.path.getctime(video_path) if os.path.exists(video_path) else 0
                }
                video_metadata.append(metadata)
        
        # Use semantic video selection
        selected_videos = semantic_video.select_videos_for_script(
            script=script,
            video_metadata=video_metadata,
            audio_duration=audio_duration,
            max_clip_duration=max_clip_duration,
            similarity_threshold=params.similarity_threshold if params else 0.5,
            diversity_threshold=params.diversity_threshold if params else 5,
            max_video_reuse=params.max_video_reuse if params else 2,
            min_segment_length=params.min_segment_length if params else 25,
            semantic_model=params.semantic_model if params else "all-mpnet-base-v2",
            enable_image_similarity=params.enable_image_similarity if params else False,
            image_similarity_threshold=params.image_similarity_threshold if params else 0.7,
            image_similarity_model=params.image_similarity_model if params else "clip-vit-base-patch32"
        )
        
        # Process selected videos
        processed_clips = []
        video_duration = 0
        max_reuse_limit = params.max_video_reuse if params and hasattr(params, 'max_video_reuse') and params.max_video_reuse is not None else None
        
        for i, selection in enumerate(selected_videos):
            # Don't break early when max_video_reuse=1 to utilize all selected videos
            if video_duration > audio_duration and not (max_reuse_limit and max_reuse_limit == 1):
                break
                
            video_path = selection['video_path']
            target_duration = min(selection['duration'], max_clip_duration)
            
            logger.debug(f"processing semantic clip {i+1}: {os.path.basename(video_path)}, target duration: {target_duration:.2f}s")
            
            try:
                clip = VideoFileClip(video_path)
                clip_duration = min(clip.duration, target_duration)
                
                # Random start time for variety
                max_start = max(0, clip.duration - clip_duration)
                start_time = random.uniform(0, max_start) if max_start > 0 else 0
                
                clip = clip.subclipped(start_time, start_time + clip_duration)
                
                # Resize clip if needed
                clip_w, clip_h = clip.size
                if clip_w != video_width or clip_h != video_height:
                    clip_ratio = clip.w / clip.h
                    video_ratio = video_width / video_height
                    logger.debug(f"resizing clip, source: {clip_w}x{clip_h}, ratio: {clip_ratio:.2f}, target: {video_width}x{video_height}, ratio: {video_ratio:.2f}")
                    
                    if clip_ratio == video_ratio:
                        clip = clip.resized(new_size=(video_width, video_height))
                    else:
                        if clip_ratio > video_ratio:
                            scale_factor = video_width / clip_w
                        else:
                            scale_factor = video_height / clip_h

                        new_width = int(clip_w * scale_factor)
                        new_height = int(clip_h * scale_factor)

                        background = ColorClip(size=(video_width, video_height), color=(0, 0, 0)).with_duration(clip_duration)
                        clip_resized = clip.resized(new_size=(new_width, new_height)).with_position("center")
                        clip = CompositeVideoClip([background, clip_resized])
                
                # Apply transitions if specified
                if video_transition_mode and video_transition_mode.value != VideoTransitionMode.none.value:
                    shuffle_side = random.choice(["left", "right", "top", "bottom"])
                    if video_transition_mode.value == VideoTransitionMode.fade_in.value:
                        clip = video_effects.fadein_transition(clip, 1)
                    elif video_transition_mode.value == VideoTransitionMode.fade_out.value:
                        clip = video_effects.fadeout_transition(clip, 1)
                    elif video_transition_mode.value == VideoTransitionMode.slide_in.value:
                        clip = video_effects.slidein_transition(clip, 1, shuffle_side)
                    elif video_transition_mode.value == VideoTransitionMode.slide_out.value:
                        clip = video_effects.slideout_transition(clip, 1, shuffle_side)
                    elif video_transition_mode.value == VideoTransitionMode.shuffle.value:
                        transition_funcs = [
                            lambda c: video_effects.fadein_transition(c, 1),
                            lambda c: video_effects.fadeout_transition(c, 1),
                            lambda c: video_effects.slidein_transition(c, 1, shuffle_side),
                            lambda c: video_effects.slideout_transition(c, 1, shuffle_side),
                        ]
                        shuffle_transition = random.choice(transition_funcs)
                        clip = shuffle_transition(clip)
                
                # Write clip to temp file
                clip_file = f"{output_dir}/temp-semantic-clip-{i+1}.mp4"
                clip.write_videofile(
                    clip_file, 
                    logger=None, 
                    fps=fps, 
                    codec=video_codec,
                    bitrate=video_bitrate,
                    audio_bitrate=audio_bitrate,
                    ffmpeg_params=quality_params
                )
                
                close_clip(clip)
                
                processed_clips.append(SubClippedVideoClip(file_path=clip_file, duration=clip_duration, width=clip_w, height=clip_h))
                video_duration += clip_duration
                
            except Exception as e:
                logger.error(f"failed to process semantic clip: {str(e)}")
        
    else:
        # Original random/sequential logic
        processed_clips = []
        subclipped_items = []
        video_duration = 0
        for video_path in video_paths:
            clip = VideoFileClip(video_path)
            clip_duration = clip.duration
            clip_w, clip_h = clip.size
            close_clip(clip)
            
            start_time = 0

            while start_time < clip_duration:
                end_time = min(start_time + max_clip_duration, clip_duration)            
                # FIX: Don't skip the last piece if it's shorter than max_clip_duration
                # We want to use as much variety as possible. 
                # Minimum 1 second to avoid tiny glitches.
                if end_time - start_time >= 1.0:
                    subclipped_items.append(SubClippedVideoClip(file_path= video_path, start_time=start_time, end_time=end_time, width=clip_w, height=clip_h))
                start_time = end_time    
                if video_concat_mode.value == VideoConcatMode.sequential.value:
                    break

        # Group subclipped items by their source file to enable round-robin selection
        items_by_file = {}
        for item in subclipped_items:
            if item.file_path not in items_by_file:
                items_by_file[item.file_path] = []
            items_by_file[item.file_path].append(item)
        
        # Shuffle clips within each file group for variety
        for file_path in items_by_file:
            random.shuffle(items_by_file[file_path])
            
        # Round-robin selection
        selected_items = []
        max_clips_per_file = max(len(clips) for clips in items_by_file.values()) if items_by_file else 0
        
        for clip_idx in range(max_clips_per_file):
            # Get a list of files that still have clips at this index
            available_files = [f for f in items_by_file if clip_idx < len(items_by_file[f])]
            # Shuffle the order of files for this "round"
            random.shuffle(available_files)
            
            for file_path in available_files:
                selected_items.append(items_by_file[file_path][clip_idx])

        logger.debug(f"total subclipped items: {len(selected_items)}")
        
        # Add clips using the round-robin order
        for i, subclipped_item in enumerate(selected_items):
            if video_duration > audio_duration:
                break
            
            logger.debug(f"processing clip {i+1}: {subclipped_item.width}x{subclipped_item.height}, current duration: {video_duration:.2f}s, remaining: {audio_duration - video_duration:.2f}s")
            
            try:
                clip = VideoFileClip(subclipped_item.file_path).subclipped(subclipped_item.start_time, subclipped_item.end_time)
                clip_duration = clip.duration
                # Not all videos are same size, so we need to resize them
                clip_w, clip_h = clip.size
                if clip_w != video_width or clip_h != video_height:
                    clip_ratio = clip.w / clip.h
                    video_ratio = video_width / video_height
                    logger.debug(f"resizing clip, source: {clip_w}x{clip_h}, ratio: {clip_ratio:.2f}, target: {video_width}x{video_height}, ratio: {video_ratio:.2f}")
                    
                    if clip_ratio == video_ratio:
                        clip = clip.resized(new_size=(video_width, video_height))
                    else:
                        if clip_ratio > video_ratio:
                            scale_factor = video_width / clip_w
                        else:
                            scale_factor = video_height / clip_h

                        new_width = int(clip_w * scale_factor)
                        new_height = int(clip_h * scale_factor)

                        background = ColorClip(size=(video_width, video_height), color=(0, 0, 0)).with_duration(clip_duration)
                        clip_resized = clip.resized(new_size=(new_width, new_height)).with_position("center")
                        clip = CompositeVideoClip([background, clip_resized])
                        
                shuffle_side = random.choice(["left", "right", "top", "bottom"])
                if video_transition_mode and video_transition_mode.value == VideoTransitionMode.none.value:
                    clip = clip
                elif video_transition_mode and video_transition_mode.value == VideoTransitionMode.fade_in.value:
                    clip = video_effects.fadein_transition(clip, 1)
                elif video_transition_mode and video_transition_mode.value == VideoTransitionMode.fade_out.value:
                    clip = video_effects.fadeout_transition(clip, 1)
                elif video_transition_mode and video_transition_mode.value == VideoTransitionMode.slide_in.value:
                    clip = video_effects.slidein_transition(clip, 1, shuffle_side)
                elif video_transition_mode and video_transition_mode.value == VideoTransitionMode.slide_out.value:
                    clip = video_effects.slideout_transition(clip, 1, shuffle_side)
                elif video_transition_mode and video_transition_mode.value == VideoTransitionMode.shuffle.value:
                    transition_funcs = [
                        lambda c: video_effects.fadein_transition(c, 1),
                        lambda c: video_effects.fadeout_transition(c, 1),
                        lambda c: video_effects.slidein_transition(c, 1, shuffle_side),
                        lambda c: video_effects.slideout_transition(c, 1, shuffle_side),
                    ]
                    shuffle_transition = random.choice(transition_funcs)
                    clip = shuffle_transition(clip)

                if clip.duration > max_clip_duration:
                    clip = clip.subclipped(0, max_clip_duration)
                    
                # wirte clip to temp file
                clip_file = f"{output_dir}/temp-clip-{i+1}.mp4"
                clip.write_videofile(
                    clip_file, 
                    logger=None, 
                    fps=fps, 
                    codec=video_codec,
                    bitrate=video_bitrate,
                    audio_bitrate=audio_bitrate,
                    ffmpeg_params=quality_params
                )
                
                close_clip(clip)
            
                processed_clips.append(SubClippedVideoClip(file_path=clip_file, duration=clip.duration, width=clip_w, height=clip_h))
                video_duration += clip.duration
                
            except Exception as e:
                logger.error(f"failed to process clip: {str(e)}")
    
    # if we have more subclipped items that weren't used yet, use them first before looping
    if video_duration < audio_duration:
        unused_items = [item for i, item in enumerate(subclipped_items) if i >= len(processed_clips)]
        for i, subclipped_item in enumerate(unused_items):
            if video_duration >= audio_duration:
                break
            
            # (Re-use the same processing logic as above)
            try:
                # Use a unique index for temp file
                idx = len(processed_clips) + 1
                clip = VideoFileClip(subclipped_item.file_path).subclipped(subclipped_item.start_time, subclipped_item.end_time)
                clip_duration = clip.duration
                clip_w, clip_h = clip.size
                if clip_w != video_width or clip_h != video_height:
                    # ... (omitting resizing for brevity in this instruction, but it should be there)
                    # Actually I should keep it for correctness
                    clip_ratio = clip.w / clip.h
                    video_ratio = video_width / video_height
                    if clip_ratio == video_ratio:
                        clip = clip.resized(new_size=(video_width, video_height))
                    else:
                        scale_factor = video_width / clip_w if clip_ratio > video_ratio else video_height / clip_h
                        new_width, new_height = int(clip_w * scale_factor), int(clip_h * scale_factor)
                        background = ColorClip(size=(video_width, video_height), color=(0, 0, 0)).with_duration(clip_duration)
                        clip_resized = clip.resized(new_size=(new_width, new_height)).with_position("center")
                        clip = CompositeVideoClip([background, clip_resized])

                # Apply transition (same logic as above)
                shuffle_side = random.choice(["left", "right", "top", "bottom"])
                if video_transition_mode and video_transition_mode.value != VideoTransitionMode.none.value:
                    # Use a simple fade for unused items to keep it clean
                    clip = video_effects.fadein_transition(clip, 0.5)

                if clip.duration > max_clip_duration:
                    clip = clip.subclipped(0, max_clip_duration)
                    
                clip_file = f"{output_dir}/temp-clip-{idx}.mp4"
                clip.write_videofile(clip_file, logger=None, fps=fps, codec=video_codec, bitrate=video_bitrate, audio_bitrate=audio_bitrate, ffmpeg_params=quality_params)
                close_clip(clip)
                processed_clips.append(SubClippedVideoClip(file_path=clip_file, duration=clip.duration, width=clip_w, height=clip_h))
                video_duration += clip.duration
            except Exception as e:
                logger.error(f"failed to process additional clip: {str(e)}")

    # loop processed clips until the video duration matches or exceeds the audio duration.
    if video_duration < audio_duration:
        # Check if we should respect max_video_reuse setting (already defined for semantic mode)
        if 'max_reuse_limit' not in locals():
            max_reuse_limit = params.max_video_reuse if params and hasattr(params, 'max_video_reuse') and params.max_video_reuse is not None else None
        
        if max_reuse_limit and max_reuse_limit == 1:
            # User has set max reuse to 1, don't loop clips
            logger.warning(f"video duration ({video_duration:.2f}s) is shorter than audio duration ({audio_duration:.2f}s), but max_video_reuse is set to 1 - NOT looping clips.")
            logger.info(f"final video duration: {video_duration:.2f}s, audio duration: {audio_duration:.2f}s")
        else:
            # Original looping behavior for other cases
            logger.warning(f"video duration ({video_duration:.2f}s) is shorter than audio duration ({audio_duration:.2f}s), looping clips to match audio length.")
            
            if max_reuse_limit:
                # Track how many times each clip has been used for reuse limit
                clip_usage = {}
                base_clips = processed_clips.copy()
                original_clip_count = len(base_clips)
                
                # Initialize usage counter
                for i, clip in enumerate(base_clips):
                    clip_usage[i] = 1  # Already used once
                
                clip_cycle = itertools.cycle(enumerate(base_clips))
                clips_added = 0
                
                for clip_idx, clip in clip_cycle:
                    if video_duration >= audio_duration:
                        break
                    
                    # Check if this clip has reached the reuse limit
                    if clip_usage[clip_idx] >= max_reuse_limit:
                        # Skip clips that have reached the reuse limit
                        continue
                    
                    processed_clips.append(clip)
                    video_duration += clip.duration
                    clip_usage[clip_idx] += 1
                    clips_added += 1
                    
                    # Safety check: if all clips have reached the limit, break
                    if all(usage >= max_reuse_limit for usage in clip_usage.values()):
                        logger.warning(f"all clips have reached max reuse limit ({max_reuse_limit}), stopping at {video_duration:.2f}s")
                        break
                
                logger.info(f"video duration: {video_duration:.2f}s, audio duration: {audio_duration:.2f}s, looped {clips_added} clips (respecting max_reuse_limit: {max_reuse_limit})")
            else:
                # Original unlimited looping behavior
                base_clips = processed_clips.copy()
                for clip in itertools.cycle(base_clips):
                    if video_duration >= audio_duration:
                        break
                    processed_clips.append(clip)
                    video_duration += clip.duration
                logger.info(f"video duration: {video_duration:.2f}s, audio duration: {audio_duration:.2f}s, looped {len(processed_clips)-len(base_clips)} clips")
     
    # merge video clips using direct concatenation to avoid quality degradation
    logger.info("starting clip merging process")
    if not processed_clips:
        logger.warning("no clips available for merging")
        return combined_video_path
    
    # if there is only one clip, use it directly
    if len(processed_clips) == 1:
        logger.info("using single clip directly")
        shutil.copy(processed_clips[0].file_path, combined_video_path)
        delete_files([processed_clips[0].file_path])
        logger.info("video combining completed")
        return combined_video_path
    
    # Use FFmpeg concat demuxer for much lighter memory usage and faster processing
    # Since all clips were generated with the same parameters (fps, codec, bitrate, resolution)
    # we can safely use stream copy (-c copy) which is extremely fast and light
    logger.info(f"Using FFmpeg concat demuxer for {len(processed_clips)} clips")
    
    list_path = os.path.join(output_dir, f"concat_list_{os.path.basename(combined_video_path)}.txt")
    try:
        with open(list_path, "w", encoding="utf-8") as f:
            for clip_info in processed_clips:
                # FFmpeg concat file paths should be absolute and properly escaped
                abs_path = os.path.abspath(clip_info.file_path).replace("'", "'\\''")
                f.write(f"file '{abs_path}'\n")
        
        logger.info(f"Concatenating clips using FFmpeg: {combined_video_path}")
        cmd = [
            "ffmpeg", "-y", "-f", "concat", "-safe", "0",
            "-i", list_path,
            "-c", "copy",
            combined_video_path
        ]
        
        # Run ffmpeg with a timeout and capture output
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        stdout, stderr = process.communicate()
        
        if process.returncode != 0:
            logger.error(f"FFmpeg concat failed with return code {process.returncode}")
            logger.error(f"FFmpeg error: {stderr}")
            raise Exception("FFmpeg concatenation failed, falling back to MoviePy")
            
        logger.info("FFmpeg concatenation successful")
        
    except Exception as e:
        logger.warning(f"FFmpeg concat failed, falling back to MoviePy: {str(e)}")
        # FALLBACK: Original MoviePy logic for safety if FFmpeg fails
        logger.info(f"Loading {len(processed_clips)} clips for MoviePy concatenation")
        clips_to_merge = []
        try:
            for i, clip_info in enumerate(processed_clips):
                clip = VideoFileClip(clip_info.file_path)
                clips_to_merge.append(clip)
            
            final_clip = concatenate_videoclips(clips_to_merge)
            final_clip.write_videofile(
                combined_video_path,
                threads=threads,
                logger=None,
                temp_audiofile_path=output_dir,
                audio_codec=audio_codec,
                fps=fps,
                codec=video_codec,
                bitrate=video_bitrate,
                audio_bitrate=audio_bitrate,
                ffmpeg_params=quality_params
            )
            for clip in clips_to_merge:
                close_clip(clip)
            close_clip(final_clip)
        except Exception as fallback_e:
            logger.error(f"MoviePy fallback also failed: {str(fallback_e)}")
            # If even MoviePy fails, try the progressive merge
            return _progressive_merge_fallback(processed_clips, combined_video_path, output_dir, threads)
    finally:
        if os.path.exists(list_path):
            try:
                os.remove(list_path)
            except Exception:
                pass
    
    # clean temp files
    clip_files = [clip.file_path for clip in processed_clips]
    delete_files(clip_files)
            
    logger.info("video combining completed")
    return combined_video_path


def _progressive_merge_fallback(processed_clips, combined_video_path, output_dir, threads):
    """Fallback progressive merging method if direct concatenation fails"""
    logger.info("using progressive merge fallback")
    
    # create initial video file as base
    base_clip_path = processed_clips[0].file_path
    temp_merged_video = f"{output_dir}/temp-merged-video.mp4"
    temp_merged_next = f"{output_dir}/temp-merged-next.mp4"
    
    # copy first clip as initial merged video
    shutil.copy(base_clip_path, temp_merged_video)
    
    # merge remaining video clips one by one
    for i, clip in enumerate(processed_clips[1:], 1):
        logger.info(f"merging clip {i}/{len(processed_clips)-1}, duration: {clip.duration:.2f}s")
        
        try:
            # load current base video and next clip to merge
            base_clip = VideoFileClip(temp_merged_video)
            next_clip = VideoFileClip(clip.file_path)
            
            # merge these two clips
            merged_clip = concatenate_videoclips([base_clip, next_clip])

            # save merged result to temp file
            merged_clip.write_videofile(
                filename=temp_merged_next,
                threads=threads,
                logger=None,
                temp_audiofile_path=output_dir,
                audio_codec=audio_codec,
                fps=fps,
                codec=video_codec,
                bitrate=video_bitrate,
                audio_bitrate=audio_bitrate,
                ffmpeg_params=quality_params
            )
            close_clip(base_clip)
            close_clip(next_clip)
            close_clip(merged_clip)
            
            # replace base file with new merged file
            delete_files(temp_merged_video)
            os.rename(temp_merged_next, temp_merged_video)
            
        except Exception as e:
            logger.error(f"failed to merge clip: {str(e)}")
            continue
    
    # after merging, rename final result to target file name
    os.rename(temp_merged_video, combined_video_path)
    
    # clean temp files
    clip_files = [clip.file_path for clip in processed_clips]
    delete_files(clip_files)
    
    return combined_video_path


def wrap_text(text, max_width, font="Arial", fontsize=60):
    # Create ImageFont
    font = ImageFont.truetype(font, fontsize)

    def get_text_size(inner_text):
        inner_text = inner_text.strip()
        left, top, right, bottom = font.getbbox(inner_text)
        return right - left, bottom - top

    width, height = get_text_size(text)
    if width <= max_width:
        return text, height

    processed = True
    _wrapped_lines_ = []
    words = text.split(" ")
    _txt_ = ""
    
    # Improved word wrapping with better line balancing
    for word in words:
        _before = _txt_
        test_txt = _txt_ + f"{word} " if _txt_ else f"{word} "
        _width, _height = get_text_size(test_txt)
        
        if _width <= max_width:
            _txt_ = test_txt
        else:
            if _txt_.strip() == word.strip():
                # Single word is too long, force break
                processed = False
                break
            
            # Add current line and start new line
            _wrapped_lines_.append(_before.strip())
            _txt_ = f"{word} "
    
    # Add remaining text
    if _txt_.strip():
        _wrapped_lines_.append(_txt_.strip())
    
    if processed:
        # Balance line lengths for better visual appearance
        _wrapped_lines_ = _balance_line_lengths(_wrapped_lines_, font, max_width)
        result = "\n".join(_wrapped_lines_)
        height = len(_wrapped_lines_) * height
        return result, height

    # Fallback: character-by-character wrapping
    _wrapped_lines_ = []
    chars = list(text)
    _txt_ = ""
    for char in chars:
        test_txt = _txt_ + char
        _width, _height = get_text_size(test_txt)
        if _width <= max_width:
            _txt_ = test_txt
        else:
            if _txt_:
                _wrapped_lines_.append(_txt_)
            _txt_ = char
    
    if _txt_:
        _wrapped_lines_.append(_txt_)
    
    result = "\n".join(_wrapped_lines_)
    height = len(_wrapped_lines_) * height
    return result, height


def _balance_line_lengths(lines, font, max_width):
    """
    Balance line lengths for better visual appearance when center-aligned
    """
    if len(lines) <= 1:
        return lines
    
    def get_text_width(text):
        left, top, right, bottom = font.getbbox(text.strip())
        return right - left
    
    balanced_lines = []
    
    for i, line in enumerate(lines):
        if i < len(lines) - 1:  # Not the last line
            current_line_width = get_text_width(line)
            next_line = lines[i + 1]
            
            # Try to balance by moving words between lines
            words_current = line.split()
            words_next = next_line.split()
            
            # If current line is much shorter than max width and next line has words
            if current_line_width < max_width * 0.7 and len(words_next) > 1:
                # Try moving first word from next line to current line
                test_line = line + " " + words_next[0]
                test_width = get_text_width(test_line)
                
                if test_width <= max_width:
                    # Move the word
                    balanced_lines.append(test_line)
                    lines[i + 1] = " ".join(words_next[1:])  # Update next line
                    continue
        
        balanced_lines.append(line)
    
    return balanced_lines


def create_enhanced_subtitle_clips(enhanced_subtitle_path, params, video_width, video_height, font_path):
    """
    Create text clips with true word-by-word highlighting
    Creates subtitle images where only the currently spoken word is highlighted
    """
    text_clips = []
    
    # Load enhanced subtitle data
    with open(enhanced_subtitle_path, 'r', encoding='utf-8') as f:
        enhanced_data = json.load(f)
    
    def hex_to_rgb(hex_color):
        """Convert hex color to RGB tuple"""
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    
    def position_clip(clip, params, video_height):
        """Apply positioning to a clip based on subtitle position settings"""
        if params.subtitle_position == "bottom":
            return clip.with_position(("center", video_height * 0.85))
        elif params.subtitle_position == "top":
            return clip.with_position(("center", video_height * 0.05))
        elif params.subtitle_position == "custom":
            custom_y = (video_height * params.custom_position / 100)
            return clip.with_position(("center", custom_y))
        else:  # center
            return clip.with_position(("center", "center"))
    
    def create_word_highlighted_image(text, highlighted_word_indices, font_size, normal_color, highlight_color, stroke_color, stroke_width, params):
        """Create an image with specific words highlighted"""
        try:
            font = ImageFont.truetype(font_path, font_size)
        except (IOError, OSError):
            font = ImageFont.load_default()
        
        # Clean text: remove commas but keep line breaks they indicate
        # Replace comma + space with just space, and standalone commas with nothing
        cleaned_text = text.replace(', ', ' ').replace(',', ' ')
        
        # Wrap text using the same logic
        max_width = int(video_width * 0.9)
        wrapped_txt, _ = wrap_text(
            cleaned_text, max_width=max_width, font=font_path, fontsize=font_size
        )
        
        # Split into lines and words
        lines = wrapped_txt.split('\n')
        
        # Calculate image dimensions
        line_height = int(font_size * 1.3)
        img_height = len(lines) * line_height + 40  # Add padding
        img_width = max_width + 40  # Add padding
        
        # Create transparent image
        img = Image.new('RGBA', (img_width, img_height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Draw background box if enabled
        if params.text_background_color is not False:
            bg_color = params.text_background_color
            if bg_color is True:
                bg_color = "#000000"
            
            bg_rgb = hex_to_rgb(bg_color)
            # Add 80% opacity to background box (matches frontend preview backdrop-blur effect)
            bg_rgba = bg_rgb + (204,) 
            
            # Draw a rounded rectangle or simple box for each line or for the whole block
            # For simplicity and to match common subtitle styles, we'll draw one box for the whole text block
            # with some padding
            draw.rectangle(
                [10, 10, img_width - 10, img_height - 10],
                fill=bg_rgba
            )
        
        # Colors
        normal_rgb = hex_to_rgb(normal_color)
        highlight_rgb = hex_to_rgb(highlight_color)
        stroke_rgb = hex_to_rgb(stroke_color) if stroke_color else None
        
        word_index = 0
        y_pos = 20
        
        for line in lines:
            words = line.split()
            
            # Calculate total line width for center alignment
            line_width = 0
            for word in words:
                word_bbox = font.getbbox(word + ' ')
                line_width += word_bbox[2] - word_bbox[0]
            
            # Center the line
            x_pos = (img_width - line_width) // 2
            x_pos = max(20, x_pos)  # Ensure minimum padding
            
            for word in words:
                # Determine color for this word
                word_color = highlight_rgb if word_index in highlighted_word_indices else normal_rgb
                
                # Draw word with stroke if specified
                if stroke_rgb and stroke_width > 0:
                    # Draw stroke by drawing text multiple times with offset
                    stroke_w = int(stroke_width)
                    for dx in range(-stroke_w, stroke_w + 1):
                        for dy in range(-stroke_w, stroke_w + 1):
                            if dx != 0 or dy != 0:
                                draw.text((x_pos + dx, y_pos + dy), word, font=font, fill=stroke_rgb)
                
                # Draw main text
                draw.text((x_pos, y_pos), word, font=font, fill=word_color)
                
                # Calculate next position
                word_bbox = font.getbbox(word + ' ')
                x_pos += word_bbox[2] - word_bbox[0]
                word_index += 1
            
            y_pos += line_height
        
        return img
    
    def create_subtitle_clip(text, highlighted_word_indices, start_time, duration, params):
        """Create a subtitle clip with specified highlighting"""
        try:
            img = create_word_highlighted_image(
                text=text,
                highlighted_word_indices=highlighted_word_indices,
                font_size=int(params.font_size),
                normal_color=params.text_fore_color,
                highlight_color=params.word_highlight_color,
                stroke_color=params.stroke_color,
                stroke_width=int(params.stroke_width),
                params=params
            )
            
            clip = ImageClip(np.array(img)).with_duration(duration).with_start(start_time)
            return position_clip(clip, params, video_height)
            
        except Exception as e:
            logger.error(f"Failed to create subtitle clip: {str(e)}")
            return None
    
    for subtitle_data in enhanced_data:
        # Support both 'start_time' and 'start' keys to prevent KeyError
        start_time = subtitle_data.get('start_time', subtitle_data.get('start', 0))
        end_time = subtitle_data.get('end_time', subtitle_data.get('end', 0))
        text = subtitle_data.get('text', '')
        words = subtitle_data.get('words', [])
        
        # If this item itself is a single word (Edge TTS style), wrap it
        if not words and text:
            words = [{'word': text, 'start': start_time, 'end': end_time}]
            text = text
        
        if not words:
            continue

        # Sort words by start time
        sorted_words = sorted(words, key=lambda w: w.get('start', 0))
        
        # Create word mapping to indices
        text_words = []
        for line in text.split('\n'):
            text_words.extend(line.split())
        
        # Create time segments with word highlighting
        current_time = start_time
        
        for word_data in sorted_words:
            word_start = max(word_data.get('start', 0), start_time)
            word_end = min(word_data.get('end', 0), end_time)
            word_text = word_data.get('word', word_data.get('text', '')).strip()
            
            if word_start >= word_end:
                continue
            
            # Find word index in text
            word_index = -1
            for idx, text_word in enumerate(text_words):
                if text_word.strip().lower() == word_text.lower():
                    word_index = idx
                    break
            
            # Create segment before word (normal colors)
            if word_start > current_time:
                clip = create_subtitle_clip(text, set(), current_time, word_start - current_time, params)
                if clip:
                    text_clips.append(clip)
            
            # Create highlighted segment during word
            if word_index >= 0:
                clip = create_subtitle_clip(text, {word_index}, word_start, word_end - word_start, params)
                if clip:
                    text_clips.append(clip)
            
            current_time = word_end
        
        # Create final normal segment if needed
        if current_time < end_time:
            clip = create_subtitle_clip(text, set(), current_time, end_time - current_time, params)
            if clip:
                text_clips.append(clip)
    
    return text_clips


def generate_video(
    video_path: str,
    audio_path: str,
    subtitle_path: str,
    output_file: str,
    params: VideoParams,
):
    aspect = VideoAspect(params.video_aspect)
    video_width, video_height = aspect.to_resolution()

    logger.info(f"generating video: {video_width} x {video_height}")
    logger.info(f"  ① video: {video_path}")
    logger.info(f"  ② audio: {audio_path}")
    logger.info(f"  ③ subtitle: {subtitle_path}")
    logger.info(f"  ④ output: {output_file}")

    # https://github.com/harry0703/MoneyPrinterTurbo/issues/217
    # PermissionError: [WinError 32] The process cannot access the file because it is being used by another process: 'final-1.mp4.tempTEMP_MPY_wvf_snd.mp3'
    # write into the same directory as the output file
    output_dir = os.path.dirname(output_file)

    font_path = ""
    if params.subtitle_enabled:
        if not params.font_name:
            params.font_name = "STHeitiMedium.ttc"
        font_path = os.path.join(utils.font_dir(), params.font_name)
        if os.name == "nt":
            font_path = font_path.replace("\\", "/")

        logger.info(f"  ⑤ font: {font_path}")

    def create_text_clip(subtitle_item):
        params.font_size = int(params.font_size)
        params.stroke_width = int(params.stroke_width)
        phrase = subtitle_item[1]
        
        # Clean text: remove commas but keep spaces for readability
        cleaned_phrase = phrase.replace(', ', ' ').replace(',', ' ')
        
        max_width = video_width * 0.9
        wrapped_txt, txt_height = wrap_text(
            cleaned_phrase, max_width=max_width, font=font_path, fontsize=params.font_size
        )
        interline = int(params.font_size * 0.25)
        size=(int(max_width), int(txt_height + params.font_size * 0.25 + (interline * (wrapped_txt.count("\n") + 1))))

        _clip = TextClip(
            text=wrapped_txt,
            font=font_path,
            font_size=params.font_size,
            color=params.text_fore_color,
            bg_color=params.text_background_color if params.text_background_color is not False else None,
            stroke_color=params.stroke_color,
            stroke_width=params.stroke_width,
            method='caption',  # Use caption method for better text wrapping
            size=size,
            # align='center',  # Removed - not supported in MoviePy 2.2.1
            # interline=interline,
        )
        duration = subtitle_item[0][1] - subtitle_item[0][0]
        _clip = _clip.with_start(subtitle_item[0][0])
        _clip = _clip.with_end(subtitle_item[0][1])
        _clip = _clip.with_duration(duration)
        if params.subtitle_position == "bottom":
            _clip = _clip.with_position(("center", video_height * 0.95 - _clip.h))
        elif params.subtitle_position == "top":
            _clip = _clip.with_position(("center", video_height * 0.05))
        elif params.subtitle_position == "custom":
            # Ensure the subtitle is fully within the screen bounds
            margin = 10  # Additional margin, in pixels
            max_y = video_height - _clip.h - margin
            min_y = margin
            custom_y = (video_height - _clip.h) * (params.custom_position / 100)
            custom_y = max(
                min_y, min(custom_y, max_y)
            )  # Constrain the y value within the valid range
            _clip = _clip.with_position(("center", custom_y))
        else:  # center
            _clip = _clip.with_position(("center", "center"))
        return _clip

    video_clip = VideoFileClip(video_path).without_audio()
    audio_clip = AudioFileClip(audio_path).with_effects(
        [afx.MultiplyVolume(params.voice_volume)]
    )

    def make_textclip(text):
        return TextClip(
            text=text,
            font=font_path,
            font_size=params.font_size,
        )

    if subtitle_path and os.path.exists(subtitle_path):
        # Check if word highlighting is enabled and enhanced subtitles are available
        enhanced_subtitle_path = getattr(params, '_enhanced_subtitle_path', None)
        use_word_highlighting = (
            getattr(params, 'enable_word_highlighting', False) and
            enhanced_subtitle_path and
            os.path.exists(enhanced_subtitle_path)
        )
        
        if use_word_highlighting:
            logger.info("Using enhanced subtitles with word highlighting")
            text_clips = create_enhanced_subtitle_clips(
                enhanced_subtitle_path, params, video_width, video_height, font_path
            )
        else:
            # Traditional subtitle rendering
            sub = SubtitlesClip(
                subtitles=subtitle_path, encoding="utf-8", make_textclip=make_textclip
            )
            text_clips = []
            for item in sub.subtitles:
                clip = create_text_clip(subtitle_item=item)
                text_clips.append(clip)
        
        video_clip = CompositeVideoClip([video_clip, *text_clips])

    bgm_file = get_bgm_file(bgm_type=params.bgm_type, bgm_file=params.bgm_file)
    if bgm_file:
        try:
            bgm_clip = AudioFileClip(bgm_file).with_effects(
                [
                    afx.MultiplyVolume(params.bgm_volume),
                    afx.AudioFadeOut(3),
                    afx.AudioLoop(duration=video_clip.duration),
                ]
            )
            audio_clip = CompositeAudioClip([audio_clip, bgm_clip])
        except Exception as e:
            logger.error(f"failed to add bgm: {str(e)}")

    video_clip = video_clip.with_audio(audio_clip)
    video_clip.write_videofile(
        output_file,
        audio_codec=audio_codec,
        temp_audiofile_path=output_dir,
        threads=params.n_threads or 2,
        logger=None,
        fps=fps,
        codec=video_codec,
        bitrate=video_bitrate,
        audio_bitrate=audio_bitrate,
        ffmpeg_params=quality_params
    )
    video_clip.close()
    del video_clip


def preprocess_video(materials: List[MaterialInfo], clip_duration=4):
    for material in materials:
        if not material.url:
            continue

        ext = utils.parse_extension(material.url)
        try:
            clip = VideoFileClip(material.url)
        except Exception:
            clip = ImageClip(material.url)

        width = clip.size[0]
        height = clip.size[1]
        if width < 480 or height < 480:
            logger.warning(f"low resolution material: {width}x{height}, minimum 480x480 required")
            continue

        if ext in const.FILE_TYPE_IMAGES:
            logger.info(f"processing image: {material.url}")
            # Create an image clip and set its duration to 3 seconds
            clip = (
                ImageClip(material.url)
                .with_duration(clip_duration)
                .with_position("center")
            )
            # Apply a zoom effect using the resize method.
            # A lambda function is used to make the zoom effect dynamic over time.
            # The zoom effect starts from the original size and gradually scales up to 120%.
            # t represents the current time, and clip.duration is the total duration of the clip (3 seconds).
            # Note: 1 represents 100% size, so 1.2 represents 120% size.
            zoom_clip = clip.resized(
                lambda t: 1 + (clip_duration * 0.03) * (t / clip.duration)
            )

            # Optionally, create a composite video clip containing the zoomed clip.
            # This is useful when you want to add other elements to the video.
            final_clip = CompositeVideoClip([zoom_clip])

            # Output the video to a file.
            video_file = f"{material.url}.mp4"
            final_clip.write_videofile(
                video_file, 
                fps=30, 
                logger=None,
                codec=video_codec,
                bitrate=video_bitrate,
                audio_bitrate=audio_bitrate,
                ffmpeg_params=quality_params
            )
            close_clip(clip)
            material.url = video_file
            logger.success(f"image processed: {video_file}")
    return materials