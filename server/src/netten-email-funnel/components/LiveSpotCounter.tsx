// ============================================
// LIVE 777 COUNTER COMPONENT
// Shows real-time founding spots remaining
// Add to your landing page
// ============================================

'use client';

import { useState, useEffect } from 'react';

interface SpotCounterProps {
  className?: string;
  showTotal?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function LiveSpotCounter({ 
  className = '', 
  showTotal = true,
  size = 'md' 
}: SpotCounterProps) {
  const [spotsRemaining, setSpotsRemaining] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    async function fetchSpots() {
      try {
        const res = await fetch('/api/waitlist/spots');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setSpotsRemaining(data.remaining);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to fetch spots:', err);
        setError(true);
        setIsLoading(false);
        // Fallback to static number if API fails
        setSpotsRemaining(777);
      }
    }
    
    fetchSpots();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchSpots, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl'
  };
  
  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-12 w-24 bg-white/10 rounded" />
      </div>
    );
  }
  
  return (
    <div className={`font-mono ${className}`}>
      <span className={`font-bold text-[#7CFF6B] ${sizeClasses[size]}`}>
        {spotsRemaining}
      </span>
      {showTotal && (
        <span className="text-white/60 ml-2">/ 777</span>
      )}
      <div className="text-sm text-white/50 mt-1">
        founding spots remaining
      </div>
    </div>
  );
}

// ============================================
// URGENCY BANNER COMPONENT
// Shows when spots are running low
// ============================================

export function UrgencyBanner() {
  const [spotsRemaining, setSpotsRemaining] = useState<number | null>(null);
  
  useEffect(() => {
    async function fetchSpots() {
      try {
        const res = await fetch('/api/waitlist/spots');
        const data = await res.json();
        setSpotsRemaining(data.remaining);
      } catch (err) {
        console.error('Failed to fetch spots:', err);
      }
    }
    fetchSpots();
  }, []);
  
  // Only show if less than 100 spots remaining
  if (!spotsRemaining || spotsRemaining > 100) return null;
  
  const urgencyLevel = spotsRemaining < 50 ? 'critical' : 'warning';
  
  return (
    <div className={`
      fixed bottom-0 left-0 right-0 z-50 py-3 px-4 text-center
      ${urgencyLevel === 'critical' 
        ? 'bg-red-600/90 text-white' 
        : 'bg-yellow-500/90 text-black'}
    `}>
      <span className="font-bold">
        {urgencyLevel === 'critical' ? '🔥' : '⚡'}
        {' '}Only {spotsRemaining} founding spots left!
      </span>
      <span className="ml-2">
        Lock in $44/mo forever before they're gone.
      </span>
    </div>
  );
}

// ============================================
// ANIMATED COUNTER (for hero section)
// ============================================

export function AnimatedSpotCounter() {
  const [spotsRemaining, setSpotsRemaining] = useState(777);
  const [displayNumber, setDisplayNumber] = useState(777);
  
  useEffect(() => {
    async function fetchSpots() {
      try {
        const res = await fetch('/api/waitlist/spots');
        const data = await res.json();
        setSpotsRemaining(data.remaining);
      } catch (err) {
        console.error('Failed to fetch spots:', err);
      }
    }
    fetchSpots();
  }, []);
  
  // Animate number counting down
  useEffect(() => {
    if (displayNumber === spotsRemaining) return;
    
    const step = displayNumber > spotsRemaining ? -1 : 1;
    const timer = setTimeout(() => {
      setDisplayNumber(prev => prev + step);
    }, 20);
    
    return () => clearTimeout(timer);
  }, [displayNumber, spotsRemaining]);
  
  return (
    <div className="relative">
      {/* Glow effect */}
      <div className="absolute inset-0 blur-xl bg-[#7CFF6B]/30 rounded-full" />
      
      <div className="relative bg-gradient-to-br from-[#0D3D2E] to-[#0a1612] border border-[#7CFF6B]/30 rounded-2xl p-8 text-center">
        <div className="text-sm text-white/50 uppercase tracking-widest mb-2">
          Founding Spots Remaining
        </div>
        
        <div className="font-mono">
          <span className="text-7xl font-bold text-[#7CFF6B]">
            {displayNumber}
          </span>
          <span className="text-3xl text-white/40 ml-2">
            / 777
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="mt-6 h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#7CFF6B] to-[#2D9E7B] transition-all duration-1000"
            style={{ width: `${((777 - spotsRemaining) / 777) * 100}%` }}
          />
        </div>
        
        <div className="mt-3 text-sm text-white/60">
          {777 - spotsRemaining} claimed · {spotsRemaining} available
        </div>
      </div>
    </div>
  );
}

export default LiveSpotCounter;
