"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { 
  Zap, 
  Video, 
  Sparkles, 
  Share2, 
  Smartphone, 
  Clock 
} from "lucide-react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    title: "Instant Scripting",
    description: "Generate high-converting video scripts in seconds with our advanced AI cinematic engine.",
    icon: Sparkles,
    color: "from-purple-500 to-indigo-500",
  },
  {
    title: "1-Click Generation",
    description: "From idea to final render in a single click. Our pipeline handles everything automatically.",
    icon: Zap,
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "Cinematic Assets",
    description: "Automatically retrieve high-quality 4K stock footage that matches your script perfectly.",
    icon: Video,
    color: "from-pink-500 to-rose-500",
  },
  {
    title: "Social Optimization",
    description: "Multi-platform support for TikTok, Reels, and Shorts with optimized aspect ratios.",
    icon: Smartphone,
    color: "from-orange-500 to-amber-500",
  },
  {
    title: "Automated Voiceover",
    description: "Human-like AI voices in 50+ languages with perfect emotional timing and pacing.",
    icon: Clock,
    color: "from-emerald-500 to-teal-500",
  },
  {
    title: "Viral Export",
    description: "Export directly to your social media accounts with auto-generated captions and tags.",
    icon: Share2,
    color: "from-indigo-500 to-blue-500",
  },
];

const FeatureCard = ({ feature, index }: { feature: typeof features[0]; index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -10 }}
      className="group relative p-8 rounded-3xl glass border-white/5 hover:border-white/20 transition-all duration-500 overflow-hidden"
    >
      <div className={cn(
        "w-14 h-14 rounded-2xl mb-6 flex items-center justify-center bg-gradient-to-br shadow-lg group-hover:scale-110 transition-transform duration-500",
        feature.color
      )}>
        <feature.icon className="w-8 h-8 text-white" />
      </div>
      
      <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-primary transition-colors">
        {feature.title}
      </h3>
      
      <p className="text-muted leading-relaxed group-hover:text-white/80 transition-colors">
        {feature.description}
      </p>

      {/* Decorative Glow */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-[50px] group-hover:bg-primary/20 transition-all" />
    </motion.div>
  );
};

export const Features = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sectionRef.current && headerRef.current) {
      gsap.fromTo(headerRef.current, 
        { opacity: 0, y: 50 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 1,
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse"
          }
        }
      );
    }
  }, []);

  return (
    <section 
      id="features"
      ref={sectionRef} 
      className="relative py-32 px-6 overflow-hidden bg-grid"
    >
      <div className="max-w-7xl mx-auto">
        <div ref={headerRef} className="text-center mb-24">
          <h2 className="text-sm font-bold tracking-[0.2em] text-primary uppercase mb-4">
            Core Capabilities
          </h2>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6">
            Everything you need for <br />
            <span className="text-gradient">Viral Automation</span>
          </h1>
          <p className="max-w-2xl mx-auto text-muted text-lg">
            BritTube combines cutting-edge AI with seamless automation 
            to help you dominate social media platforms.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};
