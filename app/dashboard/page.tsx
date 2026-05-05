export default function DashboardPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-24">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          لوحة التحكم
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          الواجهة قيد التطوير. الميزات الأولى: صندوق رسائل واتساب، استرجاع
          السلات، الذكاء الاصطناعي.
        </p>
        <div className="text-sm text-zinc-500 dark:text-zinc-500 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          إذا وصلت لهنا بعد تثبيت تطبيق سلة، فإن الربط ناجح ✓
        </div>
      </div>
    </main>
  );
}
