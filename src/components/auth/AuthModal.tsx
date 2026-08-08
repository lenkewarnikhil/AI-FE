import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { OTPForm } from './OTPForm';
import { Button } from '../ui/Button';
import { Sparkles } from 'lucide-react';
import { api } from '../../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      const res = await api.get('/auth/google');
      window.location.href = res.data.url;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Google OAuth is not configured on backend.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3 shadow-lg shadow-indigo-500/10">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Welcome to AI Workspace</h2>
        <p className="text-xs text-slate-400 mt-1">Sign in to sync your personal chat history across devices</p>
      </div>

      {error && (
        <div className="mb-4 text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
          {error}
        </div>
      )}

      {/* Google OAuth Sign-in Button */}
      <Button
        variant="glass"
        className="w-full mb-5 py-2.5 hover:bg-white/15"
        isLoading={isGoogleLoading}
        onClick={handleGoogleLogin}
        icon={
          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9c-.6-1.5-1-3.1-1-4.8z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.1C3.7 19.8 7.5 23 12 23z"
            />
          </svg>
        }
      >
        Continue with Google
      </Button>

      <div className="relative flex items-center justify-center my-4">
        <div className="border-t border-white/10 w-full" />
        <span className="bg-slate-900/80 px-3 text-[11px] uppercase tracking-wider text-slate-500 absolute font-semibold">
          Or Email OTP
        </span>
      </div>

      <OTPForm onSuccess={onClose} />
    </Modal>
  );
};
