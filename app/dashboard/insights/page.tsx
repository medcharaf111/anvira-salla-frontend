"use client";

import { useEffect, useState } from "react";
import {
  api,
  type AgentPerformance,
  type SentimentReport,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function InsightsPage() {
  const { merchantId } = useAuth();
  const [sentiment, setSentiment] = useState<SentimentReport | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [questionsSource, setQuestionsSource] = useState<"gemini" | "fallback" | null>(
    null
  );
  const [agents, setAgents] = useState<AgentPerformance[]>([]);
  const [hours, setHours] = useState<number[]>([]);
  const [loading, setLoading] = useState({ sentiment: true, questions: true, agents: true, hours: true });

  useEffect(() => {
    if (!merchantId) return;
    api.insightsSentiment().then((r) => { setSentiment(r); setLoading((l) => ({ ...l, sentiment: false })); }).catch(console.error);
    api.insightsTopQuestions().then((r) => { setQuestions(r.questions); setQuestionsSource(r.source); setLoading((l) => ({ ...l, questions: false })); }).catch(console.error);
    api.insightsAgents().then((r) => { setAgents(r.agents); setLoading((l) => ({ ...l, agents: false })); }).catch(console.error);
    api.insightsPeakHours().then((r) => { setHours(r.buckets); setLoading((l) => ({ ...l, hours: false })); }).catch(console.error);
  }, [merchantId]);

  return (
    <div className="px-10 py-12 max-w-6xl">
      <header className="mb-8">
        <p className="text-sm text-ink-subtle mb-1">تحليلات الذكاء الاصطناعي</p>
        <h1 className="text-3xl font-semibold tracking-tight">Insights</h1>
        <p className="text-ink-muted mt-2 text-[15px]">
          تحليل تلقائي للمحادثات: المشاعر، الأسئلة الأكثر تكراراً، وأداء الفريق.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <Card title="مشاعر العملاء" badge={sentiment?.source === "gemini" ? "Gemini" : sentiment ? "قالب" : ""}>
          {loading.sentiment ? (
            <Loading />
          ) : sentiment ? (
            <SentimentChart counts={sentiment.counts} />
          ) : null}
        </Card>

        <Card title="أكثر ٥ مواضيع تكرراً" badge={questionsSource === "gemini" ? "Gemini" : questionsSource === "fallback" ? "قالب" : ""}>
          {loading.questions ? (
            <Loading />
          ) : (
            <ol className="space-y-2 text-[14px] text-ink leading-7">
              {questions.map((q, i) => (
                <li key={i} className="flex items-baseline gap-3">
                  <span className="text-accent font-mono text-xs">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{q}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <Card title="أداء الفريق" className="mb-5">
        {loading.agents ? (
          <Loading />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-ink-subtle">
                <tr>
                  <th className="text-right py-2 font-medium text-xs uppercase tracking-wider">الموظف</th>
                  <th className="text-right py-2 font-medium text-xs uppercase tracking-wider">الدور</th>
                  <th className="text-right py-2 font-medium text-xs uppercase tracking-wider">رسائل مرسلة</th>
                  <th className="text-right py-2 font-medium text-xs uppercase tracking-wider">بمساعدة AI</th>
                  <th className="text-right py-2 font-medium text-xs uppercase tracking-wider">نسبة استخدام AI</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => {
                  const pct = a.messagesSent === 0 ? 0 : Math.round((a.aiAssisted / a.messagesSent) * 100);
                  return (
                    <tr key={a.userId} className="border-t border-line/60">
                      <td className="py-3 font-medium">{a.name}</td>
                      <td className="py-3 text-ink-muted">{a.role === "owner" ? "مالك" : "موظف"}</td>
                      <td className="py-3">{a.messagesSent}</td>
                      <td className="py-3">{a.aiAssisted}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden max-w-[140px]">
                            <div
                              className="h-full bg-accent transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-ink-subtle">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="ذروة الرسائل خلال اليوم (آخر ٧ أيام)">
        {loading.hours ? <Loading /> : <Heatmap buckets={hours} />}
      </Card>
    </div>
  );
}

function Card({
  title,
  badge,
  children,
  className = "",
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-surface rounded-2xl border border-line p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold tracking-tight">{title}</h3>
        {badge && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-soft text-accent-ink">
            ✨ {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-8 text-ink-subtle text-sm">
      جاري التحليل...
    </div>
  );
}

function SentimentChart({
  counts,
}: {
  counts: { positive: number; neutral: number; negative: number };
}) {
  const total = counts.positive + counts.neutral + counts.negative;
  if (total === 0)
    return <div className="text-ink-subtle text-sm">لا توجد بيانات بعد</div>;
  const segments = [
    { label: "إيجابي", value: counts.positive, color: "bg-success", text: "text-success" },
    { label: "محايد", value: counts.neutral, color: "bg-info", text: "text-info" },
    { label: "سلبي", value: counts.negative, color: "bg-danger", text: "text-danger" },
  ];
  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden mb-4">
        {segments.map((s, i) => (
          <div
            key={i}
            className={s.color}
            style={{ width: `${(s.value / total) * 100}%` }}
            title={`${s.label}: ${s.value}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {segments.map((s, i) => (
          <div key={i} className="text-center">
            <div className={`text-2xl font-semibold ${s.text}`}>{s.value}</div>
            <div className="text-xs text-ink-subtle mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Heatmap({ buckets }: { buckets: number[] }) {
  const max = Math.max(...buckets, 1);
  return (
    <div>
      <div className="grid grid-cols-12 gap-1 mb-2">
        {buckets.map((v, i) => {
          const intensity = v / max;
          return (
            <div
              key={i}
              className="aspect-square rounded-md border border-line/60 flex items-end justify-center text-[9px] text-ink-subtle"
              style={{
                background: intensity > 0
                  ? `rgba(110, 26, 194, ${0.15 + intensity * 0.65})`
                  : "transparent",
              }}
              title={`${i}:00 — ${v} رسالة`}
            >
              <span className={`pb-0.5 ${intensity > 0.45 ? "text-white" : ""}`}>
                {i.toString().padStart(2, "0")}
              </span>
            </div>
          );
        })}
      </div>
      <div className="text-xs text-ink-subtle">
        الأرقام: ساعة من اليوم. أغمق = رسائل أكثر.
      </div>
    </div>
  );
}
