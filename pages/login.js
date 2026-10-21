import { useState } from 'react';
import Head from 'next/head';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Data Privacy Modal States
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [hasAgreedTerms, setHasAgreedTerms] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsSuccess(false);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      if (!supabase) {
        throw new Error('Database connection failed.');
      }

      let authenticatedProfile = null;

      // 1. Verify via secure database RPC
      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc('check_profile_login', {
          user_email: cleanEmail,
          input_password: cleanPassword,
        });

        if (!rpcErr && rpcData) {
          authenticatedProfile = rpcData;
        }
      } catch (rpcException) {
        console.warn('RPC check bypassed, checking direct fallback...', rpcException);
      }

      // 2. Direct Fallback if RPC is initializing
      if (!authenticatedProfile) {
        const { data: directProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', cleanEmail)
          .single();

        if (directProfile && (directProfile.status === 'Active' || !directProfile.status)) {
          if (
            directProfile.password === cleanPassword ||
            directProfile.school_id === cleanPassword
          ) {
            authenticatedProfile = directProfile;
          }
        }
      }

      if (!authenticatedProfile) {
        throw new Error('Invalid email or password.');
      }

      // 3. Save session and initialize 5-minute activity timer
      const userRole = authenticatedProfile.role || 'student';
      sessionStorage.setItem('cec_role', userRole);
      sessionStorage.setItem('cec_user_email', authenticatedProfile.email);
      sessionStorage.setItem('cec_school_id', authenticatedProfile.school_id || '');
      sessionStorage.setItem('cec_full_name', authenticatedProfile.full_name || '');
      sessionStorage.setItem('cec_can_scan', authenticatedProfile.can_scan ? 'true' : 'false');
      localStorage.setItem('cec_last_active_time', Date.now().toString());

      // 4. Role Routing
      if (userRole === 'admin') {
        router.push('/admin');
      } else if (authenticatedProfile.must_change_password) {
        router.push('/update-password');
      } else if (userRole === 'staff') {
        router.push('/admin');
      } else {
        setHasAgreedTerms(false);
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
    if (!hasAgreedTerms) return;
    setShowPrivacyModal(false);
    router.push('/dashboard');
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setMessage('Please enter your email address to request a reset link.');
      setIsSuccess(false);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/update-password` : '',
    });
    setLoading(false);
    if (error) {
      setMessage('Invalid credentials.');
      setIsSuccess(false);
    } else {
      setMessage('Password reset link sent to your registered email.');
      setIsSuccess(true);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <Head>
        <title>Login • CEC TRACK</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      <div className={styles.loginCard}>
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
              alt="CEC Logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextSibling) {
                  e.currentTarget.nextSibling.style.display = 'block';
                }
              }}
            />
            <span style={{ display: 'none', fontWeight: 900, color: '#15803d', fontSize: '0.95rem' }}>
              CEC
            </span>
          </div>
        </div>

        <div className={styles.loginHeader}>
          <h1 className={styles.loginTitle}>
            Welcome to <br />
            <span className={styles.loginTitleHighlight}>CECTRACK</span>
          </h1>
          <p className={styles.loginSubtitle}>Enter your credentials to access your portal.</p>
        </div>

        <form onSubmit={handleLogin} className={styles.loginForm}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Email Address</label>
            <div className={styles.inputWrapper}>
              <div className={styles.inputIconLeft}>
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Password</label>
            <div className={styles.inputWrapper}>
              <div className={styles.inputIconLeft}>
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
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

          <div className={styles.forgotPasswordWrapper}>
            <button type="button" onClick={handleForgotPassword} className={styles.forgotPasswordBtn}>
              Forgot Password?
            </button>
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Authenticating...' : 'Log In'}
          </button>
        </form>

        {message && (
          <div
            className={styles.alertMessage}
            style={isSuccess ? { color: '#15803d', backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' } : {}}
          >
            {message}
          </div>
        )}

        <div className={styles.backLinkWrapper}>
          <Link href="/" className={styles.backLink}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.backIcon}>
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>

      {showPrivacyModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(5px)',
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
              maxWidth: '560px',
              maxHeight: '92vh',
              overflowY: 'auto',
              borderRadius: '26px',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.35rem',
                  flexShrink: 0,
                }}
              >
                🛡️
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  Data Privacy Notice
                </h3>
                <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  RA 10173 COMPLIANCE • OFFICIAL POLICY
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#ffedd5', color: '#ea580c', fontWeight: 900, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  1
                </div>
                <div>
                  <h4 style={{ margin: '0 0 3px 0', fontSize: '0.88rem', fontWeight: 900, color: '#0f172a' }}>
                    Confidentiality &amp; Non-Disclosure
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.45 }}>
                    You agree that all member directories, attendance logs, voting ballots, and internal organization materials accessible via CECTRACK are strictly confidential.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#ffedd5', color: '#ea580c', fontWeight: 900, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  2
                </div>
                <div>
                  <h4 style={{ margin: '0 0 3px 0', fontSize: '0.88rem', fontWeight: 900, color: '#0f172a' }}>
                    Personal Data Protection (No Sharing)
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.45 }}>
                    You must not screenshot, scrape, share, or disclose any personal details (names, student IDs, contact numbers, or emails) of fellow students or officers with external parties.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#ffedd5', color: '#ea580c', fontWeight: 900, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  3
                </div>
                <div>
                  <h4 style={{ margin: '0 0 3px 0', fontSize: '0.88rem', fontWeight: 900, color: '#0f172a' }}>
                    Digital ID &amp; QR Code Security
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.45 }}>
                    Your Digital ID and generated QR code are strictly personal. Sharing or presenting another student&apos;s QR code for proxy attendance is considered a violation.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#ffedd5', color: '#ea580c', fontWeight: 900, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  4
                </div>
                <div>
                  <h4 style={{ margin: '0 0 3px 0', fontSize: '0.88rem', fontWeight: 900, color: '#0f172a' }}>
                    Account Integrity &amp; Accountability
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.45 }}>
                    You are solely responsible for activities occurring under your credentials. Any deliberate breach may result in suspension of portal access and disciplinary review.
                  </p>
                </div>
              </div>
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '12px 14px',
                cursor: 'pointer',
                marginTop: '4px',
              }}
            >
              <input
                type="checkbox"
                checked={hasAgreedTerms}
                onChange={(e) => setHasAgreedTerms(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#15803d', flexShrink: 0 }}
              />
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.4, userSelect: 'none' }}>
                I have read, understood, and agree to abide by the Data Privacy and Non-Disclosure Policy.
              </span>
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={handleAgreePrivacy}
                disabled={!hasAgreedTerms}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: hasAgreedTerms ? '#15803d' : '#cbd5e1',
                  color: '#ffffff',
                  borderRadius: '14px',
                  border: 'none',
                  fontWeight: 900,
                  cursor: hasAgreedTerms ? 'pointer' : 'not-allowed',
                  fontSize: '0.9rem',
                  transition: 'background-color 0.2s ease',
                  boxShadow: hasAgreedTerms ? '0 4px 12px rgba(21, 128, 61, 0.2)' : 'none',
                }}
              >
                ✓ Agree &amp; Enter Portal
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowPrivacyModal(false);
                  setHasAgreedTerms(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  borderRadius: '12px',
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
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
