import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

const P = {
  code: 'M16 18l6-6-6-6M8 6l-6 6 6 6',
  lock: 'M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4',
  rocket: 'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09zM12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2zM9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5',
  wrench: 'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z',
  mega: 'M3 11l18-5v12L3 14v-3zM11.6 16.8a3 3 0 11-5.8-1.6',
  pencil: 'M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z',
  trash: 'M3 6h18M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2',
  refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
  inbox: 'M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z',
  send: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  out: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  x: 'M18 6L6 18M6 6l12 12',
  list: 'M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2M9 2h6a1 1 0 011 1v2a1 1 0 01-1 1H9a1 1 0 01-1-1V3a1 1 0 011-1z',
  alert: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
  check: 'M20 6L9 17l-5-5',
  bolt: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
};
const Ic = ({ d, s = 18, w = 2.1 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true">
    <path d={P[d]} />
  </svg>
);

const CATS = [
  ['security', 'Security notice'],
  ['update', 'Feature / version update'],
  ['maintenance', 'Maintenance schedule'],
  ['general', 'General announcement'],
];
const CAT_LABEL = Object.fromEntries(CATS);

function Styles() {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Figtree:wght@500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <style jsx global>{`
        :root{--g9:#04261a;--g8:#064e3b;--g7:#047857;--g6:#059669;--g5:#10b981;--g2:#a7f3d0;--g1:#d1fae5;--g0:#ecfdf5;--ink:#0b2a1e;--mut:#56705f;--line:#d6ebdf;--red:#dc2626}
        *{box-sizing:border-box}
        body{margin:0;font-family:'Figtree',system-ui,sans-serif;color:var(--ink);background:#f3faf5}
        button{font-family:inherit;cursor:pointer}
        h1,h2,h3{font-family:'Bricolage Grotesque','Figtree',sans-serif}
        :focus-visible{outline:3px solid var(--g5);outline-offset:2px}

        /* ---------- BUTTON SYSTEM (same height, radius, icon gap) ---------- */
        .dv-b{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:44px;padding:0 18px;border-radius:999px;border:1.5px solid transparent;font-size:.9rem;font-weight:800;line-height:1;white-space:nowrap;transition:transform .2s,box-shadow .2s,background .2s,border-color .2s;touch-action:manipulation}
        .dv-b:disabled{opacity:.55;cursor:not-allowed;transform:none!important;box-shadow:none!important}
        .dv-b.sm{height:36px;padding:0 14px;font-size:.8rem;gap:6px}
        .dv-b.full{width:100%}
        .dv-b.pri{background:linear-gradient(135deg,var(--g5),var(--g7));color:#fff;box-shadow:0 8px 20px rgba(5,150,105,.3)}
        .dv-b.pri:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 12px 26px rgba(5,150,105,.4)}
        .dv-b.out{background:#fff;color:var(--g7);border-color:#b7ecd3}
        .dv-b.out:hover:not(:disabled){background:var(--g0)}
        .dv-b.neu{background:#fff;color:#3f5a4b;border-color:var(--line)}
        .dv-b.neu:hover:not(:disabled){background:var(--g0)}
        .dv-b.dng{background:#fff;color:var(--red);border-color:#fecaca}
        .dv-b.dng:hover:not(:disabled){background:#fef2f2}
        .dv-b.dsol{background:linear-gradient(135deg,#f43f5e,#dc2626);color:#fff;box-shadow:0 8px 20px rgba(220,38,38,.28)}
        .dv-b.dsol:hover:not(:disabled){transform:translateY(-2px)}
        .dv-lk{background:none;border:0;color:var(--mut);font-weight:700;font-size:.86rem;text-decoration:underline;padding:6px}
        .dv-lk:hover{color:var(--g7)}

        /* ---------- FORM ---------- */
        .dv-l{display:block;font-size:.84rem;font-weight:700;color:#2f4d3e;margin-bottom:6px}
        .dv-in{width:100%;padding:12px 14px;border-radius:14px;border:1.5px solid var(--line);font-size:.93rem;font-family:inherit;font-weight:600;color:var(--ink);background:#fafdfb;outline:0;transition:border-color .2s,box-shadow .2s,background .2s}
        textarea.dv-in{resize:vertical;line-height:1.55;font-weight:500}
        .dv-in:focus{border-color:var(--g5);background:#fff;box-shadow:0 0 0 4px rgba(16,185,129,.16)}
        .dv-in:disabled{background:#f1f6f3;color:var(--g7);font-weight:800;cursor:not-allowed}
        .dv-fm{display:flex;flex-direction:column;gap:14px}
        .dv-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}

        /* ---------- PAGE SHELLS ---------- */
        .dv-center{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px 16px;position:relative;overflow:hidden;
          background:radial-gradient(700px 340px at 6% -8%,rgba(16,185,129,.2),transparent 60%),radial-gradient(600px 320px at 100% 0,rgba(163,230,53,.16),transparent 60%),radial-gradient(760px 380px at 50% 112%,rgba(16,185,129,.12),transparent 60%),#fff}
        .dv-center::after{content:'';position:absolute;inset:0;background-image:radial-gradient(rgba(5,150,105,.09) 1px,transparent 1px);background-size:22px 22px;pointer-events:none}
        .dv-center>*{position:relative;z-index:1}
        .dv-spin{width:44px;height:44px;border-radius:50%;border:4px solid var(--g1);border-top-color:var(--g6);animation:dv-r 1s linear infinite;margin-bottom:14px}
        @keyframes dv-r{to{transform:rotate(360deg)}}
        .dv-auth{font-weight:800;color:var(--g7);font-size:.9rem}

        .dv-gate{width:100%;max-width:430px;background:#fff;border-radius:30px;padding:60px 26px 26px;margin-top:50px;text-align:center;position:relative;box-shadow:0 0 0 1px #d6ebdf,0 24px 60px rgba(6,78,59,.14);animation:dv-up .6s both}
        @keyframes dv-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        .dv-gi{position:absolute;top:-46px;left:50%;transform:translateX(-50%);width:92px;height:92px;border-radius:50%;background:linear-gradient(135deg,var(--g5),var(--g7));color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 7px var(--g0),0 0 0 8px var(--line),0 14px 30px rgba(5,150,105,.35)}
        .dv-pill{display:inline-flex;align-items:center;gap:7px;background:var(--g0);color:var(--g7);border:1px solid #b7ecd3;border-radius:999px;padding:5px 14px;font-size:.8rem;font-weight:800;margin-bottom:12px}
        .dv-gate h1{font-size:1.65rem;font-weight:800;letter-spacing:-.03em;margin:0 0 8px;color:var(--g8)}
        .dv-gate p{margin:0 0 20px;color:var(--mut);font-size:.9rem;line-height:1.55}
        .dv-gate .dv-fm{text-align:left}
        .dv-err{display:flex;gap:8px;align-items:flex-start;text-align:left;background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;padding:11px 14px;border-radius:14px;font-size:.84rem;font-weight:700;margin-bottom:16px;line-height:1.4}
        .dv-copy{margin-top:22px;font-size:.8rem;color:#4f7a63;font-weight:700}

        .dv-hd{position:sticky;top:0;z-index:40;background:rgba(255,255,255,.88);backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}
        .dv-hd-in{max-width:1180px;margin:auto;padding:10px 18px;display:flex;align-items:center;justify-content:space-between;gap:12px}
        .dv-brand{display:flex;align-items:center;gap:12px;min-width:0}
        .dv-bi{width:42px;height:42px;border-radius:14px;background:linear-gradient(135deg,var(--g5),var(--g7));color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 18px rgba(5,150,105,.28);flex-shrink:0}
        .dv-bt{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .dv-bt b{font:800 1.15rem 'Bricolage Grotesque',sans-serif;color:var(--g8);letter-spacing:-.02em}
        .dv-tag{background:var(--g0);border:1px solid #b7ecd3;color:var(--g7);padding:2px 10px;border-radius:999px;font-size:.72rem;font-weight:800}
        .dv-bs{display:block;font-size:.78rem;color:var(--mut);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

        .dv-main{max-width:1180px;margin:0 auto;padding:22px 18px 40px}
        .dv-toast{display:flex;align-items:center;gap:10px;padding:13px 16px;border-radius:16px;margin-bottom:18px;font-size:.88rem;font-weight:700;border:1px solid;animation:dv-up .3s both}
        .dv-toast.ok{background:var(--g0);color:var(--g7);border-color:#b7ecd3}
        .dv-toast.er{background:#fef2f2;color:#b91c1c;border-color:#fecaca}
        .dv-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px;align-items:start}
        .dv-card{background:#fff;border:1px solid var(--line);border-radius:28px;padding:26px;box-shadow:0 10px 30px rgba(6,78,59,.07)}
        .dv-ch{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px}
        .dv-ct{display:flex;align-items:center;gap:12px;min-width:0}
        .dv-ci{width:42px;height:42px;border-radius:14px;background:linear-gradient(135deg,var(--g5),var(--g7));color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 8px 18px rgba(5,150,105,.25)}
        .dv-ct h2{margin:0;font-size:1.25rem;font-weight:800;color:var(--g8);letter-spacing:-.02em}
        .dv-sub{margin:0 0 18px;font-size:.86rem;color:var(--mut);line-height:1.55}
        .dv-sub strong{color:var(--ink)}
        .dv-pl{font-size:.84rem;font-weight:800;color:#2f4d3e;margin-bottom:8px;display:flex;align-items:center;gap:6px}
        .dv-pre{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:18px}
        .dv-pre .dv-b{width:100%;padding:0 8px;font-size:.78rem}

        .dv-list{display:flex;flex-direction:column;gap:12px;max-height:600px;overflow-y:auto;padding-right:4px}
        .dv-it{border:1px solid #bde8d1;background:linear-gradient(180deg,#f6fdf9,#fff);border-radius:20px;padding:16px;display:flex;flex-direction:column;gap:10px;transition:border-color .2s,box-shadow .2s}
        .dv-it:hover{border-color:#86efac;box-shadow:0 10px 24px rgba(5,150,105,.12)}
        .dv-it-t{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .dv-by{font-size:.74rem;font-weight:800;background:var(--g8);color:#a7f3d0;padding:3px 10px;border-radius:999px}
        .dv-ty{font-size:.74rem;font-weight:800;padding:3px 10px;border-radius:999px;background:var(--g1);color:var(--g7)}
        .dv-ty.update{background:#ccfbf1;color:#0f766e}.dv-ty.maintenance{background:#fef3c7;color:#b45309}.dv-ty.general{background:#ecfccb;color:#4d7c0f}
        .dv-dt{margin-left:auto;font-size:.76rem;font-weight:700;color:#6f8b7d}
        .dv-it h4{margin:0;font-size:1rem;font-weight:800;color:var(--ink);word-break:break-word;line-height:1.35}
        .dv-it p{margin:0;font-size:.86rem;color:#456a58;line-height:1.6;word-break:break-word}
        .dv-it-f{display:flex;justify-content:flex-end;gap:8px;border-top:1px dashed #cfe9db;padding-top:12px}
        .dv-empty{text-align:center;padding:40px 16px;background:#fafdfb;border:1px dashed #b7dcc6;border-radius:20px;color:var(--mut)}
        .dv-empty svg{color:var(--g5);margin-bottom:6px}
        .dv-empty b{display:block;color:var(--ink);font-size:.95rem;margin-bottom:4px}
        .dv-empty span{font-size:.84rem}

        .dv-ov{position:fixed;inset:0;z-index:120;background:rgba(4,38,26,.55);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;animation:dv-f .25s both}
        @keyframes dv-f{from{opacity:0}to{opacity:1}}
        .dv-md{width:100%;max-width:500px;max-height:92vh;overflow-y:auto;background:#fff;border-radius:28px;padding:24px;box-shadow:0 30px 70px rgba(0,0,0,.35);animation:dv-up .35s both}
        .dv-md.sm{max-width:400px}
        .dv-mh{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:16px}
        .dv-mh h3{margin:0;font-size:1.25rem;font-weight:800;color:var(--g8)}
        .dv-xb{width:36px;height:36px;border-radius:50%;border:1px solid var(--line);background:#fff;color:#6f8b7d;display:flex;align-items:center;justify-content:center}
        .dv-xb:hover{background:var(--g0);color:var(--g7)}
        .dv-ma{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:6px}
        .dv-q{text-align:center;color:#3f5a4b;font-size:.95rem;line-height:1.6;font-weight:600;margin:8px 0 22px}

        @media(max-width:860px){
          .dv-grid{grid-template-columns:1fr}
        }
        @media(max-width:600px){
          .dv-card{padding:20px 16px;border-radius:24px}
          .dv-pre{grid-template-columns:1fr}
          .dv-2{grid-template-columns:1fr}
          .dv-b.exit span{display:none}.dv-b.exit{padding:0 12px}
          .dv-gate{padding:58px 18px 22px;border-radius:26px}
        }
        @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
      `}</style>
    </>
  );
}

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
      <div className="dv-center">
        <Styles />
        <div className="dv-spin" />
        <div className="dv-auth">Authenticating developer clearance...</div>
      </div>
    );
  }

  // =========================================================================
  // GATE VIEW (PARA IKAW RAY MAKA-LOGIN)
  // =========================================================================
  if (!isAuthorized) {
    return (
      <div className="dv-center">
        <Head><title>Developer Access Gate • CECTRACK</title></Head>
        <Styles />

        <div className="dv-gate">
          <div className="dv-gi"><Ic d="code" s={40} w={2.2} /></div>

          <span className="dv-pill"><Ic d="lock" s={14} /> Authorized developer only</span>
          <h1>CECTRACK Developer Portal</h1>
          <p>Private notification dashboard for Lead Developer <strong>Renowee Beloy</strong>.</p>

          {gateError && (
            <div className="dv-err"><Ic d="alert" s={18} /> <span>{gateError}</span></div>
          )}

          <form className="dv-fm" onSubmit={handleGateLogin}>
            <div>
              <label className="dv-l">Developer Gmail *</label>
              <input className="dv-in" type="email" placeholder="developer@gmail.com" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} required />
            </div>
            <div>
              <label className="dv-l">Developer passkey *</label>
              <input className="dv-in" type="password" placeholder="••••••••••••" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} required />
            </div>
            <button type="submit" className="dv-b pri full" disabled={gateLoading}>
              {gateLoading ? 'Unlocking...' : 'Unlock notification console'}
            </button>
          </form>

          <div style={{ marginTop: 14 }}>
            <button type="button" className="dv-lk" onClick={() => router.push('/')}>Return to public portal</button>
          </div>
        </div>
        <div className="dv-copy">© 2026 CEC-TRACK • DOrSU Cateel Extension Campus</div>
      </div>
    );
  }

  // =========================================================================
  // MAIN DASHBOARD (FULLY RESPONSIVE FOR MOBILE & DESKTOP)
  // =========================================================================
  return (
    <div>
      <Head><title>Developer Notification Command • CECTRACK</title></Head>
      <Styles />

      {/* TOP HEADER */}
      <header className="dv-hd">
        <div className="dv-hd-in">
          <div className="dv-brand">
            <div className="dv-bi"><Ic d="code" s={22} w={2.4} /></div>
            <div style={{ minWidth: 0 }}>
              <div className="dv-bt">
                <b>Developer dashboard</b>
                <span className="dv-tag">{'Developer </>'}</span>
              </div>
              <span className="dv-bs">developer@gmail.com (Renowee Beloy • FaCET)</span>
            </div>
          </div>
          <button type="button" className="dv-b dng exit" onClick={() => setIsLogoutModalOpen(true)}>
            <Ic d="out" s={17} /> <span>Exit portal</span>
          </button>
        </div>
      </header>

      {/* MAIN VIEWPORT */}
      <main className="dv-main">
        {/* FEEDBACK TOAST */}
        {feedback.text && (
          <div className={`dv-toast ${feedback.type === 'error' ? 'er' : 'ok'}`} role="status">
            <Ic d={feedback.type === 'error' ? 'alert' : 'check'} s={18} /> {feedback.text}
          </div>
        )}

        <div className="dv-grid">
          {/* PANEL 1: CREATE NOTIFICATION FORM */}
          <section className="dv-card">
            <div className="dv-ch">
              <div className="dv-ct">
                <span className="dv-ci"><Ic d="pencil" s={20} /></span>
                <h2>Create notification</h2>
              </div>
            </div>
            <p className="dv-sub">
              Type your message below. It will automatically be sent to all students with the signature <strong>{'Developer </>'}</strong>.
            </p>

            {/* Quick Presets */}
            <div className="dv-pl"><Ic d="bolt" s={15} /> Quick presets (click to autofill)</div>
            <div className="dv-pre">
              <button type="button" className="dv-b out sm" onClick={() => applyPreset('password_2months')}><Ic d="lock" s={15} /> Password notice</button>
              <button type="button" className="dv-b out sm" onClick={() => applyPreset('version_update')}><Ic d="rocket" s={15} /> Version update</button>
              <button type="button" className="dv-b out sm" onClick={() => applyPreset('maintenance')}><Ic d="wrench" s={15} /> Maintenance</button>
            </div>

            <form className="dv-fm" onSubmit={handleSendNotification}>
              <div>
                <label className="dv-l">Sender tag (fixed signature)</label>
                <input className="dv-in" type="text" value="Developer </>" disabled readOnly />
              </div>

              <div className="dv-2">
                <div>
                  <label className="dv-l">Category *</label>
                  <select className="dv-in" value={category} onChange={(e) => setCategory(e.target.value)}>
                    {CATS.map(([v, t]) => (<option key={v} value={v}>{t}</option>))}
                  </select>
                </div>
                <div>
                  <label className="dv-l">Send target</label>
                  <input className="dv-in" type="text" value="All Enrolled Students" disabled readOnly />
                </div>
              </div>

              <div>
                <label className="dv-l">Notification title *</label>
                <input className="dv-in" type="text" placeholder="e.g. Attention students: Registration schedule" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div>
                <label className="dv-l">Message content (what students need to do) *</label>
                <textarea className="dv-in" rows={4} placeholder="Type the announcement or instructions here for the students..." value={message} onChange={(e) => setMessage(e.target.value)} required />
              </div>

              <button type="submit" className="dv-b pri full" disabled={submitting}>
                <Ic d="send" s={17} /> {submitting ? 'Broadcasting notice...' : 'Send notification to all students'}
              </button>
            </form>
          </section>

          {/* PANEL 2: LIVE SENT NOTIFICATIONS */}
          <section className="dv-card">
            <div className="dv-ch" style={{ marginBottom: 6 }}>
              <div className="dv-ct">
                <span className="dv-ci"><Ic d="list" s={20} /></span>
                <h2>Live sent ({notifications.length})</h2>
              </div>
              <button type="button" className="dv-b neu sm" onClick={loadNotifications} disabled={loadingList}>
                <Ic d="refresh" s={15} /> {loadingList ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            <p className="dv-sub">These are active notifications currently visible in all student portals.</p>

            {notifications.length === 0 ? (
              <div className="dv-empty">
                <Ic d="inbox" s={38} w={1.6} />
                <b>No notifications sent yet</b>
                <span>Fill out the form to broadcast an announcement.</span>
              </div>
            ) : (
              <div className="dv-list">
                {notifications.map((item) => (
                  <article key={item.id} className="dv-it">
                    <div className="dv-it-t">
                      <span className="dv-by">{item.sender || 'Developer </>'}</span>
                      <span className={`dv-ty ${item.type || 'security'}`}>{CAT_LABEL[item.type] || CAT_LABEL.security}</span>
                      <span className="dv-dt">
                        {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <h4>{item.title}</h4>
                    <p>{item.message}</p>
                    <div className="dv-it-f">
                      <button type="button" className="dv-b out sm" onClick={() => handleOpenEdit(item)}><Ic d="pencil" s={14} /> Edit</button>
                      <button type="button" className="dv-b dng sm" onClick={() => handleDeleteNotification(item.id, item.title)}><Ic d="trash" s={14} /> Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* LOGOUT CONFIRMATION MODAL */}
      {isLogoutModalOpen && (
        <div className="dv-ov">
          <div className="dv-md sm" role="dialog" aria-modal="true" aria-label="Sign out">
            <div className="dv-mh">
              <h3>Sign out</h3>
              <button type="button" className="dv-xb" onClick={() => setIsLogoutModalOpen(false)} aria-label="Close"><Ic d="x" s={16} /></button>
            </div>
            <p className="dv-q">Are you sure you want to log out of the Developer Portal?</p>
            <div className="dv-ma">
              <button type="button" className="dv-b neu" onClick={() => setIsLogoutModalOpen(false)}>Cancel</button>
              <button type="button" className="dv-b dsol" onClick={handleConfirmSignOut}><Ic d="out" s={17} /> Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT / UPDATE NOTIFICATION MODAL */}
      {editingItem && (
        <div className="dv-ov">
          <div className="dv-md" role="dialog" aria-modal="true" aria-label="Update notification">
            <div className="dv-mh">
              <div className="dv-ct">
                <span className="dv-ci"><Ic d="pencil" s={20} /></span>
                <h3>Update notification</h3>
              </div>
              <button type="button" className="dv-xb" onClick={() => setEditingItem(null)} aria-label="Close"><Ic d="x" s={16} /></button>
            </div>

            <form className="dv-fm" onSubmit={handleUpdateNotification}>
              <div>
                <label className="dv-l">Category *</label>
                <select className="dv-in" value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                  {CATS.map(([v, t]) => (<option key={v} value={v}>{t}</option>))}
                </select>
              </div>
              <div>
                <label className="dv-l">Notification title *</label>
                <input className="dv-in" type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
              </div>
              <div>
                <label className="dv-l">Message content *</label>
                <textarea className="dv-in" rows={4} value={editMessage} onChange={(e) => setEditMessage(e.target.value)} required />
              </div>
              <div className="dv-ma">
                <button type="button" className="dv-b neu" onClick={() => setEditingItem(null)}>Cancel</button>
                <button type="submit" className="dv-b pri" disabled={updating}>{updating ? 'Saving...' : 'Save & update'}</button>
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
