export function RatingStars({ value, size = 14 }: { value: number; size?: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const stars: ('full' | 'half' | 'empty')[] = [];
  for (let i = 0; i < 5; i++) {
    stars.push(i < full ? 'full' : i === full && half ? 'half' : 'empty');
  }
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} из 5`}>
      {stars.map((k, i) => (
        <Star key={i} kind={k} size={size} />
      ))}
    </span>
  );
}

function Star({ kind, size }: { kind: 'full' | 'half' | 'empty'; size: number }) {
  const fill = kind === 'full' ? '#f59e0b' : kind === 'half' ? 'url(#half)' : 'transparent';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="#f59e0b" strokeWidth={1.5}>
      <defs>
        <linearGradient id="half">
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <path d="M12 2l2.9 6.9L22 10l-5.3 4.6L18.2 22 12 18.3 5.8 22l1.5-7.4L2 10l7.1-1.1z" />
    </svg>
  );
}
