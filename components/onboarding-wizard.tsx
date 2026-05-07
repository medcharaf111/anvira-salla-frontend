"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";

const STORAGE_KEY = "anvira:onboarded";

export function OnboardingWizard() {
  const { currentUser, merchantId } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!merchantId) return;
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) setOpen(true);
  }, [merchantId]);

  function close(skipped = false) {
    setOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, skipped ? "skipped" : "done");
    }
  }

  if (!open || !currentUser) return null;

  return (
    <div className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
      <div className="bg-surface rounded-3xl border border-line max-w-lg w-full shadow-xl">
        <div className="p-8">
          <div className="flex items-center gap-2 mb-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition ${
                  i <= step ? "bg-accent" : "bg-surface-3"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-ink-subtle mt-2 mb-6">الخطوة {step + 1} من 3</p>

          {step === 0 && (
            <div>
              <div className="text-4xl mb-4">👋</div>
              <h2 className="text-2xl font-semibold tracking-tight mb-2">
                أهلاً، {currentUser.name.split(" ")[0]}
              </h2>
              <p className="text-ink-muted leading-7 mb-6 text-[15px]">
                Anvira تجمع كل عمليات متجرك في مكان واحد: واتساب مشترك، ذكاء اصطناعي يقترح ردود، استرجاع سلات تلقائي، ومهام للفريق.
                <br /><br />
                هذي جولة سريعة بـ ٣ خطوات لتعرف وين تبدأ.
              </p>
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="text-4xl mb-4">💬</div>
              <h2 className="text-2xl font-semibold tracking-tight mb-2">ابدأ من الإنبوكس</h2>
              <p className="text-ink-muted leading-7 mb-6 text-[15px]">
                هناك ٥ محادثات تجريبية محملة. افتح أي واحدة، واضغط <span className="text-accent font-medium">✨ اقتراح ردود</span> لتشاهد Gemini يقترح ٣ ردود خليجية مبنية على تاريخ المحادثة.
              </p>
              <div className="bg-accent-soft/40 border border-accent/15 rounded-xl p-4 text-sm leading-7">
                <span className="font-medium text-accent-ink">جربها بنفسك: </span>
                اضغط على الإنبوكس من القائمة الجانبية بعد الانتهاء من الجولة.
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="text-4xl mb-4">🚀</div>
              <h2 className="text-2xl font-semibold tracking-tight mb-2">جاهز للانطلاق</h2>
              <p className="text-ink-muted leading-7 mb-4 text-[15px]">
                الميزات الأخرى اللي تستحق التجربة:
              </p>
              <ul className="space-y-2.5 text-sm leading-7">
                <li className="flex items-start gap-2">
                  <span className="text-accent">›</span>
                  <span><strong>السلات المهجورة</strong> — انقر "صياغة وإرسال" → AI يكتب رسالة استرجاع مخصصة</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">›</span>
                  <span><strong>محرر الأتمتات</strong> — drag-and-drop لبناء أتمتاتك</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">›</span>
                  <span><strong>قاعدة المعرفة</strong> — أضف الأسئلة المتكررة ليتعلم منها الـ AI</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">›</span>
                  <span><strong>تحليلات AI</strong> — مزاج العملاء، أكثر الأسئلة تكراراً، أداء الفريق</span>
                </li>
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => close(true)}
              className="text-xs text-ink-muted hover:text-ink"
            >
              تخطّي الجولة
            </button>
            <div className="flex gap-2">
              {step > 0 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="px-4 py-2 rounded-lg bg-surface-2 text-sm hover:bg-surface-3"
                >
                  السابق
                </button>
              )}
              {step < 2 ? (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  className="px-4 py-2 rounded-lg bg-accent text-white text-sm hover:bg-accent-hover"
                >
                  التالي
                </button>
              ) : (
                <Link
                  href="/dashboard/inbox"
                  onClick={() => close()}
                  className="px-4 py-2 rounded-lg bg-accent text-white text-sm hover:bg-accent-hover"
                >
                  ابدأ من الإنبوكس
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
