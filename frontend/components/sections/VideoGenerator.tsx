"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Play, Loader2, CheckCircle2, AlertCircle, RefreshCcw, Activity, Layers, Settings2, Sparkles, Film, LogIn } from "lucide-react";
import { api, VideoTaskParams } from "../../lib/api";
import { useTaskStatus } from "../../hooks/useTaskStatus";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../lib/utils";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090/api/v1";
const TASKS_BASE_URL = API_BASE.replace(/\/api\/v1\/?$/, "");

export const VideoGenerator = () => {
  const { user, loading: authLoading } = useAuth(false);
  const [activeTab, setActiveTab] = useState("script");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);

  const handleDownload = async (e: React.MouseEvent, url: string, filename: string) => {
    e.preventDefault();
    try {
      setDownloadingUrl(url);
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response was not ok");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download video. Please try right-clicking the video and selecting 'Save Video As'.");
    } finally {
      setDownloadingUrl(null);
    }
  };

  const [params, setParams] = useState<VideoTaskParams>({
    video_subject: "The future of artificial intelligence",
    video_script: "",
    video_language: "en-US",
    video_aspect: "16:9",
    video_concat_mode: "random",
    video_source: "pexels",
    video_clip_duration: 5,
    video_count: 1,
    voice_name: "en-US-AvaNeural-Female",
    voice_volume: 1.0,
    voice_rate: 1.0,
    bgm_type: "random",
    bgm_volume: 0.2,
    subtitle_enabled: true,
    subtitle_position: "bottom",
    custom_position: 70.0,
    font_name: "Charm-Bold.ttf",
    font_size: 48,
    text_fore_color: "#FFFFFF",
    text_background_color: "#000000",
    stroke_color: "#000000",
    stroke_width: 2,
    enable_word_highlighting: false,
    word_highlight_color: "#FFFF00",
    video_transition_mode: "none",
    segmentation_method: "sentences",
    similarity_threshold: 0.5,
    enable_image_similarity: false,
    max_video_reuse: 2,
    paragraph_number: 1,
    video_duration: 60,
  });

  const getPreviewImage = (aspect: string) => {
    if (aspect === "9:16") return "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=1000&auto=format&fit=crop";
    if (aspect === "1:1") return "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop";
    return "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop";
  };

  const getAspectRatioClass = (aspect: string) => {
    switch (aspect) {
      case "9:16": return "aspect-[9/16] w-48 md:w-56";
      case "1:1": return "aspect-square w-64 md:w-72";
      default: return "aspect-video w-full max-w-2xl";
    }
  };

  const { status, error, isPolling } = useTaskStatus(taskId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await api.createTask(params);
      setTaskId(result.task_id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setTaskId(null);
  };

  // Show login prompt if not authenticated
  if (!authLoading && !user) {
    return (
      <div id="generate" className="relative">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-2xl md:text-4xl font-black text-white mb-4"
            >
              Create Your <span className="text-gradient">Video</span>
            </motion.h2>
            <p className="text-muted text-lg">
              Generate professional videos with AI in minutes.
            </p>
          </div>

          <div className="glass border-white/10 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden">
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-6">
                <LogIn className="w-10 h-10 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Login to Start Creating</h3>
              <p className="text-muted mb-8 max-w-md mx-auto">
                Sign in to your account or create a free one to start generating AI videos.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/login"
                  className="px-8 py-3 rounded-xl bg-white text-black font-bold hover:scale-105 transition-transform"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-8 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 transition-colors"
                >
                  Create Free Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="generate" className="relative">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-4xl font-black text-white mb-4"
          >
            Create Your <span className="text-gradient">Video</span>
          </motion.h2>
          <p className="text-muted text-lg">
            Configure your video settings and let AI do the rest.
          </p>
        </div>

        <div className="glass border-white/10 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {!taskId ? (
              <motion.form
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSubmit}
                className="space-y-8"
              >
                {/* Tabs */}
                <div className="flex flex-wrap gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
                  {[
                    { id: "script", label: "Content", icon: Activity },
                    { id: "video", label: "Video", icon: Film },
                    { id: "audio", label: "Audio", icon: Sparkles },
                    { id: "advanced", label: "Advanced", icon: Settings2 },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                        activeTab === tab.id 
                          ? "bg-white text-black shadow-xl" 
                          : "text-white/50 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>

                <div className="min-h-[400px]">
                  <AnimatePresence mode="wait">
                    {activeTab === "script" && (
                      <motion.div
                        key="tab-script"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                      >
                        <div>
                          <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Video Topic</label>
                          <input
                            type="text"
                            required
                            value={params.video_subject}
                            onChange={(e) => setParams({ ...params, video_subject: e.target.value })}
                            placeholder="e.g. The future of space exploration..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Custom Script (Optional)</label>
                          <textarea
                            rows={6}
                            value={params.video_script}
                            onChange={(e) => setParams({ ...params, video_script: e.target.value })}
                            placeholder="Leave blank to auto-generate, or paste your own script..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Language</label>
                            <select
                              value={params.video_language}
                              onChange={(e) => setParams({ ...params, video_language: e.target.value })}
                              className="w-full bg-[#121212] border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none cursor-pointer"
                            >
                              <option value="en-US">English</option>
                              <option value="zh-CN">Chinese</option>
                              <option value="es-ES">Spanish</option>
                              <option value="fr-FR">French</option>
                              <option value="de-DE">German</option>
                              <option value="ja-JP">Japanese</option>
                              <option value="ko-KR">Korean</option>
                              <option value="pt-BR">Portuguese</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Paragraph Count</label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={params.paragraph_number}
                              onChange={(e) => setParams({ ...params, paragraph_number: parseInt(e.target.value) })}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "video" && (
                      <motion.div
                        key="tab-video"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                      >
                        <div>
                          <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Aspect Ratio</label>
                          <select
                            value={params.video_aspect}
                            onChange={(e) => setParams({ ...params, video_aspect: e.target.value as any })}
                            className="w-full bg-[#121212] border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none cursor-pointer"
                          >
                            <option value="16:9">16:9 (YouTube)</option>
                            <option value="9:16">9:16 (TikTok/Reels)</option>
                            <option value="1:1">1:1 (Instagram)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Video Source</label>
                          <select
                            value={params.video_source}
                            onChange={(e) => setParams({ ...params, video_source: e.target.value })}
                            className="w-full bg-[#121212] border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none cursor-pointer"
                          >
                            <option value="pexels">Pexels (Free Stock)</option>
                            <option value="pixabay">Pixabay (Free Stock)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Clip Order</label>
                          <select
                            value={params.video_concat_mode}
                            onChange={(e) => setParams({ ...params, video_concat_mode: e.target.value as any })}
                            className="w-full bg-[#121212] border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none cursor-pointer"
                          >
                            <option value="random">Random Mix</option>
                            <option value="sequential">Sequential</option>
                            <option value="semantic">Semantic Match</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Transitions</label>
                          <select
                            value={params.video_transition_mode || "none"}
                            onChange={(e) => setParams({ ...params, video_transition_mode: e.target.value as any })}
                            className="w-full bg-[#121212] border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none cursor-pointer"
                          >
                            <option value="none">No Transitions</option>
                            <option value="shuffle">Mixed Transitions</option>
                            <option value="FadeIn">Fade In</option>
                            <option value="FadeOut">Fade Out</option>
                            <option value="SlideIn">Slide In</option>
                          </select>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "audio" && (
                      <motion.div
                        key="tab-audio"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                      >
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Voice</label>
                                <select
                                    value={params.voice_name}
                                    onChange={(e) => setParams({ ...params, voice_name: e.target.value })}
                                    className="w-full bg-[#121212] border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none cursor-pointer"
                                >
                                    <option value="en-US-AvaNeural-Female">Ava (Female, US)</option>
                                    <option value="en-US-AndrewNeural-Male">Andrew (Male, US)</option>
                                    <option value="en-GB-SoniaNeural-Female">Sonia (Female, UK)</option>
                                    <option value="en-AU-NatashaNeural-Female">Natasha (Female, AU)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Background Music</label>
                                <select
                                    value={params.bgm_type}
                                    onChange={(e) => setParams({ ...params, bgm_type: e.target.value })}
                                    className="w-full bg-[#121212] border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none cursor-pointer"
                                >
                                    <option value="random">Random</option>
                                    <option value="calm">Calm</option>
                                    <option value="energetic">Energetic</option>
                                    <option value="none">No Music</option>
                                </select>
                            </div>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="flex justify-between text-xs font-bold text-white/50 mb-3 uppercase tracking-wider">
                                    <span>Voice Speed</span>
                                    <span className="text-white">{params.voice_rate}x</span>
                                </label>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="2.0"
                                    step="0.1"
                                    value={params.voice_rate}
                                    onChange={(e) => setParams({ ...params, voice_rate: parseFloat(e.target.value) })}
                                    className="w-full accent-purple-500"
                                />
                            </div>
                            <div>
                                <label className="flex justify-between text-xs font-bold text-white/50 mb-3 uppercase tracking-wider">
                                    <span>Music Volume</span>
                                    <span className="text-white">{Math.round((params.bgm_volume || 0) * 100)}%</span>
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={params.bgm_volume}
                                    onChange={(e) => setParams({ ...params, bgm_volume: parseFloat(e.target.value) })}
                                    className="w-full accent-purple-500"
                                />
                            </div>
                         </div>
                      </motion.div>
                    )}

                    {activeTab === "advanced" && (
                        <motion.div
                            key="tab-advanced"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Clip Duration</label>
                                    <input
                                        type="number"
                                        min="2"
                                        max="10"
                                        value={params.video_clip_duration}
                                        onChange={(e) => setParams({ ...params, video_clip_duration: parseInt(e.target.value) })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Video Count</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="5"
                                        value={params.video_count}
                                        onChange={(e) => setParams({ ...params, video_count: parseInt(e.target.value) })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="p-6 rounded-[2rem] bg-purple-500/10 border border-purple-500/20 flex gap-4">
                                <Sparkles className="w-8 h-8 text-purple-400 shrink-0" />
                                <div>
                                    <h4 className="text-white font-bold mb-1">Subtitle Styling</h4>
                                    <p className="text-white/60 text-sm">Fully customize how subtitles appear on your video.</p>
                                </div>
                            </div>

                            {/* Subtitle Toggle */}
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                                <div>
                                    <span className="text-white font-bold text-sm">Enable Subtitles</span>
                                    <p className="text-white/40 text-xs">Show text overlay on the video</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setParams({ ...params, subtitle_enabled: !params.subtitle_enabled })}
                                    className={`w-12 h-6 rounded-full transition-colors ${params.subtitle_enabled ? 'bg-purple-500' : 'bg-white/20'}`}
                                >
                                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${params.subtitle_enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                </button>
                            </div>

                            {params.subtitle_enabled && (
                                <>
                                    {/* Position + Custom % */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Position</label>
                                            <select
                                                value={params.subtitle_position}
                                                onChange={(e) => setParams({ ...params, subtitle_position: e.target.value })}
                                                className="w-full bg-[#121212] border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none cursor-pointer"
                                            >
                                                <option value="bottom">Bottom</option>
                                                <option value="center">Center</option>
                                                <option value="top">Top</option>
                                                <option value="custom">Custom %</option>
                                            </select>
                                        </div>
                                        {params.subtitle_position === "custom" && (
                                            <div>
                                                <label className="flex justify-between text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">
                                                    <span>Custom Position</span>
                                                    <span className="text-white">{params.custom_position}%</span>
                                                </label>
                                                <input
                                                    type="range"
                                                    min="5"
                                                    max="95"
                                                    step="1"
                                                    value={params.custom_position}
                                                    onChange={(e) => setParams({ ...params, custom_position: parseFloat(e.target.value) })}
                                                    className="w-full accent-purple-500"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Font Size + Stroke Width */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="flex justify-between text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">
                                                <span>Font Size</span>
                                                <span className="text-white">{params.font_size}px</span>
                                            </label>
                                            <input
                                                type="range"
                                                min="20"
                                                max="120"
                                                step="2"
                                                value={params.font_size}
                                                onChange={(e) => setParams({ ...params, font_size: parseInt(e.target.value) })}
                                                className="w-full accent-purple-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="flex justify-between text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">
                                                <span>Stroke Width</span>
                                                <span className="text-white">{params.stroke_width}px</span>
                                            </label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="6"
                                                step="0.5"
                                                value={params.stroke_width || 2}
                                                onChange={(e) => setParams({ ...params, stroke_width: parseFloat(e.target.value) })}
                                                className="w-full accent-purple-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Text Color + Stroke Color */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Text Color</label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="color"
                                                    value={params.text_fore_color}
                                                    onChange={(e) => setParams({ ...params, text_fore_color: e.target.value })}
                                                    className="w-12 h-12 rounded-xl border border-white/10 cursor-pointer bg-transparent"
                                                />
                                                <input
                                                    type="text"
                                                    value={params.text_fore_color}
                                                    onChange={(e) => setParams({ ...params, text_fore_color: e.target.value })}
                                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Stroke Color</label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="color"
                                                    value={params.stroke_color}
                                                    onChange={(e) => setParams({ ...params, stroke_color: e.target.value })}
                                                    className="w-12 h-12 rounded-xl border border-white/10 cursor-pointer bg-transparent"
                                                />
                                                <input
                                                    type="text"
                                                    value={params.stroke_color}
                                                    onChange={(e) => setParams({ ...params, stroke_color: e.target.value })}
                                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Background Color Toggle */}
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                                        <div>
                                            <span className="text-white font-bold text-sm">Background Box</span>
                                            <p className="text-white/40 text-xs">Add a dark background behind subtitles</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setParams({ ...params, text_background_color: params.text_background_color ? "" : "#000000" })}
                                            className={`w-12 h-6 rounded-full transition-colors ${params.text_background_color ? 'bg-purple-500' : 'bg-white/20'}`}
                                        >
                                            <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${params.text_background_color ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                        </button>
                                    </div>

                                    {/* Font + Segmentation */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Font</label>
                                            <select
                                                value={params.font_name || "Charm-Bold.ttf"}
                                                onChange={(e) => setParams({ ...params, font_name: e.target.value })}
                                                className="w-full bg-[#121212] border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none cursor-pointer"
                                            >
                                                <option value="Charm-Bold.ttf">Charm Bold</option>
                                                <option value="Charm-Regular.ttf">Charm Regular</option>
                                                <option value="UTM Kabel KT.ttf">UTM Kabel</option>
                                                <option value="STHeitiMedium.ttc">STHeiti Medium</option>
                                                <option value="MicrosoftYaHeiBold.ttc">Microsoft YaHei Bold</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Segmentation</label>
                                            <select
                                                value={params.segmentation_method}
                                                onChange={(e) => setParams({ ...params, segmentation_method: e.target.value })}
                                                className="w-full bg-[#121212] border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none cursor-pointer"
                                            >
                                                <option value="sentences">By Sentence</option>
                                                <option value="paragraphs">By Paragraph</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Word Highlighting Toggle */}
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                                        <div>
                                            <span className="text-white font-bold text-sm">Word Highlighting</span>
                                            <p className="text-white/40 text-xs">Highlight each word as it's spoken (karaoke style)</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setParams({ ...params, enable_word_highlighting: !params.enable_word_highlighting })}
                                            className={`w-12 h-6 rounded-full transition-colors ${params.enable_word_highlighting ? 'bg-purple-500' : 'bg-white/20'}`}
                                        >
                                            <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${params.enable_word_highlighting ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                        </button>
                                    </div>

                                    {params.enable_word_highlighting && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Highlight Color</label>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="color"
                                                        value={params.word_highlight_color || "#ffff00"}
                                                        onChange={(e) => setParams({ ...params, word_highlight_color: e.target.value })}
                                                        className="w-12 h-12 rounded-xl border border-white/10 cursor-pointer bg-transparent"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={params.word_highlight_color || "#ffff00"}
                                                        onChange={(e) => setParams({ ...params, word_highlight_color: e.target.value })}
                                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="pt-4">
                  <button
                    disabled={isSubmitting}
                    type="submit"
                    className="w-full group relative px-10 py-5 rounded-2xl bg-white text-black font-black text-xl overflow-hidden transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_50px_rgba(255,255,255,0.2)]"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      {isSubmitting ? (
                        <>Generating... <Loader2 className="w-6 h-6 animate-spin" /></>
                      ) : (
                        <>Generate Video <Zap className="w-6 h-6 fill-black" /></>
                      )}
                    </span>
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.div
                key="status"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                {error ? (
                  <div className="flex flex-col items-center gap-6 py-12">
                    <AlertCircle className="w-16 h-16 text-red-500" />
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white">Generation Error</h3>
                      <p className="text-muted text-sm max-w-md mx-auto">{error}</p>
                    </div>
                    <button 
                      onClick={handleReset}
                      className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                ) : status ? (
                  <div className="space-y-8">
                    <div className="relative inline-flex items-center justify-center">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="60"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-white/5"
                        />
                        <motion.circle
                          cx="64"
                          cy="64"
                          r="60"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={377}
                          initial={{ strokeDashoffset: 377 }}
                          animate={{ strokeDashoffset: 377 - (377 * (status.progress || 0)) / 100 }}
                          className="text-purple-500"
                        />
                      </svg>
                      <span className="absolute text-2xl font-black text-white">
                        {Math.round(status.progress)}%
                      </span>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {status.state === 4 ? "Generating Video..." : status.state === 1 ? "Video Ready!" : "Generation Failed"}
                      </h3>
                      <p className="text-muted/80 text-sm max-w-md mx-auto">
                        {(status.message || "").startsWith("Error:") ? (status.message || "").replace("Error:", "").trim() : (status.message || "Processing your video...")}
                      </p>
                    </div>

                    {status.state === 1 && status.videos && status.videos.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                         {/* Video Preview */}
                         <div className="flex justify-center">
                           <video 
                             controls 
                             className="max-w-full rounded-2xl border border-white/10"
                             style={{ maxHeight: "400px" }}
                           >
                             <source src={status.videos[0].startsWith("http") ? status.videos[0] : `${TASKS_BASE_URL}${status.videos[0]}`} type="video/mp4" />
                           </video>
                         </div>
                         <div className="flex justify-center gap-4">
                           <button 
                             onClick={handleReset}
                             className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-colors flex items-center gap-2"
                           >
                             Create Another <RefreshCcw className="w-4 h-4" />
                           </button>
                           <a
                             href={status.videos[0].startsWith("http") ? status.videos[0] : `${TASKS_BASE_URL}${status.videos[0]}`}
                             download
                             className="px-8 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 transition-colors flex items-center gap-2"
                           >
                             Download Video
                           </a>
                         </div>
                      </motion.div>
                    )}

                    {status.state === -1 && (
                      <div className="flex flex-col items-center gap-4">
                        <AlertCircle className="w-16 h-16 text-red-500" />
                        <button 
                          onClick={handleReset}
                          className="px-8 py-3 rounded-xl bg-white text-black font-bold"
                        >
                          Try Again
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-6 py-12">
                    <Loader2 className="w-16 h-16 animate-spin text-purple-500" />
                    <p className="text-muted text-lg">Initializing video generation...</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
