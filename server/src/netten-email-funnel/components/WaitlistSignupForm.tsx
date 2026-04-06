// ============================================
// WAITLIST SIGNUP FORM COMPONENT
// Handles email capture + referral tracking
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface SignupFormProps {
  className?: string;
  onSuccess?: (data: SignupResponse) => void;
}

interface SignupResponse {
  success: boolean;
  spotNumber?: number;
  referralCode?: string;
  referralLink?: string;
  spotsRemaining?: number;
  error?: string;
}

export function WaitlistSignupForm({ className = '', onSuccess }: SignupFormProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SignupResponse | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  
  // Capture referral code from URL
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref);
      // Store in localStorage for persistence
      localStorage.setItem('netten_referral', ref);
    } else {
      // Check localStorage for previously captured referral
      const storedRef = localStorage.getItem('netten_referral');
      if (storedRef) setReferralCode(storedRef);
    }
  }, [searchParams]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    
    try {
      const res = await fetch('/api/waitlist/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName: firstName || undefined,
          referralCode: referralCode || undefined
        })
      });
      
      const data: SignupResponse = await res.json();
      setResult(data);
      
      if (data.success && onSuccess) {
        onSuccess(data);
      }
      
      // Clear referral from localStorage on successful signup
      if (data.success) {
        localStorage.removeItem('netten_referral');
      }
    } catch (error) {
      setResult({
        success: false,
        error: 'Something went wrong. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Success state
  if (result?.success) {
    return (
      <div className={`${className}`}>
        <div className="bg-gradient-to-br from-[#0D3D2E]/50 to-[#0a1612] border border-[#7CFF6B]/30 rounded-2xl p-8 text-center">
          {/* Confetti effect */}
          <div className="text-5xl mb-4">🎉</div>
          
          <h3 className="text-2xl font-bold text-white mb-2">
            You're In!
          </h3>
          
          <div className="bg-[#7CFF6B]/10 border border-[#7CFF6B]/30 rounded-xl p-4 mb-6">
            <div className="text-sm text-white/60 mb-1">You're Founding Member</div>
            <div className="text-4xl font-bold text-[#7CFF6B]">
              #{result.spotNumber}
            </div>
            <div className="text-sm text-white/60">of 777</div>
          </div>
          
          <p className="text-white/70 mb-6">
            Check your email for your welcome message and referral link.
          </p>
          
          {/* Share section */}
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-sm text-white/50 mb-2">Your referral link:</div>
            <div className="flex gap-2">
              <input
                type="text"
                value={result.referralLink || ''}
                readOnly
                className="flex-1 bg-[#0a1612] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#7CFF6B] font-mono"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(result.referralLink || '');
                }}
                className="bg-[#7CFF6B] text-[#0a1612] px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#6ee65a] transition-colors"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-white/40 mt-2">
              Share with friends → Both get 1 month free at launch
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className={`${className}`}>
      <div className="space-y-4">
        {/* Referral badge */}
        {referralCode && (
          <div className="bg-[#7CFF6B]/10 border border-[#7CFF6B]/30 rounded-lg px-4 py-2 text-sm text-[#7CFF6B] text-center">
            🎁 You were referred! You'll both get 1 month free.
          </div>
        )}
        
        {/* Email input */}
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-[#7CFF6B]/50 focus:ring-1 focus:ring-[#7CFF6B]/50 transition-all"
          />
        </div>
        
        {/* First name (optional) */}
        <div>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name (optional)"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-[#7CFF6B]/50 focus:ring-1 focus:ring-[#7CFF6B]/50 transition-all"
          />
        </div>
        
        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading || !email}
          className="w-full bg-[#7CFF6B] hover:bg-[#6ee65a] disabled:bg-[#7CFF6B]/50 disabled:cursor-not-allowed text-[#0a1612] font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Joining...
            </span>
          ) : (
            'Claim Your Founding Spot →'
          )}
        </button>
        
        {/* Error message */}
        {result?.error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400 text-center">
            {result.error}
          </div>
        )}
        
        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 text-xs text-white/40 pt-2">
          <span>🔒 No credit card required</span>
          <span>•</span>
          <span>📧 1 welcome email, no spam</span>
        </div>
      </div>
    </form>
  );
}

// ============================================
// COMPACT INLINE SIGNUP (for footer/CTA sections)
// ============================================

export function InlineSignupForm({ className = '' }: { className?: string }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/waitlist/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      }
    } catch (error) {
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (success) {
    return (
      <div className={`text-[#7CFF6B] font-semibold ${className}`}>
        ✓ You're in! Check your email.
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[#7CFF6B]/50"
      />
      <button
        type="submit"
        disabled={isLoading}
        className="bg-[#7CFF6B] hover:bg-[#6ee65a] text-[#0a1612] font-bold px-6 py-3 rounded-lg whitespace-nowrap"
      >
        {isLoading ? '...' : 'Join'}
      </button>
    </form>
  );
}

export default WaitlistSignupForm;
