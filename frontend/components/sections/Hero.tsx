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
          <span>New: AI Cinematic Engine v2.0</span>
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
            Turn Ideas into <br />
            <span className="text-gradient">Viral Masterpieces</span>
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
          The most advanced AI video automation engine. Generate high-quality shorts, 
          reels, and cinematic content in seconds. 100% automated, 100% viral.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          <button className="group relative px-8 py-4 rounded-full bg-primary text-white font-bold text-lg overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-primary/40">
            <span className="relative z-10 flex items-center gap-2">
              Start Building Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-secondary to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          
          <button className="flex items-center gap-3 px-8 py-4 rounded-full glass border-white/10 text-white font-semibold text-lg hover:bg-white/10 transition-all">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Play className="w-4 h-4 fill-white text-white" />
            </div>
            Watch Demo
          </button>
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

