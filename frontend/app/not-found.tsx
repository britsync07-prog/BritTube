"use client";

import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-purple-500/20 mb-4">404</div>
        <h2 className="text-2xl font-bold text-white mb-3">Page Not Found</h2>
        <p className="text-gray-400 text-sm mb-6">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
