'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Brain, Zap, Eye, Shield, TrendingUp, AlertTriangle,
  ChevronRight, Activity, Clock, Car, Cpu, Radio, ArrowRight
} from 'lucide-react';

const stats = [
  { value: '94.7%', label: 'Detection Accuracy', icon: Eye },
  { value: '2.3s', label: 'Avg Response Time', icon: Clock },
  { value: '12K+', label: 'Vehicles Analyzed Daily', icon: Car },
  { value: '40%', label: 'Congestion Reduction', icon: TrendingUp },
];

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Detection',
    description: 'Gemini Vision AI analyzes traffic footage in real-time to count vehicles and assess congestion density with high accuracy.',
    color: 'from-cyan-500/20 to-cyan-500/5',
    border: 'border-cyan-500/30',
    glow: 'group-hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]',
    iconColor: 'text-cyan-400',
  },
  {
    icon: Zap,
    title: 'Dynamic Signal Control',
    description: 'Automatically adjusts signal timings based on real-time traffic density — longer green for heavy lanes, shorter for clear ones.',
    color: 'from-yellow-500/20 to-yellow-500/5',
    border: 'border-yellow-500/30',
    glow: 'group-hover:shadow-[0_0_30px_rgba(234,179,8,0.2)]',
    iconColor: 'text-yellow-400',
  },
  {
    icon: AlertTriangle,
    title: 'Emergency Override',
    description: 'Instantly detects emergency vehicles (ambulance, fire, police) and grants immediate signal priority for faster response times.',
    color: 'from-red-500/20 to-red-500/5',
    border: 'border-red-500/30',
    glow: 'group-hover:shadow-[0_0_30px_rgba(239,68,68,0.2)]',
    iconColor: 'text-red-400',
  },
  {
    icon: Activity,
    title: 'Live Analytics',
    description: 'Real-time Supabase-powered dashboard with live charts, traffic trends, and historical data analysis.',
    color: 'from-purple-500/20 to-purple-500/5',
    border: 'border-purple-500/30',
    glow: 'group-hover:shadow-[0_0_30px_rgba(139,92,246,0.2)]',
    iconColor: 'text-purple-400',
  },
  {
    icon: Shield,
    title: 'Secure & Scalable',
    description: 'Enterprise-grade security with Supabase RLS, protected routes, and scalable infrastructure for city-wide deployment.',
    color: 'from-emerald-500/20 to-emerald-500/5',
    border: 'border-emerald-500/30',
    glow: 'group-hover:shadow-[0_0_30px_rgba(52,211,153,0.2)]',
    iconColor: 'text-emerald-400',
  },
  {
    icon: Radio,
    title: 'Realtime Updates',
    description: 'Supabase Realtime pushes live junction status, signal changes, and alerts to all connected dashboards instantly.',
    color: 'from-blue-500/20 to-blue-500/5',
    border: 'border-blue-500/30',
    glow: 'group-hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]',
    iconColor: 'text-blue-400',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: 'easeOut' }
  }),
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dark-950 page-grid scanline overflow-hidden">
      {/* Radial glow backgrounds */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/3 rounded-full blur-3xl" />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 border-b border-white/5 bg-dark-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-lg font-bold text-gradient">NexusFlow AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
            <a href="#stats" className="hover:text-cyan-400 transition-colors">Statistics</a>
            <a href="#how" className="hover:text-cyan-400 transition-colors">How It Works</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary py-2 px-4 text-sm">Sign In</Link>
            <Link href="/signup" className="btn-primary py-2 px-4 text-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-6 pt-28 pb-24 text-center">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            AI-Powered Smart City Traffic System
          </span>
        </motion.div>

        <motion.h1
          initial="hidden" animate="visible" variants={fadeUp} custom={1}
          className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight"
        >
          Optimize Every
          <br />
          <span className="text-gradient">Traffic Junction</span>
          <br />
          with AI Precision
        </motion.h1>

        <motion.p
          initial="hidden" animate="visible" variants={fadeUp} custom={2}
          className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Upload traffic footage, let Gemini AI analyze vehicle density, and watch your city's
          signal timings auto-optimize in real-time. Smart cities deserve smarter traffic.
        </motion.p>

        <motion.div
          initial="hidden" animate="visible" variants={fadeUp} custom={3}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/signup" className="btn-primary flex items-center gap-2 text-base px-8 py-3.5">
            Launch Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login" className="btn-secondary flex items-center gap-2 text-base px-8 py-3.5">
            Sign In <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Hero visual - mock junction */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 relative mx-auto max-w-5xl"
        >
          <div className="glass-card p-1 neon-border">
            <div className="bg-dark-900/90 rounded-xl p-6">
              {/* Mock Dashboard Preview */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Vehicles', val: '1,247', color: 'cyan', icon: '🚗' },
                  { label: 'Congestion Level', val: 'HIGH', color: 'orange', icon: '⚡' },
                  { label: 'Active Junctions', val: '4/4', color: 'emerald', icon: '🔦' },
                  { label: 'Emergency Alert', val: 'CLEAR', color: 'emerald', icon: '🚨' },
                ].map((s, i) => (
                  <div key={i} className="glass-card p-4 text-left">
                    <p className="text-gray-500 text-xs mb-1">{s.label}</p>
                    <p className={`text-${s.color}-400 font-bold text-xl font-mono`}>{s.val}</p>
                  </div>
                ))}
              </div>
              {/* Mock chart bars */}
              <div className="glass-card p-4">
                <p className="text-gray-400 text-xs mb-3 font-medium">LIVE TRAFFIC DENSITY — LAST 8 READINGS</p>
                <div className="flex items-end gap-2 h-20">
                  {[45, 72, 38, 91, 65, 55, 80, 60].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={`w-full rounded-t transition-all duration-1000 ${h > 80 ? 'bg-red-500/70' : h > 60 ? 'bg-orange-500/70' : 'bg-cyan-500/70'}`}
                        style={{ height: `${h}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Glow effect below card */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-12 bg-cyan-500/15 blur-2xl rounded-full" />
        </motion.div>
      </section>

      {/* Stats */}
      <section id="stats" className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              className="glass-card p-6 text-center group hover:border-cyan-500/30 transition-all duration-300"
            >
              <s.icon className="w-8 h-8 text-cyan-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <p className="text-3xl font-bold text-gradient mb-1">{s.value}</p>
              <p className="text-gray-500 text-sm">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Everything Your City <span className="text-gradient">Needs</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            A complete AI traffic management platform built for modern smart cities
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i % 3}
              className={`group glass-card p-6 border ${f.border} transition-all duration-300 ${f.glow}`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <f.icon className={`w-6 h-6 ${f.iconColor}`} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            How <span className="text-gradient">It Works</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Upload Traffic Footage', desc: 'Upload images or videos from any junction camera to Supabase Storage.', icon: '📸' },
            { step: '02', title: 'AI Analysis', desc: 'Gemini Vision API analyzes footage, counts vehicles, detects emergency vehicles and computes congestion scores.', icon: '🧠' },
            { step: '03', title: 'Signal Optimization', desc: 'Dynamic signal timings are calculated and applied. Dashboards update in real-time via Supabase Realtime.', icon: '🚦' },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              className="glass-card p-8 text-center relative"
            >
              <span className="text-5xl mb-4 block">{s.icon}</span>
              <span className="text-xs font-mono text-cyan-500 tracking-widest mb-2 block">{s.step}</span>
              <h3 className="text-xl font-bold text-white mb-3">{s.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              {i < 2 && (
                <div className="hidden md:block absolute top-1/2 -right-4 z-10 text-cyan-500 text-2xl">›</div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="glass-card neon-border p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-cyber opacity-40" />
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-4">Ready to Deploy?</h2>
            <p className="text-gray-400 text-lg mb-8 max-w-lg mx-auto">
              Join the smart city revolution. Start optimizing your traffic junctions with AI today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="btn-primary flex items-center gap-2 justify-center px-8 py-3.5">
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login" className="btn-secondary flex items-center gap-2 justify-center px-8 py-3.5">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-gray-500 text-sm">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-500" />
            <span className="text-gradient font-bold">NexusFlow AI</span>
            <span>— Smart Traffic Junction Optimization</span>
          </div>
          <p>© 2025 NexusFlow AI. Powered by Gemini AI & Supabase.</p>
        </div>
      </footer>
    </div>
  );
}
