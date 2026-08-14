import React, { useEffect, useState, useRef } from 'react';
import { Clock, AlertTriangle, RefreshCw, LogOut, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { api } from '../../services/api';

interface SessionTimeoutModalProps {
  warningMinutes?: number;
}

const getJwtExp = (token: string | null): number | null => {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
};

export const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = () => {
  const { token, isAuthenticated, setAuth, user, logout } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [isOpen, setIsOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dismissedForToken, setDismissedForToken] = useState<string | null>(null);
  const [warningSeconds, setWarningSeconds] = useState<number>(() => {
    const envVal = import.meta.env.VITE_SESSION_WARNING_MINUTES;
    return envVal ? parseInt(envVal, 10) * 60 : 5 * 60; // default 5 minutes
  });

  const lastTokenRef = useRef<string | null>(token);

  // Fetch session config from backend if available
  useEffect(() => {
    if (token && isAuthenticated) {
      api
        .get<{ expire_minutes: number; warning_minutes: number }>('/auth/session-config')
        .then((res) => {
          if (res.data?.warning_minutes) {
            setWarningSeconds(res.data.warning_minutes * 60);
          }
        })
        .catch(() => {});
    }
  }, [token, isAuthenticated]);

  // Reset dismissal state when token changes
  useEffect(() => {
    if (token !== lastTokenRef.current) {
      lastTokenRef.current = token;
      setDismissedForToken(null);
      setIsOpen(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setIsOpen(false);
      setSecondsLeft(null);
      return;
    }

    const checkTimeout = () => {
      const exp = getJwtExp(token);
      if (!exp) return;

      const nowSec = Math.floor(Date.now() / 1000);
      const remaining = exp - nowSec;

      setSecondsLeft(remaining);

      if (remaining <= 0) {
        setIsOpen(false);
        logout();
        addToast('Your session has expired. Please log in again.', 'warning');
        return;
      }

      // Show modal if within warning window and not dismissed for this token
      if (remaining <= warningSeconds && dismissedForToken !== token) {
        setIsOpen(true);
      }
    };

    checkTimeout();
    const interval = setInterval(checkTimeout, 1000);
    return () => clearInterval(interval);
  }, [token, isAuthenticated, warningSeconds, dismissedForToken, logout, addToast]);

  const handleContinue = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.post<{ access_token: string }>('/auth/refresh');
      const newToken = res.data.access_token;
      if (user && newToken) {
        setAuth(user, newToken);
        addToast('Session extended successfully', 'success');
        setIsOpen(false);
      }
    } catch (err: any) {
      addToast('Failed to extend session. Please log in again.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDismiss = () => {
    setDismissedForToken(token);
    setIsOpen(false);
  };

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    addToast('Logged out successfully', 'info');
  };

  if (!isOpen || secondsLeft === null || secondsLeft <= 0) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleDismiss}
      title="Session Expiring Soon"
      maxWidth="md"
      showCloseButton={false}
    >
      <div className="flex flex-col items-center text-center space-y-4 pt-1">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 animate-pulse">
          <Clock className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-white">Your session is ending soon</h3>
          <p className="text-xs text-slate-300 max-w-sm leading-relaxed">
            For security reasons, your login session will expire shortly. Would you like to continue your session or log out?
          </p>
        </div>

        {/* Big Countdown Display */}
        <div className="px-5 py-2.5 rounded-2xl bg-black/40 border border-white/10 font-mono text-2xl font-bold tracking-wider text-amber-400 shadow-inner flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400 animate-bounce" />
          <span>{formattedTime}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-3 w-full">
          <Button
            variant="primary"
            size="sm"
            onClick={handleContinue}
            isLoading={isRefreshing}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Continue Session
          </Button>

          <Button
            variant="glass"
            size="sm"
            onClick={handleDismiss}
            icon={<X className="w-3.5 h-3.5" />}
          >
            Cancel / Dismiss
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={handleLogout}
            icon={<LogOut className="w-3.5 h-3.5" />}
          >
            Log Out
          </Button>
        </div>
      </div>
    </Modal>
  );
};
