import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1">
      <Header />
      <Hero />
      <FeatureGrid />
      <CTA />
      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="border-b border-line">
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="font-semibold text-lg tracking-tight">Anvira</span>
        </div>
        <nav className="flex items-center gap-6">
          <a href="#features" className="text-sm text-ink-muted hover:text-ink">
            الميزات
          </a>
          <Link
            href="/dashboard"
            className="text-sm bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-full transition"
          >
            افتح العرض التجريبي
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="px-6 py-24 sm:py-32 relative overflow-hidden">
      <div className="max-w-3xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-line text-sm text-ink-muted mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          متاح قريباً على متجر تطبيقات سلة
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.1] mb-6 text-ink">
          منصة التشغيل الموحّدة
          <br />
          <span className="text-accent">لتجار سلة</span>
        </h1>

        <p className="text-lg sm:text-xl text-ink-muted leading-relaxed mb-10 max-w-2xl mx-auto">
          صندوق رسائل واتساب مشترك، ذكاء اصطناعي بالخليجي، واسترجاع تلقائي
          للسلات المهجورة. كل عمليات متجرك في مكان واحد.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-accent hover:bg-accent-hover text-white font-medium transition shadow-sm"
          >
            افتح العرض التجريبي ←
          </Link>
          <a
            href="#features"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-surface hover:bg-surface-2 border border-line font-medium transition"
          >
            استكشف الميزات
          </a>
        </div>
      </div>
    </section>
  );
}

function FeatureGrid() {
  return (
    <section id="features" className="px-6 py-20 border-t border-line bg-surface-2/40">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3">
            أربعة محاور تشغّل متجرك
          </h2>
          <p className="text-ink-muted max-w-xl mx-auto">
            ما يحتاجه تاجر سلة فعلياً، بدون الحاجة لخمسة أدوات منفصلة.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Feature
            badge="01"
            title="صندوق واتساب مشترك"
            body="فريقك يرد من واجهة واحدة، توزيع تلقائي للمحادثات، وتظهر هوية كل موظف على رسائله."
          />
          <Feature
            badge="02"
            title="ذكاء اصطناعي بالخليجي"
            body="ثلاثة ردود مقترحة على كل محادثة، مدربة على لهجتك ونبرتك. صياغة لا تبدو آلية."
          />
          <Feature
            badge="03"
            title="استرجاع السلات المهجورة"
            body="رسالة واتساب آلية تذكّر العميل بسلته، تشير لمنتجاته بالاسم، وتفتح محادثة مباشرة."
          />
          <Feature
            badge="04"
            title="تكامل عميق مع سلة"
            body="بيانات الطلبات والمنتجات والعملاء داخل نفس الواجهة. لا تنقّل بين شاشات."
          />
        </div>
      </div>
    </section>
  );
}

function Feature({
  badge,
  title,
  body,
}: {
  badge: string;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-surface border border-line rounded-2xl p-7 hover:border-line-strong transition">
      <div className="flex items-baseline gap-3 mb-3">
        <span className="text-xs font-mono text-accent">{badge}</span>
        <h3 className="font-semibold text-xl">{title}</h3>
      </div>
      <p className="text-ink-muted leading-7 text-[15px]">{body}</p>
    </div>
  );
}

function CTA() {
  return (
    <section className="px-6 py-24 border-t border-line">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
          جرّب Anvira الآن
        </h2>
        <p className="text-ink-muted text-lg mb-8 leading-relaxed">
          العرض التجريبي يعمل ببيانات حقيقية ووضع AI حقيقي. لا حاجة لتسجيل،
          لا حاجة لربط متجر سلة الآن.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-accent hover:bg-accent-hover text-white font-medium transition shadow-sm"
        >
          ابدأ الجولة ←
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="px-6 py-8 border-t border-line text-sm text-ink-subtle">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Logo small />
          <span>Anvira · 2026</span>
        </div>
        <div className="flex items-center gap-6">
          <a
            href="https://salla.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ink"
          >
            متجر سلة
          </a>
          <a href="#features" className="hover:text-ink">
            الميزات
          </a>
        </div>
      </div>
    </footer>
  );
}

function Logo({ small = false }: { small?: boolean }) {
  const size = small ? 18 : 22;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="24" height="24" rx="6" fill="#c96442" />
      <path
        d="M7 17 L12 7 L17 17 M9 13 H15"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
