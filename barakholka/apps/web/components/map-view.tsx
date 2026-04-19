'use client';

import { useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import maplibregl, { Map as MapLibreMap, LngLatBounds } from 'maplibre-gl';
import type { ShopGeo } from '@/lib/types';

const STYLE_URL =
  process.env.NEXT_PUBLIC_MAPLIBRE_STYLE ?? 'https://tiles.openfreemap.org/styles/liberty';

const DEFAULT_CENTER: [number, number] = [76.9145, 43.3450];
const DEFAULT_ZOOM = 16;

export type MapViewHandle = {
  flyToShop: (id: string) => void;
  flyToZone: (slug: string) => void;
  resetView: () => void;
};

export type MapViewProps = {
  ref?: React.Ref<MapViewHandle>;
  shops: ShopGeo[];
  selectedZoneSlug: string | null;
  selectedShopId: string | null;
  hoveredShopId: string | null;
  onZoneClick: (slug: string | null) => void;
  onShopClick: (id: string) => void;
  onShopHover: (id: string | null) => void;
  onReady?: () => void;
};

type Zone = { slug: string; name: string; centroid: [number, number] };

export function MapView({
  ref,
  shops,
  selectedZoneSlug,
  selectedShopId,
  hoveredShopId,
  onZoneClick,
  onShopClick,
  onShopHover,
  onReady,
}: MapViewProps) {
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const zonesRef = useRef<Zone[]>([]);
  const shopsRef = useRef<ShopGeo[]>(shops);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const styleReadyRef = useRef(false);

  shopsRef.current = shops;

  const flyToShop = useCallback((id: string) => {
    const map = mapRef.current;
    const shop = shopsRef.current.find((s) => s.id === id);
    if (!map || !shop) return;
    map.flyTo({ center: [shop.lon, shop.lat], zoom: Math.max(map.getZoom(), 17), duration: 600 });
  }, []);

  const flyToZone = useCallback((slug: string) => {
    const map = mapRef.current;
    const zone = zonesRef.current.find((z) => z.slug === slug);
    if (!map || !zone) return;
    map.flyTo({ center: zone.centroid, zoom: 17, duration: 600 });
  }, []);

  const resetView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, duration: 600 });
  }, []);

  useImperativeHandle(ref, () => ({ flyToShop, flyToZone, resetView }), [flyToShop, flyToZone, resetView]);

  // Mount the map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', async () => {
      // Zones
      try {
        const res = await fetch('/zones.geojson');
        const zonesGeoJSON = (await res.json()) as GeoJSON.FeatureCollection;
        zonesRef.current = (zonesGeoJSON.features as GeoJSON.Feature<GeoJSON.Polygon>[]).map((f) => {
          const coords = f.geometry.coordinates[0];
          let lon = 0, lat = 0;
          for (const [x, y] of coords.slice(0, -1)) { lon += x; lat += y; }
          const n = coords.length - 1;
          return {
            slug: String(f.properties?.slug ?? ''),
            name: String(f.properties?.name ?? ''),
            centroid: [lon / n, lat / n] as [number, number],
          };
        });

        map.addSource('zones', { type: 'geojson', data: zonesGeoJSON, promoteId: 'slug' });

        map.addLayer({
          id: 'zones-fill',
          type: 'fill',
          source: 'zones',
          paint: {
            'fill-color': '#005bff',
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'selected'], false], 0.45,
              ['boolean', ['feature-state', 'hover'], false], 0.22,
              0.10,
            ],
          },
        });

        map.addLayer({
          id: 'zones-outline',
          type: 'line',
          source: 'zones',
          paint: {
            'line-color': '#005bff',
            'line-width': [
              'case',
              ['boolean', ['feature-state', 'selected'], false], 3,
              1.4,
            ],
          },
        });

        map.addLayer({
          id: 'zones-label',
          type: 'symbol',
          source: 'zones',
          layout: {
            'text-field': ['get', 'name'],
            'text-size': 14,
            'text-font': ['Noto Sans Bold'],
            'text-allow-overlap': false,
          },
          paint: {
            'text-color': '#0044cc',
            'text-halo-color': '#ffffff',
            'text-halo-width': 1.4,
          },
        });

        let hoveredZone: string | null = null;
        map.on('mousemove', 'zones-fill', (e) => {
          const f = e.features?.[0];
          if (!f) return;
          if (hoveredZone && hoveredZone !== f.id) {
            map.setFeatureState({ source: 'zones', id: hoveredZone }, { hover: false });
          }
          hoveredZone = String(f.id);
          map.setFeatureState({ source: 'zones', id: hoveredZone }, { hover: true });
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'zones-fill', () => {
          if (hoveredZone) map.setFeatureState({ source: 'zones', id: hoveredZone }, { hover: false });
          hoveredZone = null;
          map.getCanvas().style.cursor = '';
        });
        map.on('click', 'zones-fill', (e) => {
          const f = e.features?.[0];
          if (!f) return;
          onZoneClick(String(f.id));
        });
      } catch (e) {
        console.warn('zones.geojson failed:', e);
      }

      // Shops as a circle layer
      map.addSource('shops', {
        type: 'geojson',
        data: shopsToFC(shopsRef.current),
        promoteId: 'id',
      });

      map.addLayer({
        id: 'shops-halo',
        type: 'circle',
        source: 'shops',
        paint: {
          'circle-radius': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 14,
            ['boolean', ['feature-state', 'hover'], false], 11,
            0,
          ],
          'circle-color': '#005bff',
          'circle-opacity': 0.18,
        },
      });

      map.addLayer({
        id: 'shops-circle',
        type: 'circle',
        source: 'shops',
        paint: {
          'circle-radius': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 8,
            ['boolean', ['feature-state', 'hover'], false], 7,
            5,
          ],
          'circle-color': [
            'case',
            ['get', 'verified'], '#005bff',
            '#5b8def',
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      map.on('mouseenter', 'shops-circle', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'shops-circle', () => { map.getCanvas().style.cursor = ''; onShopHover(null); });
      map.on('mousemove', 'shops-circle', (e) => {
        const f = e.features?.[0];
        if (f) onShopHover(String(f.id));
      });
      map.on('click', 'shops-circle', (e) => {
        const f = e.features?.[0];
        if (f) onShopClick(String(f.id));
      });

      // Background click clears zone selection
      map.on('click', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['shops-circle', 'zones-fill'] });
        if (features.length === 0) onZoneClick(null);
      });

      // Fit map to all shops if any exist
      if (shopsRef.current.length > 0) {
        const bounds = new LngLatBounds();
        for (const s of shopsRef.current) bounds.extend([s.lon, s.lat]);
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 60, duration: 0, maxZoom: 17 });
        }
      }

      styleReadyRef.current = true;
      onReadyRef.current?.();
    });

    return () => {
      popupRef.current?.remove();
      popupRef.current = null;
      map.remove();
      mapRef.current = null;
      styleReadyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push shop list updates into the source
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReadyRef.current) return;
    const src = map.getSource('shops') as maplibregl.GeoJSONSource | undefined;
    if (src) src.setData(shopsToFC(shops));
  }, [shops]);

  // Selected zone → feature-state + camera
  const lastZoneRef = useRef<string | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReadyRef.current) return;

    if (lastZoneRef.current && lastZoneRef.current !== selectedZoneSlug) {
      map.setFeatureState({ source: 'zones', id: lastZoneRef.current }, { selected: false });
    }
    if (selectedZoneSlug) {
      map.setFeatureState({ source: 'zones', id: selectedZoneSlug }, { selected: true });
      flyToZone(selectedZoneSlug);
    } else {
      resetView();
    }
    lastZoneRef.current = selectedZoneSlug;
  }, [selectedZoneSlug, flyToZone, resetView]);

  // Selected shop → feature-state + popup + camera
  const lastSelectedShopRef = useRef<string | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReadyRef.current) return;

    if (lastSelectedShopRef.current && lastSelectedShopRef.current !== selectedShopId) {
      map.setFeatureState({ source: 'shops', id: lastSelectedShopRef.current }, { selected: false });
    }
    popupRef.current?.remove();

    if (selectedShopId) {
      map.setFeatureState({ source: 'shops', id: selectedShopId }, { selected: true });
      const shop = shopsRef.current.find((s) => s.id === selectedShopId);
      if (shop) {
        flyToShop(shop.id);
        popupRef.current = new maplibregl.Popup({ offset: 14, closeButton: false })
          .setLngLat([shop.lon, shop.lat])
          .setHTML(
            `<div style="font-weight:600;margin-bottom:4px">${escapeHtml(shop.name)}</div>` +
              (shop.zone_name
                ? `<div style="color:#707075;font-size:12px;margin-bottom:6px">${escapeHtml(shop.zone_name)}${shop.sector_code ? ` · сектор ${escapeHtml(shop.sector_code)}` : ''}</div>`
                : '') +
              `<a href="/shop/${shop.id}" style="color:#005bff;font-weight:500;text-decoration:none">Открыть магазин →</a>`,
          )
          .addTo(map);
      }
    }
    lastSelectedShopRef.current = selectedShopId;
  }, [selectedShopId, flyToShop]);

  // Hovered shop → feature-state
  const lastHoveredShopRef = useRef<string | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReadyRef.current) return;
    if (lastHoveredShopRef.current && lastHoveredShopRef.current !== hoveredShopId) {
      map.setFeatureState({ source: 'shops', id: lastHoveredShopRef.current }, { hover: false });
    }
    if (hoveredShopId) {
      map.setFeatureState({ source: 'shops', id: hoveredShopId }, { hover: true });
    }
    lastHoveredShopRef.current = hoveredShopId;
  }, [hoveredShopId]);

  return <div ref={containerRef} className="h-full w-full" />;
}

function shopsToFC(shops: ShopGeo[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: shops.map((s) => ({
      type: 'Feature',
      id: s.id,
      properties: {
        id: s.id,
        name: s.name,
        verified: s.is_verified,
        zone_slug: s.zone_slug,
      },
      geometry: { type: 'Point', coordinates: [s.lon, s.lat] },
    })),
  };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
