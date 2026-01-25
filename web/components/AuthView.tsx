
import React, { useState } from 'react';
import { UserProfile, AuthStep } from '../types';
import { apiService } from '../services/api';
import { ChevronRight, Phone, User, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface AuthViewProps {
  onAuthenticated: (profile: UserProfile) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onAuthenticated }) => {
  const [step, setStep] = useState<AuthStep>('PHONE');
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tempProfile, setTempProfile] = useState<UserProfile | null>(null);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;

    setLoading(true);
    setError('');
    try {
      const profile = await apiService.getProfile(phone);
      if (profile && profile.personal_info) {
        setTempProfile(profile);
        setStep('SUCCESS');
      } else {
        setStep('PROFILE_SETUP');
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      if (err.message === 'Failed to fetch') {
        setError('Unable to connect to service. Please check your network.');
      } else {
        setError('An unexpected error occurred during sign-in.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName) return;

    setLoading(true);
    setError('');
    try {
      // Body should be flat user_id, first_name, last_name
      const profile = await apiService.createProfile({
        user_id: phone,
        first_name: firstName,
        last_name: lastName,
      });
      
      if (profile && profile.personal_info) {
        setTempProfile(profile);
        setStep('SUCCESS');
      } else {
        throw new Error('No profile data returned from server.');
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Could not create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const finalizeAuth = () => {
    if (tempProfile) {
      onAuthenticated(tempProfile);
    }
  };

  const getDisplayName = () => {
    return tempProfile?.personal_info?.first_name || firstName || 'User';
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex w-1/2 bg-indigo-950 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl -ml-48 -mb-48"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-50 to-emerald-400 rounded-xl shadow-lg flex items-center justify-center text-white font-bold text-xl">
              HM
            </div>
            <span className="text-2xl font-outfit font-bold text-white tracking-tight">Holly & Morty</span>
          </div>
          
          <h1 className="text-5xl font-outfit font-bold text-white mb-6 leading-tight">
            Financial guidance, <br />
            <span className="text-emerald-400">reimagined.</span>
          </h1>
          <p className="text-indigo-100 text-xl max-w-md leading-relaxed">
            Meet Holly, your dedicated listener, and Morty, your strategic advocate. Together, they navigate your financial future.
          </p>
        </div>

        <div className="relative z-10 flex gap-8 items-end">
          <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex-1">
            <div className="flex items-center gap-2 mb-2 text-indigo-300">
              <Sparkles size={16} />
              <span className="text-xs uppercase tracking-widest font-semibold">The Holly Promise</span>
            </div>
            <p className="text-sm text-indigo-100 italic">"I'm here to listen, truly. Your journey starts with being understood."</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex-1">
            <div className="flex items-center gap-2 mb-2 text-emerald-300">
              <Sparkles size={16} />
              <span className="text-xs uppercase tracking-widest font-semibold">The Morty Logic</span>
            </div>
            <p className="text-sm text-indigo-100 italic">"Facts first, strategy second. Let's build a plan that actually works."</p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          {step === 'PHONE' && (
            <div className="space-y-6">
              <div className="mb-8">
                <h2 className="text-3xl font-outfit font-bold text-slate-900 mb-2">Welcome Back</h2>
                <p className="text-slate-500">Enter your phone number to sign in or get started.</p>
              </div>

              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone size={20} />
                  </div>
                  <input
                    type="tel"
                    required
                    className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm transition-all"
                    placeholder="e.g. +447442141401"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

                <button
                  type="submit"
                  disabled={loading || !phone}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'Continue'}
                  {!loading && <ChevronRight size={20} />}
                </button>
              </form>
            </div>
          )}

          {step === 'PROFILE_SETUP' && (
            <div className="space-y-6">
              <div className="mb-8">
                <h2 className="text-3xl font-outfit font-bold text-slate-900 mb-2">Almost there</h2>
                <p className="text-slate-500">We couldn't find an account for <span className="font-semibold text-slate-700">{phone}</span>. Let's create one.</p>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User size={20} />
                  </div>
                  <input
                    type="text"
                    required
                    className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm transition-all"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User size={20} />
                  </div>
                  <input
                    type="text"
                    required
                    className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm transition-all"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>

                {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'Complete Setup'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('PHONE')}
                  className="w-full text-slate-500 text-sm hover:text-indigo-600 transition-colors"
                >
                  Go back
                </button>
              </form>
            </div>
          )}

          {step === 'SUCCESS' && (
            <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500">
              <div className="mx-auto w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={48} />
              </div>
              <div>
                <h2 className="text-3xl font-outfit font-bold text-slate-900 mb-2">You're in!</h2>
                <p className="text-slate-500">Welcome, {getDisplayName()}. Holly and Morty are ready to assist you.</p>
              </div>
              <button
                onClick={finalizeAuth}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2"
              >
                Enter Dashboard
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthView;
