"use client";

import React, { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Smartphone, Monitor, Activity, ShieldCheck, LineChart } from "lucide-react";
import ScrollMorphHero from "@/components/ui/scroll-morph-hero";

gsap.registerPlugin(ScrollTrigger);

export const Showcase = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 15]);

  useEffect(() => {
    if (mockupRef.current) {
      gsap.fromTo(mockupRef.current,
        { scale: 0.8, opacity: 0, rotateX: 20 },
        {
          scale: 1,
          opacity: 1,
          rotateX: 0,
          duration: 1.5,
          ease: "power4.out",
          scrollTrigger: {
            trigger: mockupRef.current,
            start: "top 80%",
          }
        }
      );
    }
  }, []);

  return (
    <section 
      id="showcase" 
      ref={containerRef}
      className="relative py-32 px-6 overflow-hidden bg-background"
    >
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <div className="text-center mb-20">
          <h2 className="text-sm font-bold tracking-[0.2em] text-secondary uppercase mb-4">
            Live Transparency
          </h2>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6">
            Proven Results, <br />
            <span className="text-gradient">Zero Guesswork</span>
          </h1>
        </div>

        <div className="relative w-full max-w-4xl perspective-1000">
          {/* Main Mockup */}
          <div 
            ref={mockupRef}
            className="relative z-20 rounded-[2.5rem] p-4 glass border-white/10 shadow-[0_0_50px_rgba(168,85,247,0.2)]"
          >
            <div className="relative aspect-[16/9] w-full rounded-[1.5rem] overflow-hidden bg-black/40 group">
              {/* Mockup Content (Placeholder for Trading Chart) */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-900/40 to-blue-900/40">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center animate-pulse">
                    <LineChart className="w-8 h-8 text-white/50" />
                  </div>
                  <span className="text-white/30 font-medium">Live Connection Established...</span>
                </div>
              </div>
              
              {/* Overlay UI */}
              <div className="absolute top-6 left-6 right-6 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="glass px-4 py-2 rounded-xl border-emerald-500/30 text-xs font-bold text-emerald-400 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  ALGO ACTIVE
                </div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-lg glass border-white/10 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-white" />
                  </div>
                  <div className="w-8 h-8 rounded-lg glass border-white/10 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Elements (Parallax) */}
          <motion.div 
            style={{ y: y1, rotate }}
            className="absolute -top-12 -left-12 z-30 w-24 h-24 glass border-white/10 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/10 hidden md:flex"
          >
            <Smartphone className="w-10 h-10 text-primary" />
          </motion.div>

          <motion.div 
            style={{ y: y2, rotate: -rotate }}
            className="absolute -bottom-12 -right-12 z-10 w-32 h-32 glass border-white/10 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-500/10 hidden md:flex"
          >
            <Monitor className="w-12 h-12 text-secondary" />
          </motion.div>

          {/* Background Glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-24 text-center">
          {[
            { label: "Historical Win Rate", value: "78.4%" },
            { label: "Total Volume Traded", value: "$4.2B+" },
            { label: "Average Latency", value: "12ms" },
            { label: "Active Strategies", value: "2,400+" },
          ].map((stat, i) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              key={stat.label}
            >
              <div className="text-3xl font-black text-white mb-2">{stat.value}</div>
              <div className="text-xs font-bold text-muted uppercase tracking-widest">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
