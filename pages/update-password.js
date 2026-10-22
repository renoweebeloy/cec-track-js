import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Home.module.css';

export default function UpdatePassword() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('student');
  const [schoolId, setSchoolId] = useState('');

  useEffect(() => {
    const email = typeof window !== 'undefined' ? sessionStorage.getItem('cec_user_email') : null;
    const role = typeof window !== 'undefined' ? sessionStorage.getItem('cec_role') : 'student';
    const id = typeof window !== 'undefined' ? sessionStorage.getItem('cec_school_id') : '';

    if (!email) {
      router.replace('/login');
      return;
    }

    setUserEmail(email);
    setUserRole(role);
    setSchoolId(id);
  }, [router]);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsSuccess(false);

    if (newPassword.length < 6) {
      setMessage('Password must contain at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('New password and confirmation password do not match.');
      return;
    }

    if (schoolId && newPassword.trim().toLowerCase() === schoolId.trim().toLowerCase()) {
      setMessage('You cannot reuse your default School ID as your new password.');
      return;
    }

    setLoading(true);

    try {
      if (!supabase) {
        throw new Error('Database connection failed.');
      }

      // 1. I-UPDATE DIREKTA SA PROFILES DATABASE TABLE (Dili na magsalig sa auth session)
      const { error: dbErr } = await supabase
        .from('profiles')
        .update({
          password: newPassword.trim(),
          must_change_password: false,
        })
        .eq('email', userEmail.trim().toLowerCase());

      if (dbErr) {
        throw new Error(dbErr.message);
      }

      // 2. I-update usab sa Supabase Auth kung anaa man gani session
      try {
        await supabase.auth.updateUser({ password: newPassword.trim() });
      } catch (authIgnored) {
        // Dili igsapayan kon walay auth session kay naa na sa database profiles ang password
      }

      setIsSuccess(true);
      setMessage('Password updated successfully! Redirecting...');

      // 3. Diretso padulong sa Dashboard o Admin
      setTimeout(() => {
        if (userRole === 'staff') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      }, 1200);
    } catch (err) {
      setMessage(err.message || 'Failed to update password.');
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <Head>
        <title>Set New Password • CEC TRACK</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      <div className={styles.loginCard}>
        {/* Security Lock Badge */}
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
              fontSize: '1.5rem',
            }}
          >
            🔒
          </div>
        </div>

        <div className={styles.loginHeader}>
          <h1 className={styles.loginTitle} style={{ fontSize: '1.85rem' }}>
            Set New <br />
            <span className={styles.loginTitleHighlight}>Password</span>
          </h1>
          <p className={styles.loginSubtitle}>
            This is your first login using default credentials. Create a personal password to secure your account.
          </p>
        </div>

        <form onSubmit={handlePasswordUpdate} className={styles.loginForm}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>NEW PASSWORD *</label>
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
                placeholder="At least 6 characters"
                className={styles.loginInput}
                style={{ paddingRight: '3rem' }}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>CONFIRM NEW PASSWORD *</label>
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
                placeholder="Re-enter new password"
                className={styles.loginInput}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Saving Changes...' : 'Update & Continue ➔'}
          </button>
        </form>

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
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
