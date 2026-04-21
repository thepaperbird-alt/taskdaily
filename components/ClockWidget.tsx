'use client';

import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';

export default function ClockWidget() {
  const [time, setTime] = useState<Date | null>(null);
  
  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) {
    return <div className="w-[140px] h-[40px] animate-pulse bg-neutral-100 dark:bg-neutral-800 rounded-2xl" />;
  }

  const hours = time.getHours() % 12;
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const hourDeg = (hours + minutes / 60) * 30; // 360 / 12 = 30
  const minDeg = (minutes + seconds / 60) * 6; // 360 / 60 = 6
  const secDeg = seconds * 6;

  return (
    <div className="flex items-center gap-3 bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm px-3 py-1.5 rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 shadow-sm transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800">
      {/* Date and Digital Time */}
      <div className="flex flex-col items-end justify-center">
        <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 leading-tight">
          {format(time, 'hh:mm a')}
        </span>
        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium tracking-wide uppercase leading-tight">
          {format(time, 'MMM dd, yyyy')}
        </span>
      </div>

      {/* Analog Clock */}
      <div className="relative w-8 h-8 rounded-full border-[2px] border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-inner flex items-center justify-center">
        {/* Center dot */}
        <div className="absolute w-[4px] h-[4px] rounded-full bg-blue-500 z-10" />
        
        {/* Hour Hand */}
        <div 
          className="absolute w-[2px] rounded-full bg-neutral-800 dark:bg-neutral-200 origin-bottom"
          style={{ height: '8px', bottom: '50%', transform: `translateY(1px) rotate(${hourDeg}deg)` }}
        />
        {/* Minute Hand */}
        <div 
          className="absolute w-[1.5px] rounded-full bg-neutral-600 dark:bg-neutral-400 origin-bottom"
          style={{ height: '11px', bottom: '50%', transform: `translateY(1px) rotate(${minDeg}deg)` }}
        />
        {/* Second Hand */}
        <div 
          className="absolute w-[1px] rounded-full bg-red-500 origin-bottom z-10"
          style={{ height: '13px', bottom: '50%', transform: `translateY(1px) rotate(${secDeg}deg)` }}
        />
      </div>
    </div>
  );
}
