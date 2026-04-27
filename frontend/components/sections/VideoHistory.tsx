"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Film, Calendar, ExternalLink, Download, Clock, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

interface HistoricalTask {
  task_id: string;
  video_subject: string;
  video_url: string;
  state: number;
  created_at: string;
}

export const VideoHistory = () => {
  const [tasks, setTasks] = useState<HistoricalTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await api.getTaskHistory();
        setTasks(data);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 rounded-3xl border border-dashed border-white/10">
        <Film className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400 font-medium">No videos generated yet</p>
        <p className="text-gray-600 text-sm mt-1">Your creations will appear here</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {tasks.map((task, i) => (
        <motion.div
          key={task.task_id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="group flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-all gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <Film className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold line-clamp-1">{task.video_subject || "Untitled Video"}</h4>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(task.created_at).toLocaleDateString()}
                </span>
                <span className={`flex items-center gap-1 font-bold ${
                  task.state === 1 ? "text-green-400" : task.state === -1 ? "text-red-400" : "text-purple-400"
                }`}>
                  {task.state === 1 ? "Complete" : task.state === -1 ? "Failed" : "Processing"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {task.state === 1 && task.video_url && (
              <>
                <a
                  href={task.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View
                </a>
                <a
                  href={task.video_url}
                  download
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </a>
              </>
            )}
            {task.state === -1 && (
               <div className="text-red-400 text-xs flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Error occurred
               </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
