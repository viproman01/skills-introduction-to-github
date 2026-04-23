import { formatKzt } from '@/lib/format';

export function Price({ value, className }: { value: number; className?: string }) {
  return <span className={className}>{formatKzt(value)}</span>;
}
