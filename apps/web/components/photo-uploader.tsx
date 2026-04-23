'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import { getSupabaseBrowser } from '@/lib/supabase/client';

export type PhotoUploaderProps = {
  bucket: 'shop-photos' | 'product-photos';
  name: string; // form field name; we submit a newline-separated URL list
  initialUrls?: string[];
  max?: number;
};

/**
 * Upload one or more images to Supabase Storage and track the resulting
 * public URLs in a hidden <input> so the enclosing form's server action
 * receives them the same way it used to receive a textarea of URLs.
 *
 * RLS policies (migration 0002_storage.sql) permit any authenticated user
 * to insert into the bucket; updates/deletes are owner-scoped via
 * storage.objects.owner.
 */
export function PhotoUploader({ bucket, name, initialUrls = [], max = 8 }: PhotoUploaderProps) {
  const [urls, setUrls] = useState<string[]>(initialUrls);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setBusy(true);
      setErr(null);
      const supabase = getSupabaseBrowser();
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? 'anon';

      const results: string[] = [];
      for (const file of Array.from(files).slice(0, max - urls.length)) {
        const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
        const path = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from(bucket).upload(path, file, {
          cacheControl: '31536000',
          upsert: false,
          contentType: file.type || undefined,
        });
        if (error) {
          setErr(error.message);
          break;
        }
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        results.push(data.publicUrl);
      }

      if (results.length > 0) setUrls((prev) => [...prev, ...results]);
      setBusy(false);
    },
    [bucket, max, urls.length],
  );

  const remove = useCallback((url: string) => {
    setUrls((prev) => prev.filter((u) => u !== url));
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={name} value={urls.join('\n')} />

      {urls.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {urls.map((u) => (
            <div key={u} className="relative aspect-square overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
              <Image src={u} alt="" fill className="object-cover" sizes="96px" />
              <button
                type="button"
                onClick={() => remove(u)}
                aria-label="Удалить"
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-xs text-neutral-700 shadow hover:text-red-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {urls.length < max && (
        <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 bg-white px-4 py-6 text-sm text-neutral-600 transition hover:border-brand hover:text-brand">
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={busy}
            className="sr-only"
            onChange={(e) => {
              onUpload(e.target.files);
              e.target.value = '';
            }}
          />
          {busy ? 'Загружаем…' : `📎 Выбрать фото (${urls.length}/${max})`}
        </label>
      )}

      {err && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700">
          Не удалось загрузить: {err}. Пока можно вставить URL вручную через текстовое поле.
        </div>
      )}
    </div>
  );
}
