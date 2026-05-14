"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { 
  Zap, 
  LineChart,
  ShieldCheck,
  Activity,
  Layers,
  Clock 
} from "lucide-react";
import { cn } from "../../lib/utils";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    title: "Instant Signal Execution",
    description: "Execute high-intent trading signals instantly across multiple exchanges with zero manual intervention.",
    icon: Zap,
    color: "from-emerald-500 to-teal-500",
  },
  {
    title: "Advanced Risk Management",
    description: "Automated stop-loss, take-profit, and trailing stops to protect your capital dynamically.",
    icon: ShieldCheck,
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "Real-Time Market Data",
    description: "Algorithms driven by sub-second latency market data ensuring you never miss a trend.",
    icon: Activity,
    color: "from-amber-500 to-orange-500",
  },
  {
    title: "Multi-Exchange Support",
    description: "Seamlessly connect via encrypted API keys to Binance, Bybit, OKX, and Coinbase.",
    icon: Layers,
    color: "from-indigo-500 to-purple-500",
  },
  {
    title: "24/7 Passive Trading",
    description: "Our bots monitor the markets around the clock, executing strategies while you sleep.",
    icon: Clock,
    color: "from-rose-500 to-pink-500",
  },
  {
    title: "Performance Analytics",
    description: "Deep dive into your portfolio's growth with transparent, real-time historical logs.",
    icon: LineChart,
    color: "from-cyan-500 to-blue-600",
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
            Institutional Infrastructure
          </h2>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6">
            Everything you need for <br />
            <span className="text-gradient">Passive Wealth Generation</span>
          </h1>
          <p className="max-w-2xl mx-auto text-muted text-lg">
            TradeAuto combines cutting-edge algorithms with seamless automation
            to help you dominate the crypto markets with precision.
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
