'use client';

import Link from 'next/link';
import Image from 'next/image';
import { CheckBadgeIcon } from './icons';
import type { ShopGeo } from '@/lib/types';

export type ShopListProps = {
  shops: ShopGeo[];
  selectedShopId: string | null;
  onShopHover: (id: string | null) => void;
  onShopClick: (id: string) => void;
};

export function ShopList({ shops, selectedShopId, onShopHover, onShopClick }: ShopListProps) {
  if (shops.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-neutral-500">
        В выбранной области нет магазинов.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-neutral-100">
      {shops.map((shop) => {
        const selected = shop.id === selectedShopId;
        return (
          <li
            key={shop.id}
            onMouseEnter={() => onShopHover(shop.id)}
            onMouseLeave={() => onShopHover(null)}
            onClick={() => onShopClick(shop.id)}
            className={[
              'group flex cursor-pointer items-stretch gap-3 px-3 py-3 transition',
              selected ? 'bg-brand-soft' : 'hover:bg-neutral-50',
            ].join(' ')}
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-neutral-100">
              {shop.photo ? (
                <Image src={shop.photo} alt={shop.name} fill className="object-cover" sizes="64px" />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] text-neutral-400">нет фото</div>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-medium text-neutral-900">{shop.name}</span>
                {shop.is_verified && <CheckBadgeIcon className="shrink-0 text-brand" size={14} />}
              </div>
              {shop.zone_name && (
                <div className="truncate text-xs text-neutral-500">
                  {shop.zone_name}
                  {shop.sector_code && <> · сектор {shop.sector_code}</>}
                </div>
              )}
              <Link
                href={`/shop/${shop.id}`}
                onClick={(e) => e.stopPropagation()}
                className="mt-1 self-start text-xs font-medium text-brand hover:underline"
              >
                открыть →
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
