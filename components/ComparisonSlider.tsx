
import React, { useState, useRef, useEffect } from 'react';

interface ComparisonSliderProps {
  before: string;
  after: string;
}

const ComparisonSlider: React.FC<ComparisonSliderProps> = ({ before, after }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const pos = ((x - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, pos)));
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-square md:aspect-video overflow-hidden rounded-2xl cursor-col-resize select-none"
      onMouseMove={handleMove}
      onTouchMove={handleMove}
    >
      {/* After Image (Background) */}
      <img src={after} alt="Mejorada" className="absolute inset-0 w-full h-full object-contain bg-slate-900" />
      
      {/* Before Image (Overlay) */}
      <div 
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{ width: `${sliderPos}%` }}
      >
        <img src={before} alt="Original" className="absolute inset-0 w-full h-full object-contain bg-slate-900" style={{ width: `${100 / (sliderPos / 100)}%`, maxWidth: 'none' }} />
      </div>

      {/* Slider Handle */}
      <div 
        className="absolute inset-y-0 w-1 bg-white shadow-xl cursor-col-resize flex items-center justify-center"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="w-10 h-10 bg-white rounded-full shadow-2xl flex items-center justify-center -ml-0.5">
          <svg className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l-5 5m0 0l5 5m-5-5h18m-5-10l5 5m0 0l-5 5" />
          </svg>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 glass px-3 py-1 rounded text-xs font-bold tracking-widest uppercase">Antes</div>
      <div className="absolute bottom-4 right-4 glass px-3 py-1 rounded text-xs font-bold tracking-widest uppercase">Después</div>
    </div>
  );
};

export default ComparisonSlider;
