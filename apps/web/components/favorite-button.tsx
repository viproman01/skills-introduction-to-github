import { HeartIcon } from './icons';
import { toggleFavorite } from '@/app/favorites/actions';

/**
 * Server component that renders a POST-form heart button. Heart fills when
 * the product is in the user's favorites. Interception is handled by a
 * server action that toggles the row and redirects back.
 */
export function FavoriteButton({
  productId,
  isFavorite,
  returnTo,
}: {
  productId: string;
  isFavorite: boolean;
  returnTo: string;
}) {
  const action = toggleFavorite.bind(null, productId);
  return (
    <form action={action} className="absolute right-2 top-2 z-10">
      <input type="hidden" name="return_to" value={returnTo} />
      <button
        type="submit"
        aria-label={isFavorite ? 'Убрать из избранного' : 'В избранное'}
        className={[
          'flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur transition',
          isFavorite ? 'text-accent' : 'text-neutral-400 hover:text-accent',
        ].join(' ')}
      >
        <HeartIcon size={18} filled={isFavorite} />
      </button>
    </form>
  );
}
