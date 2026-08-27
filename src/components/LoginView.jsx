import React, { useState, useRef } from 'react';
import { 
  CheckSquare, 
  Lock, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Users,
  Database
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { TEAM_MEMBERS, getDepartmentBadge } from '../lib/demoData';
import univerzLogo from '../assets/univerz-logo.png';

export default function LoginView() {
  const { login, profiles } = useTasks();
  const [identifier, setIdentifier] = useState('ashan@company.com');
  const [password, setPassword] = useState('Ashan@Password123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const passwordRef = useRef(null);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg('Please enter your company username or email address.');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your account password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await login(identifier.trim(), password);
      if (!res.success) {
        setErrorMsg(res.error || 'Invalid credentials. Access denied.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication error. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (username) => {
    setIdentifier(username);
    setPassword('');
    setErrorMsg('');
    if (passwordRef.current) {
      passwordRef.current.focus();
    }
  };

  const teamList = profiles && profiles.length > 0 ? profiles : TEAM_MEMBERS;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-slate-950">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl shadow-xl shadow-orange-500/20 ring-4 ring-orange-500/20 mb-2 overflow-hidden bg-[#de7843] p-1.5">
            <img src={univerzLogo} alt="univerz Logo" className="w-full h-full object-cover rounded-xl" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            univerz Task Board
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Sign in with your verified Supabase company account
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 shadow-2xl backdrop-blur-2xl">
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5 shadow-lg">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-rose-400" />
              <div className="flex-1 font-medium leading-relaxed">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Username or Email */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Username / Email</span>
                <span className="text-[10px] text-slate-500">e.g. "ashan" or "ashan@company.com"</span>
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="ashan, widura, sahan..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs text-white placeholder:text-slate-500 font-medium"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your Supabase account password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl glass-input text-xs text-white placeholder:text-slate-500 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying with Supabase...</span>
                </div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Quick Username Autocomplete */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Users size={12} className="text-indigo-400" />
                Select Username (6 Supabase Members):
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {teamList.map((member) => {
                const isSelected = identifier.toLowerCase() === member.username || identifier.toLowerCase() === member.email;

                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => handleQuickFill(member.username)}
                    className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500/60 shadow-md text-white'
                        : 'bg-slate-900/70 hover:bg-slate-800/90 border-slate-800 text-slate-300'
                    }`}
                  >
                    <img
                      src={member.avatar_url}
                      alt={member.full_name}
                      className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-700 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-bold truncate block">
                        {member.full_name || member.username}
                      </span>
                      <span className="text-[9px] text-slate-400 block truncate">
                        @{member.username} &bull; {member.department}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Security badge */}
        <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-2">
          <Database size={13} className="text-emerald-400" />
          <span>Strict Supabase Authentication & Role Verification</span>
        </div>
      </div>
    </div>
  );
}
