import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Mail, Lock, User, RefreshCw, AlertCircle, CheckCircle2, Eye, EyeOff, Check, X } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { BackgroundWallpaper } from '../layout/BackgroundWallpaper';

export const LoginPage: React.FC = () => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [step, setStep] = useState<'form' | 'verify_signup' | 'verify_reverify' | 'verify_reset'>('form');

  // Form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otp, setOtp] = useState('');

  // Password Visibility Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [cooldown, setCooldown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Password Validation Helper
  const checkPasswordRequirements = (pwd: string) => ({
    minLen: pwd.length >= 6,
    hasUpper: /[A-Z]/.test(pwd),
    hasNum: /[0-9]/.test(pwd),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?/~`]/.test(pwd),
  });

  const pwdReqs = checkPasswordRequirements(mode === 'reset' ? newPassword : password);
  const isPasswordValid = pwdReqs.minLen && pwdReqs.hasUpper && pwdReqs.hasNum && pwdReqs.hasSpecial;

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      const res = await api.get('/auth/google');
      window.location.href = res.data.url;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Google OAuth is not configured on server.');
      setIsGoogleLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@') || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setInfoMsg(null);

    try {
      const res = await api.post('/auth/login-password', { email, password });

      if (res.data.requires_reverification) {
        setInfoMsg(res.data.message || '30-day email re-verification required. Verification code sent.');
        setStep('verify_reverify');
        setCooldown(60);
        return;
      }

      if (res.data.access_token) {
        const token = res.data.access_token;
        const meRes = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAuth(meRes.data, token);
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpRequest = async (e?: React.FormEvent, forceResend: boolean = false) => {
    if (e) e.preventDefault();
    if (!name.trim() || !email || !email.includes('@')) {
      setError('Please fill in your name and valid email.');
      return;
    }
    if (!isPasswordValid) {
      setError('Please ensure your password meets all requirement criteria.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setInfoMsg(null);

    try {
      const res = await api.post('/auth/register-request', {
        name: name.trim(),
        email,
        password,
        force_resend: forceResend,
      });

      setInfoMsg(res.data.message || 'Verification code sent via EmailJS.');
      setCooldown(res.data.cooldown_seconds || 60);
      setStep('verify_signup');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to request signup verification.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/register-verify', {
        name: name.trim(),
        email,
        password,
        otp,
      });
      const token = res.data.access_token;
      const meRes = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAuth(meRes.data, token);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetRequest = async (e?: React.FormEvent, forceResend: boolean = false) => {
    if (e) e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter your valid email address.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setInfoMsg(null);

    try {
      const res = await api.post('/auth/reset-password-request', {
        email: email.trim(),
        force_resend: forceResend,
      });

      setInfoMsg(res.data.message || 'Password reset verification code sent to your email.');
      setCooldown(res.data.cooldown_seconds || 60);
      setStep('verify_reset');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to request password reset.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    if (!isPasswordValid) {
      setError('Please ensure your new password meets all security criteria.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/reset-password-verify', {
        email: email.trim(),
        otp,
        new_password: newPassword,
      });
      const token = res.data.access_token;
      const meRes = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAuth(meRes.data, token);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyReverify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/reverify-otp', { email, otp });
      const token = res.data.access_token;
      const meRes = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAuth(meRes.data, token);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPasswordRequirements = (pwd: string) => {
    if (!pwd) return null;
    const reqs = checkPasswordRequirements(pwd);
    return (
      <div className="grid grid-cols-2 gap-1.5 p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-300 my-1">
        <div className={`flex items-center gap-1.5 ${reqs.minLen ? 'text-emerald-400 font-medium' : 'text-slate-400'}`}>
          {reqs.minLen ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-slate-500" />}
          <span>At least 6 characters</span>
        </div>
        <div className={`flex items-center gap-1.5 ${reqs.hasUpper ? 'text-emerald-400 font-medium' : 'text-slate-400'}`}>
          {reqs.hasUpper ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-slate-500" />}
          <span>1 Uppercase letter</span>
        </div>
        <div className={`flex items-center gap-1.5 ${reqs.hasNum ? 'text-emerald-400 font-medium' : 'text-slate-400'}`}>
          {reqs.hasNum ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-slate-500" />}
          <span>1 Number</span>
        </div>
        <div className={`flex items-center gap-1.5 ${reqs.hasSpecial ? 'text-emerald-400 font-medium' : 'text-slate-400'}`}>
          {reqs.hasSpecial ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-slate-500" />}
          <span>1 Special character</span>
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen w-screen flex items-center justify-center p-4 overflow-hidden">
      <BackgroundWallpaper />

      <div className="relative z-10 w-full max-w-md glass-card p-8 rounded-3xl shadow-2xl flex flex-col items-center border border-white/15 bg-[#161d2e]/85 backdrop-blur-2xl">
        <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Nikhil's Personal AI</h1>
        <p className="text-xs text-slate-400 mb-5 text-center">
          {mode === 'signin'
            ? 'Welcome back! Sign in to your workspace'
            : mode === 'signup'
            ? 'Create your account to access AI workspace'
            : 'Reset your account password'}
        </p>

        {/* Tab Switcher */}
        {step === 'form' && mode !== 'reset' && (
          <div className="flex w-full p-1 bg-white/5 rounded-2xl mb-6 border border-white/10">
            <button
              onClick={() => { setMode('signin'); setError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                mode === 'signin' ? 'bg-white/15 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                mode === 'signup' ? 'bg-white/15 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {error && (
          <div className="w-full mb-4 text-xs text-rose-300 bg-rose-500/15 p-3 rounded-xl border border-rose-500/30 text-left flex items-start gap-2 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {infoMsg && (step !== 'form' || mode === 'reset') && (
          <div className="w-full mb-4 text-xs text-emerald-300 bg-emerald-500/15 p-3 rounded-xl border border-emerald-500/30 text-left flex items-start gap-2 leading-relaxed">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        {step === 'form' && mode === 'signin' && (
          <>
            <Button
              variant="glass"
              className="w-full mb-4 py-3 hover:bg-white/15"
              isLoading={isGoogleLoading}
              onClick={handleGoogleLogin}
              icon={
                <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9c-.6-1.5-1-3.1-1-4.8z" />
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.1C3.7 19.8 7.5 23 12 23z" />
                </svg>
              }
            >
              Sign in with Google
            </Button>

            <div className="relative flex items-center justify-center w-full my-3">
              <div className="border-t border-white/10 w-full" />
              <span className="bg-[#161d2e] px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 absolute">
                Or with password
              </span>
            </div>
          </>
        )}

        {/* Forms */}
        <div className="w-full">
          {step === 'form' ? (
            mode === 'signin' ? (
              <form onSubmit={handleSignIn} className="flex flex-col gap-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="w-4 h-4 text-slate-400" />}
                  autoFocus
                />
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4 text-slate-400" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
                <div className="flex justify-end text-xs">
                  <button
                    type="button"
                    onClick={() => { setMode('reset'); setError(null); setInfoMsg(null); }}
                    className="text-blue-400 hover:text-blue-300 font-medium transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <Button type="submit" variant="primary" isLoading={isLoading} icon={<ArrowRight className="w-4 h-4" />}>
                  Sign In
                </Button>
              </form>
            ) : mode === 'signup' ? (
              <form onSubmit={(e) => handleSignUpRequest(e, false)} className="flex flex-col gap-4">
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="Nikhil Lenkewar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  icon={<User className="w-4 h-4 text-slate-400" />}
                  autoFocus
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="w-4 h-4 text-slate-400" />}
                />
                <div>
                  <Input
                    label="Create Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={<Lock className="w-4 h-4 text-slate-400" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />
                  {renderPasswordRequirements(password)}
                </div>
                <Button type="submit" variant="primary" isLoading={isLoading} icon={<ArrowRight className="w-4 h-4" />}>
                  Send Verification Code
                </Button>
              </form>
            ) : (
              /* Forgot Password Request Form */
              <form onSubmit={(e) => handleResetRequest(e, false)} className="flex flex-col gap-4">
                <Input
                  label="Registered Email Address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="w-4 h-4 text-slate-400" />}
                  autoFocus
                />
                <Button type="submit" variant="primary" isLoading={isLoading} icon={<ArrowRight className="w-4 h-4" />}>
                  Send Reset Code
                </Button>
                <div className="flex justify-center text-xs mt-1">
                  <button
                    type="button"
                    onClick={() => { setMode('signin'); setError(null); setInfoMsg(null); }}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )
          ) : step === 'verify_signup' ? (
            <form onSubmit={handleVerifySignUp} className="flex flex-col gap-4">
              <div className="text-xs text-slate-300 text-center leading-relaxed">
                Verification code sent to <span className="font-semibold text-white">{email}</span>
              </div>

              <Input
                label="6-Digit Verification Code"
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                icon={<ShieldCheck className="w-4 h-4 text-slate-400" />}
                className="text-center font-mono tracking-widest text-lg"
                autoFocus
              />

              <Button type="submit" variant="primary" isLoading={isLoading}>
                Verify & Create Account
              </Button>

              <div className="flex justify-between items-center text-xs mt-1">
                <button
                  type="button"
                  onClick={() => { setStep('form'); setError(null); }}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Back to signup
                </button>

                <button
                  type="button"
                  onClick={() => handleSignUpRequest(undefined, true)}
                  disabled={cooldown > 0 || isLoading}
                  className="text-blue-400 hover:text-blue-300 disabled:opacity-40 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}</span>
                </button>
              </div>
            </form>
          ) : step === 'verify_reset' ? (
            /* Forgot Password Verification & Reset Form */
            <form onSubmit={handleVerifyReset} className="flex flex-col gap-4">
              <div className="text-xs text-slate-300 text-center leading-relaxed">
                Password reset code sent to <span className="font-semibold text-white">{email}</span>
              </div>

              <Input
                label="6-Digit Verification Code"
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                icon={<ShieldCheck className="w-4 h-4 text-slate-400" />}
                className="text-center font-mono tracking-widest text-lg"
                autoFocus
              />

              <div>
                <Input
                  label="New Password"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4 text-slate-400" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
                {renderPasswordRequirements(newPassword)}
              </div>

              <Button type="submit" variant="primary" isLoading={isLoading}>
                Reset Password & Sign In
              </Button>

              <div className="flex justify-between items-center text-xs mt-1">
                <button
                  type="button"
                  onClick={() => { setStep('form'); setMode('signin'); setError(null); }}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Back to sign in
                </button>

                <button
                  type="button"
                  onClick={() => handleResetRequest(undefined, true)}
                  disabled={cooldown > 0 || isLoading}
                  className="text-blue-400 hover:text-blue-300 disabled:opacity-40 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyReverify} className="flex flex-col gap-4">
              <div className="text-xs text-slate-300 text-center leading-relaxed">
                Monthly 30-day email re-verification code sent to <span className="font-semibold text-white">{email}</span>
              </div>

              <Input
                label="6-Digit Re-Verification Code"
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                icon={<ShieldCheck className="w-4 h-4 text-slate-400" />}
                className="text-center font-mono tracking-widest text-lg"
                autoFocus
              />

              <Button type="submit" variant="primary" isLoading={isLoading}>
                Verify & Complete Login
              </Button>

              <div className="flex justify-between items-center text-xs mt-1">
                <button
                  type="button"
                  onClick={() => { setStep('form'); setError(null); }}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Back to login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

