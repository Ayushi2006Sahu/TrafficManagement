'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, AlertTriangle, TrendingUp, Clock, RefreshCw,
  ChevronUp, CheckCircle, Radio, Shield
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { JunctionStatus } from '@/lib/types/database';
import { TopBar } from '@/components/layout/Sidebar';
import { cn, getCongestionBg, getCongestionColor, getCongestionGlow, getSignalTime, getActiveLane } from '@/lib/utils';

// Animated Traffic Light
function TrafficLight({ phase }: { phase: 'red' | 'yellow' | 'green' }) {
  return (
    <div className="flex flex-col items-center gap-2 bg-dark-900 p-3 rounded-2xl border border-white/10 w-14">
      {(['red', 'yellow', 'green'] as const).map(color => (
        <div key={color} className={cn(
          'w-8 h-8 rounded-full transition-all duration-500',
          phase === color
            ? color === 'red' ? 'bg-red-500 traffic-light-glow-red'
              : color === 'yellow' ? 'bg-yellow-400 traffic-light-glow-yellow'
              : 'bg-green-500 traffic-light-glow-green'
            : 'bg-gray-800'
        )} />
      ))}
    </div>
  );
}

// Timer ring
function SignalTimer({ total, remaining, color }: { total: number; remaining: number; color: string }) {
  const pct = total > 0 ? (remaining / total) * 100 : 0;
  const r = 28, circ = 2 * Math.PI * r;
  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="80" height="80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - (circ * pct / 100)}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <span className="text-white font-mono font-bold text-lg z-10">{remaining}s</span>
    </div>
  );
}

// Lane card
function LaneCard({
  lane, count, maxCount, isActive, signalTime, onOverride, emergency
}: {
  lane: string; count: number; maxCount: number; isActive: boolean;
  signalTime: number; onOverride: () => void; emergency: boolean;
}) {
  const [timer, setTimer] = useState(signalTime);
  const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
  const density = pct > 80 ? 'critical' : pct > 55 ? 'high' : pct > 30 ? 'medium' : 'low';
  const phase: 'red' | 'yellow' | 'green' = emergency ? 'red' : isActive ? 'green' : 'red';

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    setTimer(signalTime);
  }, [signalTime, isActive]);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimer(t => t > 0 ? t - 1 : signalTime);
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, signalTime]);

  return (
    <motion.div
      layout
      className={cn(
        'glass-card p-5 transition-all duration-500',
        isActive && !emergency
          ? 'border border-green-500/40 shadow-[0_0_30px_rgba(34,197,94,0.15)]'
          : emergency ? 'border border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.15)]'
          : 'hover:border-white/20'
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold',
              isActive ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-400'
            )}>
              {lane}
            </span>
            <span className="text-white font-semibold text-sm">Lane {lane}</span>
            {isActive && (
              <span className="flex items-center gap-1 text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded-full">
                <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse" /> ACTIVE
              </span>
            )}
          </div>
          <p className="text-gray-500 text-xs">Traffic count</p>
        </div>
        <TrafficLight phase={phase} />
      </div>

      {/* Vehicle count */}
      <div className="flex items-end justify-between mb-3">
        <span className={cn('text-3xl font-bold font-mono', getCongestionColor(density))}>{count}</span>
        <span className="text-gray-500 text-xs">vehicles</span>
      </div>

      {/* Density bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500">Density</span>
          <span className={getCongestionColor(density)}>{pct}%</span>
        </div>
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={cn('h-full rounded-full', {
              'bg-emerald-400': density === 'low',
              'bg-yellow-400': density === 'medium',
              'bg-orange-400': density === 'high',
              'bg-red-400': density === 'critical',
            })}
          />
        </div>
      </div>

      {/* Timer */}
      {isActive && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Signal Timer</p>
            <SignalTimer total={signalTime} remaining={timer} color={emergency ? '#ef4444' : '#22c55e'} />
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Allocated</p>
            <p className="text-white font-mono font-bold text-lg">{signalTime}s</p>
            <p className="text-xs text-gray-600 mt-0.5">AI optimized</p>
          </div>
        </div>
      )}

      {/* Override btn */}
      <button
        onClick={onOverride}
        className="mt-3 w-full text-xs py-2 rounded-xl border border-white/10 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all"
      >
        <ChevronUp className="w-3 h-3 inline mr-1" /> Set Priority
      </button>
    </motion.div>
  );
}

export default function JunctionPage() {
  const supabase = createClient();
  const [junctions, setJunctions] = useState<JunctionStatus[]>([]);
  const [selectedJunction, setSelectedJunction] = useState<JunctionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [emergency, setEmergency] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchJunctions();

    const channel = supabase
      .channel('junction-control')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'junction_status' },
        payload => {
          const updated = payload.new as JunctionStatus;
          setJunctions(prev => prev.map(j => j.id === updated.id ? updated : j));
          setSelectedJunction(prev => prev?.id === updated.id ? updated : prev);
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchJunctions = async () => {
    const { data } = await supabase.from('junction_status').select('*').order('congestion_level', { ascending: false });
    if (data) {
      setJunctions(data);
      setSelectedJunction(data[0] || null);
    }
    setLoading(false);
  };

  const optimizeSignal = async (j: JunctionStatus) => {
    setUpdating(true);
    const counts = { A: j.lane_a_count, B: j.lane_b_count, C: j.lane_c_count, D: j.lane_d_count };
    const maxCount = Math.max(...Object.values(counts));
    const activeLane = getActiveLane(j.lane_a_count, j.lane_b_count, j.lane_c_count, j.lane_d_count);
    const signalTime = getSignalTime(maxCount, maxCount);
    const totalVehicles = j.lane_a_count + j.lane_b_count + j.lane_c_count + j.lane_d_count;
    const congestionPct = (totalVehicles / (totalVehicles + 20)) * 100;
    const level = congestionPct > 80 ? 'critical' : congestionPct > 55 ? 'high' : congestionPct > 30 ? 'medium' : 'low';

    const { data } = await supabase
      .from('junction_status')
      .update({ active_green_lane: activeLane, current_signal_time: signalTime, congestion_level: level as any, emergency_override: false, updated_at: new Date().toISOString() })
      .eq('id', j.id)
      .select()
      .single();

    if (data) { setSelectedJunction(data); setJunctions(prev => prev.map(x => x.id === data.id ? data : x)); }
    setUpdating(false);
  };

  const setLanePriority = async (j: JunctionStatus, lane: 'A' | 'B' | 'C' | 'D') => {
    setUpdating(true);
    const { data } = await supabase
      .from('junction_status')
      .update({ active_green_lane: lane, current_signal_time: 60, emergency_override: false })
      .eq('id', j.id).select().single();
    if (data) { setSelectedJunction(data); setJunctions(prev => prev.map(x => x.id === data.id ? data : x)); }
    setUpdating(false);
  };

  const triggerEmergency = async (j: JunctionStatus) => {
    setEmergency(!emergency);
    setUpdating(true);
    const { data } = await supabase
      .from('junction_status')
      .update({ emergency_override: !emergency, current_signal_time: 60 })
      .eq('id', j.id).select().single();
    if (data) { setSelectedJunction(data); setJunctions(prev => prev.map(x => x.id === data.id ? data : x)); }
    setUpdating(false);
  };

  const sj = selectedJunction;
  const lanes = sj ? [
    { lane: 'A', count: sj.lane_a_count },
    { lane: 'B', count: sj.lane_b_count },
    { lane: 'C', count: sj.lane_c_count },
    { lane: 'D', count: sj.lane_d_count },
  ] : [];
  const maxCount = sj ? Math.max(sj.lane_a_count, sj.lane_b_count, sj.lane_c_count, sj.lane_d_count) : 1;

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Junction Control Panel" subtitle="Real-time signal optimization & override control" />

      <div className="flex-1 p-6 space-y-6">
        {/* Junction tabs */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-mono mr-2">Junctions:</p>
            {junctions.map(j => (
              <button
                key={j.id}
                onClick={() => setSelectedJunction(j)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 flex items-center gap-2',
                  selectedJunction?.id === j.id
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                    : 'bg-white/3 border-white/8 text-gray-400 hover:border-white/15'
                )}
              >
                <div className={cn('w-1.5 h-1.5 rounded-full', {
                  'bg-emerald-400': j.congestion_level === 'low',
                  'bg-yellow-400': j.congestion_level === 'medium',
                  'bg-orange-400': j.congestion_level === 'high',
                  'bg-red-400 animate-pulse': j.congestion_level === 'critical',
                })} />
                {j.junction_name}
              </button>
            ))}
          </div>
        </div>

        {sj && (
          <>
            {/* Control toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium', getCongestionBg(sj.congestion_level), getCongestionColor(sj.congestion_level))}>
                <TrendingUp className="w-4 h-4" />
                {sj.congestion_level.toUpperCase()} Congestion
              </div>

              <button
                onClick={() => optimizeSignal(sj)}
                disabled={updating}
                className="btn-primary flex items-center gap-2 py-2.5 px-5 text-sm"
              >
                {updating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Auto-Optimize
              </button>

              <button
                onClick={() => triggerEmergency(sj)}
                className={cn(
                  'flex items-center gap-2 py-2.5 px-5 rounded-xl border text-sm font-semibold transition-all duration-200',
                  sj.emergency_override
                    ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)] animate-pulse'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-red-500/30 hover:text-red-400'
                )}
              >
                <AlertTriangle className="w-4 h-4" />
                {sj.emergency_override ? 'Clear Emergency' : 'Emergency Override'}
              </button>

              <div className="flex items-center gap-2 ml-auto text-xs text-gray-500">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="font-mono">LIVE</span>
              </div>
            </div>

            {/* Emergency banner */}
            <AnimatePresence>
              {sj.emergency_override && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="glass-card p-4 border border-red-500/50 bg-red-500/10 flex items-center gap-3">
                  <Shield className="w-5 h-5 text-red-400 animate-pulse" />
                  <div>
                    <p className="text-red-400 font-bold text-sm">🚨 Emergency Override Active</p>
                    <p className="text-red-300/70 text-xs">All lanes holding — Green signal extended to 60s for emergency clearance</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Lane grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {lanes.map(({ lane, count }) => (
                <LaneCard
                  key={lane}
                  lane={lane}
                  count={count}
                  maxCount={maxCount}
                  isActive={sj.active_green_lane === lane}
                  signalTime={sj.active_green_lane === lane
                    ? sj.current_signal_time
                    : Math.max(10, getSignalTime(count, maxCount) - 10)}
                  onOverride={() => setLanePriority(sj, lane as 'A' | 'B' | 'C' | 'D')}
                  emergency={sj.emergency_override}
                />
              ))}
            </div>

            {/* AI Signal Optimization Logic */}
            <div className="glass-card p-5 border border-cyan-500/15">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <h3 className="font-bold text-white text-sm">AI Signal Optimization Logic</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  {
                    title: 'Density-Based Priority',
                    desc: 'Lane with highest vehicle count receives longest green duration (up to 65s). Proportional reduction for other lanes.',
                    icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-500/10'
                  },
                  {
                    title: 'Emergency Override',
                    desc: 'When emergency vehicle detected, all non-priority lanes hold. Active lane gets 60s and all signals are cleared.',
                    icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10'
                  },
                  {
                    title: 'Low-Traffic Reduction',
                    desc: 'Lanes with <30% density get minimum 15s green time. This prevents unnecessary idling on empty roads.',
                    icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10'
                  },
                ].map((item, i) => (
                  <div key={i} className={cn('p-4 rounded-xl border border-white/5', item.bg)}>
                    <item.icon className={cn('w-5 h-5 mb-2', item.color)} />
                    <p className="text-white text-sm font-semibold mb-1">{item.title}</p>
                    <p className="text-gray-400 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Signal allocation */}
            <div className="glass-card p-5">
              <h3 className="font-bold text-white text-sm mb-4">Signal Time Allocation</h3>
              <div className="space-y-3">
                {lanes.map(({ lane, count }) => {
                  const time = getSignalTime(count, maxCount);
                  return (
                    <div key={lane} className="flex items-center gap-4">
                      <span className={cn('w-8 text-center text-sm font-bold font-mono',
                        sj.active_green_lane === lane ? 'text-green-400' : 'text-gray-400')}>
                        {lane}
                      </span>
                      <div className="flex-1 h-6 bg-white/5 rounded-full overflow-hidden relative">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(time / 65) * 100}%` }}
                          transition={{ duration: 0.8 }}
                          className={cn('h-full rounded-full flex items-center justify-end pr-2',
                            sj.active_green_lane === lane ? 'bg-green-500/60' : 'bg-white/15')}
                        >
                          <span className="text-xs text-white font-mono">{time}s</span>
                        </motion.div>
                      </div>
                      <span className="text-gray-500 text-xs w-16 text-right">{count} vehicles</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
