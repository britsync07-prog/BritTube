"use client";

import React from "react";
import { motion } from "framer-motion";
import { Zap, ArrowRight, Sparkles } from "lucide-react";

export const CTA = () => {
  return (
    <section className="relative py-32 px-6 overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-primary/20 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="max-w-4xl mx-auto glass border-white/10 rounded-[3rem] p-12 md:p-20 text-center relative z-10 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-primary text-sm font-bold mb-8">
            <Sparkles className="w-4 h-4" />
            <span>Ready to Go Viral?</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white mb-8 leading-tight">
            Start Your Automation <br />
            <span className="text-gradient">Empire Today</span>
          </h1>

          <p className="text-muted text-lg md:text-xl max-w-xl mx-auto mb-12">
            Join 10,000+ creators who are using BritTube to dominate 
            social media with AI-powered cinematic content.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button className="group relative px-10 py-5 rounded-2xl bg-white text-black font-black text-xl overflow-hidden transition-all hover:scale-105 active:scale-95">
              <span className="relative z-10 flex items-center gap-2">
                Launch App <Zap className="w-5 h-5 fill-black" />
              </span>
              <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-10 transition-opacity" />
            </button>
            
            <button className="flex items-center gap-2 text-white font-bold text-lg hover:text-primary transition-colors group">
              View Pricing <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>

        {/* Floating Icons Background */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-10 -right-10 w-40 h-40 border border-white/5 rounded-full pointer-events-none"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-10 -left-10 w-60 h-60 border border-white/5 rounded-full pointer-events-none"
        />
      </div>
    </section>
  );
};
