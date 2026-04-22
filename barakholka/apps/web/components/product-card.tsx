import Image from 'next/image';
import Link from 'next/link';
import { Price } from './price';
import { HeartIcon } from './icons';
import { FavoriteButton } from './favorite-button';
import type { ProductCardData } from '@/lib/types';

export type ProductCardProps = {
  product: ProductCardData;
  isFavorite?: boolean;
  /** URL to redirect back to after toggling the favorite. If omitted, the
   *  heart is a non-interactive visual affordance (e.g. anonymous grids). */
  returnTo?: string;
};

export function ProductCard({ product, isFavorite = false, returnTo }: ProductCardProps) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl bg-white shadow-card transition hover:shadow-cardHover">
      {returnTo ? (
        <FavoriteButton productId={product.id} isFavorite={isFavorite} returnTo={returnTo} />
      ) : (
        <div
          aria-hidden
          className="pointer-events-none absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-neutral-400 backdrop-blur"
        >
          <HeartIcon size={18} />
        </div>
      )}

      <Link href={`/product/${product.id}`} className="flex flex-col">
        <div className="relative aspect-square w-full bg-neutral-100">
          {product.photo ? (
            <Image
              src={product.photo}
              alt={product.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-neutral-400">нет фото</div>
          )}
          {product.condition === 'used' && (
            <span className="absolute left-2 top-2 rounded bg-neutral-900/80 px-2 py-0.5 text-[11px] font-medium text-white">
              б/у
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1 p-3">
          <Price value={product.price_kzt} className="text-lg font-bold leading-none text-neutral-900" />
          <div className="line-clamp-2 text-sm text-neutral-700">{product.title}</div>
          {product.shop && (
            <div className="mt-1 truncate text-xs text-neutral-500">{product.shop.name}</div>
          )}
        </div>
      </Link>
    </div>
  );
}
