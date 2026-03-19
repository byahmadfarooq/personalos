'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { percentOf } from '@/lib/helpers';
import type { CurriculumItem } from '@/types/database';

export default function CurriculumPage() {
  const [items, setItems] = useState<CurriculumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ book_title: '', month: '', chapter_current: '', chapter_total: '', application_log: '' });

  const fetchItems = useCallback(async () => {
    const { data } = await supabase.from('curriculum').select('*').order('month', { ascending: false });
    setItems(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const saveItem = async () => {
    if (!form.book_title || !form.month || !form.chapter_total) return;
    const data = {
      book_title: form.book_title,
      month: form.month + '-01',
      chapter_current: Number(form.chapter_current) || 0,
      chapter_total: Number(form.chapter_total),
      application_log: form.application_log || null,
    };
    if (editingId) {
      await supabase.from('curriculum').update(data).eq('id', editingId);
    } else {
      await supabase.from('curriculum').insert(data);
    }
    resetForm();
    fetchItems();
  };

  const resetForm = () => {
    setForm({ book_title: '', month: '', chapter_current: '', chapter_total: '', application_log: '' });
    setShowForm(false);
    setEditingId(null);
  };

  const startEdit = (item: CurriculumItem) => {
    setForm({
      book_title: item.book_title,
      month: item.month.slice(0, 7),
      chapter_current: String(item.chapter_current),
      chapter_total: String(item.chapter_total),
      application_log: item.application_log || '',
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const updateProgress = async (id: string, chapter_current: number) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const completed = chapter_current >= item.chapter_total;
    await supabase.from('curriculum').update({ chapter_current, completed }).eq('id', id);
    setItems(items.map((i) => i.id === id ? { ...i, chapter_current, completed } : i));
  };

  const toggleComplete = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    await supabase.from('curriculum').update({ completed: !item.completed }).eq('id', id);
    setItems(items.map((i) => i.id === id ? { ...i, completed: !i.completed } : i));
  };

  const activeBooks = items.filter((i) => !i.completed);
  const completedBooks = items.filter((i) => i.completed);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">Curriculum</h1>
          <p className="text-text-muted text-sm font-mono mt-1">{activeBooks.length} active · {completedBooks.length} completed</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
          className="px-5 py-2.5 rounded-full bg-accent text-white text-sm font-body font-medium hover:bg-accent-hover transition-colors">
          {showForm ? 'Cancel' : '+ Add Book'}
        </button>
      </div>

      {showForm && (
        <div className="bg-bg-card rounded-2xl p-5 border border-white/5 space-y-4">
          <h2 className="font-heading text-lg font-semibold">{editingId ? 'Edit Book' : 'Add Book'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Book Title" value={form.book_title} onChange={(e) => setForm({ ...form, book_title: e.target.value })}
              className="bg-bg rounded-full px-4 py-3 text-sm text-text placeholder-text-muted/40 outline-none border border-white/10 focus:border-accent" />
            <input type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })}
              className="bg-bg rounded-full px-4 py-3 text-sm text-text outline-none border border-white/10 focus:border-accent" />
            <input type="number" placeholder="Current Chapter" value={form.chapter_current} onChange={(e) => setForm({ ...form, chapter_current: e.target.value })}
              className="bg-bg rounded-full px-4 py-3 text-sm text-text placeholder-text-muted/40 outline-none border border-white/10 focus:border-accent" />
            <input type="number" placeholder="Total Chapters" value={form.chapter_total} onChange={(e) => setForm({ ...form, chapter_total: e.target.value })}
              className="bg-bg rounded-full px-4 py-3 text-sm text-text placeholder-text-muted/40 outline-none border border-white/10 focus:border-accent" />
          </div>
          <textarea placeholder="Application Log — How are you applying what you learned?" value={form.application_log} onChange={(e) => setForm({ ...form, application_log: e.target.value })}
            rows={3} className="w-full bg-bg rounded-xl px-4 py-3 text-sm text-text placeholder-text-muted/40 outline-none border border-white/10 focus:border-accent resize-none" />
          <button onClick={saveItem}
            className="px-6 py-3 rounded-full bg-accent text-white text-sm font-body font-medium hover:bg-accent-hover transition-colors">
            {editingId ? 'Update' : 'Add Book'}
          </button>
        </div>
      )}

      {/* Active Books */}
      <div className="space-y-4">
        {activeBooks.map((item) => {
          const pct = percentOf(item.chapter_current, item.chapter_total);
          return (
            <div key={item.id} className="bg-bg-card rounded-2xl p-5 border border-white/5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-heading text-lg font-semibold">{item.book_title}</h3>
                  <p className="text-xs text-text-muted font-mono mt-1">
                    {new Date(item.month + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(item)} className="w-8 h-8 rounded-full bg-white/5 text-text-muted hover:text-accent flex items-center justify-center text-xs">✎</button>
                  <button onClick={() => toggleComplete(item.id)} className="w-8 h-8 rounded-full bg-white/5 text-text-muted hover:text-green-400 flex items-center justify-center text-xs">✓</button>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="font-mono text-sm text-accent font-bold">{pct}%</span>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs text-text-muted font-mono">Chapter:</label>
                <input type="number" value={item.chapter_current} min={0} max={item.chapter_total}
                  onChange={(e) => updateProgress(item.id, Number(e.target.value))}
                  className="w-16 bg-bg rounded-full px-3 py-1.5 text-sm font-mono text-text outline-none border border-white/10 focus:border-accent text-center" />
                <span className="text-xs text-text-muted font-mono">/ {item.chapter_total}</span>
              </div>

              {item.application_log && (
                <div className="mt-3 p-3 bg-bg rounded-xl border border-white/5">
                  <p className="text-xs text-text-muted font-mono uppercase mb-1">Application Log</p>
                  <p className="text-sm text-text">{item.application_log}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Completed Books */}
      {completedBooks.length > 0 && (
        <div>
          <h2 className="font-heading text-lg font-semibold mb-3 text-text-muted">Completed</h2>
          <div className="space-y-2">
            {completedBooks.map((item) => (
              <div key={item.id} className="bg-bg-card rounded-2xl p-4 border border-white/5 flex items-center justify-between opacity-60">
                <div>
                  <span className="text-sm font-body">{item.book_title}</span>
                  <span className="text-xs text-text-muted font-mono ml-2">{item.chapter_total} chapters</span>
                </div>
                <button onClick={() => toggleComplete(item.id)} className="text-xs px-3 py-1 rounded-full bg-green-500/10 text-green-400 font-mono">
                  Completed ✓
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="bg-bg-card rounded-2xl p-10 border border-white/5 text-center">
          <p className="text-text-muted font-mono">No books yet. Start building your curriculum.</p>
        </div>
      )}
    </div>
  );
}
