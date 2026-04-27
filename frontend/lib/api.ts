import { getToken } from "./auth";

export interface VideoTaskParams {
  // Video Content Settings
  video_subject: string;
  video_script?: string;
  video_terms?: string | string[];
  video_language?: string;
  video_source?: string;
  video_materials?: any[];
  video_aspect?: "9:16" | "16:9" | "1:1";
  video_concat_mode?: "sequential" | "random" | "semantic";
  video_transition_mode?: string;
  video_clip_duration?: number;
  video_count?: number;
  video_duration?: number;

  // Semantic Video Matching Settings
  segmentation_method?: string;
  min_segment_length?: number;
  similarity_threshold?: number;
  diversity_threshold?: number;
  max_video_reuse?: number;
  search_pool_size?: number;
  semantic_model?: string;

  // Image Similarity Settings
  enable_image_similarity?: boolean;
  image_similarity_threshold?: number;
  image_similarity_model?: string;

  // Audio Settings
  voice_name?: string;
  voice_volume?: number;
  voice_rate?: number;
  bgm_type?: string;
  bgm_file?: string;
  bgm_volume?: number;
  custom_audio_file?: string;

  // Subtitle Settings
  subtitle_enabled?: boolean;
  subtitle_position?: string;
  custom_position?: number;
  font_name?: string;
  text_fore_color?: string;
  text_background_color?: boolean | string;
  font_size?: number;
  stroke_color?: string;
  stroke_width?: number;

  // Word Highlighting Settings
  enable_word_highlighting?: boolean;
  word_highlight_color?: string;
  max_chars_per_line?: number;
  max_lines_per_subtitle?: number;

  // Misc Settings
  n_threads?: number;
  paragraph_number?: number;
}

export interface TaskStatus {
  id: string;
  state: number;
  progress: number;
  message: string;
  video_url: string;
  created_at: string;
  updated_at: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090/api/v1";

export const api = {
  createTask: async (params: VideoTaskParams): Promise<{ task_id: string }> => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        let errorMessage = `Failed to create task: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.detail) {
            errorMessage = errorData.detail;
          }
        } catch (e) {
          // Fallback to status text
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      console.error("API Error (createTask):", error);
      throw error;
    }
  },

  getTaskStatus: async (taskId: string): Promise<TaskStatus> => {
    try {
      const response = await fetch(`${API_BASE}/tasks/${taskId}`);
      
      if (!response.ok) {
        let errorMessage = `Failed to fetch task status: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.detail) {
            errorMessage = errorData.detail;
          }
        } catch (e) {
          // If response is not JSON, use status text
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      console.error("API Error (getTaskStatus):", error);
      throw error;
    }
  },

  getTaskHistory: async (): Promise<any[]> => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/tasks/history`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Failed to fetch history");
      return response.json();
    } catch (error) {
      console.error("API Error (getTaskHistory):", error);
      throw error;
    }
  }
};
