export type PolicyStatus = "가능" | "조건부" | "확인필요" | "불가";

const CONFIG: Record<PolicyStatus, { icon: string; classes: string }> = {
  가능: { icon: "✅", classes: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800" },
  조건부: { icon: "⚠️", classes: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800" },
  확인필요: { icon: "❓", classes: "bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600" },
  불가: { icon: "❌", classes: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800" },
};

export function PolicyBadge({ status, reason }: { status: PolicyStatus; reason?: string }) {
  const cfg = CONFIG[status];
  return (
    <div className={`inline-flex flex-col gap-1 rounded-lg border px-3 py-2 ${cfg.classes}`}>
      <span className="font-semibold">
        {cfg.icon} {status}
      </span>
      {reason && <span className="text-sm">{reason}</span>}
    </div>
  );
}
