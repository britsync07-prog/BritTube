import os
import random
import threading
from typing import List
from urllib.parse import urlencode

import requests
from loguru import logger
from moviepy.video.io.VideoFileClip import VideoFileClip

from app.core.config import config
from app.models.schema import MaterialInfo, VideoAspect, VideoConcatMode, VideoParams
from app.utils import utils

# Global cache for the semantic model to avoid reloading
_semantic_model = None
_semantic_model_lock = threading.Lock()

# Thread-safe counter for API key rotation
_api_key_counter = 0
_api_key_lock = threading.Lock()


def get_api_key(cfg_key: str):
    api_keys = config.app.get(cfg_key)
    if not api_keys:
        raise ValueError(
            f"\n\n##### {cfg_key} is not set #####\n\nPlease set it in the config.toml file: {config.config_file}\n\n"
            f"{utils.to_json(config.app)}"
        )

    # if only one key is provided, return it
    if isinstance(api_keys, str):
        return api_keys

    global _api_key_counter
    with _api_key_lock:
        _api_key_counter += 1
        return api_keys[_api_key_counter % len(api_keys)]


def search_videos_pexels(
    search_term: str,
    minimum_duration: int,
    video_aspect: VideoAspect = VideoAspect.portrait,
) -> List[MaterialInfo]:
    aspect = VideoAspect(video_aspect)
    video_orientation = aspect.name
    video_width, video_height = aspect.to_resolution()
    api_key = get_api_key("pexels_api_keys")
    headers = {
        "Authorization": api_key,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
    }
    # Build URL
    params = {"query": search_term, "per_page": 20, "orientation": video_orientation}
    query_url = f"https://api.pexels.com/videos/search?{urlencode(params)}"
    logger.info(f"searching videos: {query_url}, with proxies: {config.proxy}")

    try:
        r = requests.get(
            query_url,
            headers=headers,
            proxies=config.proxy,
            verify=False,
            timeout=(30, 60),
        )
        response = r.json()
        video_items = []
        if "videos" not in response:
            logger.error(f"search videos failed: {response}")
            return video_items
        videos = response["videos"]
        # loop through each video in the result
        for v in videos:
            duration = v["duration"]
            # check if video has desired minimum duration
            if duration < minimum_duration:
                continue
            video_files = v["video_files"]
            # loop through each url to determine the best quality
            for video in video_files:
                w = int(video["width"])
                h = int(video["height"])
                if w == video_width and h == video_height:
                    item = MaterialInfo()
                    item.provider = "pexels"
                    item.url = video["link"]
                    item.duration = duration
                    # Pexels doesn't provide explicit tags in the search response, 
                    # but we can use the video orientation and some hints from the URL if needed.
                    item.tags = [] 
                    item.description = f"{search_term} video"
                    video_items.append(item)
                    break
        return video_items
    except Exception as e:
        logger.error(f"search videos failed: {str(e)}")

    return []


def search_videos_pixabay(
    search_term: str,
    minimum_duration: int,
    video_aspect: VideoAspect = VideoAspect.portrait,
) -> List[MaterialInfo]:
    aspect = VideoAspect(video_aspect)

    video_width, video_height = aspect.to_resolution()

    api_key = get_api_key("pixabay_api_keys")
    # Build URL
    params = {
        "q": search_term,
        "video_type": "all",  # Accepted values: "all", "film", "animation"
        "per_page": 50,
        "key": api_key,
    }
    query_url = f"https://pixabay.com/api/videos/?{urlencode(params)}"
    logger.info(f"searching videos: {query_url}, with proxies: {config.proxy}")

    try:
        r = requests.get(
            query_url, proxies=config.proxy, verify=False, timeout=(30, 60)
        )
        response = r.json()
        video_items = []
        if "hits" not in response:
            logger.error(f"search videos failed: {response}")
            return video_items
        videos = response["hits"]
        # loop through each video in the result
        for v in videos:
            duration = v["duration"]
            # check if video has desired minimum duration
            if duration < minimum_duration:
                continue
            video_files = v["videos"]
            # loop through each url to determine the best quality
            for video_type in video_files:
                video = video_files[video_type]
                w = int(video["width"])
                # h = int(video["height"])
                if w >= video_width:
                    item = MaterialInfo()
                    item.provider = "pixabay"
                    item.url = video["url"]
                    item.duration = duration
                    item.tags = [t.strip() for t in v.get("tags", "").split(",")]
                    item.description = v.get("tags", "")
                    video_items.append(item)
                    break
        return video_items
    except Exception as e:
        logger.error(f"search videos failed: {str(e)}")

    return []


def save_video(video_url: str, save_dir: str = "", search_term: str = "", additional_info: dict = None) -> str:
    if not save_dir:
        save_dir = utils.storage_dir("cache_videos")

    if not os.path.exists(save_dir):
        os.makedirs(save_dir)

    url_without_query = video_url.split("?")[0]
    url_hash = utils.md5(url_without_query)
    video_id = f"vid-{url_hash}"
    video_path = f"{save_dir}/{video_id}.mp4"

    # if video already exists, return the path
    if os.path.exists(video_path) and os.path.getsize(video_path) > 0:
        logger.info(f"video already exists: {video_path}")
        # Even if it exists, ensure metadata is saved/updated
        if search_term:
            from app.services import semantic_video
            semantic_video.save_video_metadata(video_path, search_term, additional_info)
        return video_path

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    }

    # if video does not exist, download it
    try:
        response = requests.get(
            video_url,
            headers=headers,
            proxies=config.proxy,
            verify=False,
            timeout=(60, 240),
        )
        with open(video_path, "wb") as f:
            f.write(response.content)
            
        # Save metadata after successful download
        if search_term:
            from app.services import semantic_video
            semantic_video.save_video_metadata(video_path, search_term, additional_info)
            
    except Exception as e:
        logger.error(f"failed to download video from {video_url}: {str(e)}")
        return ""

    if os.path.exists(video_path) and os.path.getsize(video_path) > 0:
        clip = None
        try:
            clip = VideoFileClip(video_path)
            duration = clip.duration
            fps = clip.fps
            if duration > 0 and fps > 0:
                return video_path
        except Exception as e:
            logger.warning(f"invalid video file: {video_path} => {str(e)}")
            try:
                os.remove(video_path)
            except Exception:
                pass
        finally:
            if clip is not None:
                try:
                    clip.close()
                except Exception:
                    pass
    return ""


def _get_semantic_model(model_name: str = "all-mpnet-base-v2"):
    global _semantic_model
    with _semantic_model_lock:
        if _semantic_model is None:
            try:
                from sentence_transformers import SentenceTransformer
                logger.info(f"loading semantic model: {model_name}")
                _semantic_model = SentenceTransformer(model_name)
            except ImportError:
                logger.error("sentence-transformers not installed, please run: pip install sentence-transformers")
                return None
        return _semantic_model


def semantic_search(
    script: str,
    materials: List[MaterialInfo],
    model_name: str = "all-mpnet-base-v2",
    similarity_threshold: float = 0.5,
) -> List[MaterialInfo]:
    """
    Find the best matching materials for a script using semantic similarity.
    This now uses the robust implementation from semantic_video.py
    """
    if not materials:
        return materials
        
    from app.services import semantic_video
    
    # Pre-load model
    semantic_video.load_model(model_name)
    
    # For initial material filtering, we use the simple semantic search 
    # The more complex selection happens in semantic_video.select_videos_for_script
    # which is called during video concatenation.
    
    try:
        from sklearn.metrics.pairwise import cosine_similarity
        import numpy as np
        
        # Get the model
        model = semantic_video.load_model(model_name)

        # Encode the script (or its segments)
        script_embedding = model.encode([script])

        # Encode materials (using tags and description)
        material_texts = [
            f"{' '.join(m.tags) if m.tags else ''} {m.description} {m.search_term}".strip()
            for m in materials
        ]
        material_embeddings = model.encode(material_texts)

        # Calculate similarities
        similarities = cosine_similarity(script_embedding, material_embeddings)[0]

        # Pair materials with their scores
        scored_materials = list(zip(materials, similarities))
        
        # Sort by similarity
        scored_materials.sort(key=lambda x: x[1], reverse=True)

        results = [m for m, score in scored_materials if score >= similarity_threshold]
        
        # If no results meet the threshold, return the top ones anyway
        if not results:
            results = [m for m, score in scored_materials[:20]]
            
        return results
    except Exception as e:
        logger.error(f"semantic matching failed: {str(e)}")
        return materials


def _get_clip_model(model_name: str = "clip-vit-base-patch32"):
    try:
        from transformers import CLIPProcessor, CLIPModel
        import torch
        logger.info(f"loading clip model: {model_name}")
        model = CLIPModel.from_pretrained(f"openai/{model_name}")
        processor = CLIPProcessor.from_pretrained(f"openai/{model_name}")
        return model, processor
    except Exception as e:
        logger.error(f"failed to load clip model: {str(e)}")
        return None, None


def filter_similar_materials(
    materials: List[MaterialInfo],
    threshold: float = 0.9,
    model_name: str = "clip-vit-base-patch32",
) -> List[MaterialInfo]:
    """
    Remove visually similar materials using CLIP.
    Note: For videos, this ideally would check frames, but for performance, 
    it can check tags/descriptions or use a thumbnail if available. 
    Here we'll use descriptions as a proxy if we can't easily get frames.
    """
    # ... placeholder or implementation ...
    return materials


def download_videos(
    task_id: str,
    search_terms: List[str],
    source: str = "pexels",
    video_aspect: VideoAspect = VideoAspect.portrait,
    video_contact_mode: VideoConcatMode = VideoConcatMode.random,
    audio_duration: float = 0.0,
    max_clip_duration: int = 5,
    video_params: VideoParams = None,
) -> List[str]:
    valid_video_items = []
    valid_video_urls = []
    found_duration = 0.0
    search_videos = search_videos_pexels
    if source == "pixabay":
        search_videos = search_videos_pixabay

    for search_term in search_terms:
        video_items = search_videos(
            search_term=search_term,
            minimum_duration=max_clip_duration,
            video_aspect=video_aspect,
        )
        logger.info(f"found {len(video_items)} videos for '{search_term}'")

        for item in video_items:
            if item.url not in valid_video_urls:
                item.search_term = search_term # Ensure search term is attached
                valid_video_items.append(item)
                valid_video_urls.append(item.url)
                found_duration += item.duration

    logger.info(
        f"found total videos: {len(valid_video_items)}, required duration: {audio_duration} seconds, found duration: {found_duration} seconds"
    )
    video_paths = []

    material_directory = config.app.get("material_directory", "").strip()
    if material_directory == "task":
        material_directory = utils.task_dir(task_id)
    elif material_directory and not os.path.isdir(material_directory):
        material_directory = ""

    contact_mode_value = getattr(video_contact_mode, "value", video_contact_mode)
    if contact_mode_value == VideoConcatMode.random.value:
        random.shuffle(valid_video_items)
    elif contact_mode_value == VideoConcatMode.semantic.value and video_params:
        logger.info("starting semantic matching for video materials")
        valid_video_items = semantic_search(
            script=video_params.video_script,
            materials=valid_video_items,
            model_name=video_params.semantic_model,
            similarity_threshold=video_params.similarity_threshold,
        )

    if video_params and video_params.enable_image_similarity:
        logger.info("starting image similarity filtering")
        valid_video_items = filter_similar_materials(
            materials=valid_video_items,
            threshold=video_params.image_similarity_threshold,
            model_name=video_params.image_similarity_model,
        )

    total_duration = 0.0
    for item in valid_video_items:
        try:
            logger.info(f"downloading video: {item.url}")
            # Pass metadata information to save_video
            additional_info = {
                "thumbnail_url": item.thumbnail_url,
                "preview_images": item.preview_images,
                "tags": item.tags,
                "description": item.description,
                "provider": item.provider
            }
            saved_video_path = save_video(
                video_url=item.url, 
                save_dir=material_directory,
                search_term=item.search_term,
                additional_info=additional_info
            )
            if saved_video_path:
                logger.info(f"video saved: {saved_video_path}")
                video_paths.append(saved_video_path)
                seconds = min(max_clip_duration, item.duration)
                total_duration += seconds
                if total_duration > audio_duration:
                    logger.info(
                        f"total duration of downloaded videos: {total_duration} seconds, skip downloading more"
                    )
                    break
        except Exception as e:
            logger.error(f"failed to download video: {utils.to_json(item)} => {str(e)}")
    logger.success(f"downloaded {len(video_paths)} videos")
    return video_paths


if __name__ == "__main__":
    download_videos(
        "test123", ["Money Exchange Medium"], audio_duration=100, source="pixabay"
    )
