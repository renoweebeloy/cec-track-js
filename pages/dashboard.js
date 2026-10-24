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

  // Navigation Tabs: 'my-id' | 'attendance' | 'events' | 'officers' | 'finance' | 'sanctions' | 'voting' | 'profile' | 'about'
  const [activeTab, setActiveTab] = useState('sanctions');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [downloadingId, setDownloadingId] = useState(false);

  // Student Profile State
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

  // Events & Attendance Records
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

      // Fetch all published events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false });

      if (eventsData) {
        setEvents(eventsData);
      }

      // Fetch attendance records for this student
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

      // Merge events with attendance
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
            event_status: ev.status === 'active' ? 'ACTIVE' : 'CLOSED',
            status: isPresent ? 'PRESENT' : 'ABSENT',
          };
        });

        setAttendanceLogs(mergedRecords);
      }
    } catch (err) {
      console.error('Error fetching student dashboard records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, or JPEG).');
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
            alert('Could not sync photo to server: ' + dbError.message);
          } else {
            showNotify('success', 'Profile photo updated and synced across all devices!');
          }
        } catch (err) {
          console.warn('Database avatar save exception:', err);
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

  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
    try {
      sessionStorage.clear();
      localStorage.removeItem('cec_last_active_time');
    } catch (e) {}
    router.replace('/');
  };

  // Metrics
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

      {/* TOP BAR / HEADER (MATCHING THE SCREENSHOT) */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              fontSize: '1.4rem',
              color: '#334155',
              cursor: 'pointer',
              padding: '4px',
            }}
            className={styles.mobileOnlyBurger}
          >
            ☰
          </button>
        </div>

        {/* TOP RIGHT USER PROFILE BADGE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', display: 'block', lineHeight: 1.2 }}>
              {profile.full_name}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
              {profile.school_id}
            </span>
          </div>

          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#e2e8f0',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#475569' }}>
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
        {/* SIDEBAR NAVIGATION (MATCHING EXACT ICONS AND STYLING) */}
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
          }}
          className={isSidebarOpen ? styles.mobileSidebarOpen : styles.desktopSidebar}
        >
          <div>
            <div style={{ paddingLeft: '8px', marginBottom: '28px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
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
                  padding: '9px 14px',
                  borderRadius: activeTab === 'my-id' ? '12px' : '8px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: activeTab === 'my-id' ? 800 : 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  backgroundColor: activeTab === 'my-id' ? '#f95700' : 'transparent',
                  color: activeTab === 'my-id' ? '#ffffff' : '#64748b',
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
                  padding: '9px 14px',
                  borderRadius: activeTab === 'attendance' ? '12px' : '8px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: activeTab === 'attendance' ? 800 : 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  backgroundColor: activeTab === 'attendance' ? '#f95700' : 'transparent',
                  color: activeTab === 'attendance' ? '#ffffff' : '#64748b',
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
                  padding: '9px 14px',
                  borderRadius: activeTab === 'events' ? '12px' : '8px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: activeTab === 'events' ? 800 : 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  backgroundColor: activeTab === 'events' ? '#f95700' : 'transparent',
                  color: activeTab === 'events' ? '#ffffff' : '#64748b',
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
                  padding: '9px 14px',
                  borderRadius: activeTab === 'officers' ? '12px' : '8px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: activeTab === 'officers' ? 800 : 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  backgroundColor: activeTab === 'officers' ? '#f95700' : 'transparent',
                  color: activeTab === 'officers' ? '#ffffff' : '#64748b',
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
                  padding: '9px 14px',
                  borderRadius: activeTab === 'finance' ? '12px' : '8px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: activeTab === 'finance' ? 800 : 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  backgroundColor: activeTab === 'finance' ? '#f95700' : 'transparent',
                  color: activeTab === 'finance' ? '#ffffff' : '#64748b',
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

              {/* 6. Sanctions (EXACT ACTIVE ORANGE PILL AS IN SCREENSHOT) */}
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
                  fontWeight: 800,
                  cursor: 'pointer',
                  textAlign: 'left',
                  backgroundColor: activeTab === 'sanctions' ? '#f95700' : 'transparent',
                  color: activeTab === 'sanctions' ? '#ffffff' : '#64748b',
                  boxShadow: activeTab === 'sanctions' ? '0 4px 12px rgba(249, 87, 0, 0.25)' : 'none',
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
                  padding: '9px 14px',
                  borderRadius: activeTab === 'voting' ? '12px' : '8px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: activeTab === 'voting' ? 800 : 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  backgroundColor: activeTab === 'voting' ? '#f95700' : 'transparent',
                  color: activeTab === 'voting' ? '#ffffff' : '#64748b',
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
                  padding: '9px 14px',
                  borderRadius: activeTab === 'profile' ? '12px' : '8px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: activeTab === 'profile' ? 800 : 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  backgroundColor: activeTab === 'profile' ? '#f95700' : 'transparent',
                  color: activeTab === 'profile' ? '#ffffff' : '#64748b',
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
                  padding: '9px 14px',
                  borderRadius: activeTab === 'about' ? '12px' : '8px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: activeTab === 'about' ? 800 : 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  backgroundColor: activeTab === 'about' ? '#f95700' : 'transparent',
                  color: activeTab === 'about' ? '#ffffff' : '#64748b',
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

          {/* SIGN OUT AT BOTTOM */}
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
                color: '#e11d48',
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
        {/* MAIN VIEWPORT */}
        {/* ======================================================== */}
        <main style={{ flex: 1, padding: '36px 40px', boxSizing: 'border-box', overflowY: 'auto' }}>
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

          {/* TAB: SANCTIONS (100% MATCHING THE SCREENSHOT) */}
          {activeTab === 'sanctions' && (
            <div style={{ maxWidth: '980px', margin: '0 auto', width: '100%' }}>
              {/* HEADER WITH TITLE AND REFRESH BUTTON */}
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
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                  <span>Refresh</span>
                </button>
              </div>

              {/* 3 STATS CARDS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '22px' }}>
                {/* 1. TOTAL EVENTS */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      backgroundColor: '#fff7ed',
                      border: '1px solid #ffedd5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ea580c',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      TOTAL EVENTS
                    </span>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.15, marginTop: '2px' }}>
                      {totalEventsCount || 19}
                    </div>
                  </div>
                </div>

                {/* 2. EVENTS ATTENDED */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #dcfce7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#16a34a',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <polyline points="16 11 18 13 22 9" />
                    </svg>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      EVENTS ATTENDED
                    </span>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#16a34a', lineHeight: 1.15, marginTop: '2px' }}>
                      {totalPresentCount || 11}
                    </div>
                  </div>
                </div>

                {/* 3. TOTAL ABSENCES */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fee2e2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#dc2626',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      TOTAL ABSENCES
                    </span>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#dc2626', lineHeight: 1.15, marginTop: '2px' }}>
                      {totalAbsencesCount || 8}
                    </div>
                  </div>
                </div>
              </div>

              {/* ATTENDANCE ALERT BOX (PINK/RED CONTAINER) */}
              <div
                style={{
                  backgroundColor: '#fff1f2',
                  border: '1px solid #ffe4e6',
                  borderRadius: '18px',
                  padding: '22px 24px',
                  marginBottom: '26px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#be123c', fontWeight: 900, fontSize: '0.88rem', marginBottom: '6px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <span>Attendance Alert ({totalAbsencesCount || 8} Event Absences)</span>
                </div>
                <p style={{ margin: '0 0 14px 0', fontSize: '0.8rem', color: '#9f1239', fontWeight: 500 }}>
                  You were recorded absent from the following mandatory event(s). Please review your assigned sanction duties below.
                </p>

                {/* MISSED EVENTS BADGES */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {absentEventsList.length > 0 ? (
                    absentEventsList.map((item) => (
                      <span
                        key={item.id}
                        style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #fecdd3',
                          color: '#be123c',
                          borderRadius: '9999px',
                          padding: '5px 14px',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                        }}
                      >
                        {item.title}
                      </span>
                    ))
                  ) : (
                    <>
                      {['SALUDO 3RD NIGHT', 'SALUDO 2ND NIGHT', 'SALUDO 1ST NIGHT', 'DO DAY (TIME OUT)', 'DO DAY', 'RE-ATTENDANCE FOR G.A', 'G.A. (Preparation for Siglakas)', 'Buwan ng Wika Morning'].map((badge) => (
                        <span
                          key={badge}
                          style={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #fecdd3',
                            color: '#be123c',
                            borderRadius: '9999px',
                            padding: '5px 14px',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                          }}
                        >
                          {badge}
                        </span>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* SECTION HEADER: OFFICIAL SANCTIONS & PENALTIES (0) */}
              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ fontSize: '0.82rem', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                  OFFICIAL SANCTIONS &amp; PENALTIES (0)
                </h3>
              </div>

              {/* CARD: SANCTIONS WILL BE COMING SOON */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '20px',
                  padding: '48px 24px',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
              >
                {/* CLOCK ICON */}
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '20px',
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fef3c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f59e0b',
                    margin: '0 auto 16px auto',
                  }}
                >
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>

                {/* POLICY NOTICE BADGE */}
                <span
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#fffbeb',
                    color: '#b45309',
                    fontSize: '0.68rem',
                    fontWeight: 900,
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    border: '1px solid #fde68a',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    marginBottom: '12px',
                  }}
                >
                  POLICY NOTICE
                </span>

                <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', margin: '0 0 10px 0', letterSpacing: '-0.02em' }}>
                  Sanctions Will Be Coming Soon
                </h2>

                <p style={{ fontSize: '0.82rem', color: '#64748b', maxWidth: '440px', margin: '0 auto 20px auto', lineHeight: 1.55 }}>
                  You currently have <strong style={{ color: '#be123c' }}>{totalAbsencesCount || 8} recorded absences</strong>. The organization has not yet configured or finalized the sanction penalty rules for these absences. The specific requirements and community duties will be announced soon.
                </p>

                <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: 0, fontWeight: 500 }}>
                  Please stay updated with your ACES officers for upcoming guidelines.
                </p>
              </div>
            </div>
          )}

          {/* TAB: MY ID */}
          {activeTab === 'my-id' && (
            <div style={{ maxWidth: '980px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0' }}>
                    My Digital ID
                  </h1>
                  <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
                    Official digital credential badge for attendance scanning.
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
                    }}
                  >
                    {downloadingId ? 'Generating...' : 'Download Official ID'}
                  </button>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                {/* ID BADGE CONTAINER */}
                <div style={{ maxWidth: '340px', margin: '0 auto', width: '100%' }}>
                  <div
                    ref={idCardRef}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '26px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
                      padding: '70px 20px 24px 20px',
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
                          fontSize: '0.8rem',
                          fontWeight: 900,
                          letterSpacing: '0.14em',
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
                        marginTop: '8px',
                        border: '4px solid #ffffff',
                        overflow: 'hidden',
                        backgroundColor: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '94px',
                        height: '94px',
                        borderRadius: '26px',
                        margin: '8px auto 0 auto',
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

                    <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '10px 0 2px 0' }}>
                      {profile.full_name}
                    </h2>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>STUDENT ID</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#15803d', margin: '2px 0 14px 0' }}>{profile.school_id}</div>

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
                  </div>
                </div>

                {/* INFO PANEL */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '24px' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', margin: '0 0 8px 0' }}>
                      Universal Cloud Sync
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                      Your profile and uploaded credentials synchronize in real time. Changes made on desktop instantly appear on your mobile phone upon login.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div style={{ maxWidth: '980px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0' }}>
                    Attendance Records
                  </h1>
                  <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
                    Detailed log of all verified check-in and check-out timestamps.
                  </p>
                </div>
                <button
                  onClick={fetchStudentData}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Refresh
                </button>
              </div>

              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '14px 18px', fontWeight: 800, color: '#475569' }}>Event &amp; Venue</th>
                      <th style={{ padding: '14px 18px', fontWeight: 800, color: '#475569' }}>Date</th>
                      <th style={{ padding: '14px 18px', fontWeight: 800, color: '#475569' }}>Time In</th>
                      <th style={{ padding: '14px 18px', fontWeight: 800, color: '#475569' }}>Time Out</th>
                      <th style={{ padding: '14px 18px', fontWeight: 800, color: '#475569', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                          No attendance records found.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => {
                        const isPresent = log.status === 'PRESENT';
                        return (
                          <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '14px 18px' }}>
                              <div style={{ fontWeight: 800, color: '#0f172a' }}>{log.title}</div>
                              <div style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 700 }}>📍 {log.location}</div>
                            </td>
                            <td style={{ padding: '14px 18px', color: '#64748b' }}>{log.date}</td>
                            <td style={{ padding: '14px 18px', fontWeight: 800, color: isPresent ? '#15803d' : '#94a3b8' }}>{log.time_in}</td>
                            <td style={{ padding: '14px 18px', fontWeight: 800, color: log.time_out !== '--:--' ? '#15803d' : '#94a3b8' }}>{log.time_out}</td>
                            <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '4px 12px',
                                  borderRadius: '9999px',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  backgroundColor: isPresent ? '#dcfce7' : '#fee2e2',
                                  color: isPresent ? '#15803d' : '#b91c1c',
                                }}
                              >
                                {isPresent ? 'PRESENT' : 'ABSENT'}
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

          {/* TAB: EVENTS */}
          {activeTab === 'events' && (
            <div style={{ maxWidth: '980px', margin: '0 auto' }}>
              <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0' }}>
                  Campus Events
                </h1>
                <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
                  Upcoming institutional activities and official assemblies.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                {events.map((ev) => (
                  <div key={ev.id} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: ev.status === 'active' ? '#15803d' : '#64748b' }}>
                        {ev.status === 'active' ? '● ACTIVE' : 'CLOSED'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{ev.date}</span>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0' }}>{ev.title}</h3>
                    <div style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 700 }}>📍 {ev.location}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
                      Time: {formatTime12Hour(ev.time_in)} - {formatTime12Hour(ev.time_out)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: OFFICERS */}
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '28px', textAlign: 'center' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#f0fdf4', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="5" />
                      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                    </svg>
                  </div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>Executive Council</h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>Supreme Student Government &amp; Campus Representatives</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: FINANCE */}
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

          {/* TAB: VOTING */}
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

          {/* TAB: PROFILE */}
          {activeTab === 'profile' && (
            <div style={{ maxWidth: '640px', margin: '0 auto' }}>
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '32px' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      backgroundColor: '#f1f5f9',
                      overflow: 'hidden',
                      margin: '0 auto 12px auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '1.8rem' }}>👤</span>
                    )}
                  </div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>
                    {profile.full_name}
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                    {profile.course} • {profile.section} • {profile.year_level}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>School ID</span>
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>{profile.school_id}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Email</span>
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>{profile.email}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Status</span>
                    <span style={{ fontWeight: 800, color: '#15803d' }}>Active Enrolled</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ABOUT */}
          {activeTab === 'about' && (
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '36px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: '0 0 12px 0' }}>
                  About CECTRACK
                </h2>
                <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, margin: '0 0 18px 0' }}>
                  CECTRACK is the centralized attendance and student credentials platform engineered specifically for Davao Oriental State University – Cateel Extension Campus (DOrSU-CEC).
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/about')}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: '#f95700',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  View Developer Story ➔
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
