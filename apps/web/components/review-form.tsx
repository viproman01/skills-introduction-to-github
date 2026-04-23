'use client';

import { useState } from 'react';

export function ReviewForm({
  action,
  initialRating = 0,
  initialText = '',
}: {
  action: (formData: FormData) => void | Promise<void>;
  initialRating?: number;
  initialText?: string;
}) {
  const [rating, setRating] = useState(initialRating);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium">Ваша оценка:</span>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setRating(n)}
              className="transition"
              aria-label={`${n} из 5`}
            >
              <svg
                width={22}
                height={22}
                viewBox="0 0 24 24"
                fill={n <= rating ? '#f59e0b' : 'transparent'}
                stroke="#f59e0b"
                strokeWidth={1.5}
              >
                <path d="M12 2l2.9 6.9L22 10l-5.3 4.6L18.2 22 12 18.3 5.8 22l1.5-7.4L2 10l7.1-1.1z" />
              </svg>
            </button>
          ))}
        </div>
      </div>
      <input type="hidden" name="rating" value={rating} />

      <textarea
        name="text"
        defaultValue={initialText}
        rows={3}
        maxLength={2000}
        placeholder="Что понравилось, что нет? (необязательно)"
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand"
      />

      <button
        type="submit"
        disabled={rating === 0}
        className="self-start rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-fg hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        Отправить отзыв
      </button>
    </form>
  );
}
