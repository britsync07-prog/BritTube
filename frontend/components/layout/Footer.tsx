import React from "react";
import { Film, Mail } from "lucide-react";
import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="relative py-20 px-6 border-t border-white/5 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Film className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                Brit<span className="text-purple-400">Tube</span>
              </span>
            </Link>
            <p className="text-muted text-sm leading-relaxed mb-6">
              AI-powered video generation platform. Create professional videos with
              AI script writing, voiceovers, and stock footage.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Product</h4>
            <ul className="space-y-4">
              <li><Link href="#features" className="text-muted hover:text-white transition-colors text-sm">Features</Link></li>
              <li><Link href="#showcase" className="text-muted hover:text-white transition-colors text-sm">Showcase</Link></li>
              <li><Link href="#faq" className="text-muted hover:text-white transition-colors text-sm">FAQ</Link></li>
              <li><Link href="/signup" className="text-muted hover:text-white transition-colors text-sm">Get Started</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Legal</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="text-muted hover:text-white transition-colors text-sm">Terms of Service</Link></li>
              <li><Link href="#" className="text-muted hover:text-white transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link href="#" className="text-muted hover:text-white transition-colors text-sm">Content Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Newsletter</h4>
            <p className="text-muted text-sm mb-4">Get updates on new features and AI improvements.</p>
            <div className="relative">
              <input 
                type="email" 
                placeholder="Email address" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
              />
              <button className="absolute right-2 top-2 h-8 w-8 rounded-lg bg-purple-600 flex items-center justify-center">
                <Mail className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted text-xs">
            &copy; 2026 BritTube. All rights reserved.
          </p>
          <div className="flex gap-8 text-xs text-muted">
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
          </div>
        </div>
      </div>

      {/* Background Decorative Glow */}
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-purple-500/5 rounded-full blur-[150px] pointer-events-none" />
    </footer>
  );
};
