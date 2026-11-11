import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function DeveloperDashboard() {
  const router = useRouter();

  // Authentication & Security Guard States
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // Navigation & UI States
  const [activeTab, setActiveTab] = useState('broadcast'); // 'broadcast' | 'students' | 'history'
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState({ type: '', text: '' });

  // Broadcast Form States
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('security');

  // Data Collections
  const [students, setStudents] = useState([]);
  const [sentNotifications, setSentNotifications] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');

  // 1. VERIFY DEVELOPER ACCESS GUARD
  useEffect(() => {
    const verifyDevAccess = async () => {
      try {
        setAuthChecking(true);

        let userEmail = null;
        try {
          userEmail = sessionStorage.getItem('cec_user_email') || localStorage.getItem('cec_user_email');
        } catch (e) {}

        if (supabase) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.email) userEmail = user.email;
        }

        // Kon walay naka-log in, pabalikon sa home/login
        if (!userEmail) {
          router.replace('/');
          return;
        }

        // Susiha sa profiles table kon developer ba ang role o email
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', userEmail.trim().toLowerCase())
          .maybeSingle();

        if (error || !profile) {
          router.replace('/');
          return;
        }

        if (profile.role !== 'developer' && profile.email !== 'developer@gmail.com') {
          alert('Access Denied: Kini nga panid para lamang sa Lead Developer.');
          router.replace('/');
          return;
        }

        setIsAuthorized(true);
        loadDeveloperData();
      } catch (err) {
        console.error('Developer clearance error:', err);
        router.replace('/');
      } finally {
        setAuthChecking(false);
      }
    };

    verifyDevAccess();
  }, [router]);

  // Fetch registered students & sent notifications
  const loadDeveloperData = async () => {
    setLoading(true);
    try {
      if (!supabase) return;

      // 1. Fetch all registered students
      const { data: profilesData, error: profilesErr } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesErr) throw profilesErr;
      if (profilesData) {
        setStudents(profilesData.filter((p) => p.role === 'student' || (!p.role && p.role !== 'admin' && p.role !== 'staff' && p.role !== 'developer')));
      }

      // 2. Fetch sent broadcast notifications
      const { data: notifData, error: notifErr } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (notifErr) {
        console.warn('Notifications table fetch warning:', notifErr.message);
      } else if (notifData) {
        setSentNotifications(notifData);
      }
    } catch (err) {
      console.error('Error loading developer records:', err);
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (type, text) => {
    setNotificationMsg({ type, text });
    setTimeout(() => {
      setNotificationMsg({ type: '', text: '' });
    }, 4500);
  };

  // Quick Presets
  const handleApplyPreset = (presetType) => {
    if (presetType === 'password_2months') {
      setTitle('Security Reminder: Update Your Password Every 2 Months');
      setMessage('To maintain the highest security standard for your student attendance and records, all students are required to update their account passwords every 2 months. Please navigate to your Profile tab to update your password.');
      setCategory('security');
    } else if (presetType === 'system_update') {
      setTitle('CECTRACK System Version Update');
      setMessage('A new feature update has been rolled out to improve attendance QR scanning speed and profile syncing across devices. No action is required.');
      setCategory('update');
    } else if (presetType === 'maintenance') {
      setTitle('Scheduled Database Maintenance Notice');
      setMessage('The portal database will undergo quick optimization maintenance tonight. Attendance logs will remain completely safe and uncorrupted.');
      setCategory('maintenance');
    }
  };

  // Send Broadcast Notification
  const handleSendNotification = async (e) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      showFeedback('error', 'Please provide both the notification title and message.');
      return;
    }

    setSending(true);
    try {
      const payload = {
        title: title.trim(),
        message: message.trim(),
        sender: 'Developer </>',
        type: category,
      };

      const { error } = await supabase.from('notifications').insert([payload]);
      if (error) throw error;

      showFeedback('success', `Broadcast notification "${title.trim()}" dispatched successfully to all students!`);
      setTitle('');
      setMessage('');
      setCategory('security');
      loadDeveloperData();
    } catch (err) {
      showFeedback('error', `Failed to broadcast notification: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteNotification = async (id, notifTitle) => {
    const confirmDelete = window.confirm(`Are you sure you want to remove the broadcast announcement "${notifTitle}"?`);
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;

      showFeedback('success', `Notification removed from student feeds.`);
      loadDeveloperData();
    } catch (err) {
      showFeedback('error', `Failed to delete announcement: ${err.message}`);
    }
  };

  const handleDevLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    try {
      sessionStorage.clear();
      localStorage.removeItem('cec_user_email');
      localStorage.removeItem('cec_user_school_id');
      localStorage.removeItem('cec_last_active_time');
    } catch (e) {}
    router.replace('/');
  };

  const filteredStudents = students.filter(
    (s) =>
      (s.school_id || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.full_name || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.course || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(studentSearch.toLowerCase())
  );

  if (authChecking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#064e3b', color: '#6ee7b7', fontWeight: 900 }}>
        Verifying Developer Clearance &lt;/&gt; ...
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Head>
        <title>Developer Command Console • CECTRACK</title>
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
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#065f46',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#ffffff' }}>
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
              <span style={{ fontSize: '0.68rem', color: '#a7f3d0', fontWeight: 600 }}>
                Logged in as: developer@gmail.com
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDevLogout}
            style={{
              backgroundColor: '#ef4444',
              border: 'none',
              color: '#ffffff',
              padding: '7px 16px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Logout Developer ➔
          </button>
        </div>
      </header>

      {/* SUB-NAV TABS */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '0 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {[
            { id: 'broadcast', label: '📢 Broadcast Notification' },
            { id: 'students', label: `👥 Registered Students (${students.length})` },
            { id: 'history', label: `📋 Sent Announcements (${sentNotifications.length})` },
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
                  fontSize: '0.86rem',
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

      {/* MAIN CONTENT */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
        {/* STATS OVERVIEW */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '14px',
            marginBottom: '24px',
          }}
        >
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '16px 20px' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>REGISTERED STUDENTS</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>{students.length}</div>
            <span style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 700 }}>● Active student accounts</span>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '16px 20px' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>SENT BROADCAST NOTIFICATIONS</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#15803d', marginTop: '2px' }}>{sentNotifications.length}</div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>Dispatched as Developer &lt;/&gt;</span>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '16px 20px' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>SECURITY COMPLIANCE TARGET</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#2563eb', marginTop: '2px' }}>60 Days</div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>2-Month Password Rotation Cycle</span>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '16px 20px' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>DEVELOPER CLEARANCE</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#16a34a', marginTop: '2px' }}>AUTHORIZED</div>
            <span style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 700 }}>developer@gmail.com</span>
          </div>
        </div>

        {/* FEEDBACK ALERT */}
        {notificationMsg.text && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: '14px',
              marginBottom: '20px',
              fontSize: '0.85rem',
              fontWeight: 800,
              backgroundColor: notificationMsg.type === 'error' ? '#fef2f2' : '#f0fdf4',
              color: notificationMsg.type === 'error' ? '#b91c1c' : '#15803d',
              border: `1px solid ${notificationMsg.type === 'error' ? '#fee2e2' : '#bbf7d0'}`,
            }}
          >
            {notificationMsg.type === 'error' ? '⚠️ ' : '✓ '}
            {notificationMsg.text}
          </div>
        )}

        {/* TAB 1: BROADCAST NOTIFICATION */}
        {activeTab === 'broadcast' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {/* Form */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <span style={{ fontSize: '1.25rem' }}>📢</span>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, color: '#0f172a' }}>
                  Dispatch System Notification
                </h2>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                Messages sent from this portal will appear across all enrolled students&apos; notification dashboards with the official sender signature <strong>Developer &lt;/&gt;</strong>.
              </p>

              {/* Quick Presets */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                  ⚡ Quick Developer Presets:
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
                    🔒 2-Month Password Rotation Notice
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

              <form onSubmit={handleSendNotification} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                    Sender Identity (Locked)
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
                      Alert Category *
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
                      Target Audience
                    </label>
                    <input
                      type="text"
                      value={`All Students (${students.length})`}
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
                    Notification Headline / Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Action Required: Mandatory Password Update"
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
                    Detailed Message Body *
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Provide clear operational instructions or update details for all students..."
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
                  disabled={sending}
                  style={{
                    padding: '13px',
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '0.92rem',
                    fontWeight: 900,
                    cursor: sending ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(21, 128, 61, 0.25)',
                    marginTop: '6px',
                  }}
                >
                  {sending ? 'Broadcasting Notice...' : 'Broadcast to All Students ➔'}
                </button>
              </form>
            </div>

            {/* Live Student Feed Preview */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <span style={{ fontSize: '1.25rem' }}>📱</span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 900, margin: 0, color: '#0f172a' }}>
                  Student Viewport Preview
                </h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 16px 0' }}>
                This is exactly how your announcement appears in the student portal feed.
              </p>

              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1.5px solid #bbf7d0',
                  borderRadius: '18px',
                  padding: '16px 18px',
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
                      {title || 'Security Reminder: Update Your Password Every 2 Months'}
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
                  Registered Students Masterlist ({filteredStudents.length})
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                  Real-time registry of all students eligible to receive developer alerts.
                </p>
              </div>

              <input
                type="text"
                placeholder="Search by ID, Name, or Course..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.84rem',
                  width: '260px',
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
                    <th style={{ padding: '12px 14px', fontWeight: 800, color: '#475569', textAlign: 'center' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        No registered student records found.
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
                          <span style={{ color: '#64748b' }}>{st.section || 'Sec A'} ({st.year_level || '1st Year'})</span>
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
                Dispatched Broadcast Announcements ({sentNotifications.length})
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                Historical log of announcements pushed to student portals.
              </p>
            </div>

            {sentNotifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                No notifications sent yet. Use the Broadcast tab to dispatch one.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sentNotifications.map((item) => (
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
                        Sent on: {new Date(item.created_at).toLocaleString('en-US', { timeZone: 'Asia/Manila' })}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteNotification(item.id, item.title)}
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
