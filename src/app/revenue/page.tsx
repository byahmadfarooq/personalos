'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, percentOf } from '@/lib/helpers';
import type { Revenue } from '@/types/database';

export default function RevenuePage() {
  const [rows, setRows] = useState<Revenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ month: '', consulting_revenue: '', product_revenue: '', target: '' });

  const fetchRevenue = useCallback(async () => {
    const { data } = await supabase.from('revenue').select('*').order('month', { ascending: false });
    setRows(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchRevenue(); }, [fetchRevenue]);

  const saveRevenue = async () => {
    if (!form.month) return;
    const month = form.month + '-01'; // convert YYYY-MM to YYYY-MM-01
    const payload = {
      month,
      consulting_revenue: Number(form.consulting_revenue) || 0,
      product_revenue: Number(form.product_revenue) || 0,
      target: Number(form.target) || 0,
    };
    // Upsert by month
    const existing = rows.find((r) => r.month === month);
    if (existing) {
      await supabase.from('revenue').update(payload).eq('id', existing.id);
    } else {
      await supabase.from('revenue').insert(payload);
    }
    setForm({ month: '', consulting_revenue: '', product_revenue: '', target: '' });
    setShowForm(false);
    fetchRevenue();
  };

  const totalRevenue = rows.reduce((s, r) => s + Number(r.total), 0);
  const totalTarget = rows.reduce((s, r) => s + Number(r.target), 0);
  const latestMonth = rows[0];

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl md:text-3xl font-bold">Revenue</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 rounded-full bg-accent text-white text-sm font-body font-medium hover:bg-accent-hover transition-colors">
          {showForm ? 'Cancel' : '+ Log Revenue'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-bg-card rounded-2xl p-5 border border-white/5">
          <p className="text-xs text-text-muted font-mono uppercase">YTD Revenue</p>
          <p className="font-mono text-3xl font-bold text-accent mt-2">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-text-muted font-mono mt-1">Target: {formatCurrency(totalTarget)}</p>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-accent rounded-full progress-fill" style={{ width: `${percentOf(totalRevenue, totalTarget)}%` }} />
          </div>
        </div>
        {latestMonth && (
          <>
            <div className="bg-bg-card rounded-2xl p-5 border border-white/5">
              <p className="text-xs text-text-muted font-mono uppercase">Consulting (This Month)</p>
              <p className="font-mono text-3xl font-bold text-text mt-2">{formatCurrency(Number(latestMonth.consulting_revenue))}</p>
            </div>
            <div className="bg-bg-card rounded-2xl p-5 border border-white/5">
              <p className="text-xs text-text-muted font-mono uppercase">Product (This Month)</p>
              <p className="font-mono text-3xl font-bold text-text mt-2">{formatCurrency(Number(latestMonth.product_revenue))}</p>
            </div>
          </>
        )}
      </div>

      {showForm && (
        <div className="bg-bg-card rounded-2xl p-5 border border-white/5 space-y-4">
          <h2 className="font-heading text-lg font-semibold">Log Monthly Revenue</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })}
              className="bg-bg rounded-full px-4 py-3 text-sm text-text outline-none border border-white/10 focus:border-accent" />
            <input type="number" placeholder="Revenue Target ($)" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}
              className="bg-bg rounded-full px-4 py-3 text-sm text-text placeholder-text-muted/40 outline-none border border-white/10 focus:border-accent" />
            <input type="number" placeholder="Consulting Revenue ($)" value={form.consulting_revenue} onChange={(e) => setForm({ ...form, consulting_revenue: e.target.value })}
              className="bg-bg rounded-full px-4 py-3 text-sm text-text placeholder-text-muted/40 outline-none border border-white/10 focus:border-accent" />
            <input type="number" placeholder="Product Revenue ($)" value={form.product_revenue} onChange={(e) => setForm({ ...form, product_revenue: e.target.value })}
              className="bg-bg rounded-full px-4 py-3 text-sm text-text placeholder-text-muted/40 outline-none border border-white/10 focus:border-accent" />
          </div>
          <button onClick={saveRevenue}
            className="px-6 py-3 rounded-full bg-accent text-white text-sm font-body font-medium hover:bg-accent-hover transition-colors">
            Save
          </button>
        </div>
      )}

      {/* Revenue Table */}
      <div className="bg-bg-card rounded-2xl border border-white/5 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-xs text-text-muted font-mono py-3 px-5">Month</th>
              <th className="text-right text-xs text-text-muted font-mono py-3 px-5">Consulting</th>
              <th className="text-right text-xs text-text-muted font-mono py-3 px-5">Product</th>
              <th className="text-right text-xs text-text-muted font-mono py-3 px-5">Total</th>
              <th className="text-right text-xs text-text-muted font-mono py-3 px-5">Target</th>
              <th className="text-right text-xs text-text-muted font-mono py-3 px-5">%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const pct = percentOf(Number(r.total), Number(r.target));
              return (
                <tr key={r.id} className="border-b border-white/5">
                  <td className="text-sm font-mono py-3 px-5">
                    {new Date(r.month + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </td>
                  <td className="text-right font-mono text-sm py-3 px-5">{formatCurrency(Number(r.consulting_revenue))}</td>
                  <td className="text-right font-mono text-sm py-3 px-5">{formatCurrency(Number(r.product_revenue))}</td>
                  <td className="text-right font-mono text-sm font-bold py-3 px-5 text-accent">{formatCurrency(Number(r.total))}</td>
                  <td className="text-right font-mono text-sm py-3 px-5 text-text-muted">{formatCurrency(Number(r.target))}</td>
                  <td className="text-right font-mono text-sm py-3 px-5">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${pct >= 100 ? 'bg-green-500/10 text-green-400' : pct >= 75 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>
                      {pct}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="text-center text-text-muted font-mono text-sm py-8">No revenue data yet.</p>
        )}
      </div>
    </div>
  );
}
