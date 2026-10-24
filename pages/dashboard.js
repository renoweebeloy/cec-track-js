import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Home.module.css';

export default function StudentDashboard() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const idCardRef = useRef(null);

  // Active Tab States: 'my-id' | 'attendance' | 'events' | 'officers' | 'finance' | 'sanctions' | 'voting' | 'profile' | 'about'
  const [activeTab, setActiveTab] = useState('my-id');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [downloadingId, setDownloadingId] = useState(false);

  // Password Change Modal States
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  // Student Profile Data
  const [profile, setProfile] = useState({
    full_name: 'Renowee Beloy',
    school_id: '2024-0616',
    email: 'renowee.beloy@dorsu.edu.ph',
    course: 'BSCRIM',
    section: 'Section A',
    year_level: '3rd Year',
    avatar_url: '',
    can_scan: false,
  });

  // Events & Attendance States
  const [events, setEvents] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [attendanceFilter, setAttendanceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState({ type: '', message: '' });

  // 12-Hour AM/PM Formatter
  const formatTime12Hour = (time24) => {
    if (!time24 || time24 === '--:--') return '--:--';
    if (time24.includes('AM') || time24.includes('PM')) return time24;
    const parts = time24.split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1] ? parts[1].substring(0, 2) : '00';
    if (isNaN(hours)) return time24;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes.padStart(2, '0')} ${ampm}`;
  };

  const showNotify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification({ type: '', message: '' });
    }, 4500);
  };

  // 5-Minute Inactivity Session Guard
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const FIVE_MINUTES_MS = 5 * 60 * 1000;

    const checkSessionActivity = async () => {
      let lastActive = null;
      try {
        lastActive = localStorage.getItem('cec_last_active_time');
      } catch (e) {}

      const now = Date.now();

      if (lastActive) {
        const timeElapsed = now - parseInt(lastActive, 10);
        if (timeElapsed > FIVE_MINUTES_MS) {
          try {
            sessionStorage.clear();
            localStorage.removeItem('cec_last_active_time');
            if (supabase) await supabase.auth.signOut();
          } catch (e) {}

          alert('Your session has expired due to 5 minutes of inactivity. Please log in again.');
          router.replace('/login');
          return;
        }
      }

      try {
        localStorage.setItem('cec_last_active_time', now.toString());
      } catch (e) {}
    };

    checkSessionActivity();

    const updateActivity = () => {
      try {
        localStorage.setItem('cec_last_active_time', Date.now().toString());
      } catch (e) {}
    };

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);
    window.addEventListener('touchstart', updateActivity);

    const intervalTimer = setInterval(checkSessionActivity, 10000);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      clearInterval(intervalTimer);
    };
  }, [router]);

  useEffect(() => {
    fetchStudentData();
  }, []);

  // Pagkuha sa datos gikan sa Supabase
  const fetchStudentData = async () => {
    setLoading(true);
    try {
      if (!supabase) return;

      let userEmail = null;
      try {
        userEmail = sessionStorage.getItem('cec_user_email');
      } catch (e) {}

      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.email) userEmail = authData.user.email;

      let currentStudentId = profile.school_id;

      if (userEmail) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', userEmail.trim().toLowerCase())
          .maybeSingle();

        if (userProfile) {
          currentStudentId = userProfile.school_id || currentStudentId;
          const hasScanClearance =
            userProfile.can_scan === true ||
            userProfile.role === 'staff' ||
            userProfile.role === 'admin';

          setProfile((prev) => ({
            ...prev,
            full_name: userProfile.full_name || prev.full_name,
            school_id: userProfile.school_id || prev.school_id,
            email: userProfile.email || userEmail,
            course: userProfile.course || prev.course,
            year_level: userProfile.year_level || prev.year_level,
            section: userProfile.section || prev.section,
            avatar_url: userProfile.avatar_url || '',
            can_scan: hasScanClearance,
          }));
        }
      }

      // Kumuha sa mga events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false });

      if (eventsData) {
        setEvents(eventsData);
      }

      // Kumuha sa attendance records sa maong estudyante
      const { data: studentLogs } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', currentStudentId);

      const logsMap = {};
      if (studentLogs) {
        studentLogs.forEach((item) => {
          logsMap[item.event_id] = item;
        });
      }

      // Pagsamahin ang events at logs
      if (eventsData && eventsData.length > 0) {
        const mergedRecords = eventsData.map((ev) => {
          const matchingLog = logsMap[ev.id];
          const isPresent = Boolean(matchingLog && matchingLog.status === 'PRESENT');

          return {
            id: ev.id,
            event_id: ev.id,
            title: ev.title || 'Official Assembly',
            location: ev.location || 'FaCET Facade',
            date: ev.date || 'Scheduled',
            time_in: matchingLog && matchingLog.time_in ? formatTime12Hour(matchingLog.time_in) : '--:--',
            time_out: matchingLog && matchingLog.time_out ? formatTime12Hour(matchingLog.time_out) : '--:--',
            event_status: ev.status === 'active' ? 'ACTIVE' : 'INACTIVE (CLOSED)',
            status: isPresent ? 'PRESENT' : 'ABSENT',
            image_url: ev.image_url || null,
            description: ev.description || '',
          };
        });

        setAttendanceLogs(mergedRecords);
      } else {
        setAttendanceLogs([]);
      }
    } catch (err) {
      console.error('Error fetching dashboard records:', err);
    } finally {
      setLoading(false);
    }
  };

  // Upload og litrato direkta sa database
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Palihug pagpili og saktong file sa hulagway (PNG, JPG, o JPEG).');
      return;
    }

    setUploadingPhoto(true);

    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);

        setProfile((prev) => ({ ...prev, avatar_url: compressedBase64 }));

        try {
          const { error: dbError } = await supabase
            .from('profiles')
            .update({ avatar_url: compressedBase64 })
            .eq('school_id', profile.school_id);

          if (dbError) {
            alert('Wala ma-sync ang litrato: ' + dbError.message);
          } else {
            showNotify('success', 'Profile photo updated and synced across all devices!');
          }
        } catch (err) {
          console.warn('Avatar database sync error:', err);
        } finally {
          setUploadingPhoto(false);
        }
      };
      img.src = uploadEvent.target.result;
    };

    reader.readAsDataURL(file);
  };

  const handleDownloadIdCard = async () => {
    if (!idCardRef.current) return;
    setDownloadingId(true);

    try {
      if (!window.html2canvas) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      const canvas = await window.html2canvas(idCardRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        borderRadius: 28,
      });

      const imageUri = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `CEC-ID-${profile.school_id || 'Student'}.png`;
      downloadLink.href = imageUri;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error('Error downloading ID card:', err);
      window.print();
    } finally {
      setDownloadingId(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPasswordLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          password: newPassword.trim(),
          must_change_password: false,
        })
        .eq('school_id', profile.school_id);

      if (error) throw new Error(error.message);

      setPasswordMsg({ type: 'success', text: 'Password successfully updated!' });
      setTimeout(() => {
        setIsChangePasswordOpen(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordMsg({ type: '', text: '' });
      }, 1500);
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.message || 'Error updating password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
    try {
      sessionStorage.clear();
      localStorage.removeItem('cec_last_active_time');
    } catch (e) {}
    router.replace('/');
  };

  // Dynamic Statistics
  const totalEventsCount = attendanceLogs.length;
  const totalPresentCount = attendanceLogs.filter((l) => l.status === 'PRESENT').length;
  const totalAbsencesCount = attendanceLogs.filter((l) => l.status === 'ABSENT').length;
  const absentEventsList = attendanceLogs.filter((l) => l.status === 'ABSENT');
  const complianceRate = totalEventsCount > 0 ? Math.round((totalPresentCount / totalEventsCount) * 100) : 0;

  const cleanQuery = searchQuery.trim().toLowerCase();
  const filteredLogs = attendanceLogs
    .filter((log) => {
      if (attendanceFilter === 'present') return log.status === 'PRESENT';
      if (attendanceFilter === 'absent') return log.status === 'ABSENT';
      return true;
    })
    .filter((log) => {
      if (!cleanQuery) return true;
      return (
        (log.title || '').toLowerCase().includes(cleanQuery) ||
        (log.location || '').toLowerCase().includes(cleanQuery)
      );
    });

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    profile.school_id
  )}`;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      <Head>
        <title>Student Portal • CECTRACK</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" async />
      </Head>

      {/* TOP HEADER (MATCHING THE SCREENSHOT) */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          height: '62px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '1.2rem',
              color: '#334155',
              cursor: 'pointer',
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            ☰
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#15803d', letterSpacing: '-0.02em' }}>
                CEC TRACK
              </span>
              <span
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 900,
                  padding: '2px 6px',
                  borderRadius: '9999px',
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  border: '1px solid #bbf7d0',
                  textTransform: 'uppercase',
                }}
              >
                STUDENT
              </span>
            </div>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', display: 'block' }}>
              Student Access Portal
            </span>
          </div>
        </div>

        {/* TOP RIGHT PROFILE BADGE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', display: 'block', lineHeight: 1.2 }}>
              {profile.full_name}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 800 }}>
              {profile.school_id}
            </span>
          </div>

          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#dcfce7',
              border: '2px solid #15803d',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#15803d' }}>
                {profile.full_name.charAt(0)}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* MOBILE BACKDROP OVERLAY */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            zIndex: 90,
          }}
        />
      )}

      <div style={{ display: 'flex', flex: 1 }}>
        {/* ======================================================== */}
        {/* SIDEBAR NAVIGATION (PURE GREEN THEME) */}
        {/* ======================================================== */}
        <aside
          style={{
            width: '210px',
            backgroundColor: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '24px 14px',
            boxSizing: 'border-box',
            flexShrink: 0,
            position: isSidebarOpen ? 'fixed' : 'relative',
            top: isSidebarOpen ? 0 : 'auto',
            bottom: isSidebarOpen ? 0 : 'auto',
            left: isSidebarOpen ? 0 : 'auto',
            zIndex: isSidebarOpen ? 100 : 1,
            boxShadow: isSidebarOpen ? '6px 0 25px rgba(0,0,0,0.15)' : 'none',
          }}
        >
          <div>
            <div style={{ paddingLeft: '8px', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Portal
              </h2>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                STUDENT ACCESS
              </span>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {/* 1. My ID */}
              <button
                onClick={() => { setActiveTab('my-id'); setIsSidebarOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: activeTab === 'my-id' ? 900 : 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                  backgroundColor: activeTab === 'my-id' ? '#15803d' : 'transparent',
                  color: activeTab === 'my-id' ? '#ffffff' : '#64748b',
                  boxShadow: activeTab === 'my-id' ? '0 4px 12px rgba(21, 128, 61, 0.25)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="16" rx="3" />
                  <line x1="7" y1="8" x2="11" y2="8" />
                  <line x1="7" y1="12" x2="11" y2="12" />
                  <rect x="14" y="8" width="4" height="4" />
                </svg>
                <span>My ID</span>
              </button>

              {/* 2. Attendance */}
              <button
                onClick={() => { setActiveTab('attendance'); setIsSidebarOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: activeTab === 'attendance' ? 900 : 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                  backgroundColor: activeTab === 'attendance' ? '#15803d' : 'transparent',
                  color: activeTab === 'attendance' ? '#ffffff' : '#64748b',
                  boxShadow: activeTab === 'attendance' ? '0 4px 12px rgba(21, 128, 61, 0.25)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 8v4l3 3" />
                  <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" />
                </svg>
                <span>Attendance</span>
              </button>

              {/* 3. Events */}
              <button
                onClick={() => { setActiveTab('events'); setIsSidebarOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: activeTab === 'events' ? 900 : 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                  backgroundColor: activeTab === 'events' ? '#15803d' : 'transparent',
                  color: activeTab === 'events' ? '#ffffff' : '#64748b',
                  boxShadow: activeTab === 'events' ? '0 4px 12px rgba(21, 128, 61, 0.25)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>Events</span>
              </button>

              {/* 4. Officers */}
              <button
                onClick={() => { setActiveTab('officers'); setIsSidebarOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: activeTab === 'officers' ? 900 : 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                  backgroundColor: activeTab === 'officers' ? '#15803d' : 'transparent',
                  color: activeTab === 'officers' ? '#ffffff' : '#64748b',
                  boxShadow: activeTab === 'officers' ? '0 4px 12px rgba(21, 128, 61, 0.25)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="5" />
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                </svg>
                <span>Officers</span>
              </button>

              {/* 5. Finance */}
              <button
                onClick={() => { setActiveTab('finance'); setIsSidebarOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: activeTab === 'finance' ? 900 : 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                  backgroundColor: activeTab === 'finance' ? '#15803d' : 'transparent',
                  color: activeTab === 'finance' ? '#ffffff' : '#64748b',
                  boxShadow: activeTab === 'finance' ? '0 4px 12px rgba(21, 128, 61, 0.25)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5z" />
                  <path d="M16 12h5" />
                  <circle cx="18" cy="12" r="1" />
                </svg>
                <span>Finance</span>
              </button>

              {/* 6. Sanctions */}
              <button
                onClick={() => { setActiveTab('sanctions'); setIsSidebarOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: activeTab === 'sanctions' ? 900 : 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                  backgroundColor: activeTab === 'sanctions' ? '#15803d' : 'transparent',
                  color: activeTab === 'sanctions' ? '#ffffff' : '#64748b',
                  boxShadow: activeTab === 'sanctions' ? '0 4px 12px rgba(21, 128, 61, 0.25)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>Sanctions</span>
              </button>

              {/* 7. Voting */}
              <button
                onClick={() => { setActiveTab('voting'); setIsSidebarOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: activeTab === 'voting' ? 900 : 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                  backgroundColor: activeTab === 'voting' ? '#15803d' : 'transparent',
                  color: activeTab === 'voting' ? '#ffffff' : '#64748b',
                  boxShadow: activeTab === 'voting' ? '0 4px 12px rgba(21, 128, 61, 0.25)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 12 2 2 4-4" />
                  <path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7Z" />
                  <path d="M22 19H2" />
                </svg>
                <span>Voting</span>
              </button>

              {/* 8. Profile */}
              <button
                onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: activeTab === 'profile' ? 900 : 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                  backgroundColor: activeTab === 'profile' ? '#15803d' : 'transparent',
                  color: activeTab === 'profile' ? '#ffffff' : '#64748b',
                  boxShadow: activeTab === 'profile' ? '0 4px 12px rgba(21, 128, 61, 0.25)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Profile</span>
              </button>

              {/* 9. About */}
              <button
                onClick={() => { setActiveTab('about'); setIsSidebarOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: activeTab === 'about' ? 900 : 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                  backgroundColor: activeTab === 'about' ? '#15803d' : 'transparent',
                  color: activeTab === 'about' ? '#ffffff' : '#64748b',
                  boxShadow: activeTab === 'about' ? '0 4px 12px rgba(21, 128, 61, 0.25)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>About</span>
              </button>
            </nav>
          </div>

          <div style={{ paddingTop: '16px' }}>
            <button
              onClick={handleSignOut}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 14px',
                background: 'none',
                border: 'none',
                color: '#b91c1c',
                fontSize: '0.85rem',
                fontWeight: 800,
                cursor: 'pointer',
                borderRadius: '8px',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* ======================================================== */}
        {/* MAIN BODY VIEWPORT */}
        {/* ======================================================== */}
        <main style={{ flex: 1, padding: '32px 36px', boxSizing: 'border-box', overflowY: 'auto' }}>
          {notification.message && (
            <div
              style={{
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
                color: notification.type === 'error' ? '#b91c1c' : '#15803d',
                backgroundColor: notification.type === 'error' ? '#fef2f2' : '#f0fdf4',
                border: `1px solid ${notification.type === 'error' ? '#fee2e2' : '#bbf7d0'}`,
                padding: '10px 16px',
                borderRadius: '12px',
              }}
            >
              {notification.message}
            </div>
          )}

          {/* TAB 1: MY ID (EXACT IMAGE_710C39.PNG LAYOUT) */}
          {activeTab === 'my-id' && (
            <div style={{ maxWidth: '980px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0' }}>
                    My Digital ID
                  </h1>
                  <p style={{ fontSize: '0.88rem', color: '#15803d', margin: 0, fontWeight: 700 }}>
                    Your official scannable organization credentials.
                  </p>
                </div>
                {profile.avatar_url && (
                  <button
                    onClick={handleDownloadIdCard}
                    disabled={downloadingId}
                    style={{
                      padding: '10px 18px',
                      backgroundColor: '#15803d',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(21,128,61,0.2)',
                    }}
                  >
                    {downloadingId ? 'Generating...' : 'Download Official ID'}
                  </button>
                )}
              </div>

              <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" style={{ display: 'none' }} />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', alignItems: 'start' }}>
                {/* ID Card Display */}
                <div style={{ maxWidth: '340px', margin: '0 auto', width: '100%' }}>
                  <div
                    ref={idCardRef}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '28px',
                      border: '2px solid #22c55e',
                      boxShadow: '0 12px 30px rgba(34, 197, 94, 0.15)',
                      padding: '60px 20px 24px 20px',
                      textAlign: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '110px',
                        backgroundColor: '#15803d',
                        borderBottomLeftRadius: '36px',
                        borderBottomRightRadius: '36px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        paddingTop: '16px',
                      }}
                    >
                      <span
                        style={{
                          color: '#ffffff',
                          fontSize: '0.78rem',
                          fontWeight: 900,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          backgroundColor: 'rgba(255, 255, 255, 0.22)',
                          backdropFilter: 'blur(5px)',
                          padding: '3px 14px',
                          borderRadius: '9999px',
                        }}
                      >
                        CEC- TRACK
                      </span>
                    </div>

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        cursor: 'pointer',
                        position: 'relative',
                        zIndex: 2,
                        marginTop: '10px',
                        border: '4px solid #ffffff',
                        overflow: 'hidden',
                        backgroundColor: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '94px',
                        height: '94px',
                        borderRadius: '24px',
                        margin: '10px auto 0 auto',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                    >
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '2rem' }}>👤</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#15803d',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        marginTop: '6px',
                        textDecoration: 'underline',
                        position: 'relative',
                        zIndex: 2,
                      }}
                    >
                      {uploadingPhoto ? 'Uploading...' : profile.avatar_url ? 'Change Photo' : 'Upload 2x2 Photo'}
                    </button>

                    <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', margin: '10px 0 2px 0' }}>
                      {profile.full_name}
                    </h2>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase' }}>STUDENT ID</div>
                    <div style={{ display: 'inline-block', backgroundColor: '#f0fdf4', color: '#0f172a', border: '1px solid #bbf7d0', padding: '3px 16px', borderRadius: '10px', fontSize: '1.05rem', fontWeight: 900, margin: '4px 0 14px 0' }}>
                      {profile.school_id}
                    </div>

                    {profile.avatar_url ? (
                      <div>
                        <div style={{ maxWidth: '180px', margin: '0 auto', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
                          <img src={qrCodeUrl} alt="QR Code" crossOrigin="anonymous" style={{ width: '100%', height: 'auto', display: 'block' }} />
                        </div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#15803d', letterSpacing: '0.08em', marginTop: '10px' }}>
                          SCAN FOR ATTENDANCE
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '16px', backgroundColor: '#fef2f2', border: '1px dashed #fca5a5', borderRadius: '16px' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#991b1b' }}>QR Code Locked</div>
                        <p style={{ fontSize: '0.7rem', color: '#b91c1c', margin: '4px 0 0 0' }}>
                          Upload your photo above to activate your Attendance QR Code.
                        </p>
                      </div>
                    )}

                    <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '16px', paddingTop: '10px' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        CATEEL EXTENSION CAMPUS
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side Info Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '18px', padding: '20px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>📱</div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '0.92rem', fontWeight: 900, color: '#15803d' }}>
                        Universal Device Cloud Sync
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#166534', lineHeight: 1.5 }}>
                        Your uploaded ID picture is saved directly to your account. Open your account on your laptop or phone anytime and your picture is immediately updated.
                      </p>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '20px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>🛡️</div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '0.92rem', fontWeight: 900, color: '#0f172a' }}>
                        Official Usage Policy
                      </h4>
                      <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.55 }}>
                        <li>Present this QR code for attendance monitoring at all official assemblies.</li>
                        <li>This code is non-transferable. Presenting another student&apos;s code is prohibited.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ATTENDANCE (EXACT IMAGE_710C58.PNG LAYOUT) */}
          {activeTab === 'attendance' && (
            <div style={{ maxWidth: '980px', margin: '0 auto' }}>
              <div style={{ display: 'inline-block', backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', padding: '4px 14px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>
                OFFICIAL ATTENDANCE HISTORY
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>
                    My Attendance Record
                  </h1>
                  <p style={{ fontSize: '0.85rem', color: '#15803d', margin: 0, fontWeight: 700 }}>
                    Track your attendance participation and status.
                  </p>
                </div>
                <button
                  onClick={fetchStudentData}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#334155',
                    cursor: 'pointer',
                  }}
                >
                  Refresh Records
                </button>
              </div>

              {/* 4 STATS ROW */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '22px' }}>
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '18px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>TOTAL EVENTS</span>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>{totalEventsCount}</div>
                </div>

                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '18px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>TOTAL PRESENT</span>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#15803d', marginTop: '4px' }}>{totalPresentCount}</div>
                </div>

                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '18px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>ABSENCES</span>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: totalAbsencesCount > 0 ? '#dc2626' : '#15803d', marginTop: '4px' }}>{totalAbsencesCount}</div>
                </div>

                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '18px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>COMPLIANCE RATE</span>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#15803d', marginTop: '4px' }}>{complianceRate}%</div>
                </div>
              </div>

              {/* Filter Tabs & Search */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setAttendanceFilter('all')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      backgroundColor: attendanceFilter === 'all' ? '#15803d' : '#f1f5f9',
                      color: attendanceFilter === 'all' ? '#ffffff' : '#475569',
                    }}
                  >
                    All ({attendanceLogs.length})
                  </button>
                  <button
                    onClick={() => setAttendanceFilter('present')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      backgroundColor: attendanceFilter === 'present' ? '#15803d' : '#f1f5f9',
                      color: attendanceFilter === 'present' ? '#ffffff' : '#475569',
                    }}
                  >
                    ✓ Present ({totalPresentCount})
                  </button>
                  <button
                    onClick={() => setAttendanceFilter('absent')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      backgroundColor: attendanceFilter === 'absent' ? '#15803d' : '#f1f5f9',
                      color: attendanceFilter === 'absent' ? '#ffffff' : '#475569',
                    }}
                  >
                    ✕ Absent ({totalAbsencesCount})
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Search event..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    width: '180px',
                  }}
                />
              </div>

              {/* Table */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 800, color: '#475569' }}>EVENT &amp; LOCATION</th>
                      <th style={{ padding: '12px 16px', fontWeight: 800, color: '#475569' }}>DATE</th>
                      <th style={{ padding: '12px 16px', fontWeight: 800, color: '#475569' }}>TIME IN</th>
                      <th style={{ padding: '12px 16px', fontWeight: 800, color: '#475569' }}>TIME OUT</th>
                      <th style={{ padding: '12px 16px', fontWeight: 800, color: '#475569' }}>STATUS</th>
                      <th style={{ padding: '12px 16px', fontWeight: 800, color: '#475569', textAlign: 'center' }}>ATTENDANCE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                          No attendance records found.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => {
                        const isPresent = log.status === 'PRESENT';
                        return (
                          <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ fontWeight: 800, color: '#0f172a' }}>{log.title}</div>
                              <div style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 700 }}>📍 {log.location}</div>
                            </td>
                            <td style={{ padding: '14px 16px', color: '#64748b' }}>{log.date}</td>
                            <td style={{ padding: '14px 16px', fontWeight: 800, color: isPresent ? '#15803d' : '#94a3b8' }}>{log.time_in}</td>
                            <td style={{ padding: '14px 16px', fontWeight: 800, color: log.time_out !== '--:--' ? '#15803d' : '#94a3b8' }}>{log.time_out}</td>
                            <td style={{ padding: '14px 16px', fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>{log.event_status}</td>
                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '4px 12px',
                                  borderRadius: '9999px',
                                  fontSize: '0.72rem',
                                  fontWeight: 900,
                                  backgroundColor: isPresent ? '#dcfce7' : '#fee2e2',
                                  color: isPresent ? '#15803d' : '#b91c1c',
                                  border: `1px solid ${isPresent ? '#bbf7d0' : '#fecaca'}`,
                                }}
                              >
                                {isPresent ? '✓ PRESENT' : '✕ ABSENT'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: EVENTS (EXACT IMAGE_710C8F.PNG LAYOUT) */}
          {activeTab === 'events' && (
            <div style={{ maxWidth: '980px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <div style={{ display: 'inline-block', backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', padding: '4px 14px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>
                    OFFICIAL ORGANIZATION ACTIVITIES
                  </div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>
                    Organization Events
                  </h1>
                  <p style={{ fontSize: '0.85rem', color: '#15803d', margin: 0, fontWeight: 700 }}>
                    Explore upcoming assemblies and official activities.
                  </p>
                </div>

                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569' }}>
                  Total: {events.length} <span style={{ color: '#15803d', marginLeft: '6px' }}>Active: {events.filter((e) => e.status === 'active').length}</span>
                </div>
              </div>

              {/* Event Cards Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {events.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', color: '#94a3b8' }}>
                    No official events scheduled at this time.
                  </div>
                ) : (
                  events.map((ev) => {
                    const isActive = ev.status === 'active';
                    return (
                      <div
                        key={ev.id}
                        style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '24px',
                          overflow: 'hidden',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                        }}
                      >
                        {ev.image_url && (
                          <div style={{ width: '100%', height: '180px', overflow: 'hidden' }}>
                            <img src={ev.image_url} alt={ev.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}

                        <div style={{ padding: '20px 24px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span
                              style={{
                                backgroundColor: isActive ? '#dcfce7' : '#f1f5f9',
                                color: isActive ? '#15803d' : '#64748b',
                                border: `1px solid ${isActive ? '#bbf7d0' : '#e2e8f0'}`,
                                borderRadius: '9999px',
                                padding: '3px 10px',
                                fontSize: '0.68rem',
                                fontWeight: 900,
                              }}
                            >
                              {isActive ? '● ACTIVE (OPEN)' : 'INACTIVE (CLOSED)'}
                            </span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>{ev.date}</span>
                          </div>

                          <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>{ev.title}</h3>
                          <div style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 800 }}>📍 {ev.location || 'FaCET Facade'}</div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, margin: '6px 0 10px 0' }}>
                            In: {formatTime12Hour(ev.time_in)} Out: {formatTime12Hour(ev.time_out)}
                          </div>
                          <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
                            {ev.description || 'Official general assembly and campus-wide attendance tracking.'}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 4: OFFICERS */}
          {activeTab === 'officers' && (
            <div style={{ maxWidth: '980px', margin: '0 auto' }}>
              <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0' }}>
                  Organization Officers
                </h1>
                <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
                  Elected leadership and executive council roster.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '28px', textAlign: 'center' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#f0fdf4', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                    🏅
                  </div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>Executive Council</h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>Supreme Student Government &amp; Campus Representatives</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: FINANCE */}
          {activeTab === 'finance' && (
            <div style={{ maxWidth: '980px', margin: '0 auto' }}>
              <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0' }}>
                  Financial Records
                </h1>
                <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
                  Membership dues and official organization collections.
                </p>
              </div>

              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '36px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0' }}>
                  Account in Good Standing
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                  No pending balances or disciplinary fees assessed.
                </p>
              </div>
            </div>
          )}

          {/* TAB 6: SANCTIONS (DYNAMIC ZERO ABSENCE STATE) */}
          {activeTab === 'sanctions' && (
            <div style={{ maxWidth: '980px', margin: '0 auto', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.025em' }}>
                    My Attendance &amp; Sanctions
                  </h1>
                  <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0, fontWeight: 500 }}>
                    Monitor your event attendance compliance, absences, and assigned disciplinary duties.
                  </p>
                </div>

                <button
                  onClick={fetchStudentData}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#334155',
                    cursor: 'pointer',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                  <span>Refresh</span>
                </button>
              </div>

              {/* STAT CARDS (ALL GREEN HIGHLIGHTS) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '22px' }}>
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803d' }}>
                    📅
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>TOTAL EVENTS</span>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.15 }}>{totalEventsCount}</div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803d' }}>
                    👤
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>EVENTS ATTENDED</span>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#15803d', lineHeight: 1.15 }}>{totalPresentCount}</div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: totalAbsencesCount > 0 ? '#fef2f2' : '#f0fdf4', border: `1px solid ${totalAbsencesCount > 0 ? '#fee2e2' : '#bbf7d0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: totalAbsencesCount > 0 ? '#dc2626' : '#15803d' }}>
                    ⚠️
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>TOTAL ABSENCES</span>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: totalAbsencesCount > 0 ? '#dc2626' : '#15803d', lineHeight: 1.15 }}>{totalAbsencesCount}</div>
                  </div>
                </div>
              </div>

              {/* Attendance Alert: Lalabas lang kung may totoong absences */}
              {totalAbsencesCount > 0 && (
                <div style={{ backgroundColor: '#fff1f2', border: '1px solid #ffe4e6', borderRadius: '18px', padding: '20px 24px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#be123c', fontWeight: 900, fontSize: '0.88rem', marginBottom: '6px' }}>
                    <span>⚠️</span>
                    <span>Attendance Alert ({totalAbsencesCount} Event Absences)</span>
                  </div>
                  <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: '#9f1239' }}>
                    You were recorded absent from the following mandatory event(s). Please review your assigned sanction duties below.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {absentEventsList.map((item) => (
                      <span key={item.id} style={{ backgroundColor: '#ffffff', border: '1px solid #fecdd3', color: '#be123c', borderRadius: '9999px', padding: '5px 14px', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase' }}>
                        {item.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sanctions Policy Card */}
              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ fontSize: '0.82rem', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                  OFFICIAL SANCTIONS &amp; PENALTIES ({totalAbsencesCount})
                </h3>
              </div>

              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '48px 24px', textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803d', margin: '0 auto 16px auto', fontSize: '1.8rem' }}>
                  🕒
                </div>

                <span style={{ display: 'inline-block', backgroundColor: '#f0fdf4', color: '#15803d', fontSize: '0.68rem', fontWeight: 900, padding: '4px 12px', borderRadius: '9999px', border: '1px solid #bbf7d0', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                  POLICY NOTICE
                </span>

                <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', margin: '0 0 10px 0' }}>
                  {totalAbsencesCount === 0 ? 'No Active Sanctions' : 'Sanctions Will Be Coming Soon'}
                </h2>

                <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '460px', margin: '0 auto 16px auto', lineHeight: 1.55 }}>
                  {totalAbsencesCount === 0
                    ? 'You currently have 0 recorded absences. You are in full compliance with all institutional assemblies and activities.'
                    : `You currently have ${totalAbsencesCount} recorded absences. The specific requirements and community duties will be announced soon.`}
                </p>

                <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: 0 }}>
                  Please stay updated with your organizational officers for upcoming guidelines.
                </p>
              </div>
            </div>
          )}

          {/* TAB 7: VOTING */}
          {activeTab === 'voting' && (
            <div style={{ maxWidth: '980px', margin: '0 auto' }}>
              <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0' }}>
                  Student Voting &amp; Elections
                </h1>
                <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
                  Official ballot voting for student body elections.
                </p>
              </div>

              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '48px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', margin: '0 0 8px 0' }}>
                  Elections Closed
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                  There are no active ballots at this time. Upcoming elections will be announced by the COMELEC.
                </p>
              </div>
            </div>
          )}

          {/* TAB 8: PROFILE (EXACT IMAGE_710CB0.PNG & IMAGE_6FBA3F.PNG MATCH) */}
          {activeTab === 'profile' && (
            <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
              <div style={{ textAlign: 'center', marginBottom: '22px' }}>
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '24px',
                    backgroundColor: '#dcfce7',
                    border: '2px solid #15803d',
                    overflow: 'hidden',
                    margin: '0 auto 10px auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '2rem' }}>👤</span>
                  )}
                </div>
                <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>
                  {profile.full_name}
                </h1>
                <p style={{ fontSize: '0.85rem', color: '#15803d', margin: 0, fontWeight: 800 }}>
                  {profile.course} • {profile.section} • {profile.year_level}
                </p>
              </div>

              {/* VERIFIED STUDENT DETAILS CARD */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    VERIFIED STUDENT DETAILS
                  </span>
                  <span style={{ backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '9999px', padding: '3px 10px', fontSize: '0.68rem', fontWeight: 900, textTransform: 'uppercase' }}>
                    OFFICIAL RECORD
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b', fontWeight: 700 }}>Full Name</span>
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>{profile.full_name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b', fontWeight: 700 }}>Student ID</span>
                    <span style={{ fontWeight: 800, color: '#15803d' }}>{profile.school_id}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b', fontWeight: 700 }}>Email Address</span>
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>{profile.email}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b', fontWeight: 700 }}>Scanner Privilege</span>
                    <span style={{ backgroundColor: profile.can_scan ? '#dcfce7' : '#f1f5f9', color: profile.can_scan ? '#15803d' : '#64748b', borderRadius: '6px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 800 }}>
                      {profile.can_scan ? 'AUTHORIZED SCANNER' : 'STANDARD MEMBER'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b', fontWeight: 700 }}>Course &amp; Section</span>
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>{profile.course} - {profile.section}</span>
                  </div>
                </div>
              </div>

              {/* CHANGE PASSWORD ROW */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '18px 22px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '0.92rem', fontWeight: 900, color: '#0f172a' }}>
                    Portal Account Password
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                    Keep your account secure by maintaining a strong, confidential password.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(true)}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '8px 16px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  🔒 Change Password
                </button>
              </div>

              {/* FOOTER NOTICE */}
              <div style={{ backgroundColor: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '16px', padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ color: '#2563eb', fontSize: '1.1rem' }}>ℹ️</span>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#1e40af', textTransform: 'uppercase' }}>
                    ADMINISTRATOR MANAGED PROFILE
                  </span>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#3b82f6', lineHeight: 1.45 }}>
                    Your official student record (Name, Student ID, Email, Course, Section, and Year) is maintained by the organization administrators. If you need any corrections to your details, please contact an organization officer or administrator.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: ABOUT (BUONG KWENTO DIREKTA SA DASHBOARD) */}
          {activeTab === 'about' && (
            <div style={{ maxWidth: '980px', margin: '0 auto', width: '100%' }}>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'inline-block', backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', padding: '6px 18px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '12px' }}>
                  ✨ ABOUT CECTRACK
                </div>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0f172a', margin: '0 0 10px 0', letterSpacing: '-0.03em' }}>
                  Transforming Student Organization Operations
                </h1>
                <p style={{ fontSize: '0.92rem', color: '#64748b', maxWidth: '640px', margin: '0 auto', lineHeight: 1.6 }}>
                  CECTRACK is an all-in-one centralized digital ecosystem engineered specifically for the students, officers, and faculty of <strong>Davao Oriental State University – Cateel Extension Campus (DOrSU-CEC)</strong>.
                </p>
              </div>

              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '22px', padding: '28px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#f0fdf4', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', border: '1px solid #bbf7d0' }}>
                    📑
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>What is CECTRACK?</h2>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                      Institutional Governance &amp; Activity Operating Platform
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.65, margin: '0 0 10px 0' }}>
                  <strong>CECTRACK</strong> is a purpose-built platform designed to modernize campus administration. It eliminates slow paper sign-in sheets, misplaced tally forms, and disorganized spreadsheets by providing automated, tamper-proof digital attendance and student tracking.
                </p>
                <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.65, margin: 0 }}>
                  Equipped with live camera QR scanners, real-time duplicate check-in prevention, and instant student profile verification, CECTRACK ensures total transparency, accuracy, and operational ease for both student leaders and faculty advisers.
                </p>
              </div>

              {/* Developer Profile Card */}
              <div
                style={{
                  background: 'linear-gradient(145deg, #064e3b 0%, #022c22 100%)',
                  borderRadius: '26px',
                  padding: '32px 28px',
                  color: '#ffffff',
                  boxShadow: '0 16px 36px rgba(6, 78, 59, 0.25)',
                  border: '1px solid rgba(52, 211, 153, 0.25)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  <div
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '22px',
                      backgroundColor: '#065f46',
                      border: '3px solid #34d399',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src="/beloy.jpg"
                      alt="Renowee Beloy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }}
                      onError={(e) => {
                        e.currentTarget.src = 'https://github.com/renoweebeloy.png';
                      }}
                    />
                  </div>

                  <div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#fbbf24', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                      DEVELOPED BY
                    </span>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 900, margin: '0 0 4px 0', color: '#ffffff' }}>
                      Renowee Beloy
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: '#a7f3d0', margin: 0, fontWeight: 700, lineHeight: 1.4 }}>
                      Lead Creator • BS Information Technology (BSIT)
                      <br />
                      Faculty of Computing, Engineering, and Technology (FaCET)
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '18px' }}>
                  <span style={{ backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#6ee7b7', border: '1px solid rgba(52, 211, 153, 0.35)', padding: '5px 12px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 800 }}>
                    Developer
                  </span>
                  <span style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#7dd3fc', border: '1px solid rgba(56, 189, 248, 0.35)', padding: '5px 12px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 800 }}>
                    💻 Full-Stack Web &amp; Database Systems
                  </span>
                  <span style={{ backgroundColor: 'rgba(251, 191, 36, 0.15)', color: '#fde68a', border: '1px solid rgba(251, 191, 36, 0.35)', padding: '5px 12px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 800 }}>
                    📍 Davao Oriental State University Main Campus
                  </span>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#d1fae5', lineHeight: 1.65, margin: 0, borderTop: '1px solid rgba(52, 211, 153, 0.2)', paddingTop: '16px' }}>
                  CECTRACK was conceptualized and developed by <strong>Renowee Beloy</strong> from the <strong>Faculty of Computing, Engineering, and Technology (FaCET)</strong> as a specialized institutional software initiative for Davao Oriental State University. Engineered to resolve manual attendance bottlenecks, it replaces tedious paper logs with reliable digital identification, camera-based QR scanning, and automated attendance reporting.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* CHANGE PASSWORD MODAL */}
      {isChangePasswordOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', width: '100%', maxWidth: '400px', borderRadius: '22px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>
              Change Password
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 16px 0' }}>
              Create a new secure password for your portal account.
            </p>

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>New Password</label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  required
                />
              </div>

              {passwordMsg.text && (
                <div style={{ fontSize: '0.8rem', color: passwordMsg.type === 'error' ? '#b91c1c' : '#15803d', backgroundColor: passwordMsg.type === 'error' ? '#fef2f2' : '#f0fdf4', padding: '8px 12px', borderRadius: '8px' }}>
                  {passwordMsg.text}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  style={{ flex: 1, padding: '10px', backgroundColor: '#15803d', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer' }}
                >
                  {passwordLoading ? 'Saving...' : 'Save Password'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  style={{ padding: '10px 16px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer' }}
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
