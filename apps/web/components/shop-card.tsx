import Image from 'next/image';
import Link from 'next/link';
import { CheckBadgeIcon } from './icons';
import type { ShopSummary } from '@/lib/types';

export function ShopCard({ shop }: { shop: ShopSummary }) {
  const cover = shop.photos[0] ?? null;
  const location = shop.sector
    ? `${shop.sector.zone.name} · сектор ${shop.sector.code}${shop.sector.floor > 1 ? `, ${shop.sector.floor} эт.` : ''}`
    : 'Локация уточняется';

  return (
    <Link
      href={`/shop/${shop.id}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-card transition hover:shadow-cardHover"
    >
      <div className="relative aspect-[4/3] w-full bg-neutral-100">
        {cover ? (
          <Image src={cover} alt={shop.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-400">нет фото</div>
        )}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-neutral-900 group-hover:text-brand">{shop.name}</span>
          {shop.is_verified && (
            <CheckBadgeIcon className="text-brand" size={16} />
          )}
        </div>
        <div className="text-sm text-neutral-600">{location}</div>
        {(shop.row_number || shop.place_number) && (
          <div className="text-xs text-neutral-500">
            {shop.row_number && <>ряд {shop.row_number}</>} {shop.place_number && <>· место {shop.place_number}</>}
          </div>
        )}
      </div>
    </Link>
  );
}
