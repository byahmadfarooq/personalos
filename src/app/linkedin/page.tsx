'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { todayISO, formatDate, formatNumber } from '@/lib/helpers';
import type { LinkedInMetric } from '@/types/database';

export default function LinkedInPage() {
  const [metrics, setMetrics] = useState<LinkedInMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: todayISO(), followers: '', impressions: '', dms_sent: '', dms_received: '' });

  const fetchMetrics = useCallback(async () => {
    const { data } = await supabase.from('linkedin_metrics').select('*').order('date', { ascending: false }).limit(30);
    setMetrics(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  const saveMetric = async () => {
    if (!form.date) return;
    const payload = {
      date: form.date,
      followers: Number(form.followers) || 0,
      impressions: Number(form.impressions) || 0,
      dms_sent: Number(form.dms_sent) || 0,
      dms_received: Number(form.dms_received) || 0,
    };
    const existing = metrics.find((m) => m.date === form.date);
    if (existing) {
      await supabase.from('linkedin_metrics').update(payload).eq('id', existing.id);
    } else {
      await supabase.from('linkedin_metrics').insert(payload);
    }
    setForm({ date: todayISO(), followers: '', impressions: '', dms_sent: '', dms_received: '' });
    setShowForm(false);
    fetchMetrics();
  };

  const latest = metrics[0];
  const weekAgo = metrics[6];
  const followerDelta = latest && weekAgo ? latest.followers - weekAgo.followers : 0;
  const weekImpressions = metrics.slice(0, 7).reduce((s, m) => s + m.impressions, 0);

  // Simple bar chart data (last 14 days impressions)
  const chartData = metrics.slice(0, 14).reverse();
  const maxImpressions = Math.max(...chartData.map((d) => d.impressions), 1);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl md:text-3xl font-bold">LinkedIn</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 rounded-full bg-accent text-white text-sm font-body font-medium hover:bg-accent-hover transition-colors">
          {showForm ? 'Cancel' : '+ Log Metrics'}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-bg-card rounded-2xl p-4 border border-white/5">
          <p className="text-xs text-text-muted font-mono uppercase">Followers</p>
          <p className="font-mono text-2xl font-bold text-text mt-1">{formatNumber(latest?.followers || 0)}</p>
          <p className={`text-xs font-mono mt-1 ${followerDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {followerDelta >= 0 ? '+' : ''}{followerDelta} this week
          </p>
        </div>
        <div className="bg-bg-card rounded-2xl p-4 border border-white/5">
          <p className="text-xs text-text-muted font-mono uppercase">Weekly Impressions</p>
          <p className="font-mono text-2xl font-bold text-accent mt-1">{formatNumber(weekImpressions)}</p>
        </div>
        <div className="bg-bg-card rounded-2xl p-4 border border-white/5">
          <p className="text-xs text-text-muted font-mono uppercase">DMs Sent (Today)</p>
          <p className="font-mono text-2xl font-bold text-text mt-1">{latest?.dms_sent || 0}</p>
        </div>
        <div className="bg-bg-card rounded-2xl p-4 border border-white/5">
          <p className="text-xs text-text-muted font-mono uppercase">DMs Received</p>
          <p className="font-mono text-2xl font-bold text-text mt-1">{latest?.dms_received || 0}</p>
        </div>
      </div>

      {showForm && (
        <div className="bg-bg-card rounded-2xl p-5 border border-white/5 space-y-4">
          <h2 className="font-heading text-lg font-semibold">Log Today&apos;s LinkedIn Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="bg-bg rounded-full px-4 py-3 text-sm text-text outline-none border border-white/10 focus:border-accent" />
            <input type="number" placeholder="Follower Count" value={form.followers} onChange={(e) => setForm({ ...form, followers: e.target.value })}
              className="bg-bg rounded-full px-4 py-3 text-sm text-text placeholder-text-muted/40 outline-none border border-white/10 focus:border-accent" />
            <input type="number" placeholder="Impressions" value={form.impressions} onChange={(e) => setForm({ ...form, impressions: e.target.value })}
              className="bg-bg rounded-full px-4 py-3 text-sm text-text placeholder-text-muted/40 outline-none border border-white/10 focus:border-accent" />
            <input type="number" placeholder="DMs Sent" value={form.dms_sent} onChange={(e) => setForm({ ...form, dms_sent: e.target.value })}
              className="bg-bg rounded-full px-4 py-3 text-sm text-text placeholder-text-muted/40 outline-none border border-white/10 focus:border-accent" />
            <input type="number" placeholder="DMs Received" value={form.dms_received} onChange={(e) => setForm({ ...form, dms_received: e.target.value })}
              className="bg-bg rounded-full px-4 py-3 text-sm text-text placeholder-text-muted/40 outline-none border border-white/10 focus:border-accent" />
          </div>
          <button onClick={saveMetric}
            className="px-6 py-3 rounded-full bg-accent text-white text-sm font-body font-medium hover:bg-accent-hover transition-colors">
            Save
          </button>
        </div>
      )}

      {/* Impressions Bar Chart */}
      <div className="bg-bg-card rounded-2xl p-5 border border-white/5">
        <h2 className="font-heading text-lg font-semibold mb-4">Impressions (14 Days)</h2>
        <div className="flex items-end gap-1 h-40">
          {chartData.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-accent/20 rounded-t-lg relative" style={{ height: `${(d.impressions / maxImpressions) * 100}%`, minHeight: '2px' }}>
                <div className="absolute inset-0 bg-accent rounded-t-lg" style={{ height: '100%' }} />
              </div>
              <span className="text-[9px] text-text-muted font-mono rotate-0">{d.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Entries Table */}
      <div className="bg-bg-card rounded-2xl border border-white/5 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-xs text-text-muted font-mono py-3 px-5">Date</th>
              <th className="text-right text-xs text-text-muted font-mono py-3 px-5">Followers</th>
              <th className="text-right text-xs text-text-muted font-mono py-3 px-5">Impressions</th>
              <th className="text-right text-xs text-text-muted font-mono py-3 px-5">DMs Sent</th>
              <th className="text-right text-xs text-text-muted font-mono py-3 px-5">DMs Recv</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => (
              <tr key={m.id} className="border-b border-white/5">
                <td className="text-sm font-mono py-3 px-5">{formatDate(m.date)}</td>
                <td className="text-right font-mono text-sm py-3 px-5">{formatNumber(m.followers)}</td>
                <td className="text-right font-mono text-sm py-3 px-5 text-accent">{formatNumber(m.impressions)}</td>
                <td className="text-right font-mono text-sm py-3 px-5">{m.dms_sent}</td>
                <td className="text-right font-mono text-sm py-3 px-5">{m.dms_received}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {metrics.length === 0 && <p className="text-center text-text-muted font-mono text-sm py-8">No data yet.</p>}
      </div>
    </div>
  );
}
