export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 bg-zinc-50 dark:bg-black">
      <div className="max-w-2xl w-full space-y-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          متاح قريباً على متجر تطبيقات سلة
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Anvira
          <span className="block mt-2 text-2xl sm:text-3xl text-zinc-700 dark:text-zinc-300 font-medium">
            منصة التشغيل الموحدة لتجار سلة
          </span>
        </h1>

        <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-8">
          صندوق رسائل واتساب مشترك + ذكاء اصطناعي بالعربي + استرجاع السلات
          المهجورة. كل عمليات متجرك في مكان واحد.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8 text-right">
          <Feature
            title="صندوق رسائل واتساب موحد"
            body="فريقك يرد على عملاء سلة من واجهة واحدة، مع توزيع آلي وملاحظات داخلية."
          />
          <Feature
            title="ذكاء اصطناعي بالخليجي"
            body="ردود ذكية مدربة على لهجتك، تفهم نية العميل وتقترح ٣ ردود جاهزة."
          />
          <Feature
            title="استرجاع السلات المهجورة"
            body="رسائل واتساب آلية لاسترجاع العملاء الذين تركوا منتجات في السلة."
          />
          <Feature
            title="تكامل عميق مع سلة"
            body="بيانات الطلبات، المنتجات، والعملاء داخل نفس الواجهة. بدون تنقل."
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <a
            href="mailto:hello@anviraplus.com"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium hover:opacity-90 transition"
          >
            انضم لقائمة الانتظار
          </a>
          <a
            href="https://salla.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
          >
            متجر سلة
          </a>
        </div>
      </div>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
        {title}
      </h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-6">
        {body}
      </p>
    </div>
  );
}
