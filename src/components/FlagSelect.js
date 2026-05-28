'use client';
import { getFlag, FLAGS } from '@/lib/scoring';

const allCountries = Object.keys(FLAGS);

export default function FlagSelect({ label, value, onChange, options = null }) {
  const opts = options || allCountries;

  return (
    <div className="mb-2.5">
      <label className="block text-xs font-semibold text-dark-700 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        {value && <span className="text-2xl">{getFlag(value)}</span>}
        <select
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          className="input-field py-2.5 text-sm flex-1"
        >
          <option value="">Selecionar...</option>
          {opts.map(t => (
            <option key={t} value={t}>{getFlag(t)} {t}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
