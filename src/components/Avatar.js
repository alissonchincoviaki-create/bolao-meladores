'use client';

const COLORS = ['#2563EB','#16A34A','#DC2626','#9333EA','#EA580C','#0891B2','#DB2777'];

export default function Avatar({ name, size = 44, url = null }) {
  if (url) {
    return (
      <div style={{ width: size, height: size }} className="rounded-full overflow-hidden flex-shrink-0 border-2 border-dark-200">
        <img src={url} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }

  const idx = name ? name.charCodeAt(0) % COLORS.length : 0;
  const bg = COLORS[idx];
  const initials = name ? name.substring(0, 2).toUpperCase() : '??';

  return (
    <div
      style={{
        width: size, height: size,
        background: `linear-gradient(135deg, ${bg}, ${bg}cc)`,
        fontSize: size * 0.38,
        border: `2px solid ${bg}44`,
        boxShadow: `0 2px 8px ${bg}33`,
      }}
      className="rounded-full flex-shrink-0 flex items-center justify-center text-white font-extrabold tracking-tight"
    >
      {initials}
    </div>
  );
}
