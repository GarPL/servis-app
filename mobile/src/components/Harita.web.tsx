import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { HaritaNoktasi, HaritaProps } from '../canliKonum';

const ISTANBUL: [number, number] = [41.02, 29.05];

const servisSimgesi = L.divIcon({
  html: '<div style="font-size: 28px; line-height: 32px;">🚌</div>',
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function Odakla({ noktalar }: { noktalar: HaritaNoktasi[] }) {
  const harita = useMap();
  const sayi = noktalar.length;

  useEffect(() => {
    if (sayi === 1) {
      harita.setView([noktalar[0].lat, noktalar[0].lng], 14);
    } else if (sayi > 1) {
      harita.fitBounds(
        noktalar.map((n) => [n.lat, n.lng] as [number, number]),
        { padding: [40, 40] }
      );
    }
  }, [sayi, harita]);

  return null;
}

export default function Harita({ noktalar, yukseklik }: HaritaProps) {
  return (
    <MapContainer
      center={ISTANBUL}
      zoom={11}
      style={{ height: yukseklik, width: '100%', borderRadius: 12 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {noktalar.map((nokta) => (
        <Marker key={nokta.id} position={[nokta.lat, nokta.lng]} icon={servisSimgesi}>
          <Tooltip direction="top" offset={[0, -14]} permanent>
            {nokta.etiket}
          </Tooltip>
        </Marker>
      ))}
      <Odakla noktalar={noktalar} />
    </MapContainer>
  );
}
