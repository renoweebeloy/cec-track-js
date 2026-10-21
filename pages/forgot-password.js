import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Home.module.css';

export default function ForgotPassword() {
  const router = useRouter();

  // ⚠️ ILISI KINI SA IMONG TINAWAG NGA GOOGLE APPS SCRIPT WEB APP URL
  const APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL_HERE';

  // Step 1: Input School ID & Email | Step 2: Input Code & New Password
  const [step, setStep] = useState(1);
  const [schoolId, setSchoolId] = useState('');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // 1. SEND OTP CODE GAMIT ANG GOOGLE APPS SCRIPT (DUAL-VERIFICATION: SCHOOL ID + GMAIL)
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

      // Susiha kon nagtakdo ba ang School ID ug Email sa database
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('full_name, email, school_id')
        .eq('school_id', cleanSchoolId)
        .eq('email', cleanEmail)
        .maybeSingle();

      if (profileErr || !profile) {
        throw new Error('Account match not found. Please verify that your School ID and Email address are correct.');
      }

      // Generate ug Random 6-digit code (e.g. 593812)
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutos validity

      // I-save ang OTP sa Supabase
      const { error: resetErr } = await supabase.from('password_resets').insert([
        {
          email: cleanEmail,
          otp_code: generatedCode,
          expires_at: expiresAt,
          used: false,
        },
      ]);

      if (resetErr) throw new Error(resetErr.message);

      // Tawagon ang Google Apps Script Web App pinaagi sa POST
      if (APPS_SCRIPT_URL && APPS_SCRIPT_URL !== 'YOUR_APPS_SCRIPT_URL_HERE') {
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
        text: `Verification code sent to ${cleanEmail}! Please check your Gmail inbox (or Spam folder).`,
      });
      setStep(2);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to send verification code.' });
    } finally {
      setLoading(false);
    }
  };

  // 2. VERIFY OTP CODE & UPDATE PASSWORD SA DATABASE
  const handleVerifyAndUpdate = async (e) => {
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
    const cleanOtp = otpCode.trim();

    try {
      // Susiha ang pinakabag-ong valid OTP para niining email
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
        throw new Error('Invalid verification code. Please check your Gmail.');
      }

      // Susiha kon na-expire na ba ang 10 minutos
      if (new Date() > new Date(record.expires_at)) {
        throw new Error('This verification code has expired. Please request a new one.');
      }

      // 1. Markahan ang OTP isip used
      await supabase
        .from('password_resets')
        .update({ used: true })
        .eq('id', record.id);

      // 2. I-update ang password sa profiles table (Awtomatikong i-hash sa Bcrypt trigger)
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
        text: '🎉 Password updated successfully! Redirecting you to login...',
      });

      setTimeout(() => {
        router.push('/login');
      }, 2500);
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

        <div className={styles.loginHeader}>
          <h1 className={styles.loginTitle} style={{ fontSize: '1.6rem' }}>
            {step === 1 ? 'Reset Password' : 'Enter Verification Code'}
          </h1>
          <p className={styles.loginSubtitle}>
            {step === 1
              ? 'Enter your School ID and registered Gmail to receive your 6-digit recovery code.'
              : `Enter the code sent to ${email} and set your new password.`}
          </p>
        </div>

        {/* STEP 1: INPUT SCHOOL ID & EMAIL */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className={styles.loginForm}>
            {/* School ID Input */}
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

            {/* Registered Email Input */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Registered Gmail Address</label>
              <div className={styles.inputWrapper}>
                <div className={styles.inputIconLeft}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  placeholder="juandelacruz@dorsu.edu.ph"
                  className={styles.loginInput}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Verifying & Sending Code...' : 'Send Verification Code ➔'}
            </button>
          </form>
        )}

        {/* STEP 2: INPUT OTP & NEW PASSWORD */}
        {step === 2 && (
          <form onSubmit={handleVerifyAndUpdate} className={styles.loginForm}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>6-Digit Verification Code</label>
              <input
                type="text"
                placeholder="e.g. 482910"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className={styles.loginInput}
                style={{
                  textAlign: 'center',
                  fontSize: '1.4rem',
                  fontWeight: 900,
                  letterSpacing: '6px',
                  padding: '12px',
                }}
                required
              />
            </div>

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
              <label className={styles.inputLabel}>Confirm New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter new password"
                className={styles.loginInput}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Verifying & Saving...' : 'Save New Password ➔'}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: '6px',
                textDecoration: 'underline',
              }}
            >
              Didn&apos;t get the code? Change ID/email or resend
            </button>
          </form>
        )}

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
