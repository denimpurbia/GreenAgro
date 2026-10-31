import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icon issue in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface GeoMapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
  category?: 'lake' | 'fire' | 'report' | 'mandi' | 'farm';
  badge?: string;
}

interface GeoMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: GeoMapMarker[];
  height?: string;
  className?: string;
}

export const GeoMap: React.FC<GeoMapProps> = ({
  center = [24.585, 73.712], // Udaipur center
  zoom = 10,
  markers = [],
  height = '420px',
  className = '',
}) => {
  const getMarkerColor = (category?: string) => {
    switch (category) {
      case 'lake':
        return '#0284c7'; // Sky/Blue
      case 'fire':
        return '#dc2626'; // Red
      case 'report':
        return '#d97706'; // Amber
      case 'mandi':
        return '#16a34a'; // Green
      default:
        return '#2d5a3d'; // Agri dark green
    }
  };

  return (
    <div
      className={`rounded-2xl overflow-hidden border border-[#e5eae3] shadow-sm relative z-0 ${className}`}
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {markers.map((m) => (
          <CircleMarker
            key={m.id}
            center={[m.lat, m.lng]}
            radius={8}
            pathOptions={{
              color: getMarkerColor(m.category),
              fillColor: getMarkerColor(m.category),
              fillOpacity: 0.85,
              weight: 2,
            }}
          >
            <Popup>
              <div className="p-1 min-w-[140px]">
                <h4 className="font-bold text-gray-900 text-sm">{m.title}</h4>
                {m.badge && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-700">
                    {m.badge}
                  </span>
                )}
                {m.description && (
                  <p className="mt-1 text-xs text-gray-600 leading-snug">{m.description}</p>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
};

