export default function MenuStats({ menuItems }) {
  const stats = [
    { label: "Total",       value: menuItems.length,                              color: "text-yellow-400" },
    { label: "Available",   value: menuItems.filter((i) => i.available).length,   color: "text-emerald-400" },
    { label: "Unavailable", value: menuItems.filter((i) => !i.available).length,  color: "text-red-400" },
  ];

  return (
    <div className="flex flex-wrap gap-3 mb-5">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-neutral-900 border border-neutral-800 rounded-xl px-5 py-3 min-w-[100px]"
        >
          <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
          <div className="text-xs text-neutral-600 mt-0.5">{s.label}</div>
        </div>
      ))}
    </div>
  );
}