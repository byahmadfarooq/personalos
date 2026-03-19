'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/helpers';
import { PIPELINE_STAGES, STAGE_LABELS } from '@/types/database';
import type { PipelineDeal, PipelineStage } from '@/types/database';

export default function PipelinePage() {
  const [deals, setDeals] = useState<PipelineDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', stage: 'lead' as PipelineStage, offer: '', value: '',
    last_action: '', next_action: '', next_action_date: '',
  });

  const fetchDeals = useCallback(async () => {
    const { data } = await supabase.from('pipeline').select('*').order('updated_at', { ascending: false });
    setDeals(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  const saveDeal = async () => {
    if (!form.name || !form.offer) return;
    const payload = {
      name: form.name, stage: form.stage, offer: form.offer,
      value: Number(form.value) || 0,
      last_action: form.last_action || null,
      next_action: form.next_action || null,
      next_action_date: form.next_action_date || null,
    };
    if (editingId) {
      await supabase.from('pipeline').update(payload).eq('id', editingId);
    } else {
      await supabase.from('pipeline').insert(payload);
    }
    resetForm();
    fetchDeals();
  };

  const resetForm = () => {
    setForm({ name: '', stage: 'lead', offer: '', value: '', last_action: '', next_action: '', next_action_date: '' });
    setShowForm(false);
    setEditingId(null);
  };

  const startEdit = (deal: PipelineDeal) => {
    setForm({
      name: deal.name, stage: deal.stage, offer: deal.offer,
      value: String(deal.value), last_action: deal.last_action || '',
      next_action: deal.next_action || '', next_action_date: deal.next_action_date || '',
    });
    setEditingId(deal.id);
    setShowForm(true);
  };

  const moveStage = async (id: string, stage: PipelineStage) => {
    await supabase.from('pipeline').update({ stage }).eq('id', id);
    fetchDeals();
  };

  const deleteDeal = async (id: string) => {
    await supabase.from('pipeline').delete().eq('id', id);
    fetchDeals();
  };

  const totalValue = deals.filter((d) => !['closed_won', 'closed_lost'].includes(d.stage)).reduce((s, d) => s + Number(d.value), 0);
  const wonValue = deals.filter((d) => d.stage === 'closed_won').reduce((s, d) => s + Number(d.value), 0);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">Pipeline</h1>
          <p className="text-text-muted text-sm font-mono mt-1">
            Active: {formatCurrency(totalValue)} | Won: {formatCurrency(wonValue)}
          </p>
        </div>
        <button onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
          className="px-5 py-2.5 rounded-full bg-accent text-white text-sm font-body font-medium hover:bg-accent-hover transition-colors">
          {showForm ? 'Cancel' : '+ New Deal'}
        </button>
      </div>

      {showForm && (
        <div className="bg-bg-card rounded-2xl p-5 border border-white/5 space-y-4">
          <h2 className="font-heading text-lg font-semibold">{editingId ? 'Edit Deal' : 'New Deal'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Company / Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-bg rounded-full px-4 py-3 text-sm text-text placeholder-text-muted/40 outline-none border border-white/10 focus:border-accent" />
            <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value as PipelineStage })}
              className="bg-bg rounded-full px-4 py-3 text-sm text-text outline-none border border-white/10 focus:border-accent">
              {PIPELINE_STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
            </select>
            <input type="text" placeholder="Offer (e.g., GTM Audit)" value={form.offer} onChange={(e) => setForm({ ...form, offer: e.target.value })}
              className="bg-bg rounded-full px-4 py-3 text-sm text-text placeholder-text-muted/40 outline-none border border-white/10 focus:border-accent" />
            <input type="number" placeholder="Deal Value ($)" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })}
              className="bg-bg rounded-full px-4 py-3 text-sm text-text placeholder-text-muted/40 outline-none border border-white/10 focus:border-accent" />
            <input type="text" placeholder="Last Action" value={form.last_action} onChange={(e) => setForm({ ...form, last_action: e.target.value })}
              className="bg-bg rounded-full px-4 py-3 text-sm text-text placeholder-text-muted/40 outline-none border border-white/10 focus:border-accent" />
            <input type="text" placeholder="Next Action" value={form.next_action} onChange={(e) => setForm({ ...form, next_action: e.target.value })}
              className="bg-bg rounded-full px-4 py-3 text-sm text-text placeholder-text-muted/40 outline-none border border-white/10 focus:border-accent" />
            <input type="date" placeholder="Next Action Date" value={form.next_action_date} onChange={(e) => setForm({ ...form, next_action_date: e.target.value })}
              className="bg-bg rounded-full px-4 py-3 text-sm text-text outline-none border border-white/10 focus:border-accent" />
          </div>
          <button onClick={saveDeal}
            className="px-6 py-3 rounded-full bg-accent text-white text-sm font-body font-medium hover:bg-accent-hover transition-colors">
            {editingId ? 'Update Deal' : 'Add Deal'}
          </button>
        </div>
      )}

      {/* Kanban-style view by stage */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PIPELINE_STAGES.filter((s) => s !== 'closed_lost').map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage);
          return (
            <div key={stage} className="bg-bg-card rounded-2xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-mono text-sm font-bold text-accent">{STAGE_LABELS[stage]}</h3>
                <span className="text-xs text-text-muted font-mono">{stageDeals.length}</span>
              </div>
              <div className="space-y-2">
                {stageDeals.map((deal) => (
                  <div key={deal.id} className="bg-bg rounded-xl p-3 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-body font-medium truncate">{deal.name}</span>
                      <span className="font-mono text-xs text-accent">{formatCurrency(Number(deal.value))}</span>
                    </div>
                    <p className="text-xs text-text-muted font-mono">{deal.offer}</p>
                    {deal.next_action && (
                      <p className="text-xs text-text-muted">
                        Next: {deal.next_action} {deal.next_action_date ? `(${formatDate(deal.next_action_date)})` : ''}
                      </p>
                    )}
                    <div className="flex gap-1 flex-wrap">
                      {PIPELINE_STAGES.filter((s) => s !== deal.stage).map((s) => (
                        <button key={s} onClick={() => moveStage(deal.id, s)}
                          className="text-[10px] px-2 py-1 rounded-full bg-white/5 text-text-muted hover:text-accent font-mono">
                          → {STAGE_LABELS[s]}
                        </button>
                      ))}
                      <button onClick={() => startEdit(deal)} className="text-[10px] px-2 py-1 rounded-full bg-white/5 text-text-muted hover:text-accent font-mono">✎</button>
                      <button onClick={() => deleteDeal(deal.id)} className="text-[10px] px-2 py-1 rounded-full bg-white/5 text-text-muted hover:text-red-400 font-mono">✕</button>
                    </div>
                  </div>
                ))}
                {stageDeals.length === 0 && (
                  <p className="text-xs text-text-muted/40 font-mono text-center py-4">Empty</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Closed Lost (collapsed) */}
      {deals.filter((d) => d.stage === 'closed_lost').length > 0 && (
        <div className="bg-bg-card rounded-2xl p-4 border border-white/5 opacity-50">
          <h3 className="font-mono text-sm font-bold text-red-400 mb-2">Closed Lost ({deals.filter((d) => d.stage === 'closed_lost').length})</h3>
          {deals.filter((d) => d.stage === 'closed_lost').map((deal) => (
            <div key={deal.id} className="text-xs text-text-muted font-mono py-1 border-t border-white/5 flex justify-between">
              <span>{deal.name}</span>
              <span>{formatCurrency(Number(deal.value))}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
