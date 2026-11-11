import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function DeveloperPortal() {
  const router = useRouter();

  // Authentication & Security Guard States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // Private Developer Login Gate States (kon wala pa naka-login)
  const [devEmailInput, setDevEmailInput] = useState('');
  const [devPasswordInput, setDevPasswordInput] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Active Dashboard Tabs: 'broadcast' | 'students' | 'history'
  const [activeTab, setActiveTab] = useState('broadcast');
  const [loadingData, setLoadingData] = useState(false);

  // Broadcast Notification Form
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('security'); // 'security' | 'update' | 'maintenance' | 'general'
  const [broadcasting, setBroadcasting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Collections
  const [studentsList, setStudentsList] = useState([]);
  const [sentBroadcasts, setSentBroadcasts] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');

  // 1. SECURITY CHECK: Verify kon Developer ba gayod ang misulod
  useEffect(() => {
    checkDeveloperSession();
  }, []);

  const checkDeveloperSession = async () => {
    setAuthChecking(true);
    try {
      let savedEmail = null;
      try {
        savedEmail = sessionStorage.getItem('cec_developer_session') || sessionStorage.getItem('cec_user_email');
      } catch (e) {}

      if (savedEmail === 'developer@gmail.com') {
        setIsAuthenticated(true);
        loadPortalData();
        return;
      }

      // Check if logged in via Supabase auth
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email === 'developer@gmail.com') {
          setIsAuthenticated(true);
          sessionStorage.setItem('cec_developer_session', 'developer@gmail.com');
          loadPortalData();
          return;
        }
      }

      setIsAuthenticated(false);
    } catch (err) {
      console.warn('Developer clearance check error:', err);
      setIsAuthenticated(false);
    } finally {
      setAuthChecking(false);
    }
  };

  // Direct Developer Gate Login
  const handleDeveloperGateLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    const cleanEmail = devEmailInput.trim().toLowerCase();
    const cleanPassword = devPasswordInput.trim();

    try {
      if (!supabase) throw new Error('Database connection failed.');

      // Check directly from profiles table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', cleanEmail)
        .eq('password', cleanPassword)
        .maybeSingle();

      if (error || !profile) {
        throw new Error('Access Denied: Invalid Developer credentials or unauthorized key.');
      }

      if (profile.role !== 'developer' && profile.email !== 'developer@gmail.com') {
        throw new Error('Access Restricted: This console is strictly reserved for the Lead Developer.');
      }

      // Success Login
      try {
        sessionStorage.setItem('cec_developer_session', 'developer@gmail.com');
        sessionStorage.setItem('cec_user_email', 'developer@gmail.com');
      } catch (e) {}

      setIsAuthenticated(true);
      loadPortalData();
    } catch (err) {
      setLoginError(err.message || 'Login failed.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Load registered students & sent notifications
  const loadPortalData = async () => {
    setLoadingData(true);
    try {
      if (!supabase) return;

      // 1. Load Registered Students
      const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profiles && !profErr) {
        setStudentsList(profiles.filter((p) => p.role === 'student' || (!p.role && p.role !== 'admin' && p.role !== 'staff' && p.role !== 'developer')));
      }

      // 2. Load Sent Developer Notifications
      const { data: notifs, error: notifErr } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (notifs && !notifErr) {
        setSentBroadcasts(notifs);
      }
    } catch (err) {
      console.error('Error fetching developer data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const showNotificationFeedback = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => {
      setFeedback({ type: '', text: '' });
    }, 4500);
  };

  // Quick Developer Presets
  const handleApplyPreset = (type) => {
    if (type === 'password_2months') {
      setTitle('Security Notice: Update Your Password Every 2 Months');
      setMessage('To maintain the highest security standard for your student attendance records and digital credentials, all students are required to update their account passwords every 2 months. Please navigate to your Profile tab to set a new password.');
      setCategory('security');
    } else if (type === 'system_update') {
      setTitle('CECTRACK Version Engine Update');
      setMessage('A system optimization update has been deployed by the developer. Attendance QR scanning speeds and cross-device sync have been enhanced. No student action is required.');
      setCategory('update');
    } else if (type === 'maintenance') {
      setTitle('Scheduled Database Optimization');
      setMessage('The CECTRACK database engine will undergo routine server maintenance tonight. All verified attendance records and timestamps are fully backed up and secure.');
      setCategory('maintenance');
    }
  };

  // Broadcast to All Students
  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      showNotificationFeedback('error', 'Please provide both the headline and message body.');
      return;
    }

    setBroadcasting(true);
    try {
      const payload = {
        title: title.trim(),
        message: message.trim(),
        sender: 'Developer </>',
        type: category,
      };

      const { error } = await supabase.from('notifications').insert([payload]);
      if (error) throw error;

      showNotificationFeedback('success', `Broadcast dispatched to ${studentsList.length} registered students as "Developer </>"!`);
      setTitle('');
      setMessage('');
      setCategory('security');
      loadPortalData();
    } catch (err) {
      showNotificationFeedback('error', `Broadcast failed: ${err.message}`);
    } finally {
      setBroadcasting(false);
    }
  };

  // Delete an existing notification
  const handleDeleteBroadcast = async (id, itemTitle) => {
    const confirmDelete = window.confirm(`Permanently remove broadcast: "${itemTitle}"?`);
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;

      showNotificationFeedback('success', 'Announcement removed from student portals.');
      loadPortalData();
    } catch (err) {
      showNotificationFeedback('error', `Failed to delete announcement: ${err.message}`);
    }
  };

  const handleDeveloperLogout = () => {
    try {
      sessionStorage.removeItem('cec_developer_session');
      sessionStorage.removeItem('cec_user_email');
    } catch (e) {}
    setIsAuthenticated(false);
    router.replace('/');
  };

  const filteredStudents = studentsList.filter(
    (s) =>
      (s.school_id || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.full_name || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.course || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(studentSearch.toLowerCase())
  );

  // Loading Screen habang gina-verify
  if (authChecking) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#022c22', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', fontFamily: 'monospace', fontWeight: 900 }}>
        [🔒] AUTHENTICATING DEVELOPER CLEARANCE &lt;/&gt; ...
      </div>
    );
  }

  // =========================================================================
  // SCREEN: KON WALA PA NAKA-LOG IN (PRIVATE DEVELOPER LOCK GATE)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#022c22',
          backgroundImage: 'radial-gradient(circle at 50% 20%, #064e3b 0%, #022c22 80%)',
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
            maxWidth: '420px',
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
              margin: '0 auto 16px auto',
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
            CECTRACK Developer Console
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#a7f3d0', margin: '0 0 22px 0', lineHeight: 1.5 }}>
            Private administrative portal for lead creator <strong>Renowee Beloy</strong>. Restricted from students and unauthorized staff.
          </p>

          {loginError && (
            <div
              style={{
                backgroundColor: '#7f1d1d',
                border: '1.5px solid #ef4444',
                color: '#fee2e2',
                padding: '10px 14px',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: 700,
                marginBottom: '18px',
                textAlign: 'left',
              }}
            >
              ⚠️ {loginError}
            </div>
          )}

          <form onSubmit={handleDeveloperGateLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#6ee7b7', marginBottom: '5px' }}>
                Developer Gmail *
              </label>
              <input
                type="email"
                placeholder="developer@gmail.com"
                value={devEmailInput}
                onChange={(e) => setDevEmailInput(e.target.value)}
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
                value={devPasswordInput}
                onChange={(e) => setDevPasswordInput(e.target.value)}
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
              disabled={loginLoading}
              style={{
                width: '100%',
                padding: '13px',
                backgroundColor: '#10b981',
                color: '#022c22',
                border: 'none',
                borderRadius: '12px',
                fontSize: '0.94rem',
                fontWeight: 900,
                cursor: loginLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                marginTop: '6px',
              }}
            >
              {loginLoading ? 'Unlocking Console...' : 'Authenticate & Enter Console ➔'}
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
  // SCREEN: OFFICIAL DEVELOPER DASHBOARD VIEWPORT
  // =========================================================================
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Head>
        <title>Developer Command Console • CECTRACK</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      {/* TOP COMMAND HEADER */}
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
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: '#022c22',
                border: '1.5px solid #34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                fontWeight: 900,
                color: '#34d399',
              }}
            >
              &lt;/&gt;
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#ffffff' }}>
                  CECTRACK DEVELOPER CONSOLE
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
                    textTransform: 'uppercase',
                  }}
                >
                  Developer &lt;/&gt;
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#a7f3d0', fontWeight: 600 }}>
                Logged in as: <strong>developer@gmail.com</strong> • Full Broadcast Authority
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleDeveloperLogout}
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
              Exit Developer Mode ✕
            </button>
          </div>
        </div>
      </header>

      {/* SUB-HEADER TABS */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '0 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '10px', overflowX: 'auto' }}>
          {[
            { id: 'broadcast', label: '📢 Send Broadcast Notification' },
            { id: 'students', label: `👥 Registered Students Masterlist (${studentsList.length})` },
            { id: 'history', label: `📋 Notification History (${sentBroadcasts.length})` },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '14px 18px',
                  background: 'none',
                  border: 'none',
                  borderBottom: active ? '3px solid #15803d' : '3px solid transparent',
                  color: active ? '#15803d' : '#64748b',
                  fontWeight: active ? 900 : 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* DASHBOARD BODY */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
        {/* STATS OVERVIEW CARDS */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '14px',
            marginBottom: '24px',
          }}
        >
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '16px 20px' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>ENROLLED RECIPIENTS</span>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>{studentsList.length}</div>
            <span style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 700 }}>● Active student accounts</span>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '16px 20px' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>SENT BROADCASTS</span>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#15803d', marginTop: '2px' }}>{sentBroadcasts.length}</div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>Dispatched as Developer &lt;/&gt;</span>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '16px 20px' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>SECURITY COMPLIANCE TARGET</span>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#2563eb', marginTop: '2px' }}>60 Days</div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>2-Month Password Rotation Policy</span>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '16px 20px' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>ROLE CLEARANCE</span>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#16a34a', marginTop: '2px' }}>SUPER DEV</div>
            <span style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 700 }}>Exclusive Developer Portal</span>
          </div>
        </div>

        {/* FEEDBACK BANNER */}
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

        {/* TAB 1: BROADCAST SENDER & PREVIEW */}
        {activeTab === 'broadcast' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <span style={{ fontSize: '1.3rem' }}>📢</span>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0, color: '#0f172a' }}>
                  Send Notification to Students
                </h2>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                Enter the headline and message details below. All enrolled students will immediately see this notice in their portal with the official sender signature <strong>Developer &lt;/&gt;</strong>.
              </p>

              {/* Quick Presets */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                  ⚡ One-Click Presets:
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('password_2months')}
                    style={{
                      padding: '5px 12px',
                      backgroundColor: '#eff6ff',
                      color: '#1d4ed8',
                      border: '1px solid #bfdbfe',
                      borderRadius: '8px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    🔒 2-Month Password Update Alert
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('system_update')}
                    style={{
                      padding: '5px 12px',
                      backgroundColor: '#f0fdf4',
                      color: '#15803d',
                      border: '1px solid #bbf7d0',
                      borderRadius: '8px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    🚀 Version Update Notice
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('maintenance')}
                    style={{
                      padding: '5px 12px',
                      backgroundColor: '#fefce8',
                      color: '#a16207',
                      border: '1px solid #fef08a',
                      borderRadius: '8px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    🛠️ Server Maintenance Notice
                  </button>
                </div>
              </div>

              <form onSubmit={handleBroadcastSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                    Sender Tag (Fixed Signature)
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                      Notification Category *
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
                      <option value="update">🚀 System Update</option>
                      <option value="maintenance">🛠️ Maintenance</option>
                      <option value="general">📢 General Announcement</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                      Audience Scope
                    </label>
                    <input
                      type="text"
                      value={`All Students (${studentsList.length})`}
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

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                    Announcement Title *
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

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                    Notification Message *
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Enter instructions, security advice, or feature details..."
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

                <button
                  type="submit"
                  disabled={broadcasting}
                  style={{
                    padding: '13px',
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '0.92rem',
                    fontWeight: 900,
                    cursor: broadcasting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(21, 128, 61, 0.25)',
                    marginTop: '6px',
                  }}
                >
                  {broadcasting ? 'Broadcasting Notice...' : 'Send Notification to All Students ➔'}
                </button>
              </form>
            </div>

            {/* Live Student Feed Preview */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <span style={{ fontSize: '1.25rem' }}>📱</span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 900, margin: 0, color: '#0f172a' }}>
                  Student Dashboard Preview
                </h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 16px 0' }}>
                This is exactly how students will view your notification on their screen:
              </p>

              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1.5px solid #bbf7d0',
                  borderRadius: '18px',
                  padding: '18px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  boxShadow: '0 4px 14px rgba(21, 128, 61, 0.06)',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: '#dcfce7',
                    border: '1.5px solid #86efac',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    fontWeight: 900,
                    color: '#15803d',
                    flexShrink: 0,
                  }}
                >
                  &lt;/&gt;
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', gap: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 900, color: '#0f172a' }}>
                      {title || 'Security Notice: Update Your Password Every 2 Months'}
                    </h4>
                    <span
                      style={{
                        fontSize: '0.66rem',
                        fontWeight: 900,
                        backgroundColor: '#064e3b',
                        color: '#6ee7b7',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Developer &lt;/&gt;
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
                    {message || 'All students are encouraged to routinely update their account credentials every 60 days to safeguard personal attendance logs.'}
                  </p>

                  <div style={{ marginTop: '8px', fontSize: '0.7rem', color: '#15803d', fontWeight: 800 }}>
                    Official Signature: Developer &lt;/&gt; • Just now
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REGISTERED STUDENTS LIST */}
        {activeTab === 'students' && (
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>
                  Registered Students Directory ({filteredStudents.length})
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                  Real-time list of all students enrolled in the CECTRACK database.
                </p>
              </div>

              <input
                type="text"
                placeholder="Search Student ID, Name, or Course..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.84rem',
                  width: '280px',
                  maxWidth: '100%',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ overflowX: 'auto', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <table style={{ width: '100%', minWidth: '680px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 14px', fontWeight: 800, color: '#475569' }}>STUDENT ID</th>
                    <th style={{ padding: '12px 14px', fontWeight: 800, color: '#475569' }}>FULL NAME</th>
                    <th style={{ padding: '12px 14px', fontWeight: 800, color: '#475569' }}>REGISTERED EMAIL</th>
                    <th style={{ padding: '12px 14px', fontWeight: 800, color: '#475569' }}>COURSE &amp; SECTION</th>
                    <th style={{ padding: '12px 14px', fontWeight: 800, color: '#475569', textAlign: 'center' }}>ACCOUNT STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        No student records match your query.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((st) => (
                      <tr key={st.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 900, color: '#0f172a' }}>{st.school_id}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: '#15803d' }}>{st.full_name}</td>
                        <td style={{ padding: '12px 14px', color: '#64748b' }}>{st.email}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontWeight: 800, color: '#0f172a' }}>{st.course}</span> •{' '}
                          <span style={{ color: '#64748b' }}>{st.section || 'Section A'} ({st.year_level || '1st Year'})</span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span
                            style={{
                              backgroundColor: '#dcfce7',
                              color: '#15803d',
                              padding: '3px 10px',
                              borderRadius: '9999px',
                              fontSize: '0.68rem',
                              fontWeight: 900,
                              border: '1px solid #bbf7d0',
                            }}
                          >
                            ACTIVE
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SENT ANNOUNCEMENTS */}
        {activeTab === 'history' && (
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ marginBottom: '18px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>
                Dispatched Announcements History ({sentBroadcasts.length})
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                Manage all notifications broadcasted to student portal feeds.
              </p>
            </div>

            {sentBroadcasts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                No notifications sent yet. Use the Broadcast tab to create one.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sentBroadcasts.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '16px',
                      padding: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 900,
                            backgroundColor: '#064e3b',
                            color: '#6ee7b7',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                          }}
                        >
                          {item.sender || 'Developer </>'}
                        </span>
                        <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 900, color: '#0f172a' }}>
                          {item.title}
                        </h4>
                      </div>
                      <p style={{ margin: '0 0 6px 0', fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
                        {item.message}
                      </p>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>
                        Sent: {new Date(item.created_at).toLocaleString('en-US', { timeZone: 'Asia/Manila' })}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteBroadcast(item.id, item.title)}
                      style={{
                        backgroundColor: '#fef2f2',
                        color: '#b91c1c',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 900,
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
