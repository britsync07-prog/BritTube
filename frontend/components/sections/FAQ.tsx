"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Plus, Minus } from "lucide-react";
import { cn } from "../../lib/utils";

const faqs = [
  {
    question: "How does the AI video generation work?",
    answer: "BritTube uses AI to automatically generate video scripts based on your topic, find relevant stock footage, create natural voiceovers, and combine everything with subtitles and background music into a professional video.",
  },
  {
    question: "What languages are supported?",
    answer: "We support over 50 languages for both script generation and text-to-speech voiceovers. Simply select your desired language and our AI will handle the rest.",
  },
  {
    question: "How long does it take to generate a video?",
    answer: "Most videos are generated in under 3 minutes, depending on the video length and complexity. The AI handles script writing, voice generation, footage selection, and final rendering automatically.",
  },
  {
    question: "Can I customize the voiceover?",
    answer: "Yes! Choose from dozens of premium AI voices with different accents, genders, and styles. You can also adjust voice rate and volume to match your preference.",
  },
  {
    question: "What video quality do you support?",
    answer: "Videos are generated in HD quality (up to 1080p) with multiple aspect ratio options: 16:9 for YouTube, 9:16 for TikTok/Reels, and 1:1 for Instagram posts.",
  },
  {
    question: "Can I use my own script?",
    answer: "Absolutely! You can provide your own script or let the AI generate one for you. If you provide a script, the AI will use it as-is for voiceover and subtitle generation.",
  },
  {
    question: "Is there a limit on video generation?",
    answer: "Free users can generate up to 10 videos per month. Pro users get unlimited video generation with priority processing. Enterprise plans are available for teams.",
  },
  {
    question: "Can I edit the video after generation?",
    answer: "Currently, videos are generated as complete files. However, you can customize many parameters before generation including aspect ratio, voice, transitions, subtitles, and background music.",
  },
  {
    question: "Where does the stock footage come from?",
    answer: "We source high-quality stock footage from Pexels and Pixabay, both offering royalty-free videos that can be used commercially without attribution.",
  },
  {
    question: "Do I need video editing experience?",
    answer: "Not at all! BritTube is designed for everyone. Simply enter your topic, adjust your preferences, and click generate. The AI handles all the technical work.",
  },
];

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="relative py-32 px-6 overflow-hidden bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold tracking-[0.2em] text-secondary uppercase mb-4">
            Frequently Asked Questions
          </h2>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-6">
            Common <span className="text-gradient">Questions</span>
          </h1>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            Everything you need to know about AI video generation with BritTube.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "glass rounded-2xl border transition-all duration-300",
                openIndex === index ? "border-primary/50 bg-white/10" : "border-white/10 hover:border-white/20 hover:bg-white/5"
              )}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="flex items-center justify-between w-full p-6 text-left"
              >
                <span className="font-bold text-lg text-white">{faq.question}</span>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                  openIndex === index ? "bg-primary text-white" : "bg-white/10 text-white/50"
                )}>
                  {openIndex === index ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 pt-0 text-muted leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
