"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Play, Loader2, CheckCircle2, AlertCircle, RefreshCcw, FileText, Video as VideoIcon, Music, Type, Settings2, Sparkles } from "lucide-react";
import { api, VideoTaskParams } from "@/lib/api";
import { useTaskStatus } from "@/hooks/useTaskStatus";
import { cn } from "@/lib/utils";

export const VideoGenerator = () => {
  const [activeTab, setActiveTab] = useState("script");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [params, setParams] = useState<VideoTaskParams>({
    video_subject: "AI future world",
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
    font_name: "STHeitiMedium.ttc",
    font_size: 60,
    text_fore_color: "#FFFFFF",
    text_background_color: "#000000",
    stroke_color: "#000000",
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

  const fontMap: Record<string, string> = {
    "STHeitiMedium.ttc": "sans-serif",
    "STHeitiLight.ttc": "sans-serif",
    "MicrosoftYaHeiBold.ttc": "system-ui",
    "MicrosoftYaHeiNormal.ttc": "system-ui",
    "Charm-Bold.ttf": "cursive",
    "Charm-Regular.ttf": "cursive",
    "UTM Kabel KT.ttf": "fantasy",
  };

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

  return (
    <div id="generate" className="relative">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-4xl font-black text-white mb-4"
          >
            Create Your <span className="text-gradient">AI Masterpiece</span>
          </motion.h2>
          <p className="text-muted text-lg">
            Configure your video parameters and let BritTube intelligence handle the rest.
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
                    { id: "script", label: "Script", icon: FileText },
                    { id: "video", label: "Video", icon: VideoIcon },
                    { id: "audio", label: "Audio", icon: Music },
                    { id: "subtitles", label: "Subtitles", icon: Type },
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
                          <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Video Subject</label>
                          <input
                            type="text"
                            required
                            value={params.video_subject}
                            onChange={(e) => setParams({ ...params, video_subject: e.target.value })}
                            placeholder="Enter what your video is about..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Custom Script (Optional)</label>
                          <textarea
                            rows={6}
                            value={params.video_script}
                            onChange={(e) => setParams({ ...params, video_script: e.target.value })}
                            placeholder=" ব্রিটিশ সাম্রাজ্যের ইতিহাস... (Leave empty to AI generate)"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary/50 transition-colors resize-none"
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
                              <option value="en-US">English (US)</option>
                              <option value="zh-CN">Chinese (CN)</option>
                              <option value="bn-BD">Bengali (BD)</option>
                              <option value="es-ES">Spanish (ES)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Paragraphs</label>
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
                            <option value="16:9">Wide (16:9)</option>
                            <option value="9:16">Vertical (9:16)</option>
                            <option value="1:1">Square (1:1)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Source Provider</label>
                          <select
                            value={params.video_source}
                            onChange={(e) => setParams({ ...params, video_source: e.target.value })}
                            className="w-full bg-[#121212] border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none cursor-pointer"
                          >
                            <option value="pexels">Pexels (High Quality)</option>
                            <option value="pixabay">Pixabay (Varied)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Matching Mode</label>
                          <select
                            value={params.video_concat_mode}
                            onChange={(e) => setParams({ ...params, video_concat_mode: e.target.value as any })}
                            className="w-full bg-[#121212] border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none cursor-pointer"
                          >
                            <option value="random">Random Concatenation</option>
                            <option value="sequential">Sequential Order</option>
                            <option value="semantic">Semantic Matching (Smart)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Transition Effect</label>
                          <select
                            value={params.video_transition_mode || "none"}
                            onChange={(e) => setParams({ ...params, video_transition_mode: e.target.value as any })}
                            className="w-full bg-[#121212] border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none cursor-pointer"
                          >
                            <option value="none">No Transition</option>
                            <option value="Shuffle">Random Switch</option>
                            <option value="FadeIn">Fade In</option>
                            <option value="FadeOut">Fade Out</option>
                            <option value="SlideIn">Slide In</option>
                            <option value="SlideOut">Slide Out</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Clip Duration (s)</label>
                          <input
                            type="range"
                            min="2"
                            max="10"
                            value={params.video_clip_duration}
                            onChange={(e) => setParams({ ...params, video_clip_duration: parseInt(e.target.value) })}
                            className="w-full accent-primary mt-2"
                          />
                          <div className="flex justify-between text-xs text-white/30 mt-1">
                            <span>2s</span>
                            <span>{params.video_clip_duration}s</span>
                            <span>10s</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Video Duration (s)</label>
                          <input
                            type="range"
                            min="20"
                            max="200"
                            value={params.video_duration}
                            onChange={(e) => setParams({ ...params, video_duration: parseInt(e.target.value) })}
                            className="w-full accent-primary mt-2"
                          />
                          <div className="flex justify-between text-xs text-white/30 mt-1">
                            <span>20s</span>
                            <span>{params.video_duration}s</span>
                            <span>200s</span>
                          </div>
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
                                <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Voice Character</label>
                                <select
                                    value={params.voice_name}
                                    onChange={(e) => setParams({ ...params, voice_name: e.target.value })}
                                    className="w-full bg-[#121212] border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none cursor-pointer"
                                >
                                    <option value="en-US-AvaNeural-Female">Ava (English - Female)</option>
                                    <option value="en-US-AndrewNeural-Male">Andrew (English - Male)</option>
                                    <option value="bn-BD-NabanitaNeural-Female">Nabanita (Bengali - Female)</option>
                                    <option value="bn-BD-PradeepNeural-Male">Pradeep (Bengali - Male)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">BGM Selection</label>
                                <select
                                    value={params.bgm_type}
                                    onChange={(e) => setParams({ ...params, bgm_type: e.target.value })}
                                    className="w-full bg-[#121212] border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none cursor-pointer"
                                >
                                    <option value="random">Random Selection</option>
                                    <option value="calm">Calm & Minimal</option>
                                    <option value="energetic">Energetic & Fast</option>
                                    <option value="none">No Background Music</option>
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
                                    className="w-full accent-primary"
                                />
                            </div>
                            <div>
                                <label className="flex justify-between text-xs font-bold text-white/50 mb-3 uppercase tracking-wider">
                                    <span>BGM Volume</span>
                                    <span className="text-white">{Math.round((params.bgm_volume || 0) * 100)}%</span>
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={params.bgm_volume}
                                    onChange={(e) => setParams({ ...params, bgm_volume: parseFloat(e.target.value) })}
                                    className="w-full accent-primary"
                                />
                            </div>
                         </div>
                      </motion.div>
                    )}

                    {activeTab === "subtitles" && (
                      <motion.div
                        key="tab-subtitles"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                      >
                         <div className="flex flex-wrap gap-6 items-center">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative">
                                    <input 
                                        type="checkbox" 
                                        checked={params.subtitle_enabled}
                                        onChange={(e) => setParams({ ...params, subtitle_enabled: e.target.checked })}
                                        className="sr-only" 
                                    />
                                    <div className={cn("w-12 h-6 rounded-full transition-colors", params.subtitle_enabled ? "bg-primary" : "bg-white/10")} />
                                    <div className={cn("absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform", params.subtitle_enabled ? "translate-x-6" : "translate-x-0")} />
                                </div>
                                <span className="font-bold text-sm text-white">Enable Subtitles</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative">
                                    <input 
                                        type="checkbox" 
                                        checked={params.enable_word_highlighting}
                                        onChange={(e) => setParams({ ...params, enable_word_highlighting: e.target.checked })}
                                        className="sr-only" 
                                    />
                                    <div className={cn("w-12 h-6 rounded-full transition-colors", params.enable_word_highlighting ? "bg-primary" : "bg-white/10")} />
                                    <div className={cn("absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform", params.enable_word_highlighting ? "translate-x-6" : "translate-x-0")} />
                                </div>
                                <span className="font-bold text-sm text-white">Word Highlighting</span>
                            </label>
                         </div>

                         {/* Subtitle Position Visual Selector */}
                         {params.subtitle_enabled && (
                            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-white font-bold mb-1">Live Preview</h4>
                                        <p className="text-white/40 text-xs uppercase tracking-widest font-bold">Adjust position, font and colors below</p>
                                    </div>
                                    <select
                                        value={params.subtitle_position}
                                        onChange={(e) => {
                                            const pos = e.target.value;
                                            let custom = 70.0;
                                            if (pos === "top") custom = 10.0;
                                            else if (pos === "center") custom = 50.0;
                                            else if (pos === "bottom") custom = 85.0;
                                            setParams({ ...params, subtitle_position: pos, custom_position: custom });
                                        }}
                                        className="bg-[#121212] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none cursor-pointer"
                                    >
                                        <option value="top">Top</option>
                                        <option value="center">Center</option>
                                        <option value="bottom">Bottom</option>
                                        <option value="custom">Custom</option>
                                    </select>
                                </div>

                                <div className="flex justify-center items-center py-6 bg-black/60 rounded-2xl border border-white/5 relative overflow-hidden group">
                                    <div 
                                        className={cn(
                                            "relative border-2 border-white/20 rounded-lg transition-all duration-500 cursor-crosshair overflow-hidden shadow-2xl",
                                            getAspectRatioClass(params.video_aspect || "16:9")
                                        )}
                                        onClick={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const y = ((e.clientY - rect.top) / rect.height) * 100;
                                            setParams({ 
                                                ...params, 
                                                subtitle_position: "custom", 
                                                custom_position: parseFloat(y.toFixed(1)) 
                                            });
                                        }}
                                    >
                                        {/* Real Image Background */}
                                        <img 
                                            src={getPreviewImage(params.video_aspect || "16:9")} 
                                            alt="Preview Background" 
                                            className="absolute inset-0 w-full h-full object-cover opacity-60 transition-opacity duration-700"
                                        />
                                        
                                        {/* Dynamic Subtitle Placeholder */}
                                        <motion.div 
                                            animate={{ top: `${params.custom_position}%` }}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            className="absolute left-0 right-0 flex justify-center px-4 pointer-events-none"
                                        >
                                            <div 
                                                className="backdrop-blur-md px-3 py-1.5 rounded border border-white/20 shadow-2xl transition-colors duration-300"
                                                style={{ 
                                                    backgroundColor: typeof params.text_background_color === "string" 
                                                        ? params.text_background_color + "CC" // Add transparency
                                                        : params.text_background_color === true 
                                                            ? "rgba(0,0,0,0.8)" 
                                                            : "transparent",
                                                    border: params.text_background_color === false ? "none" : "1px solid rgba(255,255,255,0.2)"
                                                }}
                                            >
                                                <div 
                                                    className="text-center font-bold whitespace-nowrap leading-tight"
                                                    style={{ 
                                                        color: params.text_fore_color,
                                                        fontSize: Math.max(8, (params.font_size || 60) / 6) + "px",
                                                        fontFamily: fontMap[params.font_name || "STHeitiMedium.ttc"] || "sans-serif",
                                                        textShadow: params.text_background_color === false ? "0 1px 3px rgba(0,0,0,1)" : "none"
                                                    }}
                                                >
                                                    {params.enable_word_highlighting ? (
                                                        <>
                                                            SAMPLE <span style={{ color: params.word_highlight_color }}>SUBTITLE</span> TEXT
                                                        </>
                                                    ) : (
                                                        "SAMPLE SUBTITLE TEXT"
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>

                                        {/* Interactive Hover Hint */}
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                            <span className="text-[10px] text-white/50 font-bold tracking-widest uppercase">Click to Move</span>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-2 right-4 text-[10px] font-mono text-white/30">
                                        {params.video_aspect} • Y: {params.custom_position}%
                                    </div>
                                </div>
                            </div>
                         )}

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Font Style</label>
                                <select
                                    value={params.font_name}
                                    onChange={(e) => setParams({ ...params, font_name: e.target.value })}
                                    className="w-full bg-[#121212] border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none cursor-pointer"
                                >
                                    <option value="STHeitiMedium.ttc">Heiti Medium (Standard)</option>
                                    <option value="MicrosoftYaHeiBold.ttc">YaHei Bold (Professional)</option>
                                    <option value="Charm-Bold.ttf">Charm Bold (Stylized)</option>
                                    <option value="UTM Kabel KT.ttf">UTM Kabel (Modern)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Font Size</label>
                                <div className="flex gap-4">
                                    <input
                                        type="range"
                                        min="20"
                                        max="120"
                                        value={params.font_size}
                                        onChange={(e) => setParams({ ...params, font_size: parseInt(e.target.value) })}
                                        className="flex-1 accent-primary"
                                    />
                                    <span className="text-white font-mono w-12 text-right">{params.font_size}</span>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Text Color</label>
                                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/10">
                                        <input
                                            type="color"
                                            value={params.text_fore_color}
                                            onChange={(e) => setParams({ ...params, text_fore_color: e.target.value })}
                                            className="w-10 h-10 bg-transparent rounded-lg cursor-pointer border-0"
                                        />
                                        <span className="text-sm font-mono text-white/50 uppercase">{params.text_fore_color}</span>
                                    </div>
                                </div>
                                {params.enable_word_highlighting && (
                                    <div className="flex-1">
                                        <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Highlight</label>
                                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/10">
                                            <input
                                                type="color"
                                                value={params.word_highlight_color}
                                                onChange={(e) => setParams({ ...params, word_highlight_color: e.target.value })}
                                                className="w-10 h-10 bg-transparent rounded-lg cursor-pointer border-0"
                                            />
                                            <span className="text-sm font-mono text-white/50 uppercase">{params.word_highlight_color}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Background Box</label>
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <div className="relative">
                                                <input 
                                                    type="checkbox" 
                                                    checked={params.text_background_color !== false}
                                                    onChange={(e) => setParams({ ...params, text_background_color: e.target.checked ? "#000000" : false })}
                                                    className="sr-only" 
                                                />
                                                <div className={cn("w-12 h-6 rounded-full transition-colors", params.text_background_color !== false ? "bg-primary" : "bg-white/10")} />
                                                <div className={cn("absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform", params.text_background_color !== false ? "translate-x-6" : "translate-x-0")} />
                                            </div>
                                            <span className="font-bold text-sm text-white">{params.text_background_color !== false ? "Enabled" : "None"}</span>
                                        </label>
                                    </div>
                                </div>
                                {params.text_background_color !== false && (
                                    <div className="flex-1">
                                        <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Box Color</label>
                                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/10">
                                            <input
                                                type="color"
                                                value={typeof params.text_background_color === "string" ? params.text_background_color : "#000000"}
                                                onChange={(e) => setParams({ ...params, text_background_color: e.target.value })}
                                                className="w-10 h-10 bg-transparent rounded-lg cursor-pointer border-0"
                                            />
                                            <span className="text-sm font-mono text-white/50 uppercase">
                                                {typeof params.text_background_color === "string" ? params.text_background_color : "#000000"}
                                            </span>
                                        </div>
                                    </div>
                                )}
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
                            <div className="p-6 rounded-[2rem] bg-primary/10 border border-primary/20 flex gap-4">
                                <Sparkles className="w-8 h-8 text-primary shrink-0" />
                                <div>
                                    <h4 className="text-white font-bold mb-1">AI Intelligence Tuning</h4>
                                    <p className="text-white/60 text-sm">Fine-tune how Britannic AI selects and processes your video materials.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Segmentation Method</label>
                                    <select
                                        value={params.segmentation_method}
                                        onChange={(e) => setParams({ ...params, segmentation_method: e.target.value })}
                                        className="w-full bg-[#121212] border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none cursor-pointer"
                                    >
                                        <option value="sentences">By Sentences (Recommended)</option>
                                        <option value="paragraphs">By Paragraphs</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="flex justify-between text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">
                                        <span>Similarity Threshold</span>
                                        <span className="text-white">{params.similarity_threshold}</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="0.1"
                                        max="0.9"
                                        step="0.05"
                                        value={params.similarity_threshold}
                                        onChange={(e) => setParams({ ...params, similarity_threshold: parseFloat(e.target.value) })}
                                        className="w-full accent-primary mt-2"
                                    />
                                </div>
                                <div>
                                    <label className="flex justify-between text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">
                                        <span>Max Video Reuse</span>
                                        <span className="text-white">{params.max_video_reuse || 2}</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="5"
                                        step="1"
                                        value={params.max_video_reuse || 2}
                                        onChange={(e) => setParams({ ...params, max_video_reuse: parseInt(e.target.value) })}
                                        className="w-full accent-primary mt-2"
                                    />
                                </div>
                                <div className="flex items-center gap-3 cursor-pointer group">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <div className="relative">
                                            <input 
                                                type="checkbox" 
                                                checked={params.enable_image_similarity}
                                                onChange={(e) => setParams({ ...params, enable_image_similarity: e.target.checked })}
                                                className="sr-only" 
                                            />
                                            <div className={cn("w-12 h-6 rounded-full transition-colors", params.enable_image_similarity ? "bg-primary" : "bg-white/10")} />
                                            <div className={cn("absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform", params.enable_image_similarity ? "translate-x-6" : "translate-x-0")} />
                                        </div>
                                        <span className="font-bold text-sm text-white">CLIP Image Similarity</span>
                                    </label>
                                </div>
                            </div>
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
                        <>Initializing Generation Pipeline... <Loader2 className="w-6 h-6 animate-spin" /></>
                      ) : (
                        <>Launch Generation <Zap className="w-6 h-6 fill-black" /></>
                      )}
                    </span>
                  </button>
                  <p className="text-center text-xs text-white/20 mt-4 uppercase tracking-widest font-bold">Powered by BritTube v2.0 AI Engine</p>
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
                      <h3 className="text-xl font-bold text-white">Connection Error</h3>
                      <p className="text-muted text-sm max-w-md mx-auto">{error}</p>
                    </div>
                    <button 
                      onClick={handleReset}
                      className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-colors"
                    >
                      Return to Generator
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
                          className="text-primary"
                        />
                      </svg>
                      <span className="absolute text-2xl font-black text-white">
                        {Math.round(status.progress)}%
                      </span>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {status.state === 4 ? "Generating Content..." : status.state === 1 ? "Video Ready!" : "Generation Failed"}
                      </h3>
                      <p className="text-muted/80 text-sm max-w-md mx-auto">
                        {status.message.startsWith("Error:") ? status.message.replace("Error:", "").trim() : status.message}
                      </p>
                    </div>

                    {status.state === 1 && status.video_url && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                         <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 group">
                            <video 
                              src={status.video_url} 
                              controls 
                              className="w-full h-full object-cover"
                            />
                         </div>
                         <div className="flex justify-center gap-4">
                            <a 
                              href={status.video_url} 
                              download 
                              className="px-8 py-3 rounded-xl bg-white text-black font-bold hover:scale-105 transition-transform"
                            >
                              Download Video
                            </a>
                            <button 
                              onClick={handleReset}
                              className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-colors flex items-center gap-2"
                            >
                              Create New <RefreshCcw className="w-4 h-4" />
                            </button>
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
                    <Loader2 className="w-16 h-16 animate-spin text-primary" />
                    <p className="text-muted text-lg">Initializing task pipeline...</p>
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
