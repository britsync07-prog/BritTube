"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Plus, Minus } from "lucide-react";
import { cn } from "../../lib/utils";

const faqs = [
  {
    question: "How does the automated trading actually work?",
    answer: "TradeAuto connects to your preferred exchange via API keys. When our algorithms identify a high-probability setup, they automatically execute buy/sell orders in your account according to your predefined strategy settings.",
  },
  {
    question: "Is it safe? Can TradeAuto withdraw my funds?",
    answer: "No. TradeAuto is strictly non-custodial. You retain full control of your funds on your exchange. When setting up your API keys, you specifically restrict withdrawal permissions, allowing our system only to execute trades.",
  },
  {
    question: "What is your historical win rate?",
    answer: "While past performance is not indicative of future results, our core algorithms have historically maintained a 78.4% win rate over a 3-year backtesting and live execution period in varying market conditions.",
  },
  {
    question: "How do I set up risk management?",
    answer: "In the Strategy Builder, you can configure precise Stop Loss and Take Profit levels, dynamic Trailing Stops based on ATR, and define maximum drawdown limits per trade or per day.",
  },
  {
    question: "Which exchanges do you support?",
    answer: "Currently, we offer seamless API integration with Binance, Bybit, OKX, and Coinbase Advanced Trade. We are actively working on adding more institutional and retail exchanges.",
  },
  {
    question: "What happens if there is extreme market volatility?",
    answer: "Our AI Sentiment Engine monitors global volatility metrics in real-time. You can configure your strategy to pause trading during extreme market swings or flash crashes to protect your capital.",
  },
  {
    question: "Do I need to keep my computer running?",
    answer: "No. TradeAuto operates entirely in the cloud on our secure, high-availability servers. Once your strategy is activated, it runs 24/7 without requiring your device to be on.",
  },
  {
    question: "Can I use leverage?",
    answer: "Yes, for exchanges that support futures/margin trading, you can configure your desired leverage in the Strategy Builder. Please note that leverage significantly increases risk.",
  },
  {
    question: "How fast are the signal executions?",
    answer: "We utilize low-latency architecture, often executing trades within 12ms of a signal triggering, ensuring you get the best possible entry and exit prices before the market moves.",
  },
  {
    question: "What if I want to stop the bot?",
    answer: "You can pause or terminate any active strategy instantly from your Dashboard. Alternatively, you can always revoke the API key directly on your exchange to immediately sever the connection.",
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
            Knowledge Base
          </h2>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-6">
            Frequently Asked <span className="text-gradient">Questions</span>
          </h1>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            Everything you need to know about security, risk management, and getting started with automated trading.
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
