import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function DeveloperDashboard() {
  const router = useRouter();

  // Authentication & Security Guard States
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Private Passkey Gate States (kon wala pa naka-login)
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [gateLoading, setGateLoading] = useState(false);
  const [gateError, setGateError] = useState('');

  // Logout Confirmation Modal State
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  // Create Form States
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('security');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Edit / Update Modal States
  const [editingItem, setEditingItem] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [editCategory, setEditCategory] = useState('security');
  const [updating, setUpdating] = useState(false);

  // 1. Role Guard: I-verify kon Developer ba gayod
  useEffect(() => {
    const verifyDevClearance = async () => {
      setCheckingAuth(true);
      try {
        let userEmail = null;
        try {
          userEmail =
            sessionStorage.getItem('cec_developer_session') ||
            sessionStorage.getItem('cec_user_email');
        } catch (e) {}

        if (supabase) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.email) userEmail = user.email;
        }

        if (userEmail === 'developer@gmail.com') {
          setIsAuthorized(true);
          loadNotifications();
          return;
        }

        if (userEmail && supabase) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, email')
            .eq('email', userEmail.trim().toLowerCase())
            .maybeSingle();

          if (profile && (profile.role === 'developer' || profile.email === 'developer@gmail.com')) {
            setIsAuthorized(true);
            loadNotifications();
            return;
          }
        }

        // Kon dili pa log in, ipakita ang private passkey gate
        setIsAuthorized(false);
      } catch (err) {
        console.error('Auth verification error:', err);
        setIsAuthorized(false);
      } finally {
        setCheckingAuth(false);
      }
    };

    verifyDevClearance();
  }, []);

  // 2. Fetch Sent Notifications
  const loadNotifications = async () => {
    setLoadingList(true);
    try {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoadingList(false);
    }
  };

  const showToast = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => {
      setFeedback({ type: '', text: '' });
    }, 4500);
  };

  // Quick 1-Click Presets
  const applyPreset = (presetKey) => {
    if (presetKey === 'password_2months') {
      setTitle('Security Notice: Update Your Password Every 2 Months');
      setMessage(
        'To maintain the security of your student attendance and academic clearance records, all students must update their portal passwords every 2 months. Please proceed to your Profile tab to set a fresh password.'
      );
      setCategory('security');
    } else if (presetKey === 'version_update') {
      setTitle('CECTRACK Engine & Scanner Update');
      setMessage(
        'A system performance update has been deployed. Cross-device profile syncing and attendance camera scanning response times have been enhanced. No student action required.'
      );
      setCategory('update');
    } else if (presetKey === 'maintenance') {
      setTitle('Scheduled Portal Maintenance Notice');
      setMessage(
        'The CECTRACK server and database will undergo routine optimization tonight at 11:00 PM. Verified student logs and clearances remain backed up and unaffected.'
      );
      setCategory('maintenance');
    }
  };

  // 3. ADD / SEND NOTIFICATION
  const handleSendNotification = async (e) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      showToast('error', 'Please enter both the notification title and message.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        message: message.trim(),
        sender: 'Developer </>',
        type: category,
      };

      const { error } = await supabase.from('notifications').insert([payload]);
      if (error) throw error;

      showToast('success', `Notification "${title.trim()}" dispatched to all students!`);
      setTitle('');
      setMessage('');
      setCategory('security');
      loadNotifications();
    } catch (err) {
      showToast('error', `Failed to send broadcast: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // 4. OPEN EDIT MODAL
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditMessage(item.message);
    setEditCategory(item.type || 'security');
  };

  // 5. UPDATE NOTIFICATION
  const handleUpdateNotification = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          title: editTitle.trim(),
          message: editMessage.trim(),
          type: editCategory,
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      showToast('success', `Notification updated successfully!`);
      setEditingItem(null);
      loadNotifications();
    } catch (err) {
      showToast('error', `Update error: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  // 6. DELETE NOTIFICATION
  const handleDeleteNotification = async (id, itemTitle) => {
    const confirmDelete = window.confirm(`Permanently remove notification: "${itemTitle}" from student view?`);
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;

      showToast('success', 'Notification removed from student feeds.');
      loadNotifications();
    } catch (err) {
      showToast('error', `Delete error: ${err.message}`);
    }
  };

  // 7. DEVELOPER GATE LOGIN
  const handleGateLogin = async (e) => {
    e.preventDefault();
    setGateError('');
    setGateLoading(true);

    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();

    try {
      if (cleanEmail === 'developer@gmail.com' && cleanPassword === '@develorportal123') {
        sessionStorage.setItem('cec_developer_session', 'developer@gmail.com');
        setIsAuthorized(true);
        loadNotifications();
        return;
      }

      if (supabase) {
        const { data: devUser } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', cleanEmail)
          .eq('password', cleanPassword)
          .maybeSingle();

        if (devUser && (devUser.role === 'developer' || devUser.email === 'developer@gmail.com')) {
          sessionStorage.setItem('cec_developer_session', 'developer@gmail.com');
          setIsAuthorized(true);
          loadNotifications();
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

  // 8. LOGOUT CONFIRMED HANDLER
  const handleConfirmSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
    try {
      sessionStorage.removeItem('cec_developer_session');
      sessionStorage.removeItem('cec_user_email');
      sessionStorage.removeItem('cec_dev_active');
    } catch (e) {}
    setIsLogoutModalOpen(false);
    setIsAuthorized(false);
    router.replace('/');
  };

  if (checkingAuth) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#022c22', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', fontFamily: 'monospace', fontWeight: 900 }}>
        [🔒] AUTHENTICATING DEVELOPER CLEARANCE &lt;/&gt; ...
      </div>
    );
  }

  // =========================================================================
  // GATE VIEW (PARA IKAW RAY MAKA-LOGIN)
  // =========================================================================
  if (!isAuthorized) {
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
            padding: '34px 24px',
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
            Private notification dashboard for Lead Developer <strong>Renowee Beloy</strong>.
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
                touchAction: 'manipulation',
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
  // MAIN DASHBOARD (FULLY RESPONSIVE FOR MOBILE & DESKTOP)
  // =========================================================================
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <Head>
        <title>Developer Notification Command • CECTRACK</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      {/* MOBILE-FRIENDLY CSS BREAKPOINTS */}
      <style jsx>{`
        .dev-header-container {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .dev-grid-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 22px;
          align-items: start;
        }

        .category-target-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        @media (max-width: 768px) {
          .dev-header-container {
            flex-direction: column;
            align-items: flex-start;
          }
          .dev-header-btn-wrap {
            width: 100%;
            display: flex;
            justify-content: flex-end;
            margin-top: 6px;
          }
          .dev-grid-layout {
            grid-template-columns: 1fr !important;
            gap: 18px !important;
          }
          .category-target-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          .card-padding-mobile {
            padding: 18px 16px !important;
            border-radius: 20px !important;
          }
          .dev-title-text {
            font-size: 1.05rem !important;
          }
        }
      `}</style>

      {/* TOP HEADER */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          backgroundColor: '#064e3b',
          borderBottom: '1.5px solid #047857',
          padding: '12px 16px',
          color: '#ffffff',
          boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
        }}
      >
        <div className="dev-header-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
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
                flexShrink: 0,
              }}
            >
              &lt;/&gt;
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span className="dev-title-text" style={{ fontSize: '1.15rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#ffffff' }}>
                  DEVELOPER DASHBOARD
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
              <span style={{ fontSize: '0.7rem', color: '#a7f3d0', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                developer@gmail.com (Renowee Beloy • FaCET)
              </span>
            </div>
          </div>

          <div className="dev-header-btn-wrap">
            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
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
                touchAction: 'manipulation',
                whiteSpace: 'nowrap',
              }}
            >
              Exit Developer Portal ✕
            </button>
          </div>
        </div>
      </header>

      {/* MAIN VIEWPORT */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 14px' }}>
        {/* FEEDBACK TOAST */}
        {feedback.text && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '14px',
              marginBottom: '18px',
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

        {/* TWO-PANEL RESPONSIVE GRID */}
        <div className="dev-grid-layout">
          
          {/* PANEL 1: CREATE NOTIFICATION FORM */}
          <div className="card-padding-mobile" style={{ backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '1.3rem' }}>✍️</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: '#0f172a' }}>
                Create Notification
              </h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              Type your message below. It will automatically be sent to all students with the signature <strong>Developer &lt;/&gt;</strong>.
            </p>

            {/* Quick Presets */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                ⚡ Quick Presets (Click to autofill):
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => applyPreset('password_2months')}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#eff6ff',
                    color: '#1d4ed8',
                    border: '1px solid #bfdbfe',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                  }}
                >
                  🔒 2-Month Password Rotation Notice
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('version_update')}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#f0fdf4',
                    color: '#15803d',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                  }}
                >
                  🚀 System Version Update
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('maintenance')}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#fefce8',
                    color: '#a16207',
                    border: '1px solid #fef08a',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                  }}
                >
                  🛠️ Database Maintenance
                </button>
              </div>
            </div>

            <form onSubmit={handleSendNotification} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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

              <div className="category-target-grid">
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
                      outline: 'none',
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

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                  Notification Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Attention students: Registration schedule"
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
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                  Message Content (What students need to do) *
                </label>
                <textarea
                  rows={4}
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
                    outline: 'none',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '13px',
                  backgroundColor: '#15803d',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  fontWeight: 900,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(21, 128, 61, 0.25)',
                  marginTop: '4px',
                  touchAction: 'manipulation',
                }}
              >
                {submitting ? 'Broadcasting Notice...' : 'Send Notification to All Students ➔'}
              </button>
            </form>
          </div>

          {/* PANEL 2: LIVE SENT NOTIFICATIONS */}
          <div className="card-padding-mobile" style={{ backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.3rem' }}>📋</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, color: '#0f172a' }}>
                  Live Sent Notifications ({notifications.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={loadNotifications}
                disabled={loadingList}
                style={{
                  background: 'none',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '5px 12px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  color: '#475569',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                }}
              >
                {loadingList ? 'Refreshing...' : '↻ Refresh'}
              </button>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 16px 0' }}>
              These are active notifications currently visible in all student portals.
            </p>

            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: '#94a3b8', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>📭</div>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#475569' }}>No Notifications Sent Yet</div>
                <p style={{ fontSize: '0.76rem', margin: '4px 0 0 0' }}>
                  Fill out the form on the left to broadcast an announcement.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '560px', overflowY: 'auto' }}>
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      border: '1.5px solid #bbf7d0',
                      backgroundColor: '#f0fdf4',
                      borderRadius: '16px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
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
                        <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 900, color: '#0f172a', wordBreak: 'break-word' }}>
                          {item.title}
                        </h4>
                      </div>

                      {/* ACTION BUTTONS: EDIT & DELETE */}
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          style={{
                            backgroundColor: '#ffffff',
                            color: '#15803d',
                            border: '1px solid #86efac',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            touchAction: 'manipulation',
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteNotification(item.id, item.title)}
                          style={{
                            backgroundColor: '#fee2e2',
                            color: '#b91c1c',
                            border: '1px solid #fecaca',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            touchAction: 'manipulation',
                          }}
                        >
                          ✕ Delete
                        </button>
                      </div>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', lineHeight: 1.5, wordBreak: 'break-word' }}>
                      {item.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* =========================================================================
          LOGOUT CONFIRMATION MODAL ("Are you sure you want to log out?")
      ========================================================================= */}
      {isLogoutModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(4px)',
            zIndex: 120,
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
              maxWidth: '380px',
              borderRadius: '24px',
              padding: '24px 22px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              position: 'relative',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
                Sign Out
              </h3>
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.1rem',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  fontWeight: 900,
                }}
              >
                ✕
              </button>
            </div>

            <p
              style={{
                textAlign: 'center',
                color: '#334155',
                fontSize: '0.92rem',
                margin: '18px 0 24px 0',
                fontWeight: 600,
                lineHeight: 1.5,
              }}
            >
              Are you sure you want to log out of the Developer Portal?
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                style={{
                  flex: 1,
                  padding: '11px',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  color: '#334155',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSignOut}
                style={{
                  flex: 1,
                  padding: '11px',
                  backgroundColor: '#e11d48',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  color: '#ffffff',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  boxShadow: '0 4px 12px rgba(225, 29, 72, 0.25)',
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          EDIT / UPDATE NOTIFICATION MODAL
      ========================================================================= */}
      {editingItem && (
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
              maxWidth: '500px',
              borderRadius: '24px',
              padding: '24px 20px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              boxSizing: 'border-box',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>✏️</span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
                  Update Notification
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#94a3b8', cursor: 'pointer', fontWeight: 900 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateNotification} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                  Category *
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box',
                    outline: 'none',
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
                  Notification Title *
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                  Message Content *
                </label>
                <textarea
                  rows={4}
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.88rem',
                    lineHeight: 1.5,
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  type="submit"
                  disabled={updating}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontWeight: 900,
                    cursor: updating ? 'not-allowed' : 'pointer',
                    touchAction: 'manipulation',
                  }}
                >
                  {updating ? 'Saving...' : 'Save & Update ➔'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  style={{
                    padding: '12px 18px',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
