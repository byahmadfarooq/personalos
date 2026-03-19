'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getLast7Days, formatDate, getWeekStart, formatNumber, percentOf } from '@/lib/helpers';
import { HABIT_KEYS, HABIT_LABELS, STAGE_LABELS } from '@/types/database';
import type { DailyLog, Goal, WeeklyReview, PipelineDeal } from '@/types/database';

export default function WeeklyView() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [reviews, setReviews] = useState<WeeklyReview[]>([]);
  const [pipeline, setPipeline] = useState<PipelineDeal[]>([]);
  const [linkedinDelta, setLinkedinDelta] = useState({ followers: 0, impressions: 0, dms: 0 });
  const [contentCount, setContentCount] = useState(0);
  const [productDelta, setProductDelta] = useState({ signups: 0, mrr: 0 });
  const [loading, setLoading] = useState(true);

  const weekDays = getLast7Days();
  const weekStart = getWeekStart();

  const fetchData = useCallback(async () => {
    const [logsRes, goalsRes, reviewsRes, pipelineRes] = await Promise.all([
      supabase.from('daily_logs').select('*').in('date', weekDays).order('date'),
      supabase.from('goals').select('*').eq('status', 'active'),
      supabase.from('weekly_reviews').select('*').eq('week_start', weekStart),
      supabase.from('pipeline').select('*'),
    ]);

    setLogs(logsRes.data || []);
    setGoals(goalsRes.data || []);
    setReviews(reviewsRes.data || []);
    setPipeline(pipelineRes.data || []);

    // LinkedIn delta
    const { data: linkedinData } = await supabase
      .from('linkedin_metrics')
      .select('*')
      .gte('date', weekDays[0])
      .lte('date', weekDays[6])
      .order('date');

    if (linkedinData && linkedinData.length >= 2) {
      const first = linkedinData[0];
      const last = linkedinData[linkedinData.length - 1];
      setLinkedinDelta({
        followers: last.followers - first.followers,
        impressions: linkedinData.reduce((s, d) => s + d.impressions, 0),
        dms: linkedinData.reduce((s, d) => s + d.dms_sent, 0),
      });
    }

    // Content count this week
    const { count } = await supabase
      .from('content_log')
      .select('*', { count: 'exact', head: true })
      .gte('date', weekDays[0])
      .lte('date', weekDays[6]);
    setContentCount(count || 0);

    // Product delta
    const { data: prodData } = await supabase
      .from('product_metrics')
      .select('*')
      .gte('date', weekDays[0])
      .lte('date', weekDays[6])
      .order('date');

    if (prodData && prodData.length >= 2) {
      const first = prodData[0];
      const last = prodData[prodData.length - 1];
      setProductDelta({
        signups: last.signups - first.signups,
        mrr: last.mrr - first.mrr,
      });
    }

    setLoading(false);
  }, [weekDays, weekStart]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getReview = (goalId: string) => reviews.find((r) => r.goal_id === goalId);

  const saveReview = async (goalId: string, onTrack: boolean, action: string) => {
    const existing = getReview(goalId);
    if (existing) {
      await supabase
        .from('weekly_reviews')
        .update({ on_track: onTrack, corrective_action: action })
        .eq('id', existing.id);
    } else {
      const { data } = await supabase
        .from('weekly_reviews')
        .insert({ week_start: weekStart, goal_id: goalId, on_track: onTrack, corrective_action: action })
        .select()
        .single();
      if (data) setReviews([...reviews, data]);
    }
  };

  const pipelineActive = pipeline.filter((p) => !['closed_won', 'closed_lost'].includes(p.stage));
  const closedWon = pipeline.filter((p) => p.stage === 'closed_won').length;
  const totalDeals = pipeline.length;
  const conversionRate = totalDeals > 0 ? Math.round((closedWon / totalDeals) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold">Weekly Review</h1>
        <p className="text-text-muted text-sm font-mono mt-1">
          Week of {formatDate(weekDays[0])} — {formatDate(weekDays[6])}
        </p>
      </div>

      {/* 7-Day Habit Grid */}
      <div className="bg-bg-card rounded-2xl p-5 border border-white/5 overflow-x-auto">
        <h2 className="font-heading text-lg font-semibold mb-4">Habit Tracker</h2>
        <table className="w-full min-w-[600px]">
          <thead>
            <tr>
              <th className="text-left text-xs text-text-muted font-mono py-2 pr-4">Habit</th>
              {weekDays.map((d) => (
                <th key={d} className="text-center text-xs text-text-muted font-mono py-2 px-2">
                  {formatDate(d).split(',')[0]}
                </th>
              ))}
              <th className="text-center text-xs text-text-muted font-mono py-2 px-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {HABIT_KEYS.map((habit) => {
              const count = logs.filter((l) => l[habit]).length;
              return (
                <tr key={habit} className="border-t border-white/5">
                  <td className="text-sm font-mono py-3 pr-4">{HABIT_LABELS[habit]}</td>
                  {weekDays.map((d) => {
                    const dayLog = logs.find((l) => l.date === d);
                    const done = dayLog?.[habit] || false;
                    return (
                      <td key={d} className="text-center py-3 px-2">
                        <span
                          className={`inline-block w-6 h-6 rounded-full text-xs font-bold leading-6 ${
                            done ? 'bg-accent text-white' : 'bg-white/5 text-text-muted'
                          }`}
                        >
                          {done ? '✓' : '·'}
                        </span>
                      </td>
                    );
                  })}
                  <td className="text-center py-3 px-2">
                    <span className="font-mono text-sm font-bold text-accent">{count}/7</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Goal Progress Bars */}
      <div className="bg-bg-card rounded-2xl p-5 border border-white/5">
        <h2 className="font-heading text-lg font-semibold mb-4">Goal Progress</h2>
        <div className="space-y-5">
          {goals.map((goal) => {
            const pct = percentOf(Number(goal.current), Number(goal.target));
            const review = getReview(goal.id);
            const onTrack = review?.on_track ?? true;
            return (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-body">{goal.title}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono px-3 py-1 rounded-full ${
                      onTrack ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {onTrack ? 'On Track' : 'Off Track'}
                    </span>
                    <span className="font-mono text-sm text-text-muted">
                      {Number(goal.current)}/{Number(goal.target)} {goal.metric}
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full progress-fill"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => saveReview(goal.id, !onTrack, review?.corrective_action || '')}
                    className={`text-xs px-3 py-1.5 rounded-full font-mono transition-all ${
                      onTrack ? 'bg-white/5 text-text-muted hover:bg-red-500/10 hover:text-red-400' : 'bg-white/5 text-text-muted hover:bg-green-500/10 hover:text-green-400'
                    }`}
                  >
                    Mark {onTrack ? 'Off' : 'On'} Track
                  </button>
                  <input
                    type="text"
                    defaultValue={review?.corrective_action || ''}
                    placeholder="Corrective action..."
                    onBlur={(e) => saveReview(goal.id, onTrack, e.target.value)}
                    className="flex-1 bg-bg rounded-full px-3 py-1.5 text-xs text-text placeholder-text-muted/40 outline-none border border-white/10 focus:border-accent"
                  />
                </div>
              </div>
            );
          })}
          {goals.length === 0 && (
            <p className="text-text-muted text-sm font-mono">No active goals. Add goals from the Goals page.</p>
          )}
        </div>
      </div>

      {/* Bottom Row: Pipeline, LinkedIn, Content, Product */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pipeline Snapshot */}
        <div className="bg-bg-card rounded-2xl p-5 border border-white/5">
          <h2 className="font-heading text-lg font-semibold mb-3">Pipeline Snapshot</h2>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center">
              <p className="font-mono text-2xl font-bold text-accent">{pipelineActive.length}</p>
              <p className="text-xs text-text-muted font-mono">Active</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-2xl font-bold text-text">{closedWon}</p>
              <p className="text-xs text-text-muted font-mono">Won</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-2xl font-bold text-text">{conversionRate}%</p>
              <p className="text-xs text-text-muted font-mono">Conv. Rate</p>
            </div>
          </div>
          <div className="space-y-1">
            {pipelineActive.slice(0, 3).map((deal) => (
              <div key={deal.id} className="flex justify-between text-xs font-mono py-1 border-t border-white/5">
                <span className="text-text truncate mr-2">{deal.name}</span>
                <span className="text-text-muted">{STAGE_LABELS[deal.stage]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* LinkedIn Delta */}
        <div className="bg-bg-card rounded-2xl p-5 border border-white/5">
          <h2 className="font-heading text-lg font-semibold mb-3">LinkedIn This Week</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className={`font-mono text-2xl font-bold ${linkedinDelta.followers >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {linkedinDelta.followers >= 0 ? '+' : ''}{formatNumber(linkedinDelta.followers)}
              </p>
              <p className="text-xs text-text-muted font-mono">Followers</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-2xl font-bold text-accent">{formatNumber(linkedinDelta.impressions)}</p>
              <p className="text-xs text-text-muted font-mono">Impressions</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-2xl font-bold text-text">{linkedinDelta.dms}</p>
              <p className="text-xs text-text-muted font-mono">DMs Sent</p>
            </div>
          </div>
        </div>

        {/* Content Output */}
        <div className="bg-bg-card rounded-2xl p-5 border border-white/5">
          <h2 className="font-heading text-lg font-semibold mb-3">Content Output</h2>
          <div className="text-center">
            <p className="font-mono text-4xl font-bold text-accent">{contentCount}</p>
            <p className="text-sm text-text-muted font-mono mt-1">pieces published this week</p>
          </div>
        </div>

        {/* Product Delta */}
        <div className="bg-bg-card rounded-2xl p-5 border border-white/5">
          <h2 className="font-heading text-lg font-semibold mb-3">Product This Week</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className={`font-mono text-2xl font-bold ${productDelta.signups >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {productDelta.signups >= 0 ? '+' : ''}{productDelta.signups}
              </p>
              <p className="text-xs text-text-muted font-mono">Signups</p>
            </div>
            <div className="text-center">
              <p className={`font-mono text-2xl font-bold ${productDelta.mrr >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {productDelta.mrr >= 0 ? '+' : ''}${Number(productDelta.mrr).toFixed(0)}
              </p>
              <p className="text-xs text-text-muted font-mono">MRR</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
