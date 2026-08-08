import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

export const GoogleCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setError('Authorization code missing in callback.');
      return;
    }

    const exchangeCode = async () => {
      try {
        const res = await api.post('/auth/google/callback', { code });
        const token = res.data.access_token;
        const meRes = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAuth(meRes.data, token);
        navigate('/', { replace: true });
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to complete Google authentication.');
      }
    };

    exchangeCode();
  }, [searchParams, setAuth, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="glass-panel p-8 rounded-2xl max-w-sm w-full text-center flex flex-col items-center gap-4">
        {error ? (
          <>
            <div className="text-rose-400 font-medium text-sm">{error}</div>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="glass-button px-4 py-2 text-xs rounded-xl text-white"
            >
              Return Home
            </button>
          </>
        ) : (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            <div className="text-sm font-medium text-slate-200">Completing Google Sign-in...</div>
          </>
        )}
      </div>
    </div>
  );
};
