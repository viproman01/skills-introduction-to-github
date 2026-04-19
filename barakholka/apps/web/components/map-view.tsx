'use client';

import { useEffect, useRef } from 'react';
import maplibregl, { Map as MapLibreMap } from 'maplibre-gl';
import type { ShopGeo } from '@/lib/types';

const STYLE_URL =
  process.env.NEXT_PUBLIC_MAPLIBRE_STYLE ?? 'https://tiles.openfreemap.org/styles/liberty';

const CENTER: [number, number] = [76.9286, 43.3306];

export function MapView({ shops }: { shops: ShopGeo[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: CENTER,
      zoom: 14,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', async () => {
      try {
        const zonesRes = await fetch('/zones.geojson');
        const zones = await zonesRes.json();
        map.addSource('zones', { type: 'geojson', data: zones });
        map.addLayer({
          id: 'zones-fill',
          type: 'fill',
          source: 'zones',
          paint: { 'fill-color': '#e11d48', 'fill-opacity': 0.12 },
        });
        map.addLayer({
          id: 'zones-outline',
          type: 'line',
          source: 'zones',
          paint: { 'line-color': '#e11d48', 'line-width': 1.5 },
        });
        map.addLayer({
          id: 'zones-label',
          type: 'symbol',
          source: 'zones',
          layout: {
            'text-field': ['get', 'name'],
            'text-size': 13,
            'text-font': ['Noto Sans Regular'],
          },
          paint: { 'text-color': '#991b1b', 'text-halo-color': '#fff', 'text-halo-width': 1.2 },
        });
      } catch (e) {
        console.warn('zones.geojson failed to load', e);
      }

      for (const shop of shops) {
        const el = document.createElement('div');
        el.className =
          'flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-rose-600 text-xs font-bold text-white shadow cursor-pointer';
        el.textContent = '●';

        const popup = new maplibregl.Popup({ offset: 16 }).setHTML(
          `<div style="font-weight:600;margin-bottom:4px">${escapeHtml(shop.name)}</div>` +
            `<a href="/shop/${shop.id}" style="color:#e11d48;text-decoration:underline">открыть магазин</a>`,
        );

        new maplibregl.Marker({ element: el }).setLngLat([shop.lon, shop.lat]).setPopup(popup).addTo(map);
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [shops]);

  return <div ref={containerRef} className="h-[calc(100vh-8rem)] w-full rounded-xl border border-neutral-200" />;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
