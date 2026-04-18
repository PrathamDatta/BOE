import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex flex-col border border-[#166e99] w-20 flex-shrink-0">
        <div className="border-b border-[#166e99] p-1 flex justify-center items-center bg-white h-12">
          {/* Airplane SVG */}
          <svg viewBox="0 0 100 50" className="w-12 h-6 fill-[#166e99]">
            <path d="M10,40 L30,40 L45,15 L70,15 C80,15 85,20 85,25 L85,25 C85,30 80,35 70,35 L40,35 L20,45 L10,45 L20,38 L10,38 Z" />
          </svg>
        </div>
        <div className="border-b border-[#166e99] bg-white text-[#166e99] font-bold text-center text-sm tracking-widest py-0.5">
          NISS
        </div>
        <div className="p-1 flex justify-center items-center bg-white h-12 text-[#166e99]">
          {/* Ship SVG */}
          <svg viewBox="0 0 100 50" className="w-12 h-6 fill-[#166e99]">
             <path d="M5,40 L15,25 L35,25 L45,10 L60,10 L65,25 L90,25 L95,40 Z M5,45 L95,45 C95,48 90,50 85,50 L15,50 C10,50 5,48 5,45 Z" />
             <rect x="50" y="15" width="5" height="10" />
          </svg>
        </div>
      </div>
      <div className="text-[#166e99] font-bold text-lg md:text-xl leading-tight uppercase tracking-wide">
        New India Shipping<br/>Services
      </div>
    </div>
  );
};
