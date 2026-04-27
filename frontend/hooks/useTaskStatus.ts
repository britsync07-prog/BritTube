"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api, TaskStatus } from "@/lib/api";

export const useTaskStatus = (taskId: string | null) => {
  const [status, setStatus] = useState<TaskStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!taskId) return;

    try {
      const currentStatus = await api.getTaskStatus(taskId);
      setStatus(currentStatus);
      
      // Stop polling if finished or failed
      // State 1 = Success, 4 = Processing, -1 = Failed
      if (currentStatus.state === 1 || currentStatus.state === -1) {
        setIsPolling(false);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch task status");
      setIsPolling(false);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    }
  }, [taskId]);

  useEffect(() => {
    if (taskId) {
      setIsPolling(true);
      fetchStatus();
      pollIntervalRef.current = setInterval(fetchStatus, 2000); // Poll every 2 seconds
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [taskId, fetchStatus]);

  return { status, error, isPolling };
};
