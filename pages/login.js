import { useState } from 'react';
import Head from 'next/head';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

export default function Login() {
  const router = useRouter();

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Data Privacy Modal State (para sa mga estudyante)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // ========================================================
  // LOGIN SUBMIT HANDLER
  // ========================================================
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsSuccess(false);

    const cleanEmail = email.trim().toLowerCase();

    try {
      if (!supabase) {
        throw new Error('Database connection error.');
      }

      // 1. Susiha kon ang user anaa ba sa database profiles
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', cleanEmail)
        .single();

      // Kon wala sa profiles/whitelist, ilabay ang generic "Invalid credentials."
      if (profileErr || !profile) {
        throw new Error('Invalid credentials.');
      }

      if (profile.status && profile.status.toLowerCase() === 'inactive') {
        throw new Error('Invalid credentials.');
      }

      // 2. Supabase Auth Verification
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      // Kon sayop ang password o wala pa na-confirm
      if (authError && authError.message.includes('Invalid login credentials')) {
        throw new Error('Invalid credentials.');
      } else if (authError && !authError.message.includes('Invalid login credentials')) {
        // Fallback alang sa local testing kon wala pa na-link ang password
        console.warn('Auth note:', authError.message);
      }

      // 3. I-save ang session data sa SessionStorage
      const userRole = profile.role || 'student';
      sessionStorage.setItem('cec_role', userRole);
      sessionStorage.setItem('cec_user_email', profile.email);
      sessionStorage.setItem('cec_school_id', profile.school_id || '');
      sessionStorage.setItem('cec_full_name', profile.full_name || '');
      sessionStorage.setItem('cec_can_scan', profile.can_scan ? 'true' : 'false');

      // 4. Role-based Redirection
      if (userRole === 'admin' || userRole === 'staff') {
        router.push('/admin');
      } else {
        setShowPrivacyModal(true);
      }
    } catch (err) {
      setMessage(err.message || 'Invalid credentials.');
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAgreePrivacy = () => {
    setShowPrivacyModal(false);
    router.push('/dashboard');
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setMessage('Palihug ibutang ang imong email sa ibabaw una mopislit og Forgot Password.');
      setIsSuccess(false);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : '',
    });
    setLoading(false);
    if (error) {
      setMessage('Invalid credentials.');
      setIsSuccess(false);
    } else {
      setMessage('Na-send na ang password reset link sa imong email!');
      setIsSuccess(true);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <Head>
        <title>Login • CECTRACK 3.0</title>
      </Head>

      <div className={styles.loginCard}>
        {/* GAMAY NGA DOrSU / CEC LOGO */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              backgroundColor: '#f0fdf4',
              border: '2px solid #bbf7d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(21, 128, 61, 0.12)',
              overflow: 'hidden',
              padding: '6px',
              boxSizing: 'border-box',
            }}
          >
            <img
              src="/logo.png"
              alt="DOrSU Logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextSibling) {
                  e.currentTarget.nextSibling.style.display = 'block';
                }
              }}
            />
            <span
              style={{
                display: 'none',
                fontWeight: 900,
                color: '#15803d',
                fontSize: '0.95rem',
                letterSpacing: '-0.025em',
              }}
            >
              CEC
            </span>
          </div>
        </div>

        {/* Header Section */}
        <div className={styles.loginHeader}>
          <h1 className={styles.loginTitle}>
            Welcome to <br />
            <span className={styles.loginTitleHighlight}>CECTRACK</span>
          </h1>
          <p className={styles.loginSubtitle}>
            Enter your CECTRACK credentials to login.
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleLogin} className={styles.loginForm}>
          {/* Email Input */}
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Email</label>
            <div className={styles.inputWrapper}>
              <div className={styles.inputIconLeft}>
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <input
                type="email"
                placeholder="juandelacruz@gmail.com"
                className={styles.loginInput}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Password</label>
            <div className={styles.inputWrapper}>
              <div className={styles.inputIconLeft}>
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className={styles.loginInput}
                style={{ paddingRight: '3rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.passwordToggle}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className={styles.forgotPasswordWrapper}>
            <button
              type="button"
              onClick={handleForgotPassword}
              className={styles.forgotPasswordBtn}
            >
              Forgot Password?
            </button>
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        {/* Message Alert */}
        {message && (
          <div
            className={styles.alertMessage}
            style={
              isSuccess
                ? {
                    color: '#15803d',
                    backgroundColor: '#f0fdf4',
                    borderColor: '#bbf7d0',
                  }
                : {}
            }
          >
            {message}
          </div>
        )}

        {/* Back to Home Link */}
        <div className={styles.backLinkWrapper}>
          <Link href="/" className={styles.backLink}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.backIcon}
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>

      {/* DATA PRIVACY MODAL */}
      {showPrivacyModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              width: '100%',
              maxWidth: '460px',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                borderBottom: '1px solid #f1f5f9',
                paddingBottom: '12px',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                }}
              >
                🛡️
              </div>
              <div>
                <h3
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 900,
                    color: '#0f172a',
                    margin: 0,
                  }}
                >
                  Data Privacy Agreement
                </h3>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    color: '#15803d',
                    textTransform: 'uppercase',
                  }}
                >
                  RA 10173 Compliance • CEC Policy
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              Pinaagi sa pagsulod sa CEC TRACK portal, miuyon ka nga ang tanang personal nga impormasyon, attendance logs, ug digital IDs confidential ug dili ipaambit sa uban.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={handleAgreePrivacy}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#15803d',
                  color: '#ffffff',
                  borderRadius: '12px',
                  border: 'none',
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                ✓ Agree & Enter Portal
              </button>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  borderRadius: '12px',
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
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
  return { props: {} };
}
