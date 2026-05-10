'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, TrendingDown, Activity, Car, Clock, Cpu
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { TrafficAnalysis } from '@/lib/types/database';
import { TopBar } from '@/components/layout/Sidebar';
import { cn, formatNumber } from '@/lib/utils';

const COLORS = { cyan: '#06b6d4', purple: '#818cf8', emerald: '#34d399', orange: '#fb923c', red: '#f87171', yellow: '#fbbf24' };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card p-3 border border-cyan-500/20 text-xs min-w-[120px]">
        {label && <p className="text-gray-400 mb-2 font-medium">{label}</p>}
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span style={{ color: p.color }}>{p.name}</span>
            <span className="font-mono font-bold text-white">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const supabase = createClient();
  const [data, setData] = useState<TrafficAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'all' | 'recent'>('all');

  useEffect(() => {
    supabase
      .from('traffic_analysis')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(50)
      .then(({ data: d }) => {
        if (d) setData(d);
        setLoading(false);
      });
  }, []);

  const displayData = range === 'recent' ? data.slice(-10) : data;

  const chartData = displayData.map((a, i) => ({
    idx: `#${i + 1}`,
    vehicles: a.vehicle_count,
    cars: a.car_count,
    bikes: a.bike_count,
    buses: a.bus_count,
    trucks: a.truck_count,
    congestion: Math.round(a.congestion_score),
    signal: a.suggested_signal_time,
    density: a.density_level,
  }));

  const densityCounts = {
    low: data.filter(d => d.density_level === 'low').length,
    medium: data.filter(d => d.density_level === 'medium').length,
    high: data.filter(d => d.density_level === 'high').length,
    critical: data.filter(d => d.density_level === 'critical').length,
  };

  const radarData = [
    { subject: 'Cars', value: data.reduce((s, a) => s + a.car_count, 0) },
    { subject: 'Bikes', value: data.reduce((s, a) => s + a.bike_count, 0) },
    { subject: 'Buses', value: data.reduce((s, a) => s + a.bus_count, 0) },
    { subject: 'Trucks', value: data.reduce((s, a) => s + a.truck_count, 0) },
    { subject: 'Emergency', value: data.filter(a => a.emergency_detected).length * 20 },
  ];

  const totalVehicles = data.reduce((s, a) => s + a.vehicle_count, 0);
  const avgCongestion = data.length ? Math.round(data.reduce((s, a) => s + a.congestion_score, 0) / data.length) : 0;
  const avgSignal = data.length ? Math.round(data.reduce((s, a) => s + a.suggested_signal_time, 0) / data.length) : 0;
  const emergencyCount = data.filter(a => a.emergency_detected).length;

  const kpis = [
    { label: 'Total Vehicles', value: formatNumber(totalVehicles), icon: Car, color: 'text-cyan-400', bg: 'bg-cyan-500/15', trend: '+12%' },
    { label: 'Avg Congestion', value: `${avgCongestion}%`, icon: Activity, color: avgCongestion > 60 ? 'text-orange-400' : 'text-emerald-400', bg: 'bg-white/5' },
    { label: 'Avg Signal Time', value: `${avgSignal}s`, icon: Clock, color: 'text-purple-400', bg: 'bg-purple-500/15' },
    { label: 'Emergency Events', value: emergencyCount.toString(), icon: Cpu, color: 'text-red-400', bg: 'bg-red-500/15' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <TopBar title="Analytics" subtitle="Traffic performance insights" />
        <div className="flex-1 p-6 grid grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => <div key={i} className="h-48 rounded-2xl shimmer" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Traffic Analytics" subtitle="Historical data & performance insights" />

      <div className="flex-1 p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card p-5">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-4', k.bg)}>
                <k.icon className={cn('w-5 h-5', k.color)} />
              </div>
              <p className={cn('text-2xl font-bold font-mono', k.color)}>{k.value}</p>
              <p className="text-gray-400 text-xs mt-1">{k.label}</p>
              {k.trend && (
                <span className="text-xs text-emerald-400 flex items-center gap-0.5 mt-1.5">
                  <TrendingUp className="w-3 h-3" />{k.trend}
                </span>
              )}
            </motion.div>
          ))}
        </div>

        {/* Range selector */}
        <div className="flex items-center gap-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-mono">View:</p>
          {(['all', 'recent'] as const).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                range === r ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-400 hover:text-white bg-white/5')}>
              {r === 'all' ? 'All Sessions' : 'Last 10'}
            </button>
          ))}
        </div>

        {/* Charts grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Congestion over time */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-5">
              <Activity className="w-4 h-4 text-cyan-400" />
              <div>
                <h3 className="font-bold text-white text-sm">Congestion Score Over Time</h3>
                <p className="text-gray-500 text-xs">How congestion varied across sessions</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="bGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.orange} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={COLORS.orange} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="idx" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                <Area type="monotone" dataKey="congestion" stroke={COLORS.cyan} fill="url(#aGrad)" strokeWidth={2} name="Congestion %" dot={false} />
                <Area type="monotone" dataKey="signal" stroke={COLORS.orange} fill="url(#bGrad)" strokeWidth={1.5} strokeDasharray="5 5" name="Signal Time (s)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Vehicle stacked bar */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-5">
              <Car className="w-4 h-4 text-purple-400" />
              <div>
                <h3 className="font-bold text-white text-sm">Vehicle Composition</h3>
                <p className="text-gray-500 text-xs">Breakdown per analysis session</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="idx" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                <Bar dataKey="cars" fill={COLORS.cyan} radius={[3, 3, 0, 0]} name="Cars" stackId="a" />
                <Bar dataKey="bikes" fill={COLORS.purple} name="Bikes" stackId="a" />
                <Bar dataKey="buses" fill={COLORS.emerald} name="Buses" stackId="a" />
                <Bar dataKey="trucks" fill={COLORS.orange} radius={[3, 3, 0, 0]} name="Trucks" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Density distribution */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <div>
                <h3 className="font-bold text-white text-sm">Density Level Distribution</h3>
                <p className="text-gray-500 text-xs">How often each density level occurred</p>
              </div>
            </div>
            <div className="space-y-3 mt-2">
              {[
                { level: 'Low', count: densityCounts.low, color: 'bg-emerald-400', text: 'text-emerald-400' },
                { level: 'Medium', count: densityCounts.medium, color: 'bg-yellow-400', text: 'text-yellow-400' },
                { level: 'High', count: densityCounts.high, color: 'bg-orange-400', text: 'text-orange-400' },
                { level: 'Critical', count: densityCounts.critical, color: 'bg-red-400', text: 'text-red-400' },
              ].map(d => {
                const pct = data.length ? Math.round((d.count / data.length) * 100) : 0;
                return (
                  <div key={d.level} className="flex items-center gap-3">
                    <span className={cn('w-16 text-xs font-medium', d.text)}>{d.level}</span>
                    <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={cn('h-full rounded-full flex items-center justify-end pr-2', d.color, 'bg-opacity-70')}
                      >
                        <span className="text-[10px] text-white font-mono">{d.count}</span>
                      </motion.div>
                    </div>
                    <span className="text-gray-500 text-xs w-8 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-6">
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={[densityCounts].map(d => ({ Low: d.low, Medium: d.medium, High: d.high, Critical: d.critical }))}>
                  <Bar dataKey="Low" fill={COLORS.emerald} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Medium" fill={COLORS.yellow} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="High" fill={COLORS.orange} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Critical" fill={COLORS.red} radius={[4, 4, 0, 0]} />
                  <Tooltip content={<CustomTooltip />} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Radar chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-4 h-4 text-yellow-400" />
              <div>
                <h3 className="font-bold text-white text-sm">Traffic Composition Radar</h3>
                <p className="text-gray-500 text-xs">Total count by vehicle type</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Radar name="Count" dataKey="value" stroke={COLORS.cyan} fill={COLORS.cyan} fillOpacity={0.2} strokeWidth={2} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Signal vs Congestion scatter */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="w-4 h-4 text-purple-400" />
            <div>
              <h3 className="font-bold text-white text-sm">Signal Time vs Congestion Correlation</h3>
              <p className="text-gray-500 text-xs">Shows how AI-recommended signal time scales with congestion</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="congestion" name="Congestion %" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: 'Congestion %', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
              <YAxis dataKey="signal" name="Signal Time (s)" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ stroke: 'rgba(6,182,212,0.2)' }} content={<CustomTooltip />} />
              <Scatter name="Analysis" data={chartData} fill={COLORS.cyan} opacity={0.8} />
            </ScatterChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
