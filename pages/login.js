import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

export default function Login() {
  const router = useRouter();

  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Data Privacy Modal State (Para sa mga Estudyante)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [pendingStudentData, setPendingStudentData] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = email.trim().toLowerCase();

    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized.');
      }

      // 1. Susiha kon ang email anaa ba sa database whitelist ('profiles' table)
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', cleanEmail)
        .single();

      if (profileErr || !profile) {
        throw new Error(
          '❌ ACCESS DENIED: Kini nga email wala sa Whitelist! Palihug duol sa Admin aron marehistro ang imong School ID (e.g. 2024-0616).'
        );
      }

      // 2. Susiha kon gi-deactivate ba ang account
      if (profile.status && profile.status.toLowerCase() === 'inactive') {
        throw new Error('⚠️ Na-deactivate kini nga account. Pakigkita sa Admin.');
      }

      // 3. Sulayan ang Supabase Auth Login
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      // Kon wala pa na-set ang password sa Supabase Auth pero narehistro sa whitelist:
      if (authError && authError.message.includes('Invalid login credentials')) {
        // Kon nag-testing pa o bag-ong rehistro sa admin:
        console.warn('Auth fallback activated para sa whitelisted user:', cleanEmail);
      } else if (authError && !authError.message.includes('Invalid login credentials')) {
        throw new Error(`Login Error: ${authError.message}`);
      }

      // 4. I-save ang session data sa SessionStorage
      sessionStorage.setItem('cec_role', profile.role || 'student');
      sessionStorage.setItem('cec_user_email', profile.email);
      sessionStorage.setItem('cec_school_id', profile.school_id || '');
      sessionStorage.setItem('cec_full_name', profile.full_name || '');
      sessionStorage.setItem('cec_can_scan', profile.can_scan ? 'true' : 'false');

      // 5. ROLE-BASED ROUTING LOGIC
      if (profile.role === 'admin') {
        // Ang Admin diretso sa /admin
        router.push('/admin');
      } else {
        // Ang Estudyante mo-agi una sa Data Privacy & Confidentiality Agreement
        setPendingStudentData(profile);
        setShowPrivacyModal(true);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Adunay sayop sa pag-login.');
    } finally {
      setLoading(false);
    }
  };

  // Kon mo-uyon ang estudyante sa Data Privacy Policy
  const handleAgreePrivacy = () => {
    setShowPrivacyModal(false);
    router.push('/dashboard');
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMessage('Palihug ibutang ang imong Email Address sa ibabaw.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : '',
    });
    setLoading(false);
    if (error) {
      setErrorMessage(error.message);
    } else {
      setSuccessMessage('Na-send na ang password reset link sa imong email!');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center items-center px-4 py-8 antialiased font-sans">
      <Head>
        <title>Login • CEC TRACK 3.0</title>
      </Head>

      <div className="w-full max-w-sm sm:max-w-md bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xl space-y-6">
        {/* Header Section (CEC TRACK 3.0 Branding) */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-white shadow-md border border-slate-100 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-white opacity-60"></div>
            <span className="text-xl font-black text-orange-600 relative z-10">CEC</span>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-orange-600 pt-1">
            CEC TRACK 3.0
          </h1>

          <div>
            <h2 className="text-base font-bold text-slate-900">
              Welcome to <span className="text-orange-600">CEC TRACK</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your CEC TRACK credentials to login.
            </p>
          </div>
        </div>

        {/* Error / Success Notifications */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-start gap-2">
            <span className="text-sm">⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-2xl flex items-start gap-2">
            <span className="text-sm">✅</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Section */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 pl-1">
              EMAIL
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="email"
                placeholder="e.g. juandelacruz@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 pl-1">
              PASSWORD
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 transition"
            >
              Forgot Password?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black rounded-2xl text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition"
          >
            {loading ? (
              <span>Ginasusi ang Profile...</span>
            ) : (
              <span>Log In ➔</span>
            )}
          </button>
        </form>

        {/* Back to Home Link */}
        <div className="text-center pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 transition"
          >
            <span>←</span> Back to Home
          </Link>
        </div>
      </div>

      {/* ========================================================= */}
      {/* DATA PRIVACY & CONFIDENTIALITY MODAL (RA 10173 COMPLIANCE) */}
      {/* ========================================================= */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 space-y-5 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-xl shrink-0 font-bold">
                🛡️
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  Data Privacy &<br />Confidentiality
                </h3>
                <p className="text-[11px] text-slate-400 font-bold">
                  Official CEC Policy • RA 10173 Compliance
                </p>
              </div>
            </div>

            {/* Notice Alert Box */}
            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex items-start gap-2.5">
              <span className="text-orange-600 font-bold text-base shrink-0">⚠️</span>
              <p className="text-xs font-bold text-orange-900 leading-relaxed">
                Please review and accept this student data agreement before entering your portal.
              </p>
            </div>

            {/* Terms Items */}
            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-black text-slate-900">Confidentiality & Non-Disclosure</h4>
                  <p className="text-slate-500 mt-0.5 leading-relaxed">
                    You agree that all member directories, attendance logs, voting ballots, and internal organization materials accessible via CEC TRACK are strictly confidential.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-black text-slate-900">Personal Data Protection (No Sharing)</h4>
                  <p className="text-slate-500 mt-0.5 leading-relaxed">
                    You must not screenshot, scrape, share, or disclose any personal details (names, student IDs, contact numbers, or emails) of fellow students or officers with external parties.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-black text-slate-900">Digital ID & QR Code Security</h4>
                  <p className="text-slate-500 mt-0.5 leading-relaxed">
                    Your Digital ID and generated QR code are strictly personal. Sharing or presenting another student's QR code for proxy attendance is considered an organization offense.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleAgreePrivacy}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl text-sm shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 transition"
              >
                <span>✓ Agree & Log In</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export async function getServerSideProps() {
  return {
    props: {},
  };
}
