"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getToken, clearToken, fetchCurrentUser, User } from "../lib/auth";

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  logout: () => void;
}

export function useAuth(requireAuth = false): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    router.push("/login");
  }, [router]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      if (requireAuth) router.push("/login");
      return;
    }

    fetchCurrentUser(token)
      .then(setUser)
      .catch(() => {
        clearToken();
        if (requireAuth) router.push("/login");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requireAuth]); // intentionally omit router — it's stable but causes loops in some versions

  return { user, loading, logout };
}

