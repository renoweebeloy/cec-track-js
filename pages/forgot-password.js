import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

const STEPS = ['Account', 'Code', 'Password'];
const ICONS = {
  id: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2',
  mail: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  lock: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
};
const Ic = ({ d }) => (
  <span className="fp-ic">
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={ICONS[d]} />
    </svg>
  </span>
);

export default function ForgotPassword() {
  const router = useRouter();

  // Official Google Apps Script Web App URL
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyetjBCQ7HYgPj_RmE9ik7F9v4-6yVfewhXH8F-0PQKWkabFEqbpcQhxcGz2czK_nnWXA/exec';

  // Step 1: Input ID & Email | Step 2: Verify Code | Step 3: New Password
  const [step, setStep] = useState(1);
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resetRecordId, setResetRecordId] = useState(null);

  // Password States for Step 3
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isErrorMessage, setIsErrorMessage] = useState(false);

  // ========================================================
  // STEP 1: SEND 6-DIGIT CODE TO EMAIL VIA APPS SCRIPT
  // ========================================================
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setStatusMessage('');
    setIsErrorMessage(false);

    const cleanStudentId = (studentId || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanStudentId || !cleanEmail) {
      setIsErrorMessage(true);
      setStatusMessage('Please enter both your Student ID and registered email address.');
      return;
    }

    setLoading(true);

    try {
      if (!supabase) throw new Error('Database connection failed.');

      // 1. Verify user profile in database
      const { data: profiles, error: profileErr } = await supabase
        .from('profiles')
        .select('full_name, email, school_id')
        .eq('school_id', cleanStudentId)
        .eq('email', cleanEmail)
        .limit(1);

      if (profileErr) throw new Error(profileErr.message);

      const profile = profiles && profiles.length > 0 ? profiles[0] : null;

      if (!profile) {
        throw new Error('Account match not found. Please verify your Student ID and Email address.');
      }

      // 2. Generate random 6-digit OTP code
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes validity

      // 3. Save OTP record to Supabase
      const { error: resetErr } = await supabase.from('password_resets').insert([
        {
          email: cleanEmail,
          otp_code: generatedCode,
          expires_at: expiresAt,
          used: false,
        },
      ]);

      if (resetErr) throw new Error(resetErr.message);

      // 4. Send Verification Code via Google Apps Script (Direct CORS Integration)
      if (APPS_SCRIPT_URL) {
        console.log('Sending OTP request to Google Apps Script...');
        const mailResponse = await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          headers: {
            // Using text/plain avoids browser CORS preflight blocking
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify({
            email: cleanEmail,
            code: generatedCode,
            name: profile.full_name || 'CEC Member',
            type: 'reset',
          }),
        });

        const mailResult = await mailResponse.json().catch(() => null);
        console.log('Google Apps Script response:', mailResult);

        if (mailResult && mailResult.status === 'error') {
          throw new Error('Apps Script Mailer Error: ' + mailResult.message);
        }
      }

      setIsErrorMessage(false);
      setStatusMessage(`Verification code sent to ${cleanEmail}! Please check your inbox or spam folder.`);
      setOtpCode('');
      setStep(2);
    } catch (err) {
      console.error('Error in handleSendOtp:', err);
      setIsErrorMessage(true);
      setStatusMessage(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ========================================================
  // STEP 2: VERIFY 6-DIGIT CODE
  // ========================================================
  const handleVerifyOtpOnly = async (e) => {
    e.preventDefault();
    setStatusMessage('');
    setIsErrorMessage(false);

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanOtp = (otpCode || '').trim();

    if (cleanOtp.length !== 6) {
      setIsErrorMessage(true);
      setStatusMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);

    try {
      if (!supabase) throw new Error('Database connection failed.');

      const { data: records, error: checkErr } = await supabase
        .from('password_resets')
        .select('id, expires_at')
        .eq('email', cleanEmail)
        .eq('otp_code', cleanOtp)
        .eq('used', false)
        .order('created_at', { ascending: false })
        .limit(1);

      if (checkErr) throw new Error(checkErr.message);

      const record = records && records.length > 0 ? records[0] : null;

      if (!record) {
        throw new Error('Invalid verification code. Please check your email and try again.');
      }

      if (record.expires_at) {
        const expiryTime = new Date(record.expires_at).getTime();
        if (Date.now() > expiryTime) {
          throw new Error('This verification code has expired. Please request a new one.');
        }
      }

      setResetRecordId(record.id);
      setNewPassword('');
      setConfirmPassword('');
      setIsErrorMessage(false);
      setStatusMessage('Code verified successfully! You may now create your new password.');
      setStep(3);
    } catch (err) {
      setIsErrorMessage(true);
      setStatusMessage(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ========================================================
  // STEP 3: SAVE NEW PASSWORD TO DATABASE
  // ========================================================
  const handleSaveNewPassword = async (e) => {
    e.preventDefault();
    setStatusMessage('');
    setIsErrorMessage(false);

    if (newPassword.length < 6) {
      setIsErrorMessage(true);
      setStatusMessage('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setIsErrorMessage(true);
      setStatusMessage('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    const cleanStudentId = (studentId || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();

    try {
      if (!supabase) throw new Error('Database connection failed.');

      // 1. Mark OTP as used
      if (resetRecordId) {
        await supabase
          .from('password_resets')
          .update({ used: true })
          .eq('id', resetRecordId);
      }

      // 2. Update new password in profiles table
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          password: newPassword.trim(),
          must_change_password: false,
        })
        .eq('school_id', cleanStudentId)
        .eq('email', cleanEmail);

      if (updateErr) throw new Error(updateErr.message);

      setIsErrorMessage(false);
      setStatusMessage('Password updated successfully! Redirecting you to login...');

      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setIsErrorMessage(true);
      setStatusMessage(err.message || 'Error updating password.');
    } finally {
      setLoading(false);
    }
  };

  const title = step === 1 ? 'Reset password' : step === 2 ? 'Enter verification code' : 'Create new password';
  const subtitle =
    step === 1
      ? 'Enter your Student ID and registered email address to receive a verification code.'
      : step === 2
      ? 'Enter the 6-digit verification code sent to your email.'
      : 'Your identity has been verified. Set your new password below.';

  return (
    <div className="fp-page">
      <Head>
        <title>Forgot Password • CECTRACK</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Figtree:wght@500;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        :root{--g8:#064e3b;--g7:#047857;--g6:#059669;--g5:#10b981;--g1:#d1fae5;--g0:#ecfdf5;--ink:#0b2a1e;--mut:#56705f;--line:#cfe5d8}
        *{box-sizing:border-box}
        body{margin:0}
        button{font-family:inherit}
        :focus-visible{outline:3px solid var(--g5);outline-offset:2px}
        .fp-page{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px 16px 24px;font-family:'Figtree',system-ui,sans-serif;color:var(--ink);position:relative;overflow:hidden;
          background:radial-gradient(700px 340px at 6% -8%,rgba(16,185,129,.2),transparent 60%),radial-gradient(600px 320px at 100% 0,rgba(163,230,53,.16),transparent 60%),radial-gradient(760px 380px at 50% 112%,rgba(16,185,129,.12),transparent 60%),#ffffff}
        .fp-page::after{content:'';position:absolute;inset:0;background-image:radial-gradient(rgba(5,150,105,.09) 1px,transparent 1px);background-size:22px 22px;pointer-events:none}
        .fp-page>*{position:relative;z-index:1}
        .fp-card{width:100%;max-width:450px;background:#fff;border-radius:30px;padding:62px 26px 26px;margin-top:58px;position:relative;box-shadow:0 0 0 1px #d6ebdf,0 24px 60px rgba(6,78,59,.14);animation:fp-rise .6s both}
        @keyframes fp-rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        .fp-logo{position:absolute;top:-54px;left:50%;transform:translateX(-50%);width:108px;height:108px;border-radius:50%;background:#fff;padding:9px;box-shadow:0 0 0 1px #d6ebdf,0 0 0 7px var(--g0),0 12px 28px rgba(5,150,105,.28);display:flex;align-items:center;justify-content:center}
        .fp-logo img{width:100%;height:100%;object-fit:contain}

        .fp-steps{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:18px}
        .fp-s{display:flex;align-items:center;gap:6px;font-size:.8rem;font-weight:700;color:#8aa597}
        .fp-s i{width:26px;height:26px;border-radius:50%;background:#e5f3ea;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:.76rem;font-weight:800}
        .fp-s.on{color:var(--g7)}
        .fp-s.on i{background:linear-gradient(135deg,var(--g5),var(--g7));color:#fff;box-shadow:0 4px 10px rgba(5,150,105,.3)}
        .fp-line{width:22px;height:2px;background:#d6ebdf;border-radius:2px}

        .fp-head{text-align:center;margin-bottom:20px}
        .fp-head h1{font-family:'Bricolage Grotesque','Figtree',sans-serif;font-size:1.65rem;font-weight:800;letter-spacing:-.03em;margin:0 0 8px;color:var(--g8)}
        .fp-head p{margin:0;font-size:.9rem;color:var(--mut);line-height:1.55}

        .fp-form{display:flex;flex-direction:column;gap:14px}
        .fp-l{display:block;font-size:.84rem;font-weight:700;color:#2f4d3e;margin-bottom:5px}
        .fp-iw{position:relative}
        .fp-ic{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#78a38c;display:flex;pointer-events:none}
        .fp-in{width:100%;padding:13px 14px 13px 44px;border-radius:14px;border:1.5px solid var(--line);font-size:.95rem;font-family:inherit;font-weight:600;color:var(--ink);background:#fafdfb;outline:0;transition:border-color .2s,box-shadow .2s,background .2s}
        .fp-in:focus{border-color:var(--g5);background:#fff;box-shadow:0 0 0 4px rgba(16,185,129,.16)}
        .fp-otp{padding:14px 8px 14px 18px;text-align:center;font-family:'Bricolage Grotesque',sans-serif;font-size:1.9rem;font-weight:800;letter-spacing:.5em;border:2px solid var(--g5);background:var(--g0)}
        .fp-tg{position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:0;color:var(--g7);font-weight:800;font-size:.82rem;cursor:pointer;padding:8px 10px;border-radius:10px}
        .fp-tg:hover{background:var(--g0)}
        .fp-btn{width:100%;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:14px;border:0;border-radius:999px;background:linear-gradient(135deg,var(--g5),var(--g7));color:#fff;font-size:.98rem;font-weight:800;cursor:pointer;box-shadow:0 10px 24px rgba(5,150,105,.34);transition:transform .2s,box-shadow .2s;margin-top:2px}
        .fp-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 14px 30px rgba(5,150,105,.42)}
        .fp-btn:disabled{opacity:.55;cursor:not-allowed;box-shadow:none}
        .fp-lk{background:none;border:0;color:var(--mut);font-size:.86rem;font-weight:700;cursor:pointer;padding:4px;text-align:center}
        .fp-lk:hover{color:var(--g7);text-decoration:underline}
        .fp-n{margin-top:16px;font-size:.86rem;font-weight:700;line-height:1.45;padding:12px 14px;border-radius:14px;border:1px solid}
        .fp-n.ok{color:#047857;background:var(--g0);border-color:#b7ecd3}
        .fp-n.er{color:#b91c1c;background:#fef2f2;border-color:#fecaca}
        .fp-back{display:flex;justify-content:center;margin-top:20px}
        .fp-back a{display:inline-flex;align-items:center;gap:4px;color:var(--mut);font-weight:700;font-size:.86rem;text-decoration:none}
        .fp-back a:hover{color:var(--g7)}
        .fp-foot{margin-top:22px;font-size:.8rem;color:#4f7a63;font-weight:700;text-align:center}

        @media(max-width:420px){.fp-card{padding:60px 18px 22px;border-radius:26px}.fp-s span{display:none}.fp-s.on span{display:inline}}
        @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
      `}</style>

      <div className="fp-card">
        <div className="fp-logo">
          <img src="/logo.png" alt="CEC Logo" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        </div>

        <div className="fp-steps" aria-label="Password reset progress">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              {i > 0 && <span className="fp-line" />}
              <div className={`fp-s ${i + 1 <= step ? 'on' : ''}`}>
                <i>{i + 1 < step ? '✓' : i + 1}</i>
                <span>{s}</span>
              </div>
            </React.Fragment>
          ))}
        </div>

        <div className="fp-head">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>

        {/* STEP 1: STUDENT ID AND EMAIL INPUT */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="fp-form" autoComplete="off">
            <div>
              <label className="fp-l">Student ID</label>
              <div className="fp-iw">
                <Ic d="id" />
                <input className="fp-in" type="text" placeholder="e.g. 2024-0616" value={studentId} onChange={(e) => setStudentId(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="fp-l">Registered email address</label>
              <div className="fp-iw">
                <Ic d="mail" />
                <input className="fp-in" type="email" placeholder="juandelacruz@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            <button type="submit" className="fp-btn" disabled={loading}>{loading ? 'Sending code...' : 'Send verification code'}</button>
          </form>
        )}

        {/* STEP 2: VERIFICATION CODE ONLY */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtpOnly} className="fp-form" autoComplete="off">
            <div>
              <label className="fp-l" style={{ textAlign: 'center' }}>6-digit verification code</label>
              <input
                className="fp-in fp-otp"
                type="text"
                inputMode="numeric"
                placeholder="••••••"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                required
                autoFocus
              />
            </div>
            <button type="submit" className="fp-btn" disabled={loading}>{loading ? 'Verifying code...' : 'Verify code'}</button>
            <button
              type="button"
              className="fp-lk"
              onClick={() => { setStep(1); setStatusMessage(''); setIsErrorMessage(false); }}
            >
              Didn&apos;t receive the code? Change ID/email or resend
            </button>
          </form>
        )}

        {/* STEP 3: NEW PASSWORD & CONFIRM PASSWORD */}
        {step === 3 && (
          <form onSubmit={handleSaveNewPassword} className="fp-form" autoComplete="off">
            <div>
              <label className="fp-l">New password</label>
              <div className="fp-iw">
                <Ic d="lock" />
                <input
                  className="fp-in"
                  style={{ paddingRight: 70 }}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  autoFocus
                />
                <button type="button" className="fp-tg" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button>
              </div>
            </div>
            <div>
              <label className="fp-l">Confirm new password</label>
              <div className="fp-iw">
                <Ic d="lock" />
                <input
                  className="fp-in"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
            <button type="submit" className="fp-btn" disabled={loading}>{loading ? 'Saving password...' : 'Save new password'}</button>
          </form>
        )}

        {/* STATUS NOTIFICATION MESSAGE */}
        {statusMessage && <div className={`fp-n ${isErrorMessage ? 'er' : 'ok'}`}>{statusMessage}</div>}

        <div className="fp-back">
          <Link href="/login">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            Back to login
          </Link>
        </div>
      </div>

      <div className="fp-foot">© 2026 CEC-TRACK • DOrSU Cateel Extension Campus</div>
    </div>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
