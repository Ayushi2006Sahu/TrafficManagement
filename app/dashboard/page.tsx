'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Car, Zap, AlertTriangle, Activity, TrendingUp, Clock,
  Eye, Cpu, RefreshCw, ChevronRight, Shield
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { TrafficAnalysis, JunctionStatus } from '@/lib/types/database';
import { TopBar } from '@/components/layout/Sidebar';
import { cn, getCongestionBg, getCongestionColor, formatNumber, timeAgo } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';

const CHART_COLORS = { cyan: '#06b6d4', purple: '#818cf8', emerald: '#34d399', orange: '#fb923c' };

function StatCard({
  icon: Icon, label, value, sub, color, trend, glow
}: {
  icon: React.ElementType; label: string; value: string; sub?: string;
  color: string; trend?: string; glow?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('stat-card group hover:border-white/20 transition-all duration-300 cursor-default', glow)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            trend.startsWith('+') ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
          )}>{trend}</span>
        )}
      </div>
      <p className="text-2xl font-bold text-white font-mono mb-1">{value}</p>
      <p className="text-gray-400 text-sm">{label}</p>
      {sub && <p className="text-gray-600 text-xs mt-1">{sub}</p>}
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card p-3 border border-cyan-500/20 text-xs">
        <p className="text-gray-400 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-mono font-medium">
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const supabase = createClient();
  const [analyses, setAnalyses] = useState<TrafficAnalysis[]>([]);
  const [junctions, setJunctions] = useState<JunctionStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [emergencyAlert, setEmergencyAlert] = useState<TrafficAnalysis | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = useCallback(async () => {
    const [{ data: anal }, { data: junc }] = await Promise.all([
      supabase.from('traffic_analysis').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('junction_status').select('*').order('updated_at', { ascending: false }),
    ]);
    if (anal) setAnalyses(anal);
    if (junc) setJunctions(junc);
    setLastUpdated(new Date());
    setLoading(false);

    const latest = anal?.find(a => a.emergency_detected);
    if (latest) setEmergencyAlert(latest);
  }, []);

  useEffect(() => {
    fetchData();

    const analysisChannel = supabase
      .channel('dashboard-analysis')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'traffic_analysis' },
        (payload) => {
          setAnalyses(prev => [payload.new as TrafficAnalysis, ...prev.slice(0, 19)]);
          setLastUpdated(new Date());
          if ((payload.new as TrafficAnalysis).emergency_detected) {
            setEmergencyAlert(payload.new as TrafficAnalysis);
          }
        })
      .subscribe();

    const junctionChannel = supabase
      .channel('dashboard-junctions')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'junction_status' },
        (payload) => {
          setJunctions(prev => prev.map(j =>
            j.id === (payload.new as JunctionStatus).id ? payload.new as JunctionStatus : j
          ));
        })
      .subscribe();

    return () => {
      supabase.removeChannel(analysisChannel);
      supabase.removeChannel(junctionChannel);
    };
  }, [fetchData]);

  // Computed stats
  const totalVehicles = analyses.reduce((s, a) => s + a.vehicle_count, 0);
  const avgCongestion = analyses.length
    ? Math.round(analyses.reduce((s, a) => s + a.congestion_score, 0) / analyses.length)
    : 0;
  const criticalCount = junctions.filter(j => j.congestion_level === 'critical').length;
  const emergencyCount = analyses.filter(a => a.emergency_detected).length;

  // Chart data - last 8 analyses
  const chartData = [...analyses].reverse().slice(0, 8).map((a, i) => ({
    name: `T-${i + 1}`,
    vehicles: a.vehicle_count,
    congestion: Math.round(a.congestion_score),
    signal: a.suggested_signal_time,
    cars: a.car_count,
    bikes: a.bike_count,
    buses: a.bus_count,
    trucks: a.truck_count,
  }));

  const vehicleTypeData = analyses.slice(0, 5).map((a, i) => ({
    name: `Scan ${i + 1}`,
    Cars: a.car_count,
    Bikes: a.bike_count,
    Buses: a.bus_count,
    Trucks: a.truck_count,
  }));

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Traffic Command Center" subtitle="Real-time AI-powered monitoring" />

      <div className="flex-1 p-6 space-y-6">
        {/* Emergency Alert Banner */}
        <AnimatePresence>
          {emergencyAlert && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card border border-red-500/50 bg-red-500/10 p-4 flex items-center justify-between"
              style={{ boxShadow: '0 0 30px rgba(239,68,68,0.2)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <p className="text-red-400 font-bold text-sm">🚨 EMERGENCY VEHICLE DETECTED</p>
                  <p className="text-red-300/70 text-xs">
                    {emergencyAlert.emergency_vehicle_type || 'Emergency vehicle'} — Signal override active
                  </p>
                </div>
              </div>
              <button onClick={() => setEmergencyAlert(null)} className="text-red-400 text-xs hover:text-red-300">
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Car} label="Total Vehicles Detected" value={formatNumber(totalVehicles)}
            color="bg-cyan-500/15 text-cyan-400" trend="+12%" glow="hover:glow-cyan"
            sub="All sessions combined"
          />
          <StatCard
            icon={Activity} label="Avg Congestion Score" value={`${avgCongestion}%`}
            color={avgCongestion > 70 ? 'bg-red-500/15 text-red-400' : avgCongestion > 50 ? 'bg-orange-500/15 text-orange-400' : 'bg-emerald-500/15 text-emerald-400'}
            sub="Across all junctions"
          />
          <StatCard
            icon={Zap} label="Critical Junctions" value={`${criticalCount}/${junctions.length}`}
            color="bg-orange-500/15 text-orange-400"
            sub="Requiring immediate attention"
          />
          <StatCard
            icon={Shield} label="Emergency Events" value={emergencyCount.toString()}
            color="bg-red-500/15 text-red-400"
            sub="Detected & resolved"
          />
        </div>

        {/* Second row stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Car, label: 'Cars', value: analyses.reduce((s, a) => s + a.car_count, 0), color: 'text-cyan-400' },
            { icon: Cpu, label: 'Bikes', value: analyses.reduce((s, a) => s + a.bike_count, 0), color: 'text-purple-400' },
            { icon: TrendingUp, label: 'Buses', value: analyses.reduce((s, a) => s + a.bus_count, 0), color: 'text-emerald-400' },
            { icon: Eye, label: 'Trucks', value: analyses.reduce((s, a) => s + a.truck_count, 0), color: 'text-yellow-400' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-4 flex items-center gap-4">
              <div className={cn('w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center', s.color)}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className={cn('text-2xl font-bold font-mono', s.color)}>{formatNumber(s.value)}</p>
                <p className="text-gray-500 text-xs">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Traffic Density Trend */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-white text-sm">Traffic Density Trend</h3>
                <p className="text-gray-500 text-xs mt-0.5">Congestion score over time</p>
              </div>
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.cyan} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.cyan} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="congestion" stroke={CHART_COLORS.cyan} fill="url(#cGrad)"
                  strokeWidth={2} name="Congestion %" dot={false} />
                <Area type="monotone" dataKey="vehicles" stroke={CHART_COLORS.purple} fill="none"
                  strokeWidth={1.5} strokeDasharray="4 4" name="Vehicles" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Vehicle Type Breakdown */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-white text-sm">Vehicle Type Breakdown</h3>
                <p className="text-gray-500 text-xs mt-0.5">Per analysis session</p>
              </div>
              <Car className="w-4 h-4 text-purple-400" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={vehicleTypeData} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Cars" fill={CHART_COLORS.cyan} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Bikes" fill={CHART_COLORS.purple} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Buses" fill={CHART_COLORS.emerald} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Trucks" fill={CHART_COLORS.orange} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Signal Timing Chart + Junction Status */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-white text-sm">AI Signal Time Recommendations</h3>
                <p className="text-gray-500 text-xs mt-0.5">Suggested green light duration (seconds)</p>
              </div>
              <Clock className="w-4 h-4 text-emerald-400" />
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="signal" stroke={CHART_COLORS.emerald} strokeWidth={2.5}
                  dot={{ fill: CHART_COLORS.emerald, r: 4 }} name="Signal Time (s)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Junction Status */}
          <div className="glass-card p-5">
            <h3 className="font-bold text-white text-sm mb-4">Junction Status</h3>
            <div className="space-y-3">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="h-12 rounded-xl shimmer" />
                ))
              ) : junctions.slice(0, 4).map((j) => (
                <div key={j.id} className={cn('flex items-center justify-between p-3 rounded-xl border', getCongestionBg(j.congestion_level))}>
                  <div>
                    <p className="text-xs font-medium text-white truncate max-w-[120px]">{j.junction_name}</p>
                    <p className={cn('text-[10px] font-mono mt-0.5 uppercase', getCongestionColor(j.congestion_level))}>
                      {j.congestion_level}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-white">Lane {j.active_green_lane}</p>
                    <p className="text-[10px] text-gray-400">{j.current_signal_time}s</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Analyses */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-white text-sm">Recent AI Analyses</h3>
              <p className="text-gray-500 text-xs mt-0.5">Latest traffic analysis results — updates live</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-600 font-mono">
                Updated {timeAgo(lastUpdated.toISOString())}
              </span>
              <button onClick={fetchData} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-cyan-400">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase tracking-wider border-b border-white/5">
                  <th className="pb-3 pr-6">Time</th>
                  <th className="pb-3 pr-6">Vehicles</th>
                  <th className="pb-3 pr-6">Density</th>
                  <th className="pb-3 pr-6">Congestion</th>
                  <th className="pb-3 pr-6">Signal Time</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      {Array(6).fill(0).map((_, j) => (
                        <td key={j} className="py-3 pr-6">
                          <div className="h-4 rounded shimmer w-16" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : analyses.slice(0, 8).map(a => (
                  <tr key={a.id} className="hover:bg-white/2 transition-colors">
                    <td className="py-3 pr-6 text-gray-400 text-xs font-mono whitespace-nowrap">
                      {timeAgo(a.created_at)}
                    </td>
                    <td className="py-3 pr-6">
                      <span className="font-mono text-white font-medium">{a.vehicle_count}</span>
                    </td>
                    <td className="py-3 pr-6">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full', {
                            'bg-emerald-400': a.density_level === 'low',
                            'bg-yellow-400': a.density_level === 'medium',
                            'bg-orange-400': a.density_level === 'high',
                            'bg-red-400': a.density_level === 'critical',
                          })} style={{ width: `${a.congestion_score}%` }} />
                        </div>
                        <span className="text-xs text-gray-400">{Math.round(a.congestion_score)}%</span>
                      </div>
                    </td>
                    <td className="py-3 pr-6">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border', getCongestionBg(a.density_level), getCongestionColor(a.density_level))}>
                        {a.density_level}
                      </span>
                    </td>
                    <td className="py-3 pr-6 font-mono text-cyan-400 text-sm">{a.suggested_signal_time}s</td>
                    <td className="py-3">
                      {a.emergency_detected ? (
                        <span className="flex items-center gap-1 text-red-400 text-xs">
                          <AlertTriangle className="w-3 h-3" /> Emergency
                        </span>
                      ) : (
                        <span className="text-emerald-400 text-xs">Normal</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
