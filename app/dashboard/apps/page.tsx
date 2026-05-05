"use client";

const APPS: {
  name: string;
  category: "ai" | "automation" | "messaging" | "data" | "ecom";
  description: string;
  status: "installed" | "available" | "coming_soon";
  icon: string;
}[] = [
  {
    name: "Salla",
    category: "ecom",
    description: "ربط مباشر مع متجرك على سلة. تجلب الطلبات والمنتجات والعملاء.",
    status: "installed",
    icon: "🛒",
  },
  {
    name: "WhatsApp Cloud API",
    category: "messaging",
    description: "صندوق رسائل واتساب مشترك للفريق مع توزيع آلي.",
    status: "installed",
    icon: "💬",
  },
  {
    name: "Google Gemini",
    category: "ai",
    description: "ذكاء اصطناعي يقترح ردود الواتساب ويصيغ رسائل استرجاع السلات.",
    status: "installed",
    icon: "✨",
  },
  {
    name: "Google Calendar",
    category: "automation",
    description: "حجز المواعيد تلقائياً من المحادثات.",
    status: "available",
    icon: "📅",
  },
  {
    name: "Zapier",
    category: "automation",
    description: "ربط Anvira بأكثر من ٥٠٠٠ تطبيق آخر.",
    status: "available",
    icon: "⚡",
  },
  {
    name: "Make.com",
    category: "automation",
    description: "بناء أتمتات بصرية متقدمة بين Anvira وأي خدمة خارجية.",
    status: "available",
    icon: "🔧",
  },
  {
    name: "n8n",
    category: "automation",
    description: "أتمتات مفتوحة المصدر تستضيفها بنفسك.",
    status: "available",
    icon: "🔁",
  },
  {
    name: "Slack",
    category: "messaging",
    description: "تنبيهات Anvira تصل لقنوات Slack الخاصة بفريقك.",
    status: "available",
    icon: "💼",
  },
  {
    name: "Google Sheets",
    category: "data",
    description: "تصدير المحادثات والطلبات لجداول Sheets للتحليل.",
    status: "available",
    icon: "📊",
  },
  {
    name: "Notion",
    category: "data",
    description: "حفظ ملاحظات العملاء والـ playbooks في Notion.",
    status: "available",
    icon: "📓",
  },
  {
    name: "Twilio",
    category: "messaging",
    description: "بديل لـ WhatsApp Cloud API لإرسال الرسائل.",
    status: "available",
    icon: "📞",
  },
  {
    name: "Mailchimp",
    category: "messaging",
    description: "حملات بريد إلكتروني مدمجة مع شرائح Anvira.",
    status: "coming_soon",
    icon: "📧",
  },
  {
    name: "Mada Pay",
    category: "ecom",
    description: "روابط دفع مباشرة من المحادثة.",
    status: "coming_soon",
    icon: "💳",
  },
  {
    name: "Telegram",
    category: "messaging",
    description: "إضافة قناة تيليجرام للصندوق المشترك.",
    status: "coming_soon",
    icon: "✈️",
  },
];

const CATEGORY_LABEL: Record<string, string> = {
  ai: "ذكاء اصطناعي",
  automation: "أتمتة",
  messaging: "مراسلة",
  data: "بيانات",
  ecom: "تجارة",
};

export default function AppsPage() {
  return (
    <div className="px-10 py-12 max-w-6xl">
      <header className="mb-8">
        <p className="text-sm text-ink-subtle mb-1">App Center</p>
        <h1 className="text-3xl font-semibold tracking-tight">متجر التطبيقات</h1>
        <p className="text-ink-muted mt-2 text-[15px]">
          ربط Anvira بالأدوات التي يستخدمها فريقك. {APPS.filter((a) => a.status === "installed").length} مثبّتة من {APPS.length} متاحة.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {APPS.map((app) => (
          <div
            key={app.name}
            className="bg-surface border border-line rounded-2xl p-5 hover:border-line-strong transition flex flex-col"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="text-3xl">{app.icon}</div>
              <StatusBadge status={app.status} />
            </div>
            <div className="font-semibold mb-1">{app.name}</div>
            <div className="text-[11px] text-ink-subtle mb-2">
              {CATEGORY_LABEL[app.category]}
            </div>
            <p className="text-sm text-ink-muted leading-7 flex-1">{app.description}</p>
            <button
              disabled={app.status !== "available"}
              className={`mt-4 px-3 py-1.5 rounded-lg text-sm transition ${
                app.status === "installed"
                  ? "bg-success-soft text-success cursor-default"
                  : app.status === "available"
                    ? "bg-accent text-white hover:bg-accent-hover"
                    : "bg-surface-3 text-ink-subtle cursor-not-allowed"
              }`}
            >
              {app.status === "installed"
                ? "✓ مثبّت"
                : app.status === "available"
                  ? "تثبيت"
                  : "قريباً"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "installed" | "available" | "coming_soon" }) {
  if (status === "installed")
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-success-soft text-success">
        مثبّت
      </span>
    );
  if (status === "coming_soon")
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-3 text-ink-subtle">
        قريباً
      </span>
    );
  return null;
}
