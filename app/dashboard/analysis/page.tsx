'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Car, Bike, Bus, Truck, AlertTriangle, CheckCircle,
  Loader2, Zap, TrendingUp, Eye, RefreshCw, ChevronRight, ImageIcon, Cpu
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { TrafficUpload, TrafficAnalysis } from '@/lib/types/database';
import { TopBar } from '@/components/layout/Sidebar';
import { cn, getCongestionBg, getCongestionColor, timeAgo } from '@/lib/utils';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const PIE_COLORS = ['#06b6d4', '#818cf8', '#34d399', '#fb923c'];

function CongestionGauge({ score }: { score: number }) {
  const data = [{ value: score, fill: score > 80 ? '#ef4444' : score > 55 ? '#f97316' : score > 30 ? '#eab308' : '#22c55e' }];
  return (
    <div className="relative w-40 h-40 mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart innerRadius="65%" outerRadius="90%" data={data} startAngle={225} endAngle={-45}>
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar dataKey="value" cornerRadius={8} background={{ fill: 'rgba(255,255,255,0.05)' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold font-mono text-white">{score}%</span>
        <span className="text-xs text-gray-400">Congestion</span>
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  const supabase = createClient();
  const [uploads, setUploads] = useState<TrafficUpload[]>([]);
  const [analyses, setAnalyses] = useState<TrafficAnalysis[]>([]);
  const [selectedUpload, setSelectedUpload] = useState<TrafficUpload | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<TrafficAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingUploads, setLoadingUploads] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [{ data: ups }, { data: ans }] = await Promise.all([
      supabase.from('traffic_uploads').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('traffic_analysis').select('*').order('created_at', { ascending: false }).limit(20),
    ]);
    if (ups) setUploads(ups);
    if (ans) setAnalyses(ans);
    setLoadingUploads(false);
  };

  const runAnalysis = async (upload: TrafficUpload) => {
    setAnalyzing(true);
    setError('');
    setCurrentAnalysis(null);
    setSelectedUpload(upload);

    try {
      // Update upload status
      await supabase.from('traffic_uploads').update({ status: 'analyzing' }).eq('id', upload.id);

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: upload.file_url, uploadId: upload.id }),
      });

      const result = await res.json();

      // Save to Supabase
      const { data: saved, error: saveErr } = await supabase
        .from('traffic_analysis')
        .insert({
          upload_id: upload.id,
          vehicle_count: result.vehicle_count,
          car_count: result.car_count,
          bike_count: result.bike_count,
          bus_count: result.bus_count,
          truck_count: result.truck_count,
          density_level: result.density_level,
          congestion_score: result.congestion_score,
          suggested_signal_time: result.suggested_signal_time,
          emergency_detected: result.emergency_detected,
          emergency_vehicle_type: result.emergency_vehicle_type,
          ai_recommendation: result.ai_recommendation,
          raw_ai_response: result,
        })
        .select()
        .single();

      if (saveErr) throw saveErr;

      await supabase.from('traffic_uploads').update({ status: 'completed' }).eq('id', upload.id);
      setCurrentAnalysis(saved);
      setAnalyses(prev => [saved, ...prev]);
      setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, status: 'completed' } : u));
    } catch (err: any) {
      setError(err.message);
      await supabase.from('traffic_uploads').update({ status: 'failed' }).eq('id', upload.id);
    } finally {
      setAnalyzing(false);
    }
  };

  const pieData = currentAnalysis ? [
    { name: 'Cars', value: currentAnalysis.car_count },
    { name: 'Bikes', value: currentAnalysis.bike_count },
    { name: 'Buses', value: currentAnalysis.bus_count },
    { name: 'Trucks', value: currentAnalysis.truck_count },
  ] : [];

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="AI Traffic Analysis" subtitle="Gemini Vision AI powered vehicle detection" />

      <div className="flex-1 p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Upload selector */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-sm">Select Footage</h3>
              <button onClick={fetchData} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-cyan-400 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {loadingUploads ? (
                Array(4).fill(0).map((_, i) => <div key={i} className="h-16 rounded-xl shimmer" />)
              ) : uploads.length === 0 ? (
                <div className="text-center py-8">
                  <ImageIcon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No uploads yet</p>
                  <p className="text-gray-600 text-xs mt-1">Upload footage first</p>
                </div>
              ) : uploads.map(u => (
                <button key={u.id} onClick={() => setSelectedUpload(u)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200',
                    selectedUpload?.id === u.id
                      ? 'border-cyan-500/40 bg-cyan-500/10'
                      : 'border-white/5 hover:border-white/15 bg-white/3'
                  )}>
                  <div className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center shrink-0 overflow-hidden">
                    {u.file_type === 'image' ? (
                      <img src={u.file_url} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = ''; }} />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{u.file_name}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{u.junction_name} · {timeAgo(u.created_at)}</p>
                  </div>
                  <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-medium border uppercase', {
                    'text-gray-400 bg-gray-500/10 border-gray-500/20': u.status === 'pending',
                    'text-cyan-400 bg-cyan-500/10 border-cyan-500/20': u.status === 'analyzing',
                    'text-emerald-400 bg-emerald-500/10 border-emerald-500/20': u.status === 'completed',
                    'text-red-400 bg-red-500/10 border-red-500/20': u.status === 'failed',
                  })}>{u.status}</span>
                </button>
              ))}
            </div>

            {selectedUpload && (
              <button
                onClick={() => runAnalysis(selectedUpload)}
                disabled={analyzing}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-4 py-2.5"
              >
                {analyzing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                ) : (
                  <><Brain className="w-4 h-4" /> Run AI Analysis</>
                )}
              </button>
            )}
          </div>

          {/* Analysis Results */}
          <div className="lg:col-span-2 space-y-5">
            {/* Analyzing state */}
            <AnimatePresence>
              {analyzing && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-card p-8 text-center neon-border"
                >
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <Brain className="w-10 h-10 text-cyan-400 animate-pulse" />
                  </div>
                  <p className="text-white font-bold text-lg mb-1">Gemini Vision AI Processing</p>
                  <p className="text-gray-400 text-sm mb-4">Analyzing vehicle density, types, and traffic flow...</p>
                  <div className="flex justify-center gap-1">
                    {[0, 1, 2, 3, 4].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"
                        style={{ animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <div className="glass-card p-4 border border-red-500/30 bg-red-500/5 text-red-400 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> {error}
              </div>
            )}

            {/* Results */}
            {currentAnalysis && !analyzing && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                {/* Emergency Banner */}
                {currentAnalysis.emergency_detected && (
                  <div className="glass-card p-4 border border-red-500/50 bg-red-500/10 flex items-center gap-3 animate-pulse">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                    <div>
                      <p className="text-red-400 font-bold">🚨 Emergency Vehicle Detected!</p>
                      <p className="text-red-300/70 text-sm capitalize">{currentAnalysis.emergency_vehicle_type} — Signal override recommended</p>
                    </div>
                  </div>
                )}

                {/* Main stats */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Gauge */}
                  <div className="glass-card p-5 flex flex-col items-center justify-center">
                    <CongestionGauge score={Math.round(currentAnalysis.congestion_score)} />
                    <span className={cn('mt-2 px-3 py-1 rounded-full text-xs font-bold border uppercase',
                      getCongestionBg(currentAnalysis.density_level), getCongestionColor(currentAnalysis.density_level))}>
                      {currentAnalysis.density_level} density
                    </span>
                  </div>

                  {/* Key metrics */}
                  <div className="space-y-3">
                    {[
                      { label: 'Total Vehicles', value: currentAnalysis.vehicle_count, icon: Car, color: 'text-cyan-400' },
                      { label: 'Signal Time', value: `${currentAnalysis.suggested_signal_time}s`, icon: Zap, color: 'text-yellow-400' },
                      { label: 'Congestion Score', value: `${Math.round(currentAnalysis.congestion_score)}%`, icon: TrendingUp, color: getCongestionColor(currentAnalysis.density_level) },
                      { label: 'Emergency', value: currentAnalysis.emergency_detected ? 'YES' : 'Clear', icon: AlertTriangle, color: currentAnalysis.emergency_detected ? 'text-red-400' : 'text-emerald-400' },
                    ].map((m, i) => (
                      <div key={i} className="glass-card p-3 flex items-center gap-3">
                        <m.icon className={cn('w-4 h-4 shrink-0', m.color)} />
                        <div className="flex-1">
                          <p className="text-gray-400 text-xs">{m.label}</p>
                          <p className={cn('font-bold font-mono text-sm', m.color)}>{m.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vehicle breakdown */}
                <div className="glass-card p-5">
                  <h3 className="font-bold text-white text-sm mb-4">Vehicle Type Breakdown</h3>
                  <div className="grid grid-cols-2 gap-5 items-center">
                    <div className="space-y-3">
                      {[
                        { label: 'Cars', count: currentAnalysis.car_count, icon: Car, color: '#06b6d4', bg: 'bg-cyan-500/20' },
                        { label: 'Bikes', count: currentAnalysis.bike_count, icon: Bike, color: '#818cf8', bg: 'bg-purple-500/20' },
                        { label: 'Buses', count: currentAnalysis.bus_count, icon: Bus, color: '#34d399', bg: 'bg-emerald-500/20' },
                        { label: 'Trucks', count: currentAnalysis.truck_count, icon: Truck, color: '#fb923c', bg: 'bg-orange-500/20' },
                      ].map((v, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', v.bg)}>
                            <v.icon className="w-4 h-4" style={{ color: v.color }} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-400">{v.label}</span>
                              <span className="text-xs font-mono font-bold text-white">{v.count}</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${currentAnalysis.vehicle_count ? (v.count / currentAnalysis.vehicle_count) * 100 : 0}%`, backgroundColor: v.color }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70}
                            paddingAngle={4} dataKey="value">
                            {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                          </Pie>
                          <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: 8, fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* AI Recommendation */}
                <div className="glass-card p-5 border border-cyan-500/20 bg-cyan-500/5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Cpu className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-cyan-400 text-xs font-medium font-mono mb-1.5">AI RECOMMENDATION</p>
                      <p className="text-white text-sm leading-relaxed">{currentAnalysis.ai_recommendation}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* No selection state */}
            {!currentAnalysis && !analyzing && (
              <div className="glass-card p-12 text-center">
                <Eye className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 font-medium">Select footage and run AI analysis</p>
                <p className="text-gray-600 text-sm mt-1">Gemini Vision will detect all vehicles and calculate optimal signal timings</p>
              </div>
            )}

            {/* Past analyses */}
            {analyses.filter(a => a.upload_id).length > 0 && (
              <div className="glass-card p-5">
                <h3 className="font-bold text-white text-sm mb-4">Previous Analyses</h3>
                <div className="space-y-2">
                  {analyses.filter(a => a.upload_id).slice(0, 5).map(a => (
                    <button key={a.id} onClick={() => setCurrentAnalysis(a)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/5 hover:border-cyan-500/20 bg-white/3 text-left transition-all">
                      <div className={cn('w-2 h-2 rounded-full shrink-0', {
                        'bg-emerald-400': a.density_level === 'low',
                        'bg-yellow-400': a.density_level === 'medium',
                        'bg-orange-400': a.density_level === 'high',
                        'bg-red-400': a.density_level === 'critical',
                      })} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white font-medium">{a.vehicle_count} vehicles · {a.density_level} density</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{timeAgo(a.created_at)}</p>
                      </div>
                      <span className="text-xs font-mono text-cyan-400">{a.suggested_signal_time}s</span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
