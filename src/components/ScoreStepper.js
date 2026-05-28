'use client';

export default function ScoreStepper({ value, onChange }) {
  const v = value ?? '';
  const inc = () => onChange(Math.min(20, (parseInt(v) || 0) + 1));
  const dec = () => onChange(Math.max(0, (parseInt(v) || 0) - 1));

  return (
    <div className="flex flex-col items-center">
      <button onClick={inc} className="stepper-btn rounded-t-md border-b-0">▲</button>
      <div className="stepper-value">{v === '' ? '-' : v}</div>
      <button onClick={dec} className="stepper-btn rounded-b-md border-t-0">▼</button>
    </div>
  );
}
