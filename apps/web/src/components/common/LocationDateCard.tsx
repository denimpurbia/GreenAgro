import React from 'react';
import { MapPin, CalendarDays } from 'lucide-react';

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
  const displayDate =
    date ||
    new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

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
            {location}
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