import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus,
  Edit2,
  MapPin,
  Layers,
  Check,
  X,
  Sprout,
  Loader2,
  Satellite,
  Map as MapIcon,
  ExternalLink,
  Trash2,
  Pentagon,
  RotateCcw,
  Search,
  Sparkles,
  MousePointerClick,
} from 'lucide-react';

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  Polyline,
  useMap,
  useMapEvents,
} from 'react-leaflet';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useApp } from '../context/AppContext';

/* =========================================================
   TYPES
========================================================= */

type BoundaryPoint = {
  lat: number;
  lng: number;
};

type FarmWithBoundary = {
  id?: string;
  name?: string;
  locationName?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  areaAcres?: number;
  primaryCrop?: string;
  soilType?: string;
  irrigationMethod?: string;
  boundary?: BoundaryPoint[];
};

type LocationSuggestion = {
  id: string;
  name: string;
  subtitle: string;
  fullLabel: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
  placeType: string;
};

/* =========================================================
   CURATED RAJASTHAN & INDIA AGRICULTURAL VILLAGES / TEHSILS
   Instant 0ms suggestions + merged with live OpenStreetMap /
   Open-Meteo / Photon geocoding APIs for every village in India
========================================================= */

const LOCAL_VILLAGE_DIRECTORY: LocationSuggestion[] = [
  { id: 'v-bargaon', name: 'Bargaon (Badgaon)', subtitle: 'Badgaon Tehsil, Udaipur, Rajasthan', fullLabel: 'Bargaon, Udaipur, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.6336, lng: 73.6814, placeType: 'Village / Tehsil' },
  { id: 'v-girwa', name: 'Girwa', subtitle: 'Girwa Tehsil, Udaipur, Rajasthan', fullLabel: 'Girwa, Udaipur, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.5521, lng: 73.7328, placeType: 'Tehsil' },
  { id: 'v-gogunda', name: 'Gogunda', subtitle: 'Gogunda Tehsil, Udaipur, Rajasthan', fullLabel: 'Gogunda, Udaipur, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.7568, lng: 73.5307, placeType: 'Village / Tehsil' },
  { id: 'v-mavli', name: 'Mavli', subtitle: 'Mavli Tehsil, Udaipur, Rajasthan', fullLabel: 'Mavli, Udaipur, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.7833, lng: 73.9833, placeType: 'Town / Tehsil' },
  { id: 'v-vallabhnagar', name: 'Vallabhnagar', subtitle: 'Vallabhnagar Tehsil, Udaipur, Rajasthan', fullLabel: 'Vallabhnagar, Udaipur, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.6775, lng: 74.0003, placeType: 'Town / Tehsil' },
  { id: 'v-dabok', name: 'Dabok', subtitle: 'Mavli, Udaipur, Rajasthan', fullLabel: 'Dabok, Udaipur, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.6214, lng: 73.8617, placeType: 'Village' },
  { id: 'v-fatehnagar', name: 'Fatehnagar', subtitle: 'Mavli Tehsil, Udaipur, Rajasthan', fullLabel: 'Fatehnagar, Udaipur, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.8350, lng: 74.0933, placeType: 'Agricultural Town' },
  { id: 'v-bhinder', name: 'Bhinder', subtitle: 'Bhinder Tehsil, Udaipur, Rajasthan', fullLabel: 'Bhinder, Udaipur, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.5042, lng: 74.1758, placeType: 'Town / Tehsil' },
  { id: 'v-kanore', name: 'Kanore (Kanod)', subtitle: 'Kanore Tehsil, Udaipur, Rajasthan', fullLabel: 'Kanore, Udaipur, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.4422, lng: 74.2636, placeType: 'Town / Tehsil' },
  { id: 'v-jhadol', name: 'Jhadol (Phalasia)', subtitle: 'Jhadol Tehsil, Udaipur, Rajasthan', fullLabel: 'Jhadol, Udaipur, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.4039, lng: 73.4750, placeType: 'Village / Tehsil' },
  { id: 'v-kotra', name: 'Kotra', subtitle: 'Kotra Tehsil, Udaipur, Rajasthan', fullLabel: 'Kotra, Udaipur, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.3578, lng: 73.1994, placeType: 'Village / Tehsil' },
  { id: 'v-salumbar', name: 'Salumbar', subtitle: 'Salumbar District, Rajasthan', fullLabel: 'Salumbar, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.1342, lng: 74.0442, placeType: 'District / Town' },
  { id: 'v-kherwara', name: 'Kherwara', subtitle: 'Kherwara Tehsil, Udaipur, Rajasthan', fullLabel: 'Kherwara, Udaipur, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 23.9850, lng: 73.5950, placeType: 'Town / Tehsil' },
  { id: 'v-rishabhdeo', name: 'Rishabhdeo (Kesariyaji)', subtitle: 'Rishabhdeo Tehsil, Udaipur, Rajasthan', fullLabel: 'Rishabhdeo, Udaipur, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.0842, lng: 73.6869, placeType: 'Town / Tehsil' },
  { id: 'v-sarada', name: 'Sarada', subtitle: 'Sarada Tehsil, Salumbar, Rajasthan', fullLabel: 'Sarada, Salumbar, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.1567, lng: 73.8314, placeType: 'Village / Tehsil' },
  { id: 'v-lasadiya', name: 'Lasadiya', subtitle: 'Lasadiya Tehsil, Salumbar, Rajasthan', fullLabel: 'Lasadiya, Salumbar, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.2297, lng: 74.2528, placeType: 'Village / Tehsil' },
  { id: 'v-sisarma', name: 'Sisarma', subtitle: 'Girwa, Udaipur, Rajasthan', fullLabel: 'Sisarma, Udaipur, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.5586, lng: 73.6431, placeType: 'Village' },
  { id: 'v-nai', name: 'Nai Village', subtitle: 'Girwa, Udaipur, Rajasthan', fullLabel: 'Nai, Udaipur, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.5275, lng: 73.6311, placeType: 'Village' },
  { id: 'v-bujhda', name: 'Bujhda', subtitle: 'Girwa, Udaipur, Rajasthan', fullLabel: 'Bujhda, Udaipur, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.5678, lng: 73.6194, placeType: 'Village' },
  { id: 'v-thur', name: 'Thur (Thoor)', subtitle: 'Badgaon, Udaipur, Rajasthan', fullLabel: 'Thur, Badgaon, Udaipur, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.6611, lng: 73.6633, placeType: 'Village' },
  { id: 'v-madar', name: 'Madar', subtitle: 'Badgaon, Udaipur, Rajasthan', fullLabel: 'Madar, Badgaon, Udaipur, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.6789, lng: 73.6419, placeType: 'Village' },
  { id: 'v-loyra', name: 'Loyra', subtitle: 'Badgaon, Udaipur, Rajasthan', fullLabel: 'Loyra, Badgaon, Udaipur, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.6494, lng: 73.6692, placeType: 'Village' },
  { id: 'v-eklingji', name: 'Kailashpuri (Eklingji)', subtitle: 'Badgaon, Udaipur, Rajasthan', fullLabel: 'Eklingji, Udaipur, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.7456, lng: 73.7231, placeType: 'Village' },
  { id: 'v-delwara', name: 'Delwara', subtitle: 'Rajsamand / Udaipur Border, Rajasthan', fullLabel: 'Delwara, Rajsamand, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.7828, lng: 73.7458, placeType: 'Village' },
  { id: 'v-savina', name: 'Savina', subtitle: 'Girwa, Udaipur, Rajasthan', fullLabel: 'Savina, Udaipur, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.5492, lng: 73.7128, placeType: 'Locality' },
  { id: 'v-titardi', name: 'Titardi', subtitle: 'Girwa, Udaipur, Rajasthan', fullLabel: 'Titardi, Udaipur, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.5356, lng: 73.7289, placeType: 'Village' },
  { id: 'v-debari', name: 'Debari', subtitle: 'Girwa, Udaipur, Rajasthan', fullLabel: 'Debari, Udaipur, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.6075, lng: 73.8161, placeType: 'Village' },
  { id: 'v-sukher', name: 'Sukher', subtitle: 'Badgaon, Udaipur, Rajasthan', fullLabel: 'Sukher, Udaipur, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.6361, lng: 73.7139, placeType: 'Locality' },
  { id: 'v-bedla', name: 'Bedla', subtitle: 'Badgaon, Udaipur, Rajasthan', fullLabel: 'Bedla, Udaipur, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.6394, lng: 73.6969, placeType: 'Village' },
  { id: 'v-kurabad', name: 'Kurabad', subtitle: 'Kurabad Tehsil, Udaipur, Rajasthan', fullLabel: 'Kurabad, Udaipur, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.4608, lng: 73.9639, placeType: 'Village / Tehsil' },
  { id: 'v-udaipur', name: 'Udaipur', subtitle: 'Udaipur District, Rajasthan', fullLabel: 'Udaipur, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.5854, lng: 73.7125, placeType: 'District' },
  { id: 'v-nathdwara', name: 'Nathdwara', subtitle: 'Rajsamand District, Rajasthan', fullLabel: 'Nathdwara, Rajsamand, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.9297, lng: 73.8222, placeType: 'Town / Tehsil' },
  { id: 'v-rajsamand', name: 'Rajsamand', subtitle: 'Rajsamand District, Rajasthan', fullLabel: 'Rajsamand, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 25.0683, lng: 73.8831, placeType: 'District' },
  { id: 'v-kumbhalgarh', name: 'Kumbhalgarh (Kelwara)', subtitle: 'Rajsamand District, Rajasthan', fullLabel: 'Kumbhalgarh, Rajsamand, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 25.1478, lng: 73.5833, placeType: 'Village / Tehsil' },
  { id: 'v-haldighati', name: 'Haldighati (Khamnor)', subtitle: 'Khamnor, Rajsamand, Rajasthan', fullLabel: 'Haldighati, Khamnor, Rajsamand, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.8964, lng: 73.7097, placeType: 'Village' },
  { id: 'v-railmagra', name: 'Railmagra', subtitle: 'Rajsamand District, Rajasthan', fullLabel: 'Railmagra, Rajsamand, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 25.0269, lng: 74.1153, placeType: 'Village / Tehsil' },
  { id: 'v-amet', name: 'Amet', subtitle: 'Rajsamand District, Rajasthan', fullLabel: 'Amet, Rajsamand, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 25.3056, lng: 73.9286, placeType: 'Town / Tehsil' },
  { id: 'v-chittorgarh', name: 'Chittorgarh', subtitle: 'Chittorgarh District, Rajasthan', fullLabel: 'Chittorgarh, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.8887, lng: 74.6269, placeType: 'District' },
  { id: 'v-kapasan', name: 'Kapasan', subtitle: 'Chittorgarh District, Rajasthan', fullLabel: 'Kapasan, Chittorgarh, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.8906, lng: 74.3164, placeType: 'Town / Tehsil' },
  { id: 'v-nimbahera', name: 'Nimbahera', subtitle: 'Chittorgarh District, Rajasthan', fullLabel: 'Nimbahera, Chittorgarh, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.6228, lng: 74.6844, placeType: 'Town / Tehsil' },
  { id: 'v-bari-sadri', name: 'Bari Sadri', subtitle: 'Chittorgarh District, Rajasthan', fullLabel: 'Bari Sadri, Chittorgarh, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.4150, lng: 74.4750, placeType: 'Town / Tehsil' },
  { id: 'v-dungla', name: 'Dungla', subtitle: 'Chittorgarh District, Rajasthan', fullLabel: 'Dungla, Chittorgarh, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.5067, lng: 74.3778, placeType: 'Village / Tehsil' },
  { id: 'v-pratapgarh', name: 'Pratapgarh', subtitle: 'Pratapgarh District, Rajasthan', fullLabel: 'Pratapgarh, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.0319, lng: 74.7789, placeType: 'District' },
  { id: 'v-chhoti-sadri', name: 'Chhoti Sadri', subtitle: 'Pratapgarh District, Rajasthan', fullLabel: 'Chhoti Sadri, Pratapgarh, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.3831, lng: 74.7031, placeType: 'Town / Tehsil' },
  { id: 'v-dungarpur', name: 'Dungarpur', subtitle: 'Dungarpur District, Rajasthan', fullLabel: 'Dungarpur, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 23.8419, lng: 73.7147, placeType: 'District' },
  { id: 'v-sagwara', name: 'Sagwara', subtitle: 'Dungarpur District, Rajasthan', fullLabel: 'Sagwara, Dungarpur, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 23.6761, lng: 74.0228, placeType: 'Town / Tehsil' },
  { id: 'v-banswara', name: 'Banswara', subtitle: 'Banswara District, Rajasthan', fullLabel: 'Banswara, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 23.5461, lng: 74.4350, placeType: 'District' },
  { id: 'v-bhilwara', name: 'Bhilwara', subtitle: 'Bhilwara District, Rajasthan', fullLabel: 'Bhilwara, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 25.3407, lng: 74.6313, placeType: 'District' },
  { id: 'v-mandalgarh', name: 'Mandalgarh', subtitle: 'Bhilwara District, Rajasthan', fullLabel: 'Mandalgarh, Bhilwara, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 25.2000, lng: 75.1000, placeType: 'Town / Tehsil' },
  { id: 'v-sirohi', name: 'Sirohi', subtitle: 'Sirohi District, Rajasthan', fullLabel: 'Sirohi, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.8850, lng: 72.8589, placeType: 'District' },
  { id: 'v-pindwara', name: 'Pindwara', subtitle: 'Sirohi District, Rajasthan', fullLabel: 'Pindwara, Sirohi, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 24.7944, lng: 73.0550, placeType: 'Town / Tehsil' },
  { id: 'v-pali', name: 'Pali', subtitle: 'Pali District, Rajasthan', fullLabel: 'Pali, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 25.7711, lng: 73.3234, placeType: 'District' },
  { id: 'v-sumerpur', name: 'Sumerpur', subtitle: 'Pali District, Rajasthan', fullLabel: 'Sumerpur, Pali, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 25.1500, lng: 73.0833, placeType: 'Agricultural Mandi' },
  { id: 'v-kota', name: 'Kota', subtitle: 'Kota District, Rajasthan', fullLabel: 'Kota, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 25.2138, lng: 75.8648, placeType: 'District' },
  { id: 'v-bundi', name: 'Bundi', subtitle: 'Bundi District, Rajasthan', fullLabel: 'Bundi, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 25.4381, lng: 75.6377, placeType: 'District' },
  { id: 'v-ajmer', name: 'Ajmer', subtitle: 'Ajmer District, Rajasthan', fullLabel: 'Ajmer, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 26.4499, lng: 74.6399, placeType: 'District' },
  { id: 'v-jaipur', name: 'Jaipur', subtitle: 'Jaipur District, Rajasthan', fullLabel: 'Jaipur, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 26.9124, lng: 75.7873, placeType: 'District' },
  { id: 'v-jodhpur', name: 'Jodhpur', subtitle: 'Jodhpur District, Rajasthan', fullLabel: 'Jodhpur, Rajasthan, India', state: 'Rajasthan', country: 'India', lat: 26.2389, lng: 73.0243, placeType: 'District' },
];

/* =========================================================
   LEAFLET ICON FIX & CUSTOM NUMBERED POINT MARKERS
========================================================= */

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createCornerIcon = (index: number) =>
  L.divIcon({
    className: 'custom-farm-corner-pin',
    html: `<div style="
      width: 24px;
      height: 24px;
      border-radius: 9999px;
      background: #15803d;
      border: 2.5px solid #ffffff;
      color: #ffffff;
      font-weight: 800;
      font-size: 11px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.45);
      cursor: pointer;
    ">${index + 1}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

/* =========================================================
   AREA & CENTROID CALCULATIONS
========================================================= */

const calculatePolygonAreaAcres = (
  points: BoundaryPoint[]
): number => {
  if (points.length < 3) return 0;

  const earthRadiusMeters = 6378137;

  const lat0 =
    (points.reduce((sum, point) => sum + point.lat, 0) /
      points.length) *
    (Math.PI / 180);

  const projected = points.map((point) => {
    const lat = point.lat * (Math.PI / 180);
    const lng = point.lng * (Math.PI / 180);

    return {
      x: earthRadiusMeters * lng * Math.cos(lat0),
      y: earthRadiusMeters * lat,
    };
  });

  let area = 0;

  for (let i = 0; i < projected.length; i++) {
    const j = (i + 1) % projected.length;

    area +=
      projected[i].x * projected[j].y -
      projected[j].x * projected[i].y;
  }

  const areaSqMeters = Math.abs(area) / 2;
  const acres = areaSqMeters / 4046.8564224;

  return Number(acres.toFixed(2));
};

const calculatePolygonCentroid = (
  points: BoundaryPoint[],
  fallbackLat = 24.5854,
  fallbackLng = 73.7125
): { lat: number; lng: number } => {
  if (!points || points.length === 0) {
    return { lat: fallbackLat, lng: fallbackLng };
  }

  const sum = points.reduce(
    (acc, pt) => ({
      lat: acc.lat + pt.lat,
      lng: acc.lng + pt.lng,
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: Number((sum.lat / points.length).toFixed(6)),
    lng: Number((sum.lng / points.length).toFixed(6)),
  };
};

/* =========================================================
   LIVE VILLAGE / LOCATION GEOCODING ENGINE
   Combines Curated Local Index + Open-Meteo Village Search
   + Photon OSM + Nominatim OSM for Google-Maps-like search
========================================================= */

async function searchLocationsLive(query: string): Promise<LocationSuggestion[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return LOCAL_VILLAGE_DIRECTORY.slice(0, 8);
  }

  const lower = cleanQuery.toLowerCase();

  // 1. Instant local matches
  const localMatches = LOCAL_VILLAGE_DIRECTORY.filter(
    (item) =>
      item.name.toLowerCase().includes(lower) ||
      item.subtitle.toLowerCase().includes(lower) ||
      item.fullLabel.toLowerCase().includes(lower)
  ).slice(0, 6);

  if (cleanQuery.length < 2) {
    return localMatches.length > 0
      ? localMatches
      : LOCAL_VILLAGE_DIRECTORY.slice(0, 6);
  }

  // 2. Parallel live geocoding requests (Open-Meteo Village Geocoder + Nominatim India)
  const openMeteoPromise = fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      cleanQuery
    )}&count=10&language=en&format=json`
  )
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);

  const nominatimPromise = fetch(
    `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=in&limit=6&q=${encodeURIComponent(
      cleanQuery
    )}`,
    {
      headers: {
        Accept: 'application/json',
      },
    }
  )
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);

  const [openMeteoData, nominatimData] = await Promise.all([
    openMeteoPromise,
    nominatimPromise,
  ]);

  const combined: LocationSuggestion[] = [...localMatches];
  const seenCoords = new Set<string>(
    localMatches.map((m) => `${m.lat.toFixed(2)},${m.lng.toFixed(2)}`)
  );

  // Process Open-Meteo results (prioritizing India and Rajasthan)
  if (openMeteoData && Array.isArray(openMeteoData.results)) {
    const sortedResults = [...openMeteoData.results].sort((a: any, b: any) => {
      const aIn = a.country_code === 'IN' ? 1 : 0;
      const bIn = b.country_code === 'IN' ? 1 : 0;
      if (aIn !== bIn) return bIn - aIn;
      const aRaj = String(a.admin1 || '').toLowerCase().includes('rajasthan') ? 1 : 0;
      const bRaj = String(b.admin1 || '').toLowerCase().includes('rajasthan') ? 1 : 0;
      return bRaj - aRaj;
    });

    for (const item of sortedResults) {
      const lat = Number(item.latitude);
      const lng = Number(item.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

      const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
      if (seenCoords.has(key)) continue;
      seenCoords.add(key);

      const parts = [
        item.admin3,
        item.admin2,
        item.admin1,
        item.country || 'India',
      ].filter(Boolean);

      const subtitle = parts.join(', ');
      const fullLabel = [item.name, item.admin2, item.admin1, item.country || 'India']
        .filter(Boolean)
        .join(', ');

      combined.push({
        id: `om-${item.id || `${lat}-${lng}`}`,
        name: item.name,
        subtitle: subtitle || 'India',
        fullLabel,
        state: item.admin1 || 'Rajasthan',
        country: item.country || 'India',
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        placeType:
          item.feature_code === 'PPL' || item.feature_code === 'PPLA3'
            ? 'Village'
            : item.feature_code === 'PPLA2'
              ? 'Tehsil / Town'
              : 'Location',
      });
    }
  }

  // Process Nominatim results
  if (Array.isArray(nominatimData)) {
    for (const item of nominatimData) {
      const lat = Number(item.lat);
      const lng = Number(item.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

      const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
      if (seenCoords.has(key)) continue;
      seenCoords.add(key);

      const addr = item.address || {};
      const primaryName =
        addr.village ||
        addr.town ||
        addr.suburb ||
        addr.hamlet ||
        addr.county ||
        addr.city ||
        (item.display_name ? item.display_name.split(',')[0] : cleanQuery);

      const district = addr.state_district || addr.county || addr.city || '';
      const state = addr.state || 'Rajasthan';
      const country = addr.country || 'India';

      const subtitleParts = [
        addr.subdistrict || addr.municipality || '',
        district,
        state,
        country,
      ].filter(Boolean);

      combined.push({
        id: `nom-${item.place_id || `${lat}-${lng}`}`,
        name: primaryName,
        subtitle: subtitleParts.join(', '),
        fullLabel: [primaryName, district, state, country]
          .filter(Boolean)
          .join(', '),
        state,
        country,
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        placeType: addr.village || addr.hamlet ? 'Village' : 'Locality',
      });
    }
  }

  return combined.slice(0, 8);
}

/* =========================================================
   MAP CONTROLLERS
========================================================= */

const MapFlyToController: React.FC<{
  latitude: number;
  longitude: number;
  zoom?: number;
  flyTrigger: number;
}> = ({ latitude, longitude, zoom = 17, flyTrigger }) => {
  const map = useMap();

  useEffect(() => {
    // Ensure map container dimensions are fresh (especially inside modals)
    const timer = setTimeout(() => {
      map.invalidateSize();
      if (Number.isFinite(latitude) && Number.isFinite(longitude) && latitude !== 0 && longitude !== 0) {
        map.flyTo([latitude, longitude], zoom, {
          animate: true,
          duration: 1.1,
        });
      }
    }, 80);

    return () => clearTimeout(timer);
  }, [latitude, longitude, zoom, flyTrigger, map]);

  return null;
};

const BoundaryDrawingLayer: React.FC<{
  drawing: boolean;
  onAddPoint: (point: BoundaryPoint) => void;
}> = ({ drawing, onAddPoint }) => {
  useMapEvents({
    click(event) {
      if (!drawing) return;

      onAddPoint({
        lat: Number(event.latlng.lat.toFixed(7)),
        lng: Number(event.latlng.lng.toFixed(7)),
      });
    },
  });

  return null;
};

/* =========================================================
   REUSABLE LOCATION AUTOCOMPLETE COMPONENT
   Google-Maps-style search with instant suggestions
========================================================= */

const VillageAutocompleteSearch: React.FC<{
  value: string;
  onChangeText: (text: string) => void;
  onSelectLocation: (loc: LocationSuggestion) => void;
  placeholder?: string;
  compact?: boolean;
}> = ({
  value,
  onChangeText,
  onSelectLocation,
  placeholder = 'Search your village, tehsil, or district (e.g. Bargaon, Gogunda, Mavli...)',
  compact = false,
}) => {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let active = true;
    setIsSearching(true);

    const timer = setTimeout(async () => {
      const results = await searchLocationsLive(value);
      if (active) {
        setSuggestions(results);
        setIsSearching(false);
      }
    }, 180);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && suggestions.length > 0 && isOpen) {
      e.preventDefault();
      const top = suggestions[0];
      onSelectLocation(top);
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search
          className={`absolute left-3.5 text-[#156637] pointer-events-none ${
            compact ? 'w-4 h-4' : 'w-4 h-4'
          }`}
        />
        <input
          type="text"
          value={value}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            onChangeText(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full bg-white border-2 border-emerald-600/30 focus:border-[#156637] rounded-xl pl-10 pr-9 ${
            compact ? 'py-2 text-xs' : 'py-2.5 text-xs sm:text-sm'
          } text-gray-900 font-medium shadow-sm focus:outline-none transition-all`}
        />
        {isSearching ? (
          <Loader2 className="w-4 h-4 text-emerald-700 animate-spin absolute right-3" />
        ) : value ? (
          <button
            type="button"
            onClick={() => {
              onChangeText('');
              setIsOpen(true);
            }}
            className="absolute right-2.5 p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
            title="Clear location search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-[2000] bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-64 overflow-y-auto divide-y divide-gray-100">
          <div className="px-3 py-1.5 bg-[#f4f8f4] text-[10px] font-bold uppercase tracking-wider text-[#156637] flex items-center justify-between">
            <span>Select Village / Location to Fly on Map</span>
            <span>Google Maps Style Search</span>
          </div>
          {suggestions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectLocation(item);
                setIsOpen(false);
              }}
              className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50/80 transition-colors flex items-start justify-between gap-2 cursor-pointer group"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-100/80 text-[#156637] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#156637] group-hover:text-white transition-colors">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                    {item.name}
                  </div>
                  <div className="text-[11px] text-gray-500 truncate">
                    {item.subtitle}
                  </div>
                </div>
              </div>
              <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 group-hover:bg-emerald-100 group-hover:text-emerald-800">
                {item.placeType}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* =========================================================
   MAIN PAGE
========================================================= */

export const MyFarmPage: React.FC = () => {
  const { t, farm, createFarm, updateFarmData } = useApp();

  const currentFarm = farm as FarmWithBoundary | null;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Main map state
  const [isSatellite, setIsSatellite] = useState(true);
  const [isDrawingBoundary, setIsDrawingBoundary] = useState(false);
  const [boundaryPoints, setBoundaryPoints] = useState<BoundaryPoint[]>([]);
  const [isSavingBoundary, setIsSavingBoundary] = useState(false);
  const [mainMapCenter, setMainMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 24.5854,
    lng: 73.7125,
  });
  const [mainMapFlyTrigger, setMainMapFlyTrigger] = useState(0);
  const [mainMapSearchText, setMainMapSearchText] = useState('');

  // Modal map & boundary state
  const [modalMapCenter, setModalMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 24.5854,
    lng: 73.7125,
  });
  const [modalFlyTrigger, setModalFlyTrigger] = useState(0);
  const [modalBoundaryPoints, setModalBoundaryPoints] = useState<BoundaryPoint[]>([]);
  const [modalIsSatellite, setModalIsSatellite] = useState(true);

  const initialFormState = {
    name: '',
    locationName: '',
    state: 'Rajasthan',
    country: 'India',
    primaryCrop: 'Wheat',
    soilType: 'Loamy',
    irrigationMethod: 'Drip',
  };

  const [formData, setFormData] = useState(initialFormState);

  /* =========================================================
     LOAD SAVED BOUNDARY & CENTER
  ========================================================= */

  useEffect(() => {
    if (!currentFarm) {
      setBoundaryPoints([]);
      return;
    }

    if (currentFarm.latitude && currentFarm.longitude) {
      setMainMapCenter({
        lat: currentFarm.latitude,
        lng: currentFarm.longitude,
      });
      setMainMapSearchText(currentFarm.locationName || '');
    }

    const serverBoundary = Array.isArray(currentFarm.boundary)
      ? currentFarm.boundary
      : [];

    if (serverBoundary.length >= 3) {
      setBoundaryPoints(serverBoundary);
      return;
    }

    try {
      const localData = localStorage.getItem('agrin_farm_boundary');
      if (localData) {
        const parsed = JSON.parse(localData);
        if (Array.isArray(parsed) && parsed.length >= 3) {
          setBoundaryPoints(parsed);
        }
      }
    } catch {
      setBoundaryPoints([]);
    }
  }, [currentFarm]);

  /* =========================================================
     CALCULATED AREAS (AUTO FROM BOUNDARY POINTS)
  ========================================================= */

  const calculatedBoundaryArea = useMemo(() => {
    return calculatePolygonAreaAcres(boundaryPoints);
  }, [boundaryPoints]);

  const modalCalculatedArea = useMemo(() => {
    return calculatePolygonAreaAcres(modalBoundaryPoints);
  }, [modalBoundaryPoints]);

  const modalCalculatedHectares = useMemo(() => {
    return Number((modalCalculatedArea * 0.404686).toFixed(2));
  }, [modalCalculatedArea]);

  const modalCalculatedBigha = useMemo(() => {
    return Number((modalCalculatedArea * 1.6).toFixed(2));
  }, [modalCalculatedArea]);

  /* =========================================================
     OPEN CREATE / EDIT MODAL
  ========================================================= */

  const handleOpenCreate = () => {
    setIsCreating(true);
    setFormData({
      name: '',
      locationName: '',
      state: 'Rajasthan',
      country: 'India',
      primaryCrop: 'Wheat',
      soilType: 'Loamy',
      irrigationMethod: 'Drip',
    });
    setModalBoundaryPoints([]);
    setModalMapCenter({
      lat: currentFarm?.latitude || 24.5854,
      lng: currentFarm?.longitude || 73.7125,
    });
    setModalFlyTrigger((prev) => prev + 1);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = () => {
    if (!currentFarm) {
      handleOpenCreate();
      return;
    }

    setIsCreating(false);
    setFormData({
      name: currentFarm.name || '',
      locationName: currentFarm.locationName || '',
      state: currentFarm.state || 'Rajasthan',
      country: currentFarm.country || 'India',
      primaryCrop: currentFarm.primaryCrop || 'Wheat',
      soilType: currentFarm.soilType || 'Loamy',
      irrigationMethod: currentFarm.irrigationMethod || 'Drip',
    });

    const existingPoints =
      Array.isArray(currentFarm.boundary) && currentFarm.boundary.length >= 3
        ? currentFarm.boundary
        : boundaryPoints;

    setModalBoundaryPoints(existingPoints);

    const center =
      existingPoints.length >= 3
        ? calculatePolygonCentroid(
            existingPoints,
            currentFarm.latitude || 24.5854,
            currentFarm.longitude || 73.7125
          )
        : {
            lat: currentFarm.latitude || 24.5854,
            lng: currentFarm.longitude || 73.7125,
          };

    setModalMapCenter(center);
    setModalFlyTrigger((prev) => prev + 1);
    setFormError(null);
    setIsModalOpen(true);
  };

  /* =========================================================
     SELECT LOCATION IN MODAL -> FLY TO VILLAGE ON SATELLITE MAP
  ========================================================= */

  const handleSelectModalLocation = (loc: LocationSuggestion) => {
    setFormData((prev) => ({
      ...prev,
      locationName: loc.fullLabel,
      state: loc.state || 'Rajasthan',
      country: loc.country || 'India',
      name:
        !prev.name || prev.name.startsWith('GreenAgro Farm')
          ? `GreenAgro Farm (${loc.name})`
          : prev.name,
    }));

    // Fly interactive map directly to the chosen village
    setModalMapCenter({ lat: loc.lat, lng: loc.lng });
    setModalFlyTrigger((prev) => prev + 1);
    // Reset boundary points if switching to a new village so farmer can click their farm corners there
    setModalBoundaryPoints([]);
    setFormError(null);
  };

  /* =========================================================
     SELECT LOCATION ON MAIN PAGE MAP -> FLY TO VILLAGE
  ========================================================= */

  const handleSelectMainMapLocation = (loc: LocationSuggestion) => {
    setMainMapSearchText(loc.fullLabel);
    setMainMapCenter({ lat: loc.lat, lng: loc.lng });
    setMainMapFlyTrigger((prev) => prev + 1);
    setIsDrawingBoundary(true);
    setBoundaryPoints([]);
  };

  /* =========================================================
     CREATE / UPDATE FARM SUBMIT
     - Coordinates derived automatically from drawn farm polygon centroid
     - Area (Acres) derived automatically from drawn farm polygon
  ========================================================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setFormError('Please enter your Farm Name.');
      return;
    }

    if (!formData.locationName.trim()) {
      setFormError('Please search and select your Village / Location.');
      return;
    }

    if (modalBoundaryPoints.length < 3) {
      setFormError(
        'Please mark at least 3 corner points of your farm on the Satellite Map below so your exact farm boundary and area (in Acres) can be calculated automatically.'
      );
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const autoAreaAcres = calculatePolygonAreaAcres(modalBoundaryPoints);
      const centroid = calculatePolygonCentroid(
        modalBoundaryPoints,
        modalMapCenter.lat,
        modalMapCenter.lng
      );

      const payload: any = {
        name: formData.name.trim(),
        locationName: formData.locationName.trim(),
        state: formData.state || 'Rajasthan',
        country: formData.country || 'India',
        latitude: centroid.lat,
        longitude: centroid.lng,
        areaAcres: autoAreaAcres,
        primaryCrop: formData.primaryCrop.trim() || 'Wheat',
        soilType: formData.soilType,
        irrigationMethod: formData.irrigationMethod,
        boundary: modalBoundaryPoints,
      };

      if (isCreating || !currentFarm) {
        const result = await createFarm(payload);
        if (!result.success) {
          setFormError(result.message || 'Failed to create farm.');
          setIsSubmitting(false);
          return;
        }
      } else {
        await updateFarmData(payload);
      }

      setBoundaryPoints(modalBoundaryPoints);
      setMainMapCenter({ lat: centroid.lat, lng: centroid.lng });
      setMainMapFlyTrigger((prev) => prev + 1);

      localStorage.setItem(
        'agrin_farm_boundary',
        JSON.stringify(modalBoundaryPoints)
      );

      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save farm plot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* =========================================================
     MAIN MAP BOUNDARY DRAWING ACTIONS
  ========================================================= */

  const startDrawingBoundary = () => {
    setFormError(null);
    setBoundaryPoints([]);
    setIsDrawingBoundary(true);
  };

  const undoLastPoint = () => {
    setBoundaryPoints((prev) => prev.slice(0, -1));
  };

  const clearBoundary = () => {
    setBoundaryPoints([]);
  };

  const saveBoundary = async () => {
    if (boundaryPoints.length < 3) {
      setFormError(
        'Please click at least 3 corner points on the map to create your farm boundary.'
      );
      return;
    }

    if (!currentFarm) return;

    setIsSavingBoundary(true);
    setFormError(null);

    try {
      const calculatedArea = calculatePolygonAreaAcres(boundaryPoints);
      const centroid = calculatePolygonCentroid(
        boundaryPoints,
        mainMapCenter.lat,
        mainMapCenter.lng
      );

      await updateFarmData({
        latitude: centroid.lat,
        longitude: centroid.lng,
        locationName: mainMapSearchText.trim() || currentFarm.locationName,
        boundary: boundaryPoints,
        areaAcres: calculatedArea,
      } as any);

      localStorage.setItem(
        'agrin_farm_boundary',
        JSON.stringify(boundaryPoints)
      );

      setIsDrawingBoundary(false);
      setMainMapCenter(centroid);
      setMainMapFlyTrigger((prev) => prev + 1);
    } catch (error: any) {
      setFormError(error?.message || 'Unable to save farm boundary.');
    } finally {
      setIsSavingBoundary(false);
    }
  };

  const removeBoundary = async () => {
    if (!currentFarm) return;

    const confirmed = window.confirm('Remove the saved farm boundary?');
    if (!confirmed) return;

    setIsSavingBoundary(true);

    try {
      await updateFarmData({
        boundary: [],
        areaAcres: 0,
      } as any);

      setBoundaryPoints([]);
      localStorage.removeItem('agrin_farm_boundary');
      setIsDrawingBoundary(false);
    } catch (error: any) {
      setFormError(error?.message || 'Unable to remove boundary.');
    } finally {
      setIsSavingBoundary(false);
    }
  };

  const googleMapsUrl =
    currentFarm?.latitude && currentFarm?.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${currentFarm.latitude},${currentFarm.longitude}`
      : '';

  const displayAreaAcres =
    calculatedBoundaryArea > 0
      ? calculatedBoundaryArea
      : currentFarm?.areaAcres || 0;

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f291e]">
            {t('farm.title')}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Search your village, fly to your field on satellite map, and click points to map your farm boundary
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#156637] hover:bg-[#104e2a] text-white font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create / Map New Farm</span>
          </button>

          {currentFarm && (
            <button
              onClick={handleOpenEdit}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-[#f2f6f2] text-[#156637] border border-emerald-200 font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
            >
              <Edit2 className="w-4 h-4" />
              <span>{t('farm.edit')}</span>
            </button>
          )}
        </div>
      </div>

      {/* =====================================================
          EMPTY STATE
      ===================================================== */}
      {!currentFarm && (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#e8ece8] shadow-card text-center flex flex-col items-center justify-center space-y-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-[#f2f6f2] border border-agri-200/60 flex items-center justify-center text-agri-700 shadow-inner">
            <Sprout className="w-8 h-8 sm:w-10 sm:h-10 text-[#156637]" />
          </div>

          <div className="max-w-md space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Map your farm by searching your village
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              Type your village name (like Google Maps), fly directly to your field on satellite view, and click the corners of your farm to automatically calculate your area in Acres.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#156637] hover:bg-[#104e2a] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Farm on Satellite Map</span>
          </button>
        </div>
      )}

      {/* =====================================================
          FARM CARD & INTERACTIVE SATELLITE MAP
      ===================================================== */}
      {currentFarm && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#e8ece8] shadow-card space-y-6">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-gray-100 gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900">
                  {currentFarm.name}
                </h2>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                  Active Satellite Plot
                </span>
              </div>

              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-agri-700 shrink-0" />
                <span>
                  {currentFarm.locationName || 'Location not specified'}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenEdit}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#156637] hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                <Pentagon className="w-3.5 h-3.5" />
                <span>Search Village & Redraw Plot</span>
              </button>
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
            <div className="bg-[#f8faf7] p-3 sm:p-4 rounded-2xl border border-agri-100/80">
              <span className="text-[11px] sm:text-xs text-gray-500 font-medium block">
                {t('farm.totalArea')} (Auto-Calculated)
              </span>
              <span className="text-sm sm:text-lg font-extrabold text-[#156637] mt-0.5 sm:mt-1 block truncate">
                {displayAreaAcres > 0
                  ? `${displayAreaAcres} acres`
                  : 'Draw plot on map'}
              </span>
            </div>

            <div className="bg-[#f8faf7] p-3 sm:p-4 rounded-2xl border border-agri-100/80">
              <span className="text-[11px] sm:text-xs text-gray-500 font-medium block">
                {t('farm.primaryCrop')}
              </span>
              <span className="text-sm sm:text-lg font-extrabold text-gray-900 mt-0.5 sm:mt-1 block truncate">
                {currentFarm.primaryCrop || 'Not specified'}
              </span>
            </div>

            <div className="bg-[#f8faf7] p-3 sm:p-4 rounded-2xl border border-agri-100/80">
              <span className="text-[11px] sm:text-xs text-gray-500 font-medium block">
                {t('farm.soilType')}
              </span>
              <span className="text-sm sm:text-lg font-extrabold text-gray-900 mt-0.5 sm:mt-1 block truncate">
                {currentFarm.soilType || 'Not specified'}
              </span>
            </div>

            <div className="bg-[#f8faf7] p-3 sm:p-4 rounded-2xl border border-agri-100/80">
              <span className="text-[11px] sm:text-xs text-gray-500 font-medium block">
                {t('farm.irrigation')}
              </span>
              <span className="text-sm sm:text-lg font-extrabold text-gray-900 mt-0.5 sm:mt-1 block truncate">
                {currentFarm.irrigationMethod || 'Not specified'}
              </span>
            </div>
          </div>

          {/* =================================================
              QUICK VILLAGE SEARCH + SATELLITE FIELD MAP
          ================================================= */}
          <div className="pt-2 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-agri-700" />
                <h3 className="font-bold text-sm sm:text-base text-gray-900">
                  {t('farm.fieldLocation')} & Boundary Points
                </h3>
              </div>

              <div className="w-full lg:w-[420px]">
                <VillageAutocompleteSearch
                  value={mainMapSearchText}
                  onChangeText={setMainMapSearchText}
                  onSelectLocation={handleSelectMainMapLocation}
                  placeholder="Search village to jump on map (e.g. Bargaon, Gogunda, Mavli...)"
                  compact
                />
              </div>
            </div>

            {/* MAP */}
            <div className="relative isolate z-0 w-full h-[440px] sm:h-[520px] rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
              <MapContainer
                center={[mainMapCenter.lat, mainMapCenter.lng]}
                zoom={17}
                scrollWheelZoom={true}
                className="absolute inset-0 w-full h-full z-0 cursor-crosshair"
              >
                {isSatellite ? (
                  <>
                    <TileLayer
                      attribution="Tiles &copy; Esri"
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                      maxZoom={19}
                    />
                    <TileLayer
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                      maxZoom={19}
                    />
                  </>
                ) : (
                  <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                  />
                )}

                <MapFlyToController
                  latitude={mainMapCenter.lat}
                  longitude={mainMapCenter.lng}
                  zoom={17}
                  flyTrigger={mainMapFlyTrigger}
                />

                <BoundaryDrawingLayer
                  drawing={isDrawingBoundary}
                  onAddPoint={(point) => {
                    setBoundaryPoints((prev) => [...prev, point]);
                  }}
                />

                {/* FARM CENTER MARKER */}
                {!isDrawingBoundary && boundaryPoints.length < 3 && (
                  <Marker position={[mainMapCenter.lat, mainMapCenter.lng]}>
                    <Popup>
                      <div className="min-w-[180px]">
                        <strong className="text-sm">{currentFarm.name}</strong>
                        <p className="text-xs mt-1">{currentFarm.locationName}</p>
                        <p className="text-xs mt-1 font-semibold text-emerald-700">
                          Area: {displayAreaAcres || '—'} acres
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* NUMBERED BOUNDARY CORNER MARKERS */}
                {boundaryPoints.map((point, index) => (
                  <Marker
                    key={`${point.lat}-${point.lng}-${index}`}
                    position={[point.lat, point.lng]}
                    icon={createCornerIcon(index)}
                  >
                    <Popup>
                      <div className="text-xs font-semibold">
                        Corner Point #{index + 1}
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* LINE WHILE 2 POINTS */}
                {boundaryPoints.length === 2 && (
                  <Polyline
                    positions={boundaryPoints.map((p) => [p.lat, p.lng])}
                    pathOptions={{
                      color: '#22c55e',
                      weight: 3,
                      dashArray: '6, 6',
                    }}
                  />
                )}

                {/* REAL FARM POLYGON */}
                {boundaryPoints.length >= 3 && (
                  <Polygon
                    positions={boundaryPoints.map((point) => [
                      point.lat,
                      point.lng,
                    ])}
                    pathOptions={{
                      color: '#16a34a',
                      weight: 3,
                      fillColor: '#22c55e',
                      fillOpacity: 0.3,
                    }}
                  />
                )}
              </MapContainer>

              {/* TOP RIGHT CONTROLS */}
              <div className="absolute top-3 right-3 z-[1000] flex flex-col items-end gap-2">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-1 flex">
                  <button
                    type="button"
                    onClick={() => setIsSatellite(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                      isSatellite
                        ? 'bg-[#156637] text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Satellite className="w-3.5 h-3.5" />
                    Satellite
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSatellite(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                      !isSatellite
                        ? 'bg-[#156637] text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <MapIcon className="w-3.5 h-3.5" />
                    Map
                  </button>
                </div>

                {googleMapsUrl && !isDrawingBoundary && (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-white px-3 py-2 rounded-xl shadow-lg border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Google Maps
                  </a>
                )}
              </div>

              {/* DRAWING PANEL */}
              {isDrawingBoundary && (
                <div className="absolute bottom-3 right-3 z-[1000] bg-white rounded-2xl shadow-2xl border-2 border-emerald-500 p-3.5 w-[275px]">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <MousePointerClick className="w-4 h-4 text-[#156637]" />
                      <strong className="text-xs text-gray-900">
                        Click Farm Corners on Map
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsDrawingBoundary(false)}
                      className="text-gray-400 hover:text-gray-700 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-[11px] text-gray-600 mb-2.5">
                    Click 3 or more corners of your farm field. Acres are calculated automatically!
                  </p>

                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs mb-3">
                    <span className="font-semibold text-gray-700">
                      Points: {boundaryPoints.length}
                    </span>
                    <span className="font-extrabold text-[#156637]">
                      {calculatedBoundaryArea} Acres
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={undoLastPoint}
                      disabled={boundaryPoints.length === 0}
                      className="px-2 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-[11px] font-bold disabled:opacity-40 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3 inline mr-1" />
                      Undo
                    </button>

                    <button
                      type="button"
                      onClick={clearBoundary}
                      disabled={boundaryPoints.length === 0}
                      className="px-2 py-1.5 rounded-lg bg-red-50 text-red-600 text-[11px] font-bold disabled:opacity-40 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3 inline mr-1" />
                      Clear
                    </button>

                    <button
                      type="button"
                      onClick={saveBoundary}
                      disabled={boundaryPoints.length < 3 || isSavingBoundary}
                      className="px-2 py-1.5 rounded-lg bg-[#156637] text-white text-[11px] font-bold disabled:opacity-40 cursor-pointer"
                    >
                      {isSavingBoundary ? 'Saving...' : 'Save Plot'}
                    </button>
                  </div>
                </div>
              )}

              {/* DRAW BUTTON */}
              {!isDrawingBoundary && (
                <button
                  type="button"
                  onClick={startDrawingBoundary}
                  className="absolute bottom-3 right-3 z-[1000] bg-[#156637] hover:bg-[#104e2a] text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 cursor-pointer"
                >
                  <Pentagon className="w-4 h-4" />
                  {boundaryPoints.length >= 3
                    ? 'Redraw Farm Boundary Points'
                    : 'Click to Draw Farm Boundary'}
                </button>
              )}

              {/* MAP BADGE */}
              <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[11px] font-bold text-gray-800 shadow-md border border-gray-200">
                {boundaryPoints.length >= 3
                  ? `Calculated Area: ${calculatedBoundaryArea} Acres (${boundaryPoints.length} points)`
                  : 'Search village above & click farm corners to calculate Acres'}
              </div>
            </div>

            {/* BOUNDARY STATUS */}
            <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              {boundaryPoints.length >= 3 ? (
                <div className="text-xs text-emerald-700 font-semibold">
                  <Check className="w-3.5 h-3.5 inline mr-1" />
                  Real farm boundary mapped from {boundaryPoints.length} points •{' '}
                  <strong>{calculatedBoundaryArea} acres</strong>
                </div>
              ) : (
                <div className="text-xs text-gray-500">
                  Search your village above or click “Click to Draw Farm Boundary” to trace your field corners.
                </div>
              )}

              {boundaryPoints.length >= 3 && !isDrawingBoundary && (
                <button
                  type="button"
                  onClick={removeBoundary}
                  disabled={isSavingBoundary}
                  className="text-xs text-red-600 font-semibold hover:underline cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3 h-3 inline mr-1" />
                  Remove Boundary
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          CREATE / MANAGE FARM PLOT MODAL
          - Google-Maps-style Village Autocomplete Search
          - Interactive Satellite Map that flies to selected village
          - Click 3+ points on map to trace farm boundary
          - Automatic Area Calculation in Acres (no manual typing)
          - No manual Latitude/Longitude or Detect Coordinates
      ===================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-gray-100 max-h-[94vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-[#0f291e]">
                  {isCreating || !currentFarm
                    ? 'Create Your Farm on Satellite Map'
                    : 'Manage Farm Plot & Boundary'}
                </h3>
                <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                  Step 1: Search your village • Step 2: Click your farm corners on map • Step 3: Save
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              {/* STEP 1: GOOGLE-MAPS-STYLE VILLAGE / LOCATION SEARCH */}
              <div className="bg-[#f4f8f4] p-3.5 sm:p-4 rounded-2xl border border-emerald-200/80 space-y-2">
                <label className="block text-xs font-extrabold text-[#0f291e]">
                  1. Search Your Village / Town / Tehsil{' '}
                  <span className="text-red-500">*</span>
                </label>

                <VillageAutocompleteSearch
                  value={formData.locationName}
                  onChangeText={(txt) =>
                    setFormData((prev) => ({ ...prev, locationName: txt }))
                  }
                  onSelectLocation={handleSelectModalLocation}
                  placeholder="Type village name (e.g. Bargaon, Gogunda, Girwa, Mavli, Vallabhnagar...)"
                />

                <p className="text-[11px] text-gray-600 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#156637] shrink-0" />
                  <span>
                    Select your village from the dropdown — the satellite map below will immediately fly to that location!
                  </span>
                </p>
              </div>

              {/* STEP 2: INTERACTIVE SATELLITE MAP TO CLICK FARM CORNERS */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="block text-xs font-extrabold text-[#0f291e]">
                    2. Click Your Exact Farm Corners on the Map (Minimum 3 Points){' '}
                    <span className="text-red-500">*</span>
                  </label>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setModalBoundaryPoints((prev) => prev.slice(0, -1))
                      }
                      disabled={modalBoundaryPoints.length === 0}
                      className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold disabled:opacity-40 cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Undo Point
                    </button>

                    <button
                      type="button"
                      onClick={() => setModalBoundaryPoints([])}
                      disabled={modalBoundaryPoints.length === 0}
                      className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-bold disabled:opacity-40 cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="relative isolate z-0 w-full h-[320px] sm:h-[370px] rounded-2xl overflow-hidden border-2 border-emerald-600/40 shadow-inner">
                  <MapContainer
                    center={[modalMapCenter.lat, modalMapCenter.lng]}
                    zoom={17}
                    scrollWheelZoom={true}
                    className="absolute inset-0 w-full h-full z-0 cursor-crosshair"
                  >
                    {modalIsSatellite ? (
                      <>
                        <TileLayer
                          attribution="Tiles &copy; Esri"
                          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                          maxZoom={19}
                        />
                        <TileLayer
                          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                          maxZoom={19}
                        />
                      </>
                    ) : (
                      <TileLayer
                        attribution="&copy; OpenStreetMap contributors"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        maxZoom={19}
                      />
                    )}

                    <MapFlyToController
                      latitude={modalMapCenter.lat}
                      longitude={modalMapCenter.lng}
                      zoom={17}
                      flyTrigger={modalFlyTrigger}
                    />

                    <BoundaryDrawingLayer
                      drawing={true}
                      onAddPoint={(point) => {
                        setModalBoundaryPoints((prev) => [...prev, point]);
                        setFormError(null);
                      }}
                    />

                    {/* NUMBERED CORNER PINS */}
                    {modalBoundaryPoints.map((point, index) => (
                      <Marker
                        key={`modal-pt-${point.lat}-${point.lng}-${index}`}
                        position={[point.lat, point.lng]}
                        icon={createCornerIcon(index)}
                      />
                    ))}

                    {/* DASHED LINE FOR 2 POINTS */}
                    {modalBoundaryPoints.length === 2 && (
                      <Polyline
                        positions={modalBoundaryPoints.map((p) => [p.lat, p.lng])}
                        pathOptions={{
                          color: '#22c55e',
                          weight: 3,
                          dashArray: '6, 6',
                        }}
                      />
                    )}

                    {/* DRAWN FARM POLYGON */}
                    {modalBoundaryPoints.length >= 3 && (
                      <Polygon
                        positions={modalBoundaryPoints.map((p) => [p.lat, p.lng])}
                        pathOptions={{
                          color: '#16a34a',
                          weight: 3,
                          fillColor: '#22c55e',
                          fillOpacity: 0.32,
                        }}
                      />
                    )}
                  </MapContainer>

                  {/* SATELLITE / MAP SWITCH */}
                  <div className="absolute top-2.5 right-2.5 z-[1000] bg-white rounded-xl shadow-md border border-gray-200 p-1 flex">
                    <button
                      type="button"
                      onClick={() => setModalIsSatellite(true)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                        modalIsSatellite
                          ? 'bg-[#156637] text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Satellite className="w-3 h-3" />
                      Satellite
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalIsSatellite(false)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                        !modalIsSatellite
                          ? 'bg-[#156637] text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <MapIcon className="w-3 h-3" />
                      Street
                    </button>
                  </div>

                  {/* INSTRUCTION OVERLAY */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 z-[1000] bg-white/95 backdrop-blur-sm px-3.5 py-2 rounded-xl shadow-lg border border-emerald-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-800">
                      <MousePointerClick className="w-4 h-4 text-[#156637] shrink-0" />
                      {modalBoundaryPoints.length === 0 && (
                        <span>
                          Tap/click on your farm corners on the satellite map to trace your plot
                        </span>
                      )}
                      {modalBoundaryPoints.length > 0 &&
                        modalBoundaryPoints.length < 3 && (
                          <span>
                            {modalBoundaryPoints.length} point(s) marked — click at least{' '}
                            {3 - modalBoundaryPoints.length} more corner(s)
                          </span>
                        )}
                      {modalBoundaryPoints.length >= 3 && (
                        <span className="text-emerald-800 font-bold">
                          {modalBoundaryPoints.length} Corners Marked • Farm Boundary Ready!
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-[#156637] text-white text-xs font-extrabold">
                        Auto Area: {modalCalculatedArea} Acres
                      </span>
                      {modalCalculatedArea > 0 && (
                        <span className="text-[11px] font-semibold text-gray-600 hidden sm:inline">
                          ({modalCalculatedHectares} Ha • ~{modalCalculatedBigha} Bigha)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 3: FARM NAME, CROP, SOIL & IRRIGATION (NO MANUAL ACRES OR LAT/LNG) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Farm Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kisan Organic Farm"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: e.target.value,
                      })
                    }
                    className="w-full bg-[#f8faf7] border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#156637]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Primary Crop
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Wheat, Maize, Mustard, Soybean"
                    value={formData.primaryCrop}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        primaryCrop: e.target.value,
                      })
                    }
                    className="w-full bg-[#f8faf7] border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#156637]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* AUTO-CALCULATED FARM AREA DISPLAY (READ-ONLY) */}
                <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl px-3.5 py-2 flex flex-col justify-center">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-800">
                    Farm Area (From Map Points)
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-[#156637] mt-0.5">
                    {modalCalculatedArea > 0
                      ? `${modalCalculatedArea} Acres`
                      : 'Click 3+ points on map'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Soil Type
                  </label>
                  <select
                    value={formData.soilType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        soilType: e.target.value,
                      })
                    }
                    className="w-full bg-[#f8faf7] border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#156637]"
                  >
                    <option value="Loamy">Loamy</option>
                    <option value="Clay">Clay</option>
                    <option value="Sandy Loam">Sandy Loam</option>
                    <option value="Black Cotton">Black Cotton</option>
                    <option value="Red Soil">Red Soil</option>
                    <option value="Alluvial">Alluvial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Irrigation Method
                  </label>
                  <select
                    value={formData.irrigationMethod}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        irrigationMethod: e.target.value,
                      })
                    }
                    className="w-full bg-[#f8faf7] border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#156637]"
                  >
                    <option value="Drip">Drip</option>
                    <option value="Sprinkler">Sprinkler</option>
                    <option value="Flood / Furrow">Flood / Furrow</option>
                    <option value="Rainfed">Rainfed</option>
                  </select>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#156637] text-white text-xs sm:text-sm font-bold hover:bg-[#104e2a] flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving Farm Plot...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {isCreating || !currentFarm
                        ? 'Create Farm Plot'
                        : 'Save Farm Plot'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyFarmPage;
