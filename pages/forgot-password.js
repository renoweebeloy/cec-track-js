import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Home.module.css';

export default function ForgotPassword() {
  const router = useRouter();

  // Official Google Apps Script Web App URL
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzuVn8MyNNu472-_t3HWfcZNVZVNDOEs9VNrKihAc2fshTrGrmxzRnysvZf4t7-TFU/exec';

  // Step 1: Input ID & Email | Step 2: Verify Code | Step 3: New Password
  const [step, setStep] = useState(1);
  const [schoolId, setSchoolId] = useState('');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resetRecordId, setResetRecordId] = useState(null);

  // Password States for Step 3
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // ========================================================
  // STEP 1: SEND 6-DIGIT CODE TO GMAIL
  // ========================================================
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    const cleanSchoolId = schoolId.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanSchoolId || !cleanEmail) {
      setMessage({ type: 'error', text: 'Please enter both your School ID and registered email address.' });
      return;
    }

    setLoading(true);

    try {
      if (!supabase) throw new Error('Database connection failed.');

      // Check if School ID and Email match an existing profile
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('full_name, email, school_id')
        .eq('school_id', cleanSchoolId)
        .eq('email', cleanEmail)
        .maybeSingle();

      if (profileErr || !profile) {
        throw new Error('Account not found. Please verify that your School ID and email address are correct.');
      }

      // Generate random 6-digit verification code
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes validity

      // Save OTP record to Supabase
      const { error: resetErr } = await supabase.from('password_resets').insert([
        {
          email: cleanEmail,
          otp_code: generatedCode,
          expires_at: expiresAt,
          used: false,
        },
      ]);

      if (resetErr) throw new Error(resetErr.message);

      // Trigger Google Apps Script Web App
      if (APPS_SCRIPT_URL) {
        await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            code: generatedCode,
            name: profile.full_name || 'CEC Member',
          }),
        });
      }

      setMessage({
        type: 'success',
        text: `Verification code sent to ${cleanEmail}! Please check your email inbox or spam folder.`,
      });
      setOtpCode('');
      setStep(2);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to send verification code.' });
    } finally {
      setLoading(false);
    }
  };

  // ========================================================
  // STEP 2: VERIFY 6-DIGIT CODE ONLY
  // ========================================================
  const handleVerifyOtpOnly = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otpCode.trim();

    if (cleanOtp.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter the complete 6-digit verification code.' });
      return;
    }

    setLoading(true);

    try {
      // Find latest valid OTP for this email
      const { data: record, error: checkErr } = await supabase
        .from('password_resets')
        .select('*')
        .eq('email', cleanEmail)
        .eq('otp_code', cleanOtp)
        .eq('used', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (checkErr || !record) {
        throw new Error('Invalid verification code. Please check your email and try again.');
      }

      // Check if code has expired
      if (new Date() > new Date(record.expires_at)) {
        throw new Error('This verification code has expired. Please request a new one.');
      }

      setResetRecordId(record.id);
      setNewPassword('');
      setConfirmPassword('');
      setMessage({
        type: 'success',
        text: 'Code verified successfully! You may now create your new password.',
      });
      setStep(3);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Verification failed.' });
    } finally {
      setLoading(false);
    }
  };

  // ========================================================
  // STEP 3: SAVE NEW PASSWORD TO DATABASE
  // ========================================================
  const handleSaveNewPassword = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match. Please verify.' });
      return;
    }

    setLoading(true);
    const cleanSchoolId = schoolId.trim();
    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Mark OTP record as used
      if (resetRecordId) {
        await supabase
          .from('password_resets')
          .update({ used: true })
          .eq('id', resetRecordId);
      }

      // 2. Update password in profiles table (hashed automatically by database trigger)
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          password: newPassword.trim(),
          must_change_password: false,
        })
        .eq('school_id', cleanSchoolId)
        .eq('email', cleanEmail);

      if (updateErr) throw new Error(updateErr.message);

      setMessage({
        type: 'success',
        text: 'Password updated successfully! Redirecting you to login...',
      });

      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Error updating password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <Head>
        <title>Forgot Password • CECTRACK</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      <div className={styles.loginCard} style={{ maxWidth: '440px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              backgroundColor: '#f0fdf4',
              border: '2px solid #bbf7d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(21, 128, 61, 0.12)',
              overflow: 'hidden',
              padding: '6px',
            }}
          >
            <img
              src="/logo.png"
              alt="CEC Logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </div>

        {/* Dynamic Header */}
        <div className={styles.loginHeader}>
          <h1 className={styles.loginTitle} style={{ fontSize: '1.5rem' }}>
            {step === 1 && 'Reset Password'}
            {step === 2 && 'Enter Verification Code'}
            {step === 3 && 'Create New Password'}
          </h1>
          <p className={styles.loginSubtitle}>
            {step === 1 && 'Enter your School ID and registered email address to receive a verification code.'}
            {step === 2 && `Enter the 6-digit verification code sent to ${email}.`}
            {step === 3 && 'Your identity has been verified. Set your new password below.'}
          </p>
        </div>

        {/* STEP 1: SCHOOL ID AND EMAIL INPUT */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className={styles.loginForm} autoComplete="off">
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>School ID</label>
              <div className={styles.inputWrapper}>
                <div className={styles.inputIconLeft}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="e.g. 2024-0616"
                  className={styles.loginInput}
                  value={schoolId}
                  onChange={(e) => setSchoolId(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Registered Email Address</label>
              <div className={styles.inputWrapper}>
                <div className={styles.inputIconLeft}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  placeholder="name@dorsu.edu.ph"
                  className={styles.loginInput}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Sending Code...' : 'Send Verification Code ➔'}
            </button>
          </form>
        )}

        {/* STEP 2: VERIFICATION CODE ONLY */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtpOnly} className={styles.loginForm} autoComplete="off">
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>6-Digit Verification Code</label>
              <input
                type="text"
                placeholder="Enter verification code"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className={styles.loginInput}
                style={{
                  textAlign: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  letterSpacing: '4px',
                  padding: '14px',
                }}
                required
                autoFocus
              />
            </div>

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Verifying Code...' : 'Verify Code ➔'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setMessage({ type: '', text: '' });
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: '6px',
                textDecoration: 'underline',
              }}
            >
              Didn&apos;t receive the code? Change ID/email or resend
            </button>
          </form>
        )}

        {/* STEP 3: NEW PASSWORD & CONFIRM PASSWORD */}
        {step === 3 && (
          <form onSubmit={handleSaveNewPassword} className={styles.loginForm} autoComplete="off">
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>New Password</label>
              <div className={styles.inputWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  className={styles.loginInput}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ paddingRight: '3rem' }}
                  autoComplete="new-password"
                  required
                  autoFocus
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
              <label className={styles.inputLabel}>Confirm New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter new password"
                className={styles.loginInput}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Saving Password...' : 'Save New Password ➔'}
            </button>
          </form>
        )}

        {/* Status Notification Message */}
        {message.text && (
          <div
            className={styles.alertMessage}
            style={{
              marginTop: '16px',
              color: message.type === 'error' ? '#b91c1c' : '#15803d',
              backgroundColor: message.type === 'error' ? '#fef2f2' : '#f0fdf4',
              borderColor: message.type === 'error' ? '#fee2e2' : '#bbf7d0',
            }}
          >
            {message.text}
          </div>
        )}

        <div className={styles.backLinkWrapper}>
          <Link href="/login" className={styles.backLink}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.backIcon}>
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
