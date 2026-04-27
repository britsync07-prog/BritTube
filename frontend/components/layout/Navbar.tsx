"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Cpu, Zap, Layers, Play } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const navLinks = [
  { name: "Features", href: "#features", icon: Cpu },
  { name: "Showcase", href: "#showcase", icon: Play },
  { name: "Generate", href: "#generate", icon: Zap },
  { name: "Pricing", href: "#pricing", icon: Layers },
  { name: "API", href: "#api", icon: Layers },
];

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out px-6 py-4",
        isScrolled ? "py-3" : "py-6"
      )}
    >
      <div
        className={cn(
          "max-w-7xl mx-auto flex items-center justify-between px-6 py-3 rounded-full transition-all duration-500 border border-transparent",
          isScrolled ? "glass border-white/10 shadow-2xl shadow-purple-500/10" : "bg-transparent"
        )}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white group-hover:opacity-80 transition-opacity">
            Brit<span className="text-primary">Tube</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-muted hover:text-white transition-colors relative group"
            >
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </div>

        {/* CTA Button */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-full text-sm font-semibold text-gray-300 hover:text-white border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-primary to-secondary text-white text-sm font-semibold hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-24 left-6 right-6 glass p-6 rounded-3xl md:hidden z-40 border-white/10"
          >
            <div className="flex flex-col gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-4 text-lg font-medium text-white/70 hover:text-white"
                >
                  <link.icon className="w-5 h-5 text-primary" />
                  {link.name}
                </Link>
              ))}
              <hr className="border-white/10" />
              <Link href="/login" className="w-full text-center py-3 rounded-2xl border border-white/10 text-white font-semibold text-sm hover:bg-white/5 transition-all">
                Login
              </Link>
              <Link href="/signup" className="w-full text-center py-3 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-sm">
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
