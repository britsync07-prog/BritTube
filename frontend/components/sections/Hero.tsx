"use client";

import React from "react";
import { motion } from "framer-motion";
import { Play, ArrowRight, Sparkles } from "lucide-react";
import { HeroBackground } from "./HeroBackground";
import { ParticleAnimation } from "@/components/ui/particle-animation";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Three.js Background */}
      <HeroBackground />

      {/* Hero Content */}
      <div className="container relative z-10 px-6 mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-white/10 text-primary text-sm font-medium mb-8"
        >
          <Sparkles className="w-4 h-4" />
          <span>New: Institutional-Grade Trading Signals v2.0</span>
        </motion.div>

        {/* Particle Animation with overlaid title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="relative flex h-[650px] w-full flex-col items-center justify-center overflow-hidden mb-8"
        >
          {/* Overlaid headline text */}
          <h1 className="pointer-events-none z-10 absolute text-center text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.1]">
            Automate Your Crypto <br />
            <span className="text-gradient">Trading Precision</span>
          </h1>
          {/* Particle canvas fills the container */}
          <ParticleAnimation />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="max-w-2xl mx-auto text-lg md:text-xl text-muted leading-relaxed mb-12"
        >
          Secure, non-custodial automated trading platform. Execute passive trading strategies
          with high-intent crypto signals on your favorite exchanges. 100% automated.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12"
        >
          <button className="group relative px-8 py-4 rounded-full bg-primary text-white font-bold text-lg overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-primary/40">
            <span className="relative z-10 flex items-center gap-2">
              Start Trading Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-secondary to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          
          <button className="flex items-center gap-3 px-8 py-4 rounded-full glass border-white/10 text-white font-semibold text-lg hover:bg-white/10 transition-all">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Play className="w-4 h-4 fill-white text-white" />
            </div>
            View Live Results
          </button>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
          className="flex flex-wrap justify-center gap-8 items-center text-muted"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
               <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <span className="text-sm font-medium">Non-Custodial</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <span className="text-sm font-medium">API Key Encryption</span>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
               <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             </div>
             <span className="text-sm font-medium">Ultra-Low Latency</span>
          </div>
        </motion.div>

        {/* Floating UI Elements (Parallax) */}
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 5, 0]
          }}
          transition={{ 
            duration: 5, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none"
        />
        <motion.div
          animate={{ 
            y: [0, 20, 0],
            rotate: [0, -5, 0]
          }}
          transition={{ 
            duration: 7, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute -top-20 -right-20 w-80 h-80 bg-secondary/20 rounded-full blur-[120px] pointer-events-none"
        />
      </div>
    </section>
  );
};

