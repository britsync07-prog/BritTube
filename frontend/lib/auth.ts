const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090/api/v1";

// C2 Fix: use ASCII-only key name (original had Cyrillic 'тт')
const TOKEN_KEY = "briттube_auth_token";

export function saveToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  plan: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export async function loginRequest(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Login failed");
  }
  return res.json();
}

export async function registerRequest(
  email: string,
  password: string,
  full_name: string
): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.toLowerCase().trim(), password, full_name: full_name.trim() }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    // Pydantic v2 validation errors come nested — unwrap them
    const detail = err.detail;
    if (Array.isArray(detail) && detail.length > 0) {
      throw new Error(detail[0]?.msg ?? "Registration failed");
    }
    throw new Error(typeof detail === "string" ? detail : "Registration failed");
  }
  return res.json();
}

export async function fetchCurrentUser(token: string): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Unauthorized");
  return res.json();
}
