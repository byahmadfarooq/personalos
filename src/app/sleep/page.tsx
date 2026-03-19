'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { todayISO, formatDate, sleepScoreColor } from '@/lib/helpers';
import type { SleepEntry } from '@/types/database';

type SleepAnalysis = {
  avg_sleep_hours: number;
  avg_bedtime_hour: number;
  avg_wake_hour: number;
  avg_nap_minutes: number;
  avg_score: number;
  best_score_day: string | null;
  worst_score_day: string | null;
  days_with_optimal_nap: number;
  days_with_excessive_nap: number;
  consistency_score: number;
  recommendation: string;
};

function formatHour(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
}

function computeLocalAnalysis(entries: SleepEntry[]): SleepAnalysis | null {
  if (entries.length === 0) return null;

  const avgSleep = entries.reduce((s, e) => s + Number(e.total_main_sleep_hours), 0) / entries.length;
  const bedtimeHours = entries.map((e) => {
    const d = new Date(e.main_sleep_start);
    return d.getHours() + d.getMinutes() / 60;
  });
  const wakeHours = entries.map((e) => {
    const d = new Date(e.main_sleep_end);
    return d.getHours() + d.getMinutes() / 60;
  });
  const avgBedtime = bedtimeHours.reduce((a, b) => a + b, 0) / bedtimeHours.length;
  const avgWake = wakeHours.reduce((a, b) => a + b, 0) / wakeHours.length;
  const avgNap = entries.reduce((s, e) => s + e.nap_duration_minutes, 0) / entries.length;
  const avgScore = entries.reduce((s, e) => s + e.optimal_sleep_score, 0) / entries.length;

  const sorted = [...entries].sort((a, b) => b.optimal_sleep_score - a.optimal_sleep_score);
  const bestDay = sorted[0]?.date || null;
  const worstDay = sorted[sorted.length - 1]?.date || null;

  const optimalNaps = entries.filter((e) => e.nap_duration_minutes >= 20 && e.nap_duration_minutes <= 30).length;
  const excessiveNaps = entries.filter((e) => e.nap_duration_minutes > 30).length;

  // Consistency: std dev of bedtime hours
  const mean = avgBedtime;
  const variance = bedtimeHours.reduce((s, h) => s + Math.pow(h - mean, 2), 0) / bedtimeHours.length;
  const stddev = Math.sqrt(variance);
  const consistency = Math.max(0, Math.round(100 - stddev * 10));

  let recommendation = 'Your sleep patterns look healthy. Keep maintaining consistency.';
  if (avgSleep < 7) {
    recommendation = 'You are sleeping less than 7 hours on average. Aim for 7-9 hours for optimal performance.';
  } else if (avgNap > 30) {
    recommendation = 'Your naps average over 30 minutes. Keep naps to 20-30 minutes to avoid sleep inertia.';
  } else if (stddev > 1.5) {
    recommendation = 'Your bedtime varies significantly. Consistent sleep/wake times improve circadian rhythm.';
  }

  return {
    avg_sleep_hours: Math.round(avgSleep * 100) / 100,
    avg_bedtime_hour: Math.round(avgBedtime * 10) / 10,
    avg_wake_hour: Math.round(avgWake * 10) / 10,
    avg_nap_minutes: Math.round(avgNap),
    avg_score: Math.round(avgScore),
    best_score_day: bestDay,
    worst_score_day: worstDay,
    days_with_optimal_nap: optimalNaps,
    days_with_excessive_nap: excessiveNaps,
    consistency_score: consistency,
    recommendation,
  };
}

export default function SleepPage() {
  const [entries, setEntries] = useState<SleepEntry[]>([]);
  const [analysis, setAnalysis] = useState<SleepAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: todayISO(),
    sleep_start: '23:00',
    sleep_end: '07:00',
    nap_minutes: '0',
    score: '75',
  });

  const fetchData = useCallback(async () => {
    const { data } = await supabase
      .from('sleep_tracker')
      .select('*')
      .order('date', { ascending: false })
      .limit(30);
    const sleepEntries = data || [];
    setEntries(sleepEntries);
    setAnalysis(computeLocalAnalysis(sleepEntries));
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveSleep = async () => {
    if (!form.date) return;

    // Build timestamps from date + time inputs
    const sleepDate = new Date(form.date + 'T00:00:00');
    const [startH, startM] = form.sleep_start.split(':').map(Number);
    const [endH, endM] = form.sleep_end.split(':').map(Number);

    const startDate = new Date(sleepDate);
    startDate.setHours(startH, startM, 0, 0);
    // If bedtime is PM (e.g. 23:00), it's the night before
    // If bedtime hour >= 12 and wake hour < 12, sleep crosses midnight — start is the previous day
    // We keep start as-is since the date represents "the day this sleep is for"

    const endDate = new Date(sleepDate);
    endDate.setHours(endH, endM, 0, 0);
    // If end time is earlier than start time, it means we woke up the next day
    if (endH < startH || (endH === startH && endM < startM)) {
      endDate.setDate(endDate.getDate() + 1);
    }

    const payload = {
      date: form.date,
      main_sleep_start: startDate.toISOString(),
      main_sleep_end: endDate.toISOString(),
      nap_duration_minutes: Number(form.nap_minutes) || 0,
      optimal_sleep_score: Number(form.score) || 0,
    };

    const existing = entries.find((e) => e.date === form.date);
    if (existing) {
      await supabase.from('sleep_tracker').update(payload).eq('id', existing.id);
    } else {
      await supabase.from('sleep_tracker').insert(payload);
    }

    setForm({ date: todayISO(), sleep_start: '23:00', sleep_end: '07:00', nap_minutes: '0', score: '75' });
    setShowForm(false);
    fetchData();
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl md:text-3xl font-bold">Sleep Tracker</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 rounded-full bg-accent text-white text-sm font-body font-medium hover:bg-accent-hover transition-colors">
          {showForm ? 'Cancel' : '+ Log Sleep'}
        </button>
      </div>

      {/* Analysis Cards */}
      {analysis && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-bg-card rounded-2xl p-4 border border-white/5">
              <p className="text-xs text-text-muted font-mono uppercase">Avg Sleep</p>
              <p className="font-mono text-2xl font-bold text-accent mt-1">{analysis.avg_sleep_hours}h</p>
            </div>
            <div className="bg-bg-card rounded-2xl p-4 border border-white/5">
              <p className="text-xs text-text-muted font-mono uppercase">Avg Score</p>
              <p className={`font-mono text-2xl font-bold mt-1 ${sleepScoreColor(analysis.avg_score)}`}>{analysis.avg_score}</p>
            </div>
            <div className="bg-bg-card rounded-2xl p-4 border border-white/5">
              <p className="text-xs text-text-muted font-mono uppercase">Consistency</p>
              <p className={`font-mono text-2xl font-bold mt-1 ${sleepScoreColor(analysis.consistency_score)}`}>{analysis.consistency_score}%</p>
            </div>
            <div className="bg-bg-card rounded-2xl p-4 border border-white/5">
              <p className="text-xs text-text-muted font-mono uppercase">Avg Nap</p>
              <p className="font-mono text-2xl font-bold text-text mt-1">{analysis.avg_nap_minutes}m</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-bg-card rounded-2xl p-5 border border-white/5">
              <h3 className="font-heading text-base font-semibold mb-3">Sleep Schedule</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted font-mono">Avg Bedtime</span>
                  <span className="font-mono font-bold">{formatHour(analysis.avg_bedtime_hour)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted font-mono">Avg Wake Time</span>
                  <span className="font-mono font-bold">{formatHour(analysis.avg_wake_hour)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted font-mono">Best Day</span>
                  <span className="font-mono font-bold text-green-400">{analysis.best_score_day ? formatDate(analysis.best_score_day) : '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted font-mono">Worst Day</span>
                  <span className="font-mono font-bold text-red-400">{analysis.worst_score_day ? formatDate(analysis.worst_score_day) : '—'}</span>
                </div>
              </div>
            </div>

            <div className="bg-bg-card rounded-2xl p-5 border border-white/5">
              <h3 className="font-heading text-base font-semibold mb-3">Nap Analysis</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted font-mono">Optimal Naps (20-30m)</span>
                  <span className="font-mono font-bold text-green-400">{analysis.days_with_optimal_nap} days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted font-mono">Excessive Naps (&gt;30m)</span>
                  <span className="font-mono font-bold text-red-400">{analysis.days_with_excessive_nap} days</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-accent-dim rounded-xl border border-accent/20">
                <p className="text-xs text-accent font-mono uppercase mb-1">Recommendation</p>
                <p className="text-sm text-text">{analysis.recommendation}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {showForm && (
        <div className="bg-bg-card rounded-2xl p-5 border border-white/5 space-y-4">
          <h2 className="font-heading text-lg font-semibold">Log Sleep</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-muted font-mono uppercase mb-1 block">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-bg rounded-full px-4 py-3 text-sm text-text outline-none border border-white/10 focus:border-accent" />
            </div>
            <div>
              <label className="text-xs text-text-muted font-mono uppercase mb-1 block">Bedtime</label>
              <input type="time" value={form.sleep_start} onChange={(e) => setForm({ ...form, sleep_start: e.target.value })}
                className="w-full bg-bg rounded-full px-4 py-3 text-sm text-text outline-none border border-white/10 focus:border-accent" />
            </div>
            <div>
              <label className="text-xs text-text-muted font-mono uppercase mb-1 block">Wake Time</label>
              <input type="time" value={form.sleep_end} onChange={(e) => setForm({ ...form, sleep_end: e.target.value })}
                className="w-full bg-bg rounded-full px-4 py-3 text-sm text-text outline-none border border-white/10 focus:border-accent" />
            </div>
            <div>
              <label className="text-xs text-text-muted font-mono uppercase mb-1 block">Nap (minutes)</label>
              <input type="number" value={form.nap_minutes} min="0" max="180" onChange={(e) => setForm({ ...form, nap_minutes: e.target.value })}
                className="w-full bg-bg rounded-full px-4 py-3 text-sm text-text outline-none border border-white/10 focus:border-accent" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-text-muted font-mono uppercase mb-1 block">Sleep Score (0-100)</label>
              <input type="range" min="0" max="100" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })}
                className="w-full accent-accent" />
              <div className="flex justify-between text-xs text-text-muted font-mono mt-1">
                <span>Poor</span>
                <span className={`text-lg font-bold ${sleepScoreColor(Number(form.score))}`}>{form.score}</span>
                <span>Excellent</span>
              </div>
            </div>
          </div>
          <button onClick={saveSleep}
            className="px-6 py-3 rounded-full bg-accent text-white text-sm font-body font-medium hover:bg-accent-hover transition-colors">
            Save Sleep Log
          </button>
        </div>
      )}

      {/* Sleep History */}
      <div className="bg-bg-card rounded-2xl border border-white/5 overflow-hidden">
        <h2 className="font-heading text-lg font-semibold px-5 pt-5 pb-3">Sleep History</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-xs text-text-muted font-mono py-3 px-5">Date</th>
              <th className="text-right text-xs text-text-muted font-mono py-3 px-5">Hours</th>
              <th className="text-right text-xs text-text-muted font-mono py-3 px-5">Nap</th>
              <th className="text-right text-xs text-text-muted font-mono py-3 px-5">Score</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-b border-white/5">
                <td className="text-sm font-mono py-3 px-5">{formatDate(e.date)}</td>
                <td className="text-right font-mono text-sm py-3 px-5 text-accent">
                  {Number(e.total_main_sleep_hours).toFixed(1)}h
                </td>
                <td className="text-right font-mono text-sm py-3 px-5">
                  {e.nap_duration_minutes > 0 ? `${e.nap_duration_minutes}m` : '—'}
                </td>
                <td className="text-right font-mono text-sm py-3 px-5">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${sleepScoreColor(e.optimal_sleep_score)}`}>
                    {e.optimal_sleep_score}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && <p className="text-center text-text-muted font-mono text-sm py-8">No sleep data yet. Start logging your sleep.</p>}
      </div>
    </div>
  );
}
