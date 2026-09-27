import 'leaflet/dist/leaflet.css';
import type { LatLng, Map as LeafletMap, Marker } from 'leaflet';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

type Props = {
    center: [number, number] | null;
    latitude: string;
    longitude: string;
    onChange: (latitude: number, longitude: number) => void;
};

export function AddressMap({ center, latitude, longitude, onChange }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<LeafletMap | null>(null);
    const markerRef = useRef<Marker | null>(null);
    const placeRef = useRef<((point: LatLng) => void) | null>(null);
    const onChangeRef = useRef(onChange);
    const centerRef = useRef(center);
    const coordinatesRef = useRef([latitude, longitude]);
    onChangeRef.current = onChange;
    centerRef.current = center;
    coordinatesRef.current = [latitude, longitude];

    useEffect(() => {
        let mounted = true;
        let resizeTimer: ReturnType<typeof setTimeout> | undefined;

        void import('leaflet').then((leaflet) => {
            if (!mounted || !containerRef.current) return;

            const currentLatitude = Number(coordinatesRef.current[0]);
            const currentLongitude = Number(coordinatesRef.current[1]);
            const saved =
                coordinatesRef.current[0] !== '' &&
                coordinatesRef.current[1] !== '' &&
                Number.isFinite(currentLatitude) &&
                Number.isFinite(currentLongitude)
                    ? ([currentLatitude, currentLongitude] as [number, number])
                    : null;
            const map = leaflet
                .map(containerRef.current)
                .setView(
                    saved ?? centerRef.current ?? [-2.5, 118],
                    saved || centerRef.current ? 13 : 5,
                );
            mapRef.current = map;
            leaflet
                .tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution:
                        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                    maxZoom: 19,
                })
                .addTo(map);

            const icon = leaflet.divIcon({
                className: '',
                html: '<span style="display:block;width:22px;height:22px;border:3px solid white;border-radius:50%;background:#124979;box-shadow:0 2px 8px #345"></span>',
                iconSize: [22, 22],
                iconAnchor: [11, 11],
            });
            const place = (point: LatLng) => {
                if (!markerRef.current) {
                    markerRef.current = leaflet
                        .marker(point, {
                            draggable: true,
                            icon,
                            title: 'Titik alamat pengiriman',
                        })
                        .addTo(map);
                    markerRef.current.on('dragend', () => {
                        const position = markerRef.current?.getLatLng();
                        if (position)
                            onChangeRef.current(position.lat, position.lng);
                    });
                } else {
                    markerRef.current.setLatLng(point);
                }
                onChangeRef.current(point.lat, point.lng);
            };
            placeRef.current = place;
            map.on('click', (event) => place(event.latlng));
            if (saved) place(leaflet.latLng(saved));
            resizeTimer = setTimeout(() => map.invalidateSize(), 150);
        });

        return () => {
            mounted = false;
            clearTimeout(resizeTimer);
            mapRef.current?.remove();
            mapRef.current = null;
            markerRef.current = null;
            placeRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (center && mapRef.current) mapRef.current.setView(center, 13);
    }, [center]);

    useEffect(() => {
        if (latitude && longitude && markerRef.current) {
            markerRef.current.setLatLng([Number(latitude), Number(longitude)]);
        }
    }, [latitude, longitude]);

    return (
        <div className="space-y-2">
            <div
                ref={containerRef}
                aria-label="Peta penentuan alamat"
                className="z-0 h-64 w-full rounded-lg border sm:h-72"
            />
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                    const point = mapRef.current?.getCenter();
                    if (point) placeRef.current?.(point);
                }}
            >
                Gunakan titik tengah peta
            </Button>
        </div>
    );
}
