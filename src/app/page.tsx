'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { todayISO, formatNumber, formatCurrency } from '@/lib/helpers';
import { HABIT_KEYS, HABIT_LABELS } from '@/types/database';
import type { DailyLog, HabitKey } from '@/types/database';

export default function DailyView() {
  const today = todayISO();
  const [log, setLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [mostImportantTask, setMostImportantTask] = useState('');
  const [winLog, setWinLog] = useState('');
  const [tomorrowTask, setTomorrowTask] = useState('');
  const [quickMetrics, setQuickMetrics] = useState({
    followers: 0,
    pipelineCount: 0,
    mrr: 0,
    briefs: 0,
  });

  const fetchLog = useCallback(async () => {
    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('date', today)
      .single();

    if (error && error.code === 'PGRST116') {
      // No row found — create one
      const { data: newLog } = await supabase
        .from('daily_logs')
        .insert({ date: today })
        .select()
        .single();
      if (newLog) {
        setLog(newLog);
        setMostImportantTask(newLog.most_important_task || '');
        setWinLog(newLog.win_log || '');
        setTomorrowTask(newLog.tomorrow_task || '');
      }
    } else if (data) {
      setLog(data);
      setMostImportantTask(data.most_important_task || '');
      setWinLog(data.win_log || '');
      setTomorrowTask(data.tomorrow_task || '');
    }
    setLoading(false);
  }, [today]);

  const fetchQuickMetrics = useCallback(async () => {
    // Latest LinkedIn followers
    const { data: linkedin } = await supabase
      .from('linkedin_metrics')
      .select('followers')
      .order('date', { ascending: false })
      .limit(1)
      .single();

    // Active pipeline count
    const { count: pipelineCount } = await supabase
      .from('pipeline')
      .select('*', { count: 'exact', head: true })
      .not('stage', 'in', '("closed_won","closed_lost")');

    // Latest MRR
    const { data: product } = await supabase
      .from('product_metrics')
      .select('mrr')
      .order('date', { ascending: false })
      .limit(1)
      .single();

    // GTM Brief signups
    const { data: briefs } = await supabase
      .from('product_metrics')
      .select('signups')
      .eq('product_name', 'GTM Brief')
      .order('date', { ascending: false })
      .limit(1)
      .single();

    setQuickMetrics({
      followers: linkedin?.followers || 0,
      pipelineCount: pipelineCount || 0,
      mrr: product?.mrr || 0,
      briefs: briefs?.signups || 0,
    });
  }, []);

  useEffect(() => {
    fetchLog();
    fetchQuickMetrics();
  }, [fetchLog, fetchQuickMetrics]);

  const toggleHabit = async (habit: HabitKey) => {
    if (!log) return;
    const newValue = !log[habit];
    await supabase
      .from('daily_logs')
      .update({ [habit]: newValue })
      .eq('id', log.id);
    setLog({ ...log, [habit]: newValue });
  };

  const updateTextField = async (field: 'most_important_task' | 'win_log' | 'tomorrow_task', value: string) => {
    if (!log) return;
    await supabase
      .from('daily_logs')
      .update({ [field]: value })
      .eq('id', log.id);
    setLog({ ...log, [field]: value });
  };

  const markDayComplete = async () => {
    if (!log) return;
    await supabase
      .from('daily_logs')
      .update({ day_complete: true })
      .eq('id', log.id);
    setLog({ ...log, day_complete: true });
  };

  const habitsCompleted = log ? HABIT_KEYS.filter((k) => log[k]).length : 0;
  const allHabitsDone = habitsCompleted === HABIT_KEYS.length;
  const winLogged = !!log?.win_log;
  const systemHealthy = allHabitsDone && winLogged;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">Today</h1>
          <p className="text-text-muted text-sm font-mono mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`w-4 h-4 rounded-full ${
              systemHealthy ? 'bg-green-500 health-dot-green' : 'bg-accent health-dot-orange'
            }`}
            title={systemHealthy ? 'System healthy' : 'Habits incomplete'}
          />
          <span className="text-xs text-text-muted font-mono">
            {habitsCompleted}/{HABIT_KEYS.length}
          </span>
        </div>
      </div>

      {/* Most Important Task */}
      <div className="bg-bg-card rounded-2xl p-5 border border-white/5">
        <label className="text-xs text-text-muted font-mono uppercase tracking-wider">
          Most Important Task
        </label>
        <input
          type="text"
          value={mostImportantTask}
          onChange={(e) => setMostImportantTask(e.target.value)}
          onBlur={() => updateTextField('most_important_task', mostImportantTask)}
          placeholder="What's the ONE thing you must accomplish today?"
          className="w-full mt-2 bg-transparent text-xl font-heading font-semibold text-text placeholder-text-muted/40 outline-none border-b border-white/10 pb-2 focus:border-accent transition-colors"
        />
      </div>

      {/* Quick Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Followers', value: formatNumber(quickMetrics.followers), icon: 'in' },
          { label: 'Pipeline', value: quickMetrics.pipelineCount.toString(), icon: '◈' },
          { label: 'MRR', value: formatCurrency(quickMetrics.mrr), icon: '$' },
          { label: 'Briefs', value: quickMetrics.briefs.toString(), icon: '⚡' },
        ].map((m) => (
          <div key={m.label} className="bg-bg-card rounded-2xl p-4 border border-white/5 metric-glow">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-accent-dim text-accent flex items-center justify-center text-xs font-mono">
                {m.icon}
              </span>
              <span className="text-xs text-text-muted font-mono uppercase">{m.label}</span>
            </div>
            <p className="font-mono text-2xl font-bold mt-2 text-text">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Habit Checkboxes */}
      <div className="bg-bg-card rounded-2xl p-5 border border-white/5">
        <h2 className="font-heading text-lg font-semibold mb-4">Daily Habits</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {HABIT_KEYS.map((habit) => (
            <button
              key={habit}
              onClick={() => toggleHabit(habit)}
              className="flex flex-col items-center gap-2"
            >
              <div
                className={`w-[44px] h-[44px] rounded-full border-2 flex items-center justify-center text-lg font-bold transition-all ${
                  log?.[habit]
                    ? 'bg-accent border-accent text-white'
                    : 'border-white/20 text-text-muted hover:border-accent'
                }`}
              >
                {log?.[habit] ? '✓' : ''}
              </div>
              <span className="text-xs text-text-muted font-mono">{HABIT_LABELS[habit]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Evening Section */}
      <div className="bg-bg-card rounded-2xl p-5 border border-white/5 space-y-5">
        <h2 className="font-heading text-lg font-semibold">Evening Wrap-Up</h2>

        <div>
          <label className="text-xs text-text-muted font-mono uppercase tracking-wider">
            Today&apos;s Win
          </label>
          <textarea
            value={winLog}
            onChange={(e) => setWinLog(e.target.value)}
            onBlur={() => updateTextField('win_log', winLog)}
            placeholder="What went well today?"
            rows={2}
            className="w-full mt-2 bg-bg rounded-xl p-3 text-sm text-text placeholder-text-muted/40 outline-none border border-white/10 focus:border-accent transition-colors resize-none"
          />
        </div>

        <div>
          <label className="text-xs text-text-muted font-mono uppercase tracking-wider">
            Tomorrow&apos;s Priority
          </label>
          <textarea
            value={tomorrowTask}
            onChange={(e) => setTomorrowTask(e.target.value)}
            onBlur={() => updateTextField('tomorrow_task', tomorrowTask)}
            placeholder="What's the #1 priority for tomorrow?"
            rows={2}
            className="w-full mt-2 bg-bg rounded-xl p-3 text-sm text-text placeholder-text-muted/40 outline-none border border-white/10 focus:border-accent transition-colors resize-none"
          />
        </div>

        {!log?.day_complete ? (
          <button
            onClick={markDayComplete}
            disabled={!allHabitsDone || !winLogged}
            className={`w-full py-4 rounded-full font-body font-semibold text-sm uppercase tracking-wider transition-all ${
              allHabitsDone && winLogged
                ? 'bg-accent text-white hover:bg-accent-hover active:scale-[0.98]'
                : 'bg-white/5 text-text-muted cursor-not-allowed'
            }`}
          >
            {allHabitsDone && winLogged ? 'Complete Day ✓' : `Complete all habits & log win first (${habitsCompleted}/${HABIT_KEYS.length})`}
          </button>
        ) : (
          <div className="w-full py-4 rounded-full bg-green-500/10 text-green-400 text-center font-body font-semibold text-sm uppercase tracking-wider">
            Day Complete ✓
          </div>
        )}
      </div>
    </div>
  );
}
