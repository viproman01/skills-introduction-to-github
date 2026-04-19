type IconProps = { className?: string; size?: number };

const base = (size = 20) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export function SearchIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function MenuIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function UserIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
    </svg>
  );
}

export function BoxIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3 7l9-4 9 4-9 4-9-4z" />
      <path d="M3 7v10l9 4 9-4V7" />
      <path d="M12 11v10" />
    </svg>
  );
}

export function HeartIcon({ className, size, filled }: IconProps & { filled?: boolean }) {
  return (
    <svg {...base(size)} className={className} fill={filled ? 'currentColor' : 'none'}>
      <path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" />
    </svg>
  );
}

export function CartIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.5L21 8H6" />
    </svg>
  );
}

export function MapPinIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 22s7-7.6 7-13a7 7 0 0 0-14 0c0 5.4 7 13 7 13z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

export function ChevronDownIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function CheckBadgeIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="currentColor" stroke="none">
      <path d="M12 2 9.5 4.5 6 4l-.5 3.5L2 9l1.5 3.5L2 16l3.5 1L6 20.5l3.5-.5L12 22l2.5-2 3.5.5.5-3.5L22 16l-1.5-3.5L22 9l-3.5-1.5L18 4l-3.5.5z" />
      <path d="m9 12 2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
