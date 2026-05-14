import React from "react";
import { TrendingUp, Shield, Activity, HelpCircle, Mail } from "lucide-react";
import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="relative py-20 px-6 border-t border-white/5 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                Trade<span className="text-primary">Auto</span>
              </span>
            </Link>
            <p className="text-muted text-sm leading-relaxed mb-6">
              Secure, non-custodial automated trading platform. Execute passive trading strategies
              with high-intent crypto signals.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full glass border-white/10 flex items-center justify-center hover:text-primary transition-colors">
                <Shield className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full glass border-white/10 flex items-center justify-center hover:text-primary transition-colors">
                <Activity className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Platform</h4>
            <ul className="space-y-4">
              <li><Link href="#features" className="text-muted hover:text-white transition-colors text-sm">Features</Link></li>
              <li><Link href="#showcase" className="text-muted hover:text-white transition-colors text-sm">Live Results</Link></li>
              <li><Link href="#pricing" className="text-muted hover:text-white transition-colors text-sm">Pricing</Link></li>
              <li><Link href="#faq" className="text-muted hover:text-white transition-colors text-sm">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Legal</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="text-muted hover:text-white transition-colors text-sm">Terms & Conditions</Link></li>
              <li><Link href="#" className="text-muted hover:text-white transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link href="#" className="text-muted hover:text-white transition-colors text-sm">Risk Disclosure</Link></li>
              <li><Link href="#" className="text-muted hover:text-white transition-colors text-sm">AML Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Newsletter</h4>
            <p className="text-muted text-sm mb-4">Subscribe for the latest AI updates.</p>
            <div className="relative">
              <input 
                type="email" 
                placeholder="Email address" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors"
              />
              <button className="absolute right-2 top-2 h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Mail className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 p-6 bg-white/5 border border-white/10 rounded-2xl">
          <h4 className="text-white font-bold text-sm mb-2">High-Risk Warning</h4>
          <p className="text-muted text-xs leading-relaxed">
            Trading cryptocurrencies and executing automated trading strategies carries a high level of risk, and may not be suitable for all investors. Before deciding to trade cryptocurrency you should carefully consider your investment objectives, level of experience, and risk appetite. The possibility exists that you could sustain a loss of some or all of your initial investment and therefore you should not invest money that you cannot afford to lose. You should be aware of all the risks associated with cryptocurrency trading, and seek advice from an independent financial advisor if you have any doubts.
          </p>
        </div>

        <div className="pt-8 mt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted text-xs">
            © 2026 TradeAuto. All rights reserved.
          </p>
          <div className="flex gap-8 text-xs text-muted">
            <Link href="#" className="hover:text-white transition-colors">Terms & Conditions</Link>
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Risk Disclosure</Link>
          </div>
        </div>
      </div>

      {/* Background Decorative Glow */}
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
    </footer>
  );
};
