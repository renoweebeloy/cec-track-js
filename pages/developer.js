import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function DeveloperDashboard() {
  const router = useRouter();

  // Authentication State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // Private Passkey Gate (para ikaw ray makasulod)
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [gateLoading, setGateLoading] = useState(false);
  const [gateError, setGateError] = useState('');

  // Notification Broadcast States
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('security');
  const [broadcasting, setBroadcasting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // History Collection
  const [broadcastHistory, setBroadcastHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // 1. Check existing developer session on load
  useEffect(() => {
    const checkSession = () => {
      try {
        const devSession = sessionStorage.getItem('cec_dev_active');
        if (devSession === 'authorized_developer') {
          setIsUnlocked(true);
          loadBroadcastHistory();
        }
      } catch (e) {}
      setAuthChecking(false);
    };
    checkSession();
  }, []);

  // 2. Private Developer Gate Login
  const handleGateLogin = async (e) => {
    e.preventDefault();
    setGateError('');
    setGateLoading(true);

    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();

    try {
      if (cleanEmail === 'developer@gmail.com' && cleanPassword === '@develorportal123') {
        sessionStorage.setItem('cec_dev_active', 'authorized_developer');
        setIsUnlocked(true);
        loadBroadcastHistory();
        return;
      }

      // Check also with Supabase profiles table
      if (supabase) {
        const { data: devUser, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', cleanEmail)
          .eq('password', cleanPassword)
          .maybeSingle();

        if (devUser && (devUser.role === 'developer' || devUser.email === 'developer@gmail.com')) {
          sessionStorage.setItem('cec_dev_active', 'authorized_developer');
          setIsUnlocked(true);
          loadBroadcastHistory();
          return;
        }
      }

      throw new Error('Access Denied: Invalid Developer credentials.');
    } catch (err) {
      setGateError(err.message || 'Incorrect credentials.');
    } finally {
      setGateLoading(false);
    }
  };

  // 3. Load Sent Developer Notifications
  const loadBroadcastHistory = async () => {
    setLoadingHistory(true);
    try {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('sender', 'Developer </>')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setBroadcastHistory(data);
    } catch (err) {
      console.warn('History fetch note:', err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  const showToast = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => {
      setFeedback({ type: '', text: '' });
    }, 4500);
  };

  // Quick Developer Presets (1-Click Fill)
  const handleApplyPreset = (presetKey) => {
    if (presetKey === 'password_2months') {
      setTitle('Security Notice: Update Your Password Every 2 Months');
      setMessage('To maintain the highest security standard for your student attendance records and digital credentials, all students are required to update their account passwords every 2 months. Please go to your Profile tab to set a new password.');
      setCategory('security');
    } else if (presetKey === 'system_update') {
      setTitle('CECTRACK Engine & Scanner Update');
      setMessage('A system optimization update has been deployed. Attendance QR scanning speed and cross-device sync have been enhanced. No student action is required.');
      setCategory('update');
    } else if (presetKey === 'maintenance') {
      setTitle('Scheduled Database Optimization');
      setMessage('The CECTRACK database engine will undergo routine server maintenance tonight. Attendance records and timestamps are fully backed up and secure.');
      setCategory('maintenance');
    }
  };

  // 4. Send Broadcast to All Students
  const handleSendBroadcast = async (e) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      showToast('error', 'Please enter both the notification title and message.');
      return;
    }

    setBroadcasting(true);
    try {
      const payload = {
        title: title.trim(),
        message: message.trim(),
        sender: 'Developer </ />',
        type: category,
      };

      const { error } = await supabase.from('notifications').insert([payload]);
      if (error) throw error;

      showToast('success', `Notification "${title.trim()}" successfully broadcasted to all students!`);
      setTitle('');
      setMessage('');
      setCategory('security');
      loadBroadcastHistory();
    } catch (err) {
      showToast('error', `Failed to send notification: ${err.message}`);
    } finally {
      setBroadcasting(false);
    }
  };

  // 5. Delete Broadcast Announcement
  const handleDeleteBroadcast = async (id, itemTitle) => {
    const confirmDelete = window.confirm(`Remove notification "${itemTitle}" from student view?`);
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;

      showToast('success', 'Notification removed.');
      loadBroadcastHistory();
    } catch (err) {
      showToast('error', `Delete error: ${err.message}`);
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('cec_dev_active');
    } catch (e) {}
    setIsUnlocked(false);
    router.replace('/');
  };

  if (authChecking) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#022c22', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', fontFamily: 'monospace', fontWeight: 900 }}>
        [🔒] AUTHENTICATING DEVELOPER ACCESS...
      </div>
    );
  }

  // =========================================================================
  // GATE LOGIN: PRIBADO NGA PASULOD (PARA IKAW RAY MAKA-OPEN)
  // =========================================================================
  if (!isUnlocked) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#022c22',
          backgroundImage: 'radial-gradient(circle at 50% 20%, #064e3b 0%, #022c22 85%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <Head>
          <title>Developer Access Gate • CECTRACK</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        </Head>

        <div
          style={{
            width: '100%',
            maxWidth: '410px',
            backgroundColor: '#064e3b',
            border: '2px solid #10b981',
            borderRadius: '26px',
            padding: '34px 26px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
            boxSizing: 'border-box',
            textAlign: 'center',
            color: '#ffffff',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '18px',
              backgroundColor: '#022c22',
              border: '2px solid #34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px auto',
              fontSize: '1.6rem',
              fontWeight: 900,
              color: '#34d399',
              boxShadow: '0 0 20px rgba(52, 211, 153, 0.35)',
            }}
          >
            &lt;/&gt;
          </div>

          <span
            style={{
              display: 'inline-block',
              backgroundColor: '#022c22',
              color: '#6ee7b7',
              border: '1px solid #10b981',
              padding: '4px 14px',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              fontWeight: 900,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '10px',
            }}
          >
            AUTHORIZED DEVELOPER ONLY
          </span>

          <h1 style={{ fontSize: '1.45rem', fontWeight: 900, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            CECTRACK Developer Portal
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#a7f3d0', margin: '0 0 20px 0', lineHeight: 1.5 }}>
            Private notification console for Lead Developer <strong>Renowee Beloy</strong>.
          </p>

          {gateError && (
            <div
              style={{
                backgroundColor: '#7f1d1d',
                border: '1.5px solid #ef4444',
                color: '#fee2e2',
                padding: '10px 14px',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: 700,
                marginBottom: '16px',
                textAlign: 'left',
              }}
            >
              ⚠️ {gateError}
            </div>
          )}

          <form onSubmit={handleGateLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#6ee7b7', marginBottom: '5px' }}>
                Developer Gmail *
              </label>
              <input
                type="email"
                placeholder="developer@gmail.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1.5px solid #047857',
                  backgroundColor: '#022c22',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#6ee7b7', marginBottom: '5px' }}>
                Developer Passkey *
              </label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1.5px solid #047857',
                  backgroundColor: '#022c22',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={gateLoading}
              style={{
                width: '100%',
                padding: '13px',
                backgroundColor: '#10b981',
                color: '#022c22',
                border: 'none',
                borderRadius: '12px',
                fontSize: '0.94rem',
                fontWeight: 900,
                cursor: gateLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                marginTop: '6px',
              }}
            >
              {gateLoading ? 'Unlocking...' : 'Unlock Notification Console ➔'}
            </button>
          </form>

          <div style={{ marginTop: '20px' }}>
            <button
              type="button"
              onClick={() => router.push('/')}
              style={{ background: 'none', border: 'none', color: '#a7f3d0', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Return to Public Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN CONSOLE: PURE ADD NOTIFICATION DASHBOARD
  // =========================================================================
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Head>
        <title>Developer Notification Console • CECTRACK</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      {/* TOP HEADER */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          backgroundColor: '#064e3b',
          borderBottom: '1px solid #047857',
          padding: '12px 20px',
          color: '#ffffff',
          boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#022c22',
                border: '1.5px solid #34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                fontWeight: 900,
                color: '#34d399',
              }}
            >
              &lt;/&gt;
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#ffffff' }}>
                  DEVELOPER BROADCAST CONSOLE
                </span>
                <span
                  style={{
                    backgroundColor: '#022c22',
                    border: '1px solid #10b981',
                    color: '#6ee7b7',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontSize: '0.65rem',
                    fontWeight: 900,
                  }}
                >
                  Developer &lt;/&gt;
                </span>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#a7f3d0' }}>
                Official Notification Dispatcher to All Enrolled Students
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              backgroundColor: '#ef4444',
              border: 'none',
              color: '#ffffff',
              padding: '7px 16px',
              borderRadius: '10px',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(239, 68, 68, 0.25)',
            }}
          >
            Exit Console ✕
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '26px 16px' }}>
        {/* FEEDBACK TOAST */}
        {feedback.text && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: '14px',
              marginBottom: '20px',
              fontSize: '0.85rem',
              fontWeight: 800,
              backgroundColor: feedback.type === 'error' ? '#fef2f2' : '#f0fdf4',
              color: feedback.type === 'error' ? '#b91c1c' : '#15803d',
              border: `1px solid ${feedback.type === 'error' ? '#fee2e2' : '#bbf7d0'}`,
            }}
          >
            {feedback.type === 'error' ? '⚠️ ' : '✓ '}
            {feedback.text}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
          {/* SULOD: ADD NOTIFICATION FORM */}
          <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.3rem' }}>✍️</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: '#0f172a' }}>
                Compose Notification
              </h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              Type your message below. Once sent, it will instantly appear in all students&apos; notification feeds with the signature <strong>Developer &lt;/&gt;</strong>.
            </p>

            {/* QUICK PRESETS (1-CLICK FILL) */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                ⚡ Quick Presets (Click to autofill):
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('password_2months')}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#eff6ff',
                    color: '#1d4ed8',
                    border: '1px solid #bfdbfe',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  🔒 2-Month Password Rotation Notice
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset('system_update')}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#f0fdf4',
                    color: '#15803d',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  🚀 System Version Update
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset('maintenance')}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#fefce8',
                    color: '#a16207',
                    border: '1px solid #fef08a',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  🛠️ Database Maintenance
                </button>
              </div>
            </div>

            <form onSubmit={handleSendBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* SENDER SIGNATURE (LOCKED) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                  Official Sender Signature (Locked)
                </label>
                <input
                  type="text"
                  value="Developer </>"
                  disabled
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    backgroundColor: '#f1f5f9',
                    color: '#15803d',
                    fontWeight: 900,
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* CATEGORY & TARGET */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      backgroundColor: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="security">🔒 Security Notice</option>
                    <option value="update">🚀 Feature / Version Update</option>
                    <option value="maintenance">🛠️ Maintenance Schedule</option>
                    <option value="general">📢 General Announcement</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                    Send Target
                  </label>
                  <input
                    type="text"
                    value="All Enrolled Students"
                    disabled
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      backgroundColor: '#f8fafc',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* TITLE */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                  Notification Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Action Required: Update Password Every 2 Months"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* MESSAGE */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                  Message Content (What students need to do) *
                </label>
                <textarea
                  rows={5}
                  placeholder="Type the announcement or instructions here for the students..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.88rem',
                    lineHeight: 1.5,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* SEND BUTTON */}
              <button
                type="submit"
                disabled={broadcasting}
                style={{
                  padding: '13px',
                  backgroundColor: '#15803d',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  fontWeight: 900,
                  cursor: broadcasting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(21, 128, 61, 0.25)',
                  marginTop: '4px',
                }}
              >
                {broadcasting ? 'Broadcasting Notice...' : 'Send Notification to All Students ➔'}
              </button>
            </form>
          </div>

          {/* SULOD: RECENT BROADCASTS SENT BY DEVELOPER */}
          <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.3rem' }}>📋</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, color: '#0f172a' }}>
                  Live Sent Notifications ({broadcastHistory.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={loadBroadcastHistory}
                disabled={loadingHistory}
                style={{
                  background: 'none',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                {loadingHistory ? 'Refreshing...' : '↻ Refresh'}
              </button>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 16px 0' }}>
              Active announcements currently visible in the student notification feed.
            </p>

            {broadcastHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: '#94a3b8', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>📭</div>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#475569' }}>No Broadcasts Sent Yet</div>
                <p style={{ fontSize: '0.76rem', margin: '4px 0 0 0' }}>
                  Fill out the form on the left to send your first notification to all students.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '520px', overflowY: 'auto' }}>
                {broadcastHistory.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      border: '1.5px solid #bbf7d0',
                      backgroundColor: '#f0fdf4',
                      borderRadius: '16px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 900,
                              backgroundColor: '#064e3b',
                              color: '#6ee7b7',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                            }}
                          >
                            {item.sender || 'Developer </>'}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: '#15803d', fontWeight: 800 }}>
                            {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 900, color: '#0f172a' }}>
                          {item.title}
                        </h4>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteBroadcast(item.id, item.title)}
                        style={{
                          backgroundColor: '#fee2e2',
                          color: '#b91c1c',
                          border: '1px solid #fecaca',
                          borderRadius: '8px',
                          padding: '4px 8px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        Delete ✕
                      </button>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', lineHeight: 1.45 }}>
                      {item.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
