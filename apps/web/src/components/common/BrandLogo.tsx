import React from 'react';

export const BrandLogo: React.FC<{ className?: string; textClassName?: string; subtitleClassName?: string }> = ({
  className = 'w-9 h-9',
  textClassName = '',
  subtitleClassName = '',
}) => {
  return (
    <div className="flex items-center gap-3 select-none">
      {/* Exact Stylized Leaf & Kernel Logo matching the reference image */}
      <svg
        className={className}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer green leaf curve */}
        <path
          d="M10 38C10 24 20 10 38 6C36 24 26 38 10 38Z"
          fill="#166534"
        />
        {/* Secondary lime/emerald leaf facet */}
        <path
          d="M14 38C14 26 22 14 36 8C33 22 24 35 14 38Z"
          fill="#22c55e"
          opacity="0.85"
        />
        {/* Inner bright leaf contour */}
        <path
          d="M17 38C17 28 24 18 34 11C31 22 23 33 17 38Z"
          fill="#86efac"
          opacity="0.9"
        />
        {/* Golden seed / corn kernel inner accent */}
        <path
          d="M20 37C20 30 25 22 32 16C29 24 24 33 20 37Z"
          fill="#eab308"
        />
        {/* Leaf stem */}
        <path
          d="M10 38C8 42 6 44 4 45"
          stroke="#14532d"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>

      <div className="flex flex-col">
        <span
          className={`font-extrabold text-[21px] text-[#0e3820] tracking-tight leading-none ${textClassName}`}
        >
          GreenAgro
        </span>
        <span
          className={`text-[11px] text-gray-500 font-medium tracking-wide mt-1 leading-none ${subtitleClassName}`}
        >
          GreenAgro Intelligence Network
        </span>
      </div>
    </div>
  );
};
