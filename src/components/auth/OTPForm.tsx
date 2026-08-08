import React, { useState, useEffect } from 'react';
import { Mail, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

interface OTPFormProps {
  onSuccess: () => void;
}

export const OTPForm: React.FC<OTPFormProps> = ({ onSuccess }) => {
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/request-otp', { email });
      setCooldown(res.data.cooldown_seconds || 60);
      if (res.data.dev_otp) {
        setDevOtp(res.data.dev_otp);
      }
      setStep('verify');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to request OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP code.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const verifyRes = await api.post('/auth/verify-otp', { email, otp });
      const token = verifyRes.data.access_token;

      // Get user profile
      const meRes = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAuth(meRes.data, token);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {step === 'request' ? (
        <form onSubmit={handleRequestOTP} className="flex flex-col gap-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-4 h-4" />}
            autoFocus
          />

          {error && <div className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">{error}</div>}

          <Button type="submit" variant="primary" isLoading={isLoading} icon={<ArrowRight className="w-4 h-4" />}>
            Send Login Code
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4">
          <div className="text-xs text-slate-300">
            Enter the 6-digit code sent to <span className="font-semibold text-white">{email}</span>
          </div>

          {devOtp && (
            <div className="bg-amber-500/15 border border-amber-500/30 p-2.5 rounded-xl text-xs text-amber-200">
              ⚡ <strong>Dev Mode OTP Code:</strong> <span className="font-mono text-sm tracking-widest text-amber-300 font-bold ml-1">{devOtp}</span>
            </div>
          )}

          <Input
            label="6-Digit Verification Code"
            type="text"
            maxLength={6}
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            icon={<ShieldCheck className="w-4 h-4" />}
            className="text-center font-mono tracking-widest text-lg"
            autoFocus
          />

          {error && <div className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">{error}</div>}

          <Button type="submit" variant="primary" isLoading={isLoading}>
            Verify & Sign In
          </Button>

          <div className="flex justify-between items-center text-xs mt-1">
            <button
              type="button"
              onClick={() => {
                setStep('request');
                setError(null);
              }}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Change email
            </button>

            <button
              type="button"
              onClick={handleRequestOTP}
              disabled={cooldown > 0 || isLoading}
              className="text-indigo-400 hover:text-indigo-300 disabled:text-slate-600 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
