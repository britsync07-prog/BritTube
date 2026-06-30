"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Loader2,
  ChevronDown,
  ChevronRight,
  Code,
  Terminal,
  BookOpen,
  Zap,
  ExternalLink,
} from "lucide-react";
import { getToken } from "../../../lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090/api/v1";

interface ApiKeyItem {
  id: number;
  key_preview: string;
  name: string;
  user_id: number;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

function CollapsibleSection({ title, icon: Icon, children, defaultOpen = false }: {
  title: string;
  icon: any;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <Icon className="w-5 h-5 text-purple-400 shrink-0" />
        <span className="text-white font-bold text-sm flex-1">{title}</span>
        {open ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-white/5 pt-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative">
      {label && <p className="text-xs text-gray-500 mb-2 font-bold uppercase">{label}</p>}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-gray-300 break-all">
        <pre className="flex-1 whitespace-pre-wrap">{code}</pre>
        <button onClick={copy} className="shrink-0 p-1.5 hover:bg-white/10 rounded-lg transition-colors">
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
        </button>
      </div>
    </div>
  );
}

export default function AdminApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/admin/api-keys`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchKeys(); }, []);

  const createKey = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/admin/api-keys?name=${encodeURIComponent(newKeyName)}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNewKey(data.key);
        setNewKeyName("");
        fetchKeys();
      }
    } finally { setCreating(false); }
  };

  const revokeKey = async (id: number) => {
    if (!confirm("Revoke this API key?")) return;
    const token = getToken();
    await fetch(`${API_BASE}/admin/api-keys/${id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    fetchKeys();
  };

  const toggleKey = async (id: number) => {
    const token = getToken();
    await fetch(`${API_BASE}/admin/api-keys/${id}/toggle`, {
      method: "PUT", headers: { Authorization: `Bearer ${token}` },
    });
    fetchKeys();
  };

  const copyKey = () => {
    if (newKey) { navigator.clipboard.writeText(newKey); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">API Keys & MCP</h1>
          <p className="text-gray-500 mt-1">Manage API keys for external integrations and AI tools</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 transition-colors">
          <Plus className="w-4 h-4" /> Create Key
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
            {newKey ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center"><Check className="w-5 h-5 text-green-400" /></div>
                  <div>
                    <h3 className="text-lg font-bold text-white">API Key Created</h3>
                    <p className="text-xs text-gray-500">Copy this key now — it will not be shown again</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 font-mono text-sm text-white break-all">
                  <span className="flex-1">{newKey}</span>
                  <button onClick={copyKey} className="shrink-0 p-2 hover:bg-white/10 rounded-lg transition-colors">
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
                  </button>
                </div>
                <button onClick={() => { setNewKey(null); setShowCreate(false); }} className="w-full py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/15 transition-colors">Done</button>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">Create API Key</h3>
                <input type="text" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="e.g., My AI Integration" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" autoFocus onKeyDown={(e) => e.key === "Enter" && createKey()} />
                <div className="flex gap-3">
                  <button onClick={() => { setShowCreate(false); setNewKeyName(""); }} className="flex-1 py-3 rounded-xl bg-white/5 text-gray-400 font-bold hover:bg-white/10 transition-colors">Cancel</button>
                  <button onClick={createKey} disabled={creating || !newKeyName.trim()} className="flex-1 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 transition-colors disabled:opacity-50">
                    {creating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Create"}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Keys Table */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Name</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Key</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Created</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Last Used</th>
                <th className="text-right px-6 py-4 text-xs font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-purple-500 mx-auto" /></td></tr>
              ) : keys.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12"><Key className="w-12 h-12 text-gray-600 mx-auto mb-4" /><p className="text-gray-400">No API keys yet</p></td></tr>
              ) : keys.map((k) => (
                <tr key={k.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center"><Key className="w-4 h-4 text-purple-400" /></div>
                      <span className="text-white font-medium">{k.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="font-mono text-xs text-gray-500">{k.key_preview}</span></td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleKey(k.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${k.is_active ? "bg-green-500/10 text-green-400 hover:bg-green-500/20" : "bg-red-500/10 text-red-400 hover:bg-red-500/20"}`}>
                      {k.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{new Date(k.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : "Never"}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => revokeKey(k.id)} className="text-gray-500 hover:text-red-400 transition-colors p-2"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== FULL MCP DOCUMENTATION ===== */}
      <div className="space-y-4">
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-400" />
          MCP Integration Guide
        </h2>
        <p className="text-gray-400 text-sm">
          BritTube includes a Model Context Protocol (MCP) server that lets any AI tool generate videos. 
          Works with Claude Desktop, Cursor, Windsurf, Cline, Continue, and any MCP-compatible client.
        </p>

        {/* Quick Start */}
        <CollapsibleSection title="Quick Start (3 steps)" icon={Zap} defaultOpen={true}>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-bold shrink-0 mt-0.5">1</span>
              <div>
                <p className="text-white font-bold text-sm">Create an API key above</p>
                <p className="text-gray-500 text-xs">Click "Create Key" and copy it immediately.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-bold shrink-0 mt-0.5">2</span>
              <div>
                <p className="text-white font-bold text-sm">Run the MCP server</p>
                <CodeBlock code={`python G:/myjob/BritTube/mcp/mcp_server.py --api-key bt_YOUR_KEY --base-url http://localhost:9090`} />
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-bold shrink-0 mt-0.5">3</span>
              <div>
                <p className="text-white font-bold text-sm">Ask your AI to generate a video</p>
                <p className="text-gray-500 text-xs">Example: "Generate a 60-second video about the future of AI in 16:9 format"</p>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Claude Desktop */}
        <CollapsibleSection title="Claude Desktop Setup" icon={Terminal}>
          <p className="text-gray-400 text-xs mb-3">Add to your Claude Desktop config file (claude_desktop_config.json):</p>
          <CodeBlock label="claude_desktop_config.json" code={JSON.stringify({
            mcpServers: {
              brittube: {
                command: "python",
                args: ["G:/myjob/BritTube/mcp/mcp_server.py"],
                env: {
                  BRITTUBE_API_KEY: "bt_YOUR_KEY_HERE",
                  BRITTUBE_BASE_URL: "http://localhost:9090"
                }
              }
            }
          }, null, 2)} />
          <p className="text-gray-500 text-xs mt-3">Config location: ~/Library/Application Support/Claude/claude_desktop_config.json (Mac) or %APPDATA%/Claude/claude_desktop_config.json (Windows)</p>
        </CollapsibleSection>

        {/* Cursor */}
        <CollapsibleSection title="Cursor / Windsurf / Cline Setup" icon={Code}>
          <p className="text-gray-400 text-xs mb-3">These editors support MCP via settings.json or .cursorrules. Add the same config:</p>
          <CodeBlock label="settings.json" code={JSON.stringify({
            "mcpServers": {
              "brittube": {
                "command": "python",
                "args": ["G:/myjob/BritTube/mcp/mcp_server.py"],
                "env": {
                  "BRITTUBE_API_KEY": "bt_YOUR_KEY_HERE",
                  "BRITTUBE_BASE_URL": "http://localhost:9090"
                }
              }
            }
          }, null, 2)} />
          <p className="text-gray-500 text-xs mt-3">For Cursor: Settings - MCP - Add new MCP server. For Cline: Add to cline_mcp_settings.json.</p>
        </CollapsibleSection>

        {/* Direct API Usage */}
        <CollapsibleSection title="Direct API Usage (no MCP)" icon={Terminal}>
          <p className="text-gray-400 text-xs mb-3">Use the REST API directly with any HTTP client:</p>
          
          <CodeBlock label="Generate Video (curl)" code={`curl -X POST http://localhost:9090/api/external/v1/generate \\
  -H "X-API-Key: bt_YOUR_KEY_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "video_subject": "The beauty of nature",
    "video_language": "en-US",
    "video_aspect": "16:9",
    "video_source": "pexels",
    "voice_name": "en-US-AvaNeural-Female",
    "subtitle_enabled": true
  }'`} />

          <div className="mt-3">
            <CodeBlock label="Check Status (curl)" code={`curl http://localhost:9090/api/external/v1/status/TASK_ID \\
  -H "X-API-Key: bt_YOUR_KEY_HERE"`} />
          </div>

          <div className="mt-3">
            <CodeBlock label="Python Example" code={`import requests

API_KEY = "bt_YOUR_KEY_HERE"
BASE = "http://localhost:9090"
headers = {"X-API-Key": API_KEY}

# Generate video
resp = requests.post(f"{BASE}/api/external/v1/generate", 
    headers=headers,
    json={"video_subject": "Space exploration", "video_aspect": "16:9"})
task_id = resp.json()["task_id"]

# Poll status
import time
while True:
    status = requests.get(f"{BASE}/api/external/v1/status/{task_id}", headers=headers).json()
    print(f"Progress: {status['progress']}%")
    if status["status"] == "completed":
        print(f"Download: {status['videos'][0]}")
        break
    time.sleep(10)`} />
          </div>
        </CollapsibleSection>

        {/* MCP Tools Reference */}
        <CollapsibleSection title="MCP Tools Reference" icon={BookOpen}>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="text-white font-bold text-sm mb-2">generate_video</h4>
              <p className="text-gray-400 text-xs mb-3">Generate a complete video with AI narration, stock footage, and subtitles.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div><span className="text-purple-400 font-bold">subject</span> <span className="text-gray-500">(required)</span> — Video topic</div>
                <div><span className="text-purple-400 font-bold">script</span> — Custom script (AI generates if empty)</div>
                <div><span className="text-purple-400 font-bold">language</span> — en-US, es-ES, fr-FR, etc.</div>
                <div><span className="text-purple-400 font-bold">aspect_ratio</span> — 16:9, 9:16, 1:1</div>
                <div><span className="text-purple-400 font-bold">voice</span> — en-US-AvaNeural-Female, etc.</div>
                <div><span className="text-purple-400 font-bold">duration</span> — Target seconds (default: 60)</div>
                <div><span className="text-purple-400 font-bold">source</span> — pexels or pixabay</div>
                <div><span className="text-purple-400 font-bold">subtitle</span> — true/false (default: true)</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="text-white font-bold text-sm mb-2">check_video_status</h4>
              <p className="text-gray-400 text-xs mb-2">Check progress of a video generation task.</p>
              <div className="text-xs"><span className="text-purple-400 font-bold">task_id</span> <span className="text-gray-500">(required)</span> — Task ID from generate_video</div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="text-white font-bold text-sm mb-2">list_voices</h4>
              <p className="text-gray-400 text-xs">List available TTS voices grouped by language.</p>
            </div>
          </div>
        </CollapsibleSection>

        {/* Available Voices */}
        <CollapsibleSection title="Available Voices" icon={Zap}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {[
              { lang: "English", voices: ["en-US-AvaNeural-Female", "en-US-AndrewNeural-Male", "en-GB-SoniaNeural-Female", "en-AU-NatashaNeural-Female"] },
              { lang: "Spanish", voices: ["es-ES-ElviraNeural-Female", "es-MX-DaliaNeural-Female"] },
              { lang: "French", voices: ["fr-FR-DeniseNeural-Female", "fr-FR-HenriNeural-Male"] },
              { lang: "German", voices: ["de-DE-KatjaNeural-Female", "de-DE-ConradNeural-Male"] },
              { lang: "Japanese", voices: ["ja-JP-NanamiNeural-Female", "ja-JP-KeitaNeural-Male"] },
              { lang: "Chinese", voices: ["zh-CN-XiaoxiaoNeural-Female", "zh-CN-YunxiNeural-Male"] },
              { lang: "Portuguese", voices: ["pt-BR-FranciscaNeural-Female", "pt-BR-AntonioNeural-Male"] },
              { lang: "Hindi", voices: ["hi-IN-SwaraNeural-Female", "hi-IN-MadhurNeural-Male"] },
            ].map((g) => (
              <div key={g.lang} className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-white font-bold mb-1">{g.lang}</p>
                {g.voices.map((v) => <p key={v} className="text-gray-500 font-mono">{v}</p>)}
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* API Endpoints */}
        <CollapsibleSection title="API Endpoints Reference" icon={Code}>
          <div className="space-y-3 text-xs">
            {[
              { method: "POST", path: "/api/external/v1/generate", desc: "Generate a video (requires X-API-Key header)" },
              { method: "GET", path: "/api/external/v1/status/{task_id}", desc: "Check task status and get download URL" },
              { method: "GET", path: "/api/external/v1/stream/{file_path}", desc: "Stream a video file" },
            ].map((ep, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ep.method === "POST" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"}`}>{ep.method}</span>
                <code className="text-gray-300 font-mono flex-1">{ep.path}</code>
                <span className="text-gray-500">{ep.desc}</span>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}
