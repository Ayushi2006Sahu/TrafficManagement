'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Cpu, LayoutDashboard, Upload, Microscope, TrafficCone,
  BarChart3, LogOut, Menu, X, Bell, ChevronDown, Radio
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/upload', label: 'Upload Footage', icon: Upload },
  { href: '/dashboard/analysis', label: 'AI Analysis', icon: Microscope },
  { href: '/dashboard/junction', label: 'Junction Control', icon: TrafficCone },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
];

export function Sidebar({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center animate-glow-pulse">
            <Cpu className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-gradient leading-none">NexusFlow AI</p>
            <p className="text-[10px] text-gray-500 mt-0.5 font-mono">TRAFFIC CONTROL</p>
          </div>
        </Link>
      </div>

      {/* Live indicator */}
      <div className="mx-4 mt-4 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
        <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        <span className="text-emerald-400 text-xs font-medium">LIVE MONITORING ACTIVE</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 mt-2">
        <p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest px-4 mb-3">Navigation</p>
        {navItems.map(item => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(active ? 'sidebar-item-active' : 'sidebar-item')}
            >
              <item.icon className={cn('w-4 h-4', active ? 'text-cyan-400' : 'text-gray-500')} />
              <span>{item.label}</span>
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-white/5">
        <div className="glass-card p-3 flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-xs font-bold">
            {userEmail?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{userEmail || 'Admin'}</p>
            <p className="text-[10px] text-cyan-400 font-mono">SYSTEM ADMIN</p>
          </div>
          <ChevronDown className="w-3 h-3 text-gray-500" />
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-gray-400 text-sm hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 glass-card rounded-xl"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-dark-900/60 backdrop-blur-xl border-r border-white/5 fixed left-0 top-0 h-full z-30">
        <SidebarContent />
      </aside>

      {/* Sidebar - Mobile */}
      <aside className={cn(
        'lg:hidden flex flex-col w-72 bg-dark-900/95 backdrop-blur-xl border-r border-white/5 fixed left-0 top-0 h-full z-50 transition-transform duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <SidebarContent />
      </aside>
    </>
  );
}

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="h-16 border-b border-white/5 bg-dark-900/40 backdrop-blur-md flex items-center justify-between px-6">
      <div>
        <h2 className="text-lg font-bold text-white leading-none">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-xs font-mono font-medium">SYSTEM ONLINE</span>
        </div>
        <button className="relative p-2 glass-card rounded-xl hover:border-cyan-500/30 transition-colors">
          <Bell className="w-4 h-4 text-gray-400" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-400 animate-pulse" />
        </button>
      </div>
    </div>
  );
}
