import React from 'react';

// DEPRECATED: Use BrandLogo from HomePage or Navbar for all new branding.

// A playful, cartoonish uncle face with mustache and glasses inside a gift box
export default function Logo({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Gift box */}
      <rect x="8" y="24" width="48" height="32" rx="8" fill="#fef9c3" stroke="#38bdf8" strokeWidth="3" />
      {/* Ribbon */}
      <rect x="30" y="24" width="4" height="32" fill="#38bdf8" />
      <rect x="8" y="38" width="48" height="4" fill="#38bdf8" />
      {/* Uncle face */}
      <ellipse cx="32" cy="40" rx="12" ry="10" fill="#fde68a" stroke="#fbbf24" strokeWidth="2" />
      {/* Glasses */}
      <circle cx="26" cy="40" r="3" stroke="#0ea5e9" strokeWidth="2" fill="white" />
      <circle cx="38" cy="40" r="3" stroke="#0ea5e9" strokeWidth="2" fill="white" />
      <rect x="29" y="39" width="6" height="2" fill="#0ea5e9" />
      {/* Mustache */}
      <path d="M26 45 Q32 48 38 45" stroke="#78350f" strokeWidth="2" fill="none" />
      {/* Smile */}
      <path d="M28 44 Q32 47 36 44" stroke="#ea580c" strokeWidth="2" fill="none" />
    </svg>
  );
} 