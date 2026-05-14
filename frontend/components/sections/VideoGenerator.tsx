"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Play, Loader2, CheckCircle2, AlertCircle, RefreshCcw, Activity, Layers, Shield, Settings2, Sparkles, TrendingUp } from "lucide-react";
import { api, VideoTaskParams } from "../../lib/api";
import { useTaskStatus } from "../../hooks/useTaskStatus";
import { cn } from "../../lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090/api/v1";
const TASKS_BASE_URL = API_BASE.replace(/\/api\/v1\/?$/, "");

export const VideoGenerator = () => {
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
            Configure Your <span className="text-gradient">Trading Strategy</span>
          </motion.h2>
          <p className="text-muted text-lg">
            Set your trading parameters and let TradeAuto's algorithms execute seamlessly.
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
                    { id: "script", label: "Strategy", icon: Activity },
                    { id: "video", label: "Execution", icon: Layers },
                    { id: "audio", label: "Risk Mgmt", icon: Shield },
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
                          <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Target Asset Pair</label>
                          <input
                            type="text"
                            required
                            value={params.video_subject}
                            onChange={(e) => setParams({ ...params, video_subject: e.target.value })}
                            placeholder="e.g. BTC/USDT, ETH/USDC..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Strategy Parameters (JSON/Text)</label>
                          <textarea
                            rows={6}
                            value={params.video_script}
                            onChange={(e) => setParams({ ...params, video_script: e.target.value })}
                            placeholder="Define custom technical indicators or leave blank for default signal algorithm..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary/50 transition-colors resize-none"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Exchange</label>
                            <select
                              value={params.video_language}
                              onChange={(e) => setParams({ ...params, video_language: e.target.value })}
                              className="w-full bg-[#121212] border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none cursor-pointer"
                            >
                              <option value="en-US">Binance</option>
                              <option value="zh-CN">Bybit</option>
                              <option value="bn-BD">OKX</option>
                              <option value="es-ES">Coinbase Advanced</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Max Concurrent Trades</label>
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
                          <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Order Type</label>
                          <select
                            value={params.video_aspect}
                            onChange={(e) => setParams({ ...params, video_aspect: e.target.value as any })}
                            className="w-full bg-[#121212] border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none cursor-pointer"
                          >
                            <option value="16:9">Market Order (Immediate)</option>
                            <option value="9:16">Limit Order (Precise)</option>
                            <option value="1:1">TWAP (Institutional)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Signal Confidence Level</label>
                          <select
                            value={params.video_source}
                            onChange={(e) => setParams({ ...params, video_source: e.target.value })}
                            className="w-full bg-[#121212] border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none cursor-pointer"
                          >
                            <option value="pexels">High (Lower Frequency)</option>
                            <option value="pixabay">Medium (Balanced)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Capital Allocation</label>
                          <select
                            value={params.video_concat_mode}
                            onChange={(e) => setParams({ ...params, video_concat_mode: e.target.value as any })}
                            className="w-full bg-[#121212] border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none cursor-pointer"
                          >
                            <option value="random">Dynamic Sizing (Risk-adjusted)</option>
                            <option value="sequential">Fixed Amount ($)</option>
                            <option value="semantic">Fixed Percentage (%)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Leverage (Futures Only)</label>
                          <select
                            value={params.video_transition_mode || "none"}
                            onChange={(e) => setParams({ ...params, video_transition_mode: e.target.value as any })}
                            className="w-full bg-[#121212] border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none cursor-pointer"
                          >
                            <option value="none">1x (Spot)</option>
                            <option value="Shuffle">2x</option>
                            <option value="FadeIn">5x</option>
                            <option value="FadeOut">10x</option>
                            <option value="SlideIn">20x (High Risk)</option>
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
                                <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Stop Loss Method</label>
                                <select
                                    value={params.voice_name}
                                    onChange={(e) => setParams({ ...params, voice_name: e.target.value })}
                                    className="w-full bg-[#121212] border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none cursor-pointer"
                                >
                                    <option value="en-US-AvaNeural-Female">Fixed Percentage</option>
                                    <option value="en-US-AndrewNeural-Male">Trailing Stop (ATR based)</option>
                                    <option value="bn-BD-NabanitaNeural-Female">Support/Resistance (Dynamic)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Take Profit Strategy</label>
                                <select
                                    value={params.bgm_type}
                                    onChange={(e) => setParams({ ...params, bgm_type: e.target.value })}
                                    className="w-full bg-[#121212] border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none cursor-pointer"
                                >
                                    <option value="random">Partial Scalp (50% at TP1)</option>
                                    <option value="calm">Fixed Target</option>
                                    <option value="energetic">Trailing TP</option>
                                </select>
                            </div>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="flex justify-between text-xs font-bold text-white/50 mb-3 uppercase tracking-wider">
                                    <span>Max Drawdown Limit</span>
                                    <span className="text-white">{params.voice_rate}%</span>
                                </label>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="5.0"
                                    step="0.1"
                                    value={params.voice_rate}
                                    onChange={(e) => setParams({ ...params, voice_rate: parseFloat(e.target.value) })}
                                    className="w-full accent-primary"
                                />
                            </div>
                            <div>
                                <label className="flex justify-between text-xs font-bold text-white/50 mb-3 uppercase tracking-wider">
                                    <span>Trailing Step</span>
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

                    {activeTab === "advanced" && (
                        <motion.div
                            key="tab-advanced"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <div className="p-6 rounded-[2rem] bg-primary/10 border border-primary/20 flex gap-4">
                                <TrendingUp className="w-8 h-8 text-primary shrink-0" />
                                <div>
                                    <h4 className="text-white font-bold mb-1">AI Market Sentiment Integration</h4>
                                    <p className="text-white/60 text-sm">Fine-tune how the algorithm interprets global news sentiment before executing a signal.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">Sentiment Weight</label>
                                    <select
                                        value={params.segmentation_method}
                                        onChange={(e) => setParams({ ...params, segmentation_method: e.target.value })}
                                        className="w-full bg-[#121212] border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none cursor-pointer"
                                    >
                                        <option value="sentences">High (Override Technicals)</option>
                                        <option value="paragraphs">Balanced</option>
                                        <option value="ignore">Ignore Sentiment</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="flex justify-between text-sm font-bold text-white/50 mb-3 uppercase tracking-wider">
                                        <span>Volatility Tolerance</span>
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
                        <>Deploying Strategy... <Loader2 className="w-6 h-6 animate-spin" /></>
                      ) : (
                        <>Activate Strategy <Zap className="w-6 h-6 fill-black" /></>
                      )}
                    </span>
                  </button>
                  <p className="text-center text-xs text-white/20 mt-4 uppercase tracking-widest font-bold">Powered by TradeAuto API v2.0</p>
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
                        {status.state === 4 ? "Deploying Strategy..." : status.state === 1 ? "Strategy Active!" : "Deployment Failed"}
                      </h3>
                      <p className="text-muted/80 text-sm max-w-md mx-auto">
                        {(status.message || "").startsWith("Error:") ? (status.message || "").replace("Error:", "").trim() : (status.message || "An unknown error occurred during deployment.")}
                      </p>
                    </div>

                    {status.state === 1 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                         <div className="flex justify-center gap-4">
                            <button 
                              onClick={handleReset}
                              className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-colors flex items-center gap-2"
                            >
                              Configure New Strategy <RefreshCcw className="w-4 h-4" />
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
