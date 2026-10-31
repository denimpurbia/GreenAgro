/**
 * Southern Rajasthan — Udaipur Division District Registry
 * Used for lake, watershed, Aravalli and community report geo-filtering.
 */

export interface District {
  slug: string;
  nameEn: string;
  nameHi: string;
  centroid: { lat: number; lng: number };
  /** Approximate bounding box [minLng, minLat, maxLng, maxLat] */
  bbox: [number, number, number, number];
}

export const DISTRICTS: District[] = [
  {
    slug: 'udaipur',
    nameEn: 'Udaipur',
    nameHi: 'उदयपुर',
    centroid: { lat: 24.585, lng: 73.712 },
    bbox: [73.2, 24.1, 74.4, 25.2],
  },
  {
    slug: 'salumber',
    nameEn: 'Salumber',
    nameHi: 'सलूम्बर',
    centroid: { lat: 24.15, lng: 74.01 },
    bbox: [73.6, 23.8, 74.5, 24.6],
  },
  {
    slug: 'rajsamand',
    nameEn: 'Rajsamand',
    nameHi: 'राजसमंद',
    centroid: { lat: 25.065, lng: 73.885 },
    bbox: [73.5, 24.7, 74.3, 25.5],
  },
  {
    slug: 'dungarpur',
    nameEn: 'Dungarpur',
    nameHi: 'डूंगरपुर',
    centroid: { lat: 23.844, lng: 73.714 },
    bbox: [73.2, 23.4, 74.2, 24.3],
  },
  {
    slug: 'banswara',
    nameEn: 'Banswara',
    nameHi: 'बांसवाड़ा',
    centroid: { lat: 23.544, lng: 74.452 },
    bbox: [74.0, 23.1, 75.0, 24.1],
  },
  {
    slug: 'pratapgarh',
    nameEn: 'Pratapgarh',
    nameHi: 'प्रतापगढ़',
    centroid: { lat: 24.033, lng: 74.778 },
    bbox: [74.4, 23.6, 75.3, 24.5],
  },
  {
    slug: 'chittorgarh',
    nameEn: 'Chittorgarh',
    nameHi: 'चित्तौड़गढ़',
    centroid: { lat: 24.88, lng: 74.62 },
    bbox: [74.0, 24.3, 75.4, 25.5],
  },
  {
    slug: 'bhilwara',
    nameEn: 'Bhilwara',
    nameHi: 'भीलवाड़ा',
    centroid: { lat: 25.347, lng: 74.636 },
    bbox: [74.0, 24.9, 75.3, 25.9],
  },
];

export function getDistrictBySlug(slug: string): District | undefined {
  return DISTRICTS.find((d) => d.slug === slug);
}

