import React, { useState } from 'react';
import {
  Sparkles,
  Lock,
  Shield,
  ArrowRight,
  BrainCircuit,
  HeartHandshake,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { loginWithGoogle } from '../lib/firebase';

interface AuthScreenProps {
  onAuthSuccess?: () => void;
  onContinueAsGuest?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, onContinueAsGuest }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await loginWithGoogle();
      if (onAuthSuccess) {
        onAuthSuccess();
      }
    } catch (err: any) {
      console.error('Sign in failed:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed before completing. You can retry or click "Try Instant Reflection as Guest".');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked by the browser. Please allow popups or open the app in a new tab, or use Guest mode below.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('This preview domain is being authorized in Firebase Auth. In the meantime, you can use "Try Instant Reflection as Guest" to test immediately.');
      } else {
        setError(
          err.message || 'Failed to sign in with Google. You can also use "Try Instant Reflection as Guest" below.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#1A1414] text-[#F5EFEB] flex flex-col justify-between selection:bg-[#D0888F] selection:text-[#1A1414] relative overflow-y-auto">
      {/* Subtle warm ambient lighting */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-[#D0888F]/15 via-[#C47B82]/5 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-gradient-to-r from-[#D0888F]/10 to-transparent blur-3xl pointer-events-none rounded-full" />

      {/* Top Header Bar */}
      <div className="w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#D0888F] via-[#C47B82] to-[#E5A862] p-0.5 shadow-lg shadow-[#D0888F]/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#221A1A] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#D0888F]" />
            </div>
          </div>
          <span className="font-bold text-lg tracking-tight text-[#F5EFEB]">
            Kite AI
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#C7BCB8] bg-[#221A1A] px-3.5 py-1.5 rounded-full border border-[#3D3030]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Gemini 3.6 Flash &bull; Cloud Firestore</span>
        </div>
      </div>

      {/* Main Container */}
      <main className="w-full max-w-3xl mx-auto px-6 py-10 flex-1 flex flex-col justify-center items-center text-center z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D0888F]/10 border border-[#D0888F]/20 text-[#D0888F] text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-[#D0888F]" />
          <span>MINDFUL EXECUTIVE REFLECTION & JOURNALING</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl text-[#F5EFEB] tracking-tight font-extrabold max-w-2xl leading-[1.15] mb-6">
          Clarity for your thoughts, powered by{' '}
          <span className="bg-gradient-to-r from-[#D0888F] via-[#E5A862] to-[#D0888F] bg-clip-text text-transparent">
            Gemini AI
          </span>
          .
        </h1>

        <p className="text-base sm:text-lg text-[#C7BCB8] max-w-xl font-sans mb-8 leading-relaxed">
          Thoughtful inquiry, 4-dimensional mood tracking, and multi-turn executive reflections—safely persisted to your private Cloud Firestore partition.
        </p>

        {/* Auth Action Card */}
        <div className="w-full max-w-md bg-[#221A1A]/95 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-2xl border border-[#3D3030] mb-10 text-left">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-[#F5EFEB]">Sign In to Your Journal</h2>
            <span className="text-[10px] text-[#D0888F] bg-[#D0888F]/10 px-2 py-0.5 rounded border border-[#D0888F]/20 font-mono">
              Google OAuth
            </span>
          </div>
          <p className="text-xs text-[#8F827E] mb-6">
            Sign in with Google to load your secure, isolated reflection logs.
          </p>

          {error && (
            <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            <button
              id="btn-google-login"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-[#D0888F] hover:bg-[#C47B82] text-[#1A1414] font-bold text-sm transition-all duration-150 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#1A1414]" />
                  <span>Connecting to Google Auth...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                  <ArrowRight className="w-4 h-4 text-[#1A1414]" />
                </>
              )}
            </button>

            {onContinueAsGuest && (
              <button
                id="btn-guest-mode"
                onClick={onContinueAsGuest}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#2A2121] hover:bg-[#332929] border border-[#3D3030] hover:border-[#D0888F]/50 text-[#C7BCB8] hover:text-[#F5EFEB] text-xs font-semibold transition-all cursor-pointer"
              >
                <span>Try Instant Reflection as Guest</span>
              </button>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-[#3D3030] flex items-center justify-between text-[11px] text-[#8F827E]">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-[#8F827E]" /> Direct Google Auth
            </span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Firestore Isolated
            </span>
          </div>
        </div>

        {/* Feature 3-Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl text-left">
          <div className="p-4 rounded-xl bg-[#221A1A] border border-[#3D3030] shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-[#D0888F]/10 border border-[#D0888F]/20 flex items-center justify-center mb-2.5 text-[#D0888F]">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-[#F5EFEB] mb-1">Gemini 3.6 Flash Matrix</h3>
            <p className="text-[11px] text-[#8F827E] leading-relaxed">
              Auto-failover ladder across 3.6 Flash, 3.1 Flash-Lite, and 3.7 Flash.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#221A1A] border border-[#3D3030] shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-[#E5A862]/10 border border-[#E5A862]/20 flex items-center justify-center mb-2.5 text-[#E5A862]">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-[#F5EFEB] mb-1">4-Dimensional Moods</h3>
            <p className="text-[11px] text-[#8F827E] leading-relaxed">
              Tag entries as Happy, Anxious, Creative, or Reflected to calibrate Gemini's tone.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#221A1A] border border-[#3D3030] shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-2.5 text-emerald-400">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-[#F5EFEB] mb-1">Owner-Isolated Storage</h3>
            <p className="text-[11px] text-[#8F827E] leading-relaxed">
              Server-side API keys and Firestore security rules safeguard your private logs.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-4 border-t border-[#3D3030] flex flex-col sm:flex-row items-center justify-between text-xs text-[#8F827E] gap-2 z-10">
        <span>Gemini AI Reflection Companion</span>
        <span>Secured with Firebase Auth & Cloud Firestore</span>
      </footer>
    </div>
  );
};
