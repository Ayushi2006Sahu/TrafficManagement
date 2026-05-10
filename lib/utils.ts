import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function getCongestionColor(level: string): string {
  switch (level) {
    case 'low': return 'text-emerald-400';
    case 'medium': return 'text-yellow-400';
    case 'high': return 'text-orange-400';
    case 'critical': return 'text-red-400';
    default: return 'text-gray-400';
  }
}

export function getCongestionBg(level: string): string {
  switch (level) {
    case 'low': return 'bg-emerald-500/20 border-emerald-500/40';
    case 'medium': return 'bg-yellow-500/20 border-yellow-500/40';
    case 'high': return 'bg-orange-500/20 border-orange-500/40';
    case 'critical': return 'bg-red-500/20 border-red-500/40';
    default: return 'bg-gray-500/20 border-gray-500/40';
  }
}

export function getCongestionGlow(level: string): string {
  switch (level) {
    case 'low': return 'shadow-[0_0_20px_rgba(52,211,153,0.3)]';
    case 'medium': return 'shadow-[0_0_20px_rgba(251,191,36,0.3)]';
    case 'high': return 'shadow-[0_0_20px_rgba(251,146,60,0.3)]';
    case 'critical': return 'shadow-[0_0_20px_rgba(239,68,68,0.4)]';
    default: return '';
  }
}

export function getSignalTime(laneCount: number, maxCount: number): number {
  const ratio = laneCount / Math.max(maxCount, 1);
  const min = 15, max = 65;
  return Math.round(min + ratio * (max - min));
}

export function getActiveLane(
  a: number, b: number, c: number, d: number
): 'A' | 'B' | 'C' | 'D' {
  const max = Math.max(a, b, c, d);
  if (a === max) return 'A';
  if (b === max) return 'B';
  if (c === max) return 'C';
  return 'D';
}

export function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

export function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
