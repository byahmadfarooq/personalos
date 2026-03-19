'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { percentOf } from '@/lib/helpers';
import type { Goal } from '@/types/database';

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', metric: '', target: '', timeline: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    const { data } = await supabase.from('goals').select('*').order('created_at');
    setGoals(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const saveGoal = async () => {
    if (!form.title || !form.metric || !form.target || !form.timeline) return;
    if (editingId) {
      await supabase.from('goals').update({
        title: form.title, metric: form.metric,
        target: Number(form.target), timeline: form.timeline,
      }).eq('id', editingId);
    } else {
      await supabase.from('goals').insert({
        title: form.title, metric: form.metric,
        target: Number(form.target), timeline: form.timeline,
      });
    }
    setForm({ title: '', metric: '', target: '', timeline: '' });
    setShowForm(false);
    setEditingId(null);
    fetchGoals();
  };

  const updateCurrent = async (id: string, current: number) => {
    await supabase.from('goals').update({ current }).eq('id', id);
    setGoals(goals.map((g) => g.id === id ? { ...g, current } : g));
  };

  const updateStatus = async (id: string, status: Goal['status']) => {
    await supabase.from('goals').update({ status }).eq('id', id);
    fetchGoals();
  };

  const startEdit = (goal: Goal) => {
    setForm({ title: goal.title, metric: goal.metric, target: String(goal.target), timeline: goal.timeline });
    setEditingId(goal.id);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl md:text-3xl font-bold">Goals</h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ title: '', metric: '', target: '', timeline: '' }); }}
          className="px-5 py-2.5 rounded-full bg-accent text-white text-sm font-body font-medium hover:bg-accent-hover transition-colors"
        >
          {showForm ? 'Cancel' : '+ New Goal'}
        </button>
      </div>

      {showForm && (
        <div className="bg-bg-card rounded-2xl p-5 border border-white/5 space-y-4">
          <h2 className="font-heading text-lg font-semibold">{editingId ? 'Edit Goal' : 'New Goal'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Goal title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="bg-bg rounded-full px-4 py-3 text-sm text-text placeholder-text-muted/40 outline-none border border-white/10 focus:border-accent" />
            <input type="text" placeholder="Metric (e.g., followers, revenue)" value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })}
              className="bg-bg rounded-full px-4 py-3 text-sm text-text placeholder-text-muted/40 outline-none border border-white/10 focus:border-accent" />
            <input type="number" placeholder="Target number" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}
              className="bg-bg rounded-full px-4 py-3 text-sm text-text placeholder-text-muted/40 outline-none border border-white/10 focus:border-accent" />
            <input type="text" placeholder="Timeline (e.g., Q2 2026)" value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value })}
              className="bg-bg rounded-full px-4 py-3 text-sm text-text placeholder-text-muted/40 outline-none border border-white/10 focus:border-accent" />
          </div>
          <button onClick={saveGoal}
            className="px-6 py-3 rounded-full bg-accent text-white text-sm font-body font-medium hover:bg-accent-hover transition-colors">
            {editingId ? 'Update Goal' : 'Add Goal'}
          </button>
        </div>
      )}

      <div className="space-y-4">
        {goals.map((goal) => {
          const pct = percentOf(Number(goal.current), Number(goal.target));
          return (
            <div key={goal.id} className="bg-bg-card rounded-2xl p-5 border border-white/5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-heading text-lg font-semibold">{goal.title}</h3>
                  <p className="text-xs text-text-muted font-mono mt-1">{goal.timeline}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono px-3 py-1 rounded-full ${
                    goal.status === 'active' ? 'bg-accent-dim text-accent' :
                    goal.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                    goal.status === 'paused' ? 'bg-yellow-500/10 text-yellow-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>
                    {goal.status}
                  </span>
                  <button onClick={() => startEdit(goal)} className="w-8 h-8 rounded-full bg-white/5 text-text-muted hover:text-accent flex items-center justify-center text-xs">✎</button>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-3">
                <div className="flex-1">
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <span className="font-mono text-sm font-bold text-accent">{pct}%</span>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-text-muted font-mono">Current:</label>
                  <input
                    type="number"
                    value={Number(goal.current)}
                    onChange={(e) => updateCurrent(goal.id, Number(e.target.value))}
                    className="w-24 bg-bg rounded-full px-3 py-1.5 text-sm font-mono text-text outline-none border border-white/10 focus:border-accent"
                  />
                  <span className="text-xs text-text-muted font-mono">/ {Number(goal.target)} {goal.metric}</span>
                </div>
                <div className="flex gap-1 ml-auto">
                  {(['active', 'completed', 'paused', 'abandoned'] as const).map((s) => (
                    <button key={s} onClick={() => updateStatus(goal.id, s)}
                      className={`text-xs px-3 py-1.5 rounded-full font-mono transition-all ${
                        goal.status === s ? 'bg-accent text-white' : 'bg-white/5 text-text-muted hover:text-accent'
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        {goals.length === 0 && (
          <div className="bg-bg-card rounded-2xl p-10 border border-white/5 text-center">
            <p className="text-text-muted font-mono">No goals yet. Click &quot;+ New Goal&quot; to add one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
