type StatCardProps = {
  label: string;
  value: string;
  description: string;
};

export function StatCard({
  label,
  value,
  description,
}: StatCardProps) {
  return (
    <div className="glass rounded-2xl p-6 transition duration-300 hover:-translate-y-1 hover:border-indigo-400/20">
      <p className="text-sm text-slate-400">
        {label}
      </p>

      <div className="mt-3 flex items-end justify-between gap-4">
        <p className="font-heading text-4xl font-bold text-white">
          {value}
        </p>

        <span className="text-xs text-emerald-400">
          {description}
        </span>
      </div>
    </div>
  );
}