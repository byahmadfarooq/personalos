'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { todayISO, formatDate, formatNumber, formatCurrency } from '@/lib/helpers';
import type { ProductMetric, ContentLogEntry } from '@/types/database';

export default function GTMBriefPage() {
  const [productMetrics, setProductMetrics] = useState<ProductMetric[]>([]);
  const [contentLog, setContentLog] = useState<ContentLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMetricForm, setShowMetricForm] = useState(false);
  const [showContentForm, setShowContentForm] = useState(false);
  const [metricForm, setMetricForm] = useState({ date: todayISO(), product_name: 'GTM Brief', signups: '', conversions: '', mrr: '' });
  const [contentForm, setContentForm] = useState({
    date: todayISO(), platform: 'newsletter' as ContentLogEntry['platform'],
    post_type: 'newsletter' as ContentLogEntry['post_type'], pillar: '', title: '', impressions: '',
  });

  const fetchData = useCallback(async () => {
    const [metricsRes, contentRes] = await Promise.all([
      supabase.from('product_metrics').select('*').order('date', { ascending: false }).limit(30),
      supabase.from('content_log').select('*').order('date', { ascending: false }).limit(30),
    ]);
    setProductMetrics(metricsRes.data || []);
    setContentLog(contentRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveMetric = async () => {
    if (!metricForm.date) return;
    const payload = {
      date: metricForm.date,
      product_name: metricForm.product_name,
      signups: Number(metricForm.signups) || 0,
      conversions: Number(metricForm.conversions) || 0,
      mrr: Number(metricForm.mrr) || 0,
    };
    await supabase.from('product_metrics').upsert(payload, { onConflict: 'date,product_name' });
    setMetricForm({ date: todayISO(), product_name: 'GTM Brief', signups: '', conversions: '', mrr: '' });
    setShowMetricForm(false);
    fetchData();
  };

  const saveContent = async () => {
    if (!contentForm.pillar) return;
    await supabase.from('content_log').insert({
      date: contentForm.date,
      platform: contentForm.platform,
      post_type: contentForm.post_type,
      pillar: contentForm.pillar,
      title: contentForm.title || null,
      impressions: Number(contentForm.impressions) || 0,
    });
    setContentForm({ date: todayISO(), platform: 'newsletter', post_type: 'newsletter', pillar: '', title: '', impressions: '' });
    setShowContentForm(false);
    fetchData();
  };

  const gtmMetrics = productMetrics.filter((m) => m.product_name === 'GTM Brief');
  const latest = gtmMetrics[0];
  const totalImpressions = contentLog.reduce((s, c) => s + c.impressions, 0);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl md:text-3xl font-bold">GTM Brief & Content</h1>

      {/* Product Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-bg-card rounded-2xl p-4 border border-white/5">
          <p className="text-xs text-text-muted font-mono uppercase">Total Signups</p>
          <p className="font-mono text-2xl font-bold text-accent mt-1">{latest?.signups || 0}</p>
        </div>
        <div className="bg-bg-card rounded-2xl p-4 border border-white/5">
          <p className="text-xs text-text-muted font-mono uppercase">Conversions</p>
          <p className="font-mono text-2xl font-bold text-text mt-1">{latest?.conversions || 0}</p>
        </div>
        <div className="bg-bg-card rounded-2xl p-4 border border-white/5">
          <p className="text-xs text-text-muted font-mono uppercase">MRR</p>
          <p className="font-mono text-2xl font-bold text-accent mt-1">{formatCurrency(Number(latest?.mrr || 0))}</p>
        </div>
        <div className="bg-bg-card rounded-2xl p-4 border border-white/5">
          <p className="text-xs text-text-muted font-mono uppercase">Content Impressions</p>
          <p className="font-mono text-2xl font-bold text-text mt-1">{formatNumber(totalImpressions)}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        <button onClick={() => { setShowMetricForm(!showMetricForm); setShowContentForm(false); }}
          className="px-5 py-2.5 rounded-full bg-accent text-white text-sm font-body font-medium hover:bg-accent-hover transition-colors">
          {showMetricForm ? 'Cancel' : '+ Log Product Metrics'}
        </button>
        <button onClick={() => { setShowContentForm(!showContentForm); setShowMetricForm(false); }}
          className="px-5 py-2.5 rounded-full bg-white/10 text-text text-sm font-body font-medium hover:bg-white/20 transition-colors">
          {showContentForm ? 'Cancel' : '+ Log Content'}
        </button>
      </div>

      {/* Product Metric Form */}
      {showMetricForm && (
        <div className="bg-bg-card rounded-2xl p-5 border border-white/5 space-y-4">
          <h2 className="font-heading text-lg font-semibold">Log Product Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="date" value={metricForm.date} onChange={(e) => setMetricForm({ ...metricForm, date: e.target.value })}
              className="bg-bg rounded-full px-4 py-3 text-sm text-text outline-none border border-white/10 focus:border-accent" />
            <input type="text" placeholder="Product Name" value={metricForm.product_name} onChange={(e) => setMetricForm({ ...metricForm, product_name: e.target.value })}
              className="bg-bg rounded-full px-4 py-3 text-sm text-text placeholder-text-muted/40 outline-none border border-white/10 focus:border-accent" />
            <input type="number" placeholder="Signups" value={metricForm.signups} onChange={(e) => setMetricForm({ ...metricForm, signups: e.target.value })}
              className="bg-bg rounded-full px-4 py-3 text-sm text-text placeholder-text-muted/40 outline-none border border-white/10 focus:border-accent" />
            <input type="number" placeholder="Conversions" value={metricForm.conversions} onChange={(e) => setMetricForm({ ...metricForm, conversions: e.target.value })}
              className="bg-bg rounded-full px-4 py-3 text-sm text-text placeholder-text-muted/40 outline-none border border-white/10 focus:border-accent" />
            <input type="number" placeholder="MRR ($)" value={metricForm.mrr} onChange={(e) => setMetricForm({ ...metricForm, mrr: e.target.value })}
              className="bg-bg rounded-full px-4 py-3 text-sm text-text placeholder-text-muted/40 outline-none border border-white/10 focus:border-accent" />
          </div>
          <button onClick={saveMetric} className="px-6 py-3 rounded-full bg-accent text-white text-sm font-body font-medium hover:bg-accent-hover transition-colors">Save</button>
        </div>
      )}

      {/* Content Log Form */}
      {showContentForm && (
        <div className="bg-bg-card rounded-2xl p-5 border border-white/5 space-y-4">
          <h2 className="font-heading text-lg font-semibold">Log Content</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="date" value={contentForm.date} onChange={(e) => setContentForm({ ...contentForm, date: e.target.value })}
              className="bg-bg rounded-full px-4 py-3 text-sm text-text outline-none border border-white/10 focus:border-accent" />
            <select value={contentForm.platform} onChange={(e) => setContentForm({ ...contentForm, platform: e.target.value as ContentLogEntry['platform'] })}
              className="bg-bg rounded-full px-4 py-3 text-sm text-text outline-none border border-white/10 focus:border-accent">
              <option value="linkedin">LinkedIn</option>
              <option value="twitter">Twitter</option>
              <option value="newsletter">Newsletter</option>
              <option value="blog">Blog</option>
              <option value="youtube">YouTube</option>
              <option value="other">Other</option>
            </select>
            <select value={contentForm.post_type} onChange={(e) => setContentForm({ ...contentForm, post_type: e.target.value as ContentLogEntry['post_type'] })}
              className="bg-bg rounded-full px-4 py-3 text-sm text-text outline-none border border-white/10 focus:border-accent">
              <option value="text">Text</option>
              <option value="carousel">Carousel</option>
              <option value="video">Video</option>
              <option value="article">Article</option>
              <option value="newsletter">Newsletter</option>
              <option value="thread">Thread</option>
            </select>
            <input type="text" placeholder="Content Pillar" value={contentForm.pillar} onChange={(e) => setContentForm({ ...contentForm, pillar: e.target.value })}
              className="bg-bg rounded-full px-4 py-3 text-sm text-text placeholder-text-muted/40 outline-none border border-white/10 focus:border-accent" />
            <input type="text" placeholder="Title (optional)" value={contentForm.title} onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
              className="bg-bg rounded-full px-4 py-3 text-sm text-text placeholder-text-muted/40 outline-none border border-white/10 focus:border-accent" />
            <input type="number" placeholder="Impressions" value={contentForm.impressions} onChange={(e) => setContentForm({ ...contentForm, impressions: e.target.value })}
              className="bg-bg rounded-full px-4 py-3 text-sm text-text placeholder-text-muted/40 outline-none border border-white/10 focus:border-accent" />
          </div>
          <button onClick={saveContent} className="px-6 py-3 rounded-full bg-accent text-white text-sm font-body font-medium hover:bg-accent-hover transition-colors">Save</button>
        </div>
      )}

      {/* Content Log Table */}
      <div className="bg-bg-card rounded-2xl border border-white/5 overflow-hidden">
        <h2 className="font-heading text-lg font-semibold px-5 pt-5 pb-3">Content Log</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-xs text-text-muted font-mono py-3 px-5">Date</th>
              <th className="text-left text-xs text-text-muted font-mono py-3 px-5">Platform</th>
              <th className="text-left text-xs text-text-muted font-mono py-3 px-5">Type</th>
              <th className="text-left text-xs text-text-muted font-mono py-3 px-5">Pillar</th>
              <th className="text-right text-xs text-text-muted font-mono py-3 px-5">Impressions</th>
            </tr>
          </thead>
          <tbody>
            {contentLog.map((c) => (
              <tr key={c.id} className="border-b border-white/5">
                <td className="text-sm font-mono py-3 px-5">{formatDate(c.date)}</td>
                <td className="text-sm font-mono py-3 px-5 capitalize">{c.platform}</td>
                <td className="text-sm font-mono py-3 px-5 capitalize">{c.post_type}</td>
                <td className="text-sm font-body py-3 px-5">{c.pillar}</td>
                <td className="text-right font-mono text-sm py-3 px-5 text-accent">{formatNumber(c.impressions)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {contentLog.length === 0 && <p className="text-center text-text-muted font-mono text-sm py-8">No content logged yet.</p>}
      </div>
    </div>
  );
}
