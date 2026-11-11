import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function DeveloperDashboard() {
  const router = useRouter();

  // Authentication & Security Guard States
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

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

  // 1. Role Guard: I-block kon dili Developer
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

        // Check against profiles table
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

        // Kon dili developer, i-redirect sa Home
        router.replace('/');
      } catch (err) {
        console.error('Auth verification error:', err);
        router.replace('/');
      } finally {
        setCheckingAuth(false);
      }
    };

    verifyDevClearance();
  }, [router]);

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

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('cec_developer_session');
      sessionStorage.removeItem('cec_user_email');
    } catch (e) {}
    router.replace('/');
  };

  if (checkingAuth) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#022c22', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', fontFamily: 'monospace', fontWeight: 900 }}>
        [🔒] VERIFYING DEVELOPER AUTHORIZATION &lt;/&gt; ...
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <Head>
        <title>Developer Notification Command • CECTRACK</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      {/* TOP HEADER */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          backgroundColor: '#064e3b',
          borderBottom: '1.5px solid #047857',
          padding: '12px 20px',
          color: '#ffffff',
          boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                <span style={{ fontSize: '1.12rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#ffffff' }}>
                  DEVELOPER NOTIFICATION DASHBOARD
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
                Logged in as: <strong>developer@gmail.com</strong> (Renowee Beloy • FaCET)
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
            Exit Developer Portal ✕
          </button>
        </div>
      </header>

      {/* MAIN VIEWPORT */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '26px 16px' }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', alignItems: 'start' }}>
          
          {/* PANEL 1: ADD NOTIFICATION FORM */}
          <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '1.3rem' }}>✍️</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: '#0f172a' }}>
                Create Notification
              </h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              Type your message below. Once sent, it will instantly appear in all students&apos; notification feeds with the signature <strong>Developer &lt;/&gt;</strong>.
            </p>

            {/* Quick 1-Click Presets */}
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
                }}
              >
                {submitting ? 'Broadcasting Notice...' : 'Send Notification to All Students ➔'}
              </button>
            </form>
          </div>

          {/* PANEL 2: SENT NOTIFICATIONS LIST (UPDATE & DELETE) */}
          <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
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
                }}
              >
                {loadingList ? 'Refreshing...' : '↻ Refresh'}
              </button>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 16px 0' }}>
              These are the active notifications currently displayed on all students&apos; screens. You can edit or delete them at any time.
            </p>

            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: '#94a3b8', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>📭</div>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#475569' }}>No Notifications Sent Yet</div>
                <p style={{ fontSize: '0.76rem', margin: '4px 0 0 0' }}>
                  Fill out the form on the left to send your first broadcast announcement.
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
                        <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 900, color: '#0f172a' }}>
                          {item.title}
                        </h4>
                      </div>

                      {/* Action Buttons: UPDATE & DELETE */}
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          style={{
                            backgroundColor: '#ffffff',
                            color: '#15803d',
                            border: '1px solid #86efac',
                            borderRadius: '8px',
                            padding: '4px 10px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            cursor: 'pointer',
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
                            padding: '4px 10px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          ✕ Delete
                        </button>
                      </div>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
                      {item.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* EDIT / UPDATE MODAL */}
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
              maxWidth: '520px',
              borderRadius: '24px',
              padding: '26px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>✏️</span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
                  Update Broadcast Notification
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
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                  Message Content *
                </label>
                <textarea
                  rows={5}
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
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
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
                    fontSize: '0.92rem',
                    fontWeight: 900,
                    cursor: updating ? 'not-allowed' : 'pointer',
                  }}
                >
                  {updating ? 'Saving Changes...' : 'Save & Update Broadcast ➔'}
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
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    cursor: 'pointer',
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
