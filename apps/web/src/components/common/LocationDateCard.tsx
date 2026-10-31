import React from 'react';
import { MapPin, CalendarDays } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface LocationDateCardProps {
  location?: string;
  date?: string;
  className?: string;
}

export const LocationDateCard: React.FC<LocationDateCardProps> = ({
  location = 'Udaipur, Rajasthan, India',
  date,
  className = '',
}) => {
  const { language } = useApp();
  const isHi = language === 'hi';

  const displayDate =
    date ||
    new Date().toLocaleDateString(isHi ? 'hi-IN' : 'en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const displayLocation = (() => {
    if (!isHi) return location;
    return location
      .replace(/Udaipur/gi, 'उदयपुर')
      .replace(/Rajasthan/gi, 'राजस्थान')
      .replace(/India/gi, 'भारत')
      .replace(/Badgaon/gi, 'बड़गांव')
      .replace(/Girwa/gi, 'गिर्वा')
      .replace(/Mavli/gi, 'मावली')
      .replace(/Gogunda/gi, 'गोगुंदा')
      .replace(/Vallabhnagar/gi, 'वल्लभनगर')
      .replace(/Salumbar/gi, 'सलूम्बर')
      .replace(/Thur/gi, 'थूर')
      .replace(/Dabok/gi, 'डबोक')
      .replace(/Fatehnagar/gi, 'फतहनगर')
      .replace(/Kherwara/gi, 'खैरवाड़ा')
      .replace(/Kotra/gi, 'कोटड़ा')
      .replace(/Jhadol/gi, 'झाड़ोल')
      .replace(/Rajsamand/gi, 'राजसमंद')
      .replace(/Chittorgarh/gi, 'चित्तौड़गढ़')
      .replace(/Dungarpur/gi, 'डूंगरपुर')
      .replace(/Banswara/gi, 'बांसवाड़ा')
      .replace(/Pratapgarh/gi, 'प्रतापगढ़');
  })();

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm ${className}`}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-50">
        <MapPin className="h-4 w-4 text-green-700" />
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-semibold text-gray-900">
            {displayLocation}
          </p>
        </div>

        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
          <CalendarDays className="h-3.5 w-3.5" />
          <span>{displayDate}</span>
        </div>
      </div>
    </div>
  );
};

export default LocationDateCard;