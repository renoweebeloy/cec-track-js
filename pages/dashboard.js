import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function StudentDashboard() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const idCardRef = useRef(null);

  // Active Tab Navigation
  const [activeTab, setActiveTab] = useState('my-id');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [downloadingId, setDownloadingId] = useState(false);

  // Welcome Toast Banner State
  const [showWelcomeToast, setShowWelcomeToast] = useState(true);

  // Logout Confirmation Modal State
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Password Change Modal States
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  // Student Profile Data
  const [profile, setProfile] = useState({
    full_name: 'Ive cadalzo',
    school_id: '2023-8133',
    email: 'ive.cadalzo@dorsu.edu.ph',
    course: 'BSAM',
    section: 'Section A',
    year_level: '3rd Year',
    avatar_url: '',
    can_scan: false,
  });

  // Events, Attendance, & Officers States
  const [events, setEvents] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [officersList, setOfficersList] = useState([]);
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

  // Auto-dismiss welcome toast pagkatapos ng 5 segundo
  useEffect(() => {
    const welcomeTimer = setTimeout(() => {
      setShowWelcomeToast(false);
    }, 5000);
    return () => clearTimeout(welcomeTimer);
  }, []);

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

      // 1. Events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false });

      if (eventsData) {
        setEvents(eventsData);
      }

      // 2. Attendance
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

      // 3. Officers
      const { data: officersData } = await supabase
        .from('officers')
        .select('*')
        .order('id', { ascending: true });

      if (officersData) {
        setOfficersList(officersData);
      }
    } catch (err) {
      console.error('Error fetching dashboard records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Palihug pagpili og saktong litrato (PNG, JPG, o JPEG).');
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
            alert('Wala ma-sync ang litrato sa database: ' + dbError.message);
          } else {
            showNotify('success', 'Profile photo updated & Attendance QR Code generated successfully!');
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
        backgroundColor: null,
        borderRadius: 34,
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
      setPasswordMsg({ type: 'error', text: 'Ang password kinahanglang labing menos 6 ka letra/numero.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Wala magkatugma ang bag-ong password.' });
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

      setPasswordMsg({ type: 'success', text: 'Malampusong nabag-o ang imong password!' });
      setTimeout(() => {
        setIsChangePasswordOpen(false);
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

  const handleConfirmSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
    try {
      sessionStorage.clear();
      localStorage.removeItem('cec_last_active_time');
    } catch (e) {}
    router.replace('/');
  };

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

  // STRUCTURED PAYLOAD + HIGH ECC PARA SA PINONG QR PATTERN
  const qrPayload = JSON.stringify({
    school_id: profile.school_id,
    full_name: profile.full_name,
    course: profile.course,
    campus: 'DOrSU-CEC',
    system: 'CECTRACK_AUTH_ATTENDANCE',
  });

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&ecc=H&margin=10&data=${encodeURIComponent(
    qrPayload
  )}`;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', overflowX: 'hidden', position: 'relative' }}>
      <Head>
        <title>Student Portal • CECTRACK</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" async />
      </Head>

      <style jsx>{`
        @media (max-width: 768px) {
          .portal-sidebar {
            position: fixed !important;
            top: 0 !important;
            bottom: 0 !important;
            left: 0 !important;
            width: 250px !important;
            max-width: 82vw !important;
            z-index: 100 !important;
            transform: ${isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)'} !important;
            transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1) !important;
            box-shadow: ${isSidebarOpen ? '8px 0 25px rgba(0,0,0,0.2)' : 'none'} !important;
          }
          .portal-main-content {
            padding: 16px 14px !important;
            width: 100% !important;
            max-width: 100vw !important;
          }
          .stats-grid-responsive {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
          .stats-grid-three {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
        }
        @media (min-width: 769px) {
          .portal-sidebar {
            position: relative !important;
            transform: none !important;
            width: 215px !important;
            flex-shrink: 0 !important;
            box-shadow: none !important;
          }
          .portal-main-content {
            padding: 32px 36px !important;
            flex: 1 !important;
          }
          .stats-grid-responsive {
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 16px !important;
          }
          .stats-grid-three {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 18px !important;
          }
        }
      `}</style>

      {/* TOP HEADER */}
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
          padding: '0 16px',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '1.2rem',
              color: '#334155',
              cursor: 'pointer',
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              touchAction: 'manipulation',
            }}
          >
            {isSidebarOpen ? '✕' : '☰'}
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#15803d', letterSpacing: '-0.02em' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ textAlign: 'right', minWidth: 0 }}>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 900,
                color: '#0f172a',
                display: 'block',
                lineHeight: 1.15,
                maxWidth: '105px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {profile.full_name}
            </span>
            <span style={{ fontSize: '0.68rem', color: '#15803d', fontWeight: 800 }}>
              {profile.school_id}
            </span>
          </div>

          <div
            style={{
              width: '34px',
              height: '34px',
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
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(3px)',
            zIndex: 90,
          }}
        />
      )}

      {/* GREEN WELCOME TO STUDENT PORTAL TOAST BANNER */}
      {showWelcomeToast && (
        <div
          style={{
            position: 'fixed',
            top: '18px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            backgroundColor: '#ecfdf5',
            border: '1.5px solid #a7f3d0',
            padding: '7px 20px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 6px 20px rgba(16, 185, 129, 0.12)',
          }}
        >
          <div
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: '#15803d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 900,
            }}
          >
            ✓
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#15803d' }}>
            Welcome to the Student Portal!
          </span>
          <button
            onClick={() => setShowWelcomeToast(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#15803d',
              fontSize: '12px',
              fontWeight: 900,
              cursor: 'pointer',
              marginLeft: '4px',
              padding: '0 4px',
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, minWidth: 0, width: '100%' }}>
        {/* SIDEBAR NAVIGATION */}
        <aside
          className="portal-sidebar"
          style={{
            backgroundColor: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '20px 14px',
            boxSizing: 'border-box',
            overflowY: 'auto',
          }}
        >
          <div>
            <div style={{ paddingLeft: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Portal</h2>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  STUDENT ACCESS
                </span>
              </div>
              {isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.1rem', fontWeight: 900, color: '#64748b', cursor: 'pointer', padding: '4px' }}
                >
                  ✕
                </button>
              )}
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                {
                  id: 'my-id',
                  label: 'My ID',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="16" rx="3" />
                      <line x1="7" y1="8" x2="11" y2="8" />
                      <line x1="7" y1="12" x2="11" y2="12" />
                      <rect x="14" y="8" width="4" height="4" />
                    </svg>
                  ),
                },
                {
                  id: 'attendance',
                  label: 'Attendance',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 8v4l3 3" />
                      <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" />
                    </svg>
                  ),
                },
                {
                  id: 'events',
                  label: 'Events',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  ),
                },
                {
                  id: 'officers',
                  label: 'Officers',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="5" />
                      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                    </svg>
                  ),
                },
                {
                  id: 'sanctions',
                  label: 'Sanctions',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  ),
                },
                {
                  id: 'profile',
                  label: 'Profile',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  ),
                },
                {
                  id: 'about',
                  label: 'About',
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  ),
                },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsSidebarOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: 'none',
                      fontSize: '0.85rem',
                      fontWeight: isActive ? 900 : 700,
                      cursor: 'pointer',
                      textAlign: 'left',
                      backgroundColor: isActive ? '#15803d' : 'transparent',
                      color: isActive ? '#ffffff' : '#64748b',
                      boxShadow: isActive ? '0 4px 12px rgba(21, 128, 61, 0.25)' : 'none',
                      transition: 'all 0.15s ease',
                      touchAction: 'manipulation',
                    }}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div style={{ paddingTop: '16px' }}>
            <button
              onClick={() => setIsLogoutModalOpen(true)}
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
                touchAction: 'manipulation',
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

        {/* MAIN BODY VIEWPORT */}
        <main className="portal-main-content" style={{ boxSizing: 'border-box', overflowY: 'auto' }}>
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

          {/* TAB 1: MY ID */}
          {activeTab === 'my-id' && (
            <div style={{ maxWidth: '980px', margin: '0 auto', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>My Digital ID</h1>
                  <p style={{ fontSize: '0.85rem', color: '#15803d', margin: 0, fontWeight: 700 }}>
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
                      borderRadius: '12px',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(21, 128, 61, 0.28)',
                      touchAction: 'manipulation',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>{downloadingId ? 'Generating...' : 'Download Official ID'}</span>
                  </button>
                )}
              </div>

              <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" style={{ display: 'none' }} />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '24px', alignItems: 'start', width: '100%' }}>
                <div style={{ maxWidth: '330px', margin: '0 auto', width: '100%' }}>
                  
                  {/* DIGITAL ID CARD (ACCURATE GREEN GRADIENT & PROPORTION) */}
                  <div
                    ref={idCardRef}
                    style={{
                      background: 'linear-gradient(180deg, #15803d 0%, #16a34a 38%, #bbf7d0 75%, #ffffff 96%)',
                      borderRadius: '34px',
                      border: '1.5px solid rgba(255, 255, 255, 0.45)',
                      boxShadow: '0 16px 36px -6px rgba(22, 101, 52, 0.28), 0 8px 16px rgba(0, 0, 0, 0.05)',
                      padding: '24px 20px 22px 20px',
                      textAlign: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    {/* Top Pill Header */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                      <span
                        style={{
                          backgroundColor: '#ffffff',
                          color: '#15803d',
                          fontSize: '0.72rem',
                          fontWeight: 900,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          padding: '4px 18px',
                          borderRadius: '9999px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
                        }}
                      >
                        <span style={{ fontSize: '0.65rem' }}>●</span> CEC-TRACK
                      </span>
                    </div>

                    {/* Student Photo Frame (Portrait with thick white border) */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        cursor: 'pointer',
                        width: '88px',
                        height: '108px',
                        borderRadius: '24px',
                        border: '4px solid #ffffff',
                        backgroundColor: '#ffffff',
                        overflow: 'hidden',
                        margin: '0 auto 12px auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.14)',
                        position: 'relative',
                      }}
                    >
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '2.2rem' }}>👤</span>
                      )}
                    </div>

                    {/* Full Name */}
                    <h2
                      style={{
                        fontSize: '1.28rem',
                        fontWeight: 900,
                        color: '#064e3b',
                        margin: '0 0 2px 0',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {profile.full_name}
                    </h2>

                    {/* Student ID Label */}
                    <div
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        color: '#166534',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        marginBottom: '6px',
                      }}
                    >
                      STUDENT ID
                    </div>

                    {/* White Pill Badge for ID Number */}
                    <div
                      style={{
                        display: 'inline-block',
                        backgroundColor: '#ffffff',
                        color: '#064e3b',
                        padding: '4px 22px',
                        borderRadius: '9999px',
                        fontSize: '1.02rem',
                        fontWeight: 900,
                        letterSpacing: '0.02em',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                        marginBottom: '16px',
                      }}
                    >
                      {profile.school_id}
                    </div>

                    {/* DENSE HIGH-DETAIL QR CODE CONTAINER */}
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '22px',
                        padding: '12px',
                        boxShadow: '0 8px 22px rgba(0, 0, 0, 0.08)',
                        maxWidth: '185px',
                        margin: '0 auto 14px auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {profile.avatar_url ? (
                        <img
                          src={qrCodeUrl}
                          alt="Student QR Code"
                          style={{
                            width: '100%',
                            height: 'auto',
                            display: 'block',
                            borderRadius: '8px',
                            imageRendering: 'pixelated',
                          }}
                        />
                      ) : (
                        <div style={{ padding: '16px 8px', color: '#991b1b', backgroundColor: '#fef2f2', borderRadius: '14px', width: '100%' }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 900 }}>QR Code Locked</div>
                          <p style={{ fontSize: '0.68rem', margin: '4px 0 0 0' }}>
                            Upload your photo to generate your Attendance QR Code.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* SCAN FOR ATTENDANCE */}
                    <div
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 900,
                        color: '#15803d',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        marginBottom: '10px',
                      }}
                    >
                      SCAN FOR ATTENDANCE
                    </div>

                    {/* Divider Line */}
                    <div
                      style={{
                        width: '84%',
                        height: '1px',
                        backgroundColor: '#cbd5e1',
                        margin: '0 auto 10px auto',
                      }}
                    />

                    {/* CATEEL EXTENSION CAMPUS */}
                    <div
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        color: '#475569',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}
                    >
                      CATEEL EXTENSION CAMPUS
                    </div>
                  </div>

                  {/* Photo Change Action sa Ilalim */}
                  <div style={{ textAlign: 'center', marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#15803d',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        touchAction: 'manipulation',
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                      <span>{uploadingPhoto ? 'Uploading...' : 'Tap photo to crop/change'}</span>
                    </button>
                  </div>
                </div>

                {/* Right Side Info Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
                  <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '18px', padding: '18px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '1.4rem', flexShrink: 0 }}>📱</div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 900, color: '#15803d' }}>
                        Universal Device Cloud Sync
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#166534', lineHeight: 1.5 }}>
                        Your uploaded ID picture is saved directly to your account. Open your account on your laptop or phone anytime and your picture is immediately updated.
                      </p>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '18px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '1.4rem', flexShrink: 0 }}>🛡️</div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 900, color: '#0f172a' }}>
                        Official Usage Policy
                      </h4>
                      <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px', fontSize: '0.78rem', color: '#64748b', lineHeight: 1.55 }}>
                        <li>Present this QR code for attendance monitoring at all official assemblies.</li>
                        <li>This code is non-transferable. Presenting another student&apos;s code is prohibited.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div style={{ maxWidth: '980px', margin: '0 auto', width: '100%' }}>
              <div style={{ display: 'inline-block', backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', padding: '4px 14px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>
                OFFICIAL ATTENDANCE HISTORY
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>
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
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#334155',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                  }}
                >
                  Refresh Records
                </button>
              </div>

              {/* STATS ROW */}
              <div className="stats-grid-responsive" style={{ display: 'grid', marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>TOTAL EVENTS</span>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>{totalEventsCount}</div>
                </div>

                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>TOTAL PRESENT</span>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#15803d', marginTop: '2px' }}>{totalPresentCount}</div>
                </div>

                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>ABSENCES</span>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: totalAbsencesCount > 0 ? '#dc2626' : '#15803d', marginTop: '2px' }}>{totalAbsencesCount}</div>
                </div>

                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>COMPLIANCE RATE</span>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#15803d', marginTop: '2px' }}>{complianceRate}%</div>
                </div>
              </div>

              {/* Filters & Search */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['all', 'present', 'absent'].map((filterKey) => (
                    <button
                      key={filterKey}
                      onClick={() => setAttendanceFilter(filterKey)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        backgroundColor: attendanceFilter === filterKey ? '#15803d' : '#f1f5f9',
                        color: attendanceFilter === filterKey ? '#ffffff' : '#475569',
                        textTransform: 'capitalize',
                        touchAction: 'manipulation',
                      }}
                    >
                      {filterKey === 'all' && `All (${attendanceLogs.length})`}
                      {filterKey === 'present' && `✓ Present (${totalPresentCount})`}
                      {filterKey === 'absent' && `✕ Absent (${totalAbsencesCount})`}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Search event..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.8rem',
                    width: '160px',
                  }}
                />
              </div>

              {/* Table Wrapper */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflowX: 'auto', width: '100%' }}>
                <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: '#475569' }}>EVENT &amp; LOCATION</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: '#475569' }}>DATE</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: '#475569' }}>TIME IN</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: '#475569' }}>TIME OUT</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: '#475569' }}>STATUS</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: '#475569', textAlign: 'center' }}>ATTENDANCE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                          No attendance records found.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => {
                        const isPresent = log.status === 'PRESENT';
                        return (
                          <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ fontWeight: 800, color: '#0f172a' }}>{log.title}</div>
                              <div style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 700 }}>📍 {log.location}</div>
                            </td>
                            <td style={{ padding: '12px 14px', color: '#64748b' }}>{log.date}</td>
                            <td style={{ padding: '12px 14px', fontWeight: 800, color: isPresent ? '#15803d' : '#94a3b8' }}>{log.time_in}</td>
                            <td style={{ padding: '12px 14px', fontWeight: 800, color: log.time_out !== '--:--' ? '#15803d' : '#94a3b8' }}>{log.time_out}</td>
                            <td style={{ padding: '12px 14px', fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>{log.event_status}</td>
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
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

          {/* TAB 3: EVENTS */}
          {activeTab === 'events' && (
            <div style={{ maxWidth: '980px', margin: '0 auto', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ display: 'inline-block', backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', padding: '4px 14px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>
                    OFFICIAL ORGANIZATION ACTIVITIES
                  </div>
                  <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
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
                          <div style={{ width: '100%', height: '170px', overflow: 'hidden' }}>
                            <img src={ev.image_url} alt={ev.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}

                        <div style={{ padding: '18px 20px' }}>
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

                          <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>{ev.title}</h3>
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
            <div style={{ maxWidth: '980px', margin: '0 auto', width: '100%' }}>
              <div style={{ marginBottom: '22px' }}>
                <div style={{ display: 'inline-block', backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', padding: '4px 14px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>
                  STUDENT LEADERSHIP ROSTER
                </div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>
                  Organization Officers
                </h1>
                <p style={{ fontSize: '0.85rem', color: '#15803d', margin: 0, fontWeight: 700 }}>
                  Meet the official campus and department student leaders.
                </p>
              </div>

              {officersList.length === 0 ? (
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '40px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🏅</div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>Officers Roster Coming Soon</h3>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '4px 0 0 0' }}>Wala pa&apos;y gidugang nga opisyales ang mga tagdumala.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
                  {officersList.map((off) => (
                    <div
                      key={off.id}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '22px',
                        padding: '24px 20px',
                        textAlign: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: '84px',
                          height: '84px',
                          borderRadius: '24px',
                          backgroundColor: '#dcfce7',
                          border: '3px solid #15803d',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '14px',
                          boxShadow: '0 4px 12px rgba(21,128,61,0.15)',
                        }}
                      >
                        {off.avatar_url ? (
                          <img src={off.avatar_url} alt={off.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '2rem' }}>👤</span>
                        )}
                      </div>

                      <span
                        style={{
                          backgroundColor: '#f0fdf4',
                          color: '#15803d',
                          border: '1px solid #bbf7d0',
                          padding: '3px 12px',
                          borderRadius: '9999px',
                          fontSize: '0.68rem',
                          fontWeight: 900,
                          textTransform: 'uppercase',
                          marginBottom: '8px',
                        }}
                      >
                        {off.position}
                      </span>

                      <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>
                        {off.name}
                      </h3>

                      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 10px 0', fontWeight: 600 }}>
                        {off.department}
                      </p>

                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800, borderTop: '1px solid #f1f5f9', width: '100%', paddingTop: '8px' }}>
                        Term: {off.term || '2026 - 2027'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SANCTIONS */}
          {activeTab === 'sanctions' && (
            <div style={{ maxWidth: '980px', margin: '0 auto', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.025em' }}>
                    My Attendance &amp; Sanctions
                  </h1>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, fontWeight: 500 }}>
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
                    borderRadius: '10px',
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#334155',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                  <span>Refresh</span>
                </button>
              </div>

              {/* STATS */}
              <div className="stats-grid-three" style={{ display: 'grid', marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#fff7ed', border: '1px solid #ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>TOTAL EVENTS</span>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.15, marginTop: '2px' }}>{totalEventsCount}</div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <polyline points="16 11 18 13 22 9" />
                    </svg>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>EVENTS ATTENDED</span>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#16a34a', lineHeight: 1.15, marginTop: '2px' }}>{totalPresentCount}</div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: totalAbsencesCount > 0 ? '#fef2f2' : '#f0fdf4', border: `1px solid ${totalAbsencesCount > 0 ? '#fee2e2' : '#bbf7d0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>TOTAL ABSENCES</span>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: totalAbsencesCount > 0 ? '#dc2626' : '#15803d', lineHeight: 1.15, marginTop: '2px' }}>{totalAbsencesCount}</div>
                  </div>
                </div>
              </div>

              {totalAbsencesCount > 0 && (
                <div style={{ backgroundColor: '#fff1f2', border: '1px solid #ffe4e6', borderRadius: '18px', padding: '18px 20px', marginBottom: '20px' }}>
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

              <div style={{ marginBottom: '12px' }}>
                <h3 style={{ fontSize: '0.82rem', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                  OFFICIAL SANCTIONS &amp; PENALTIES ({totalAbsencesCount})
                </h3>
              </div>

              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803d', margin: '0 auto 16px auto', fontSize: '1.8rem' }}>
                  🕒
                </div>

                <span style={{ display: 'inline-block', backgroundColor: '#f0fdf4', color: '#15803d', fontSize: '0.68rem', fontWeight: 900, padding: '4px 12px', borderRadius: '9999px', border: '1px solid #bbf7d0', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                  POLICY NOTICE
                </span>

                <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: '0 0 8px 0' }}>
                  {totalAbsencesCount === 0 ? 'No Active Sanctions' : 'Sanctions Will Be Coming Soon'}
                </h2>

                <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '460px', margin: '0 auto 14px auto', lineHeight: 1.55 }}>
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

          {/* TAB 6: PROFILE */}
          {activeTab === 'profile' && (
            <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
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
                <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>
                  {profile.full_name}
                </h1>
                <p style={{ fontSize: '0.85rem', color: '#15803d', margin: 0, fontWeight: 800 }}>
                  {profile.course} • {profile.section} • {profile.year_level}
                </p>
              </div>

              {/* VERIFIED STUDENT DETAILS CARD */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '20px', marginBottom: '18px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '14px', flexWrap: 'wrap', gap: '6px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    VERIFIED STUDENT DETAILS
                  </span>
                  <span style={{ backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '9999px', padding: '3px 10px', fontSize: '0.68rem', fontWeight: 900, textTransform: 'uppercase' }}>
                    OFFICIAL RECORD
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                    <span style={{ color: '#64748b', fontWeight: 700 }}>Full Name</span>
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>{profile.full_name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                    <span style={{ color: '#64748b', fontWeight: 700 }}>Student ID</span>
                    <span style={{ fontWeight: 800, color: '#15803d' }}>{profile.school_id}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                    <span style={{ color: '#64748b', fontWeight: 700 }}>Email Address</span>
                    <span style={{ fontWeight: 800, color: '#0f172a', wordBreak: 'break-all' }}>{profile.email}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                    <span style={{ color: '#64748b', fontWeight: 700 }}>Scanner Privilege</span>
                    <span style={{ backgroundColor: profile.can_scan ? '#dcfce7' : '#f1f5f9', color: profile.can_scan ? '#15803d' : '#64748b', borderRadius: '6px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 800 }}>
                      {profile.can_scan ? 'AUTHORIZED SCANNER' : 'STANDARD MEMBER'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                    <span style={{ color: '#64748b', fontWeight: 700 }}>Course &amp; Section</span>
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>{profile.course} - {profile.section}</span>
                  </div>
                </div>
              </div>

              {/* CHANGE PASSWORD ROW */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '0.9rem', fontWeight: 900, color: '#0f172a' }}>
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
                    touchAction: 'manipulation',
                  }}
                >
                  🔒 Change Password
                </button>
              </div>
            </div>
          )}

          {/* TAB 7: ABOUT */}
          {activeTab === 'about' && (
            <div style={{ maxWidth: '980px', margin: '0 auto', width: '100%' }}>
              <section style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#f0fdf4',
                    color: '#15803d',
                    border: '1px solid #bbf7d0',
                    padding: '6px 18px',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 900,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: '14px',
                  }}
                >
                  ABOUT CECTRACK
                </div>

                <h1
                  style={{
                    fontSize: 'clamp(1.7rem, 4vw, 2.6rem)',
                    fontWeight: 900,
                    color: '#0f172a',
                    letterSpacing: '-0.03em',
                    margin: '0 0 14px 0',
                    lineHeight: 1.2,
                  }}
                >
                  Transforming Student <br />
                  Organization Operations
                </h1>

                <p
                  style={{
                    fontSize: '0.92rem',
                    color: '#64748b',
                    maxWidth: '680px',
                    margin: '0 auto',
                    lineHeight: 1.6,
                    fontWeight: 500,
                  }}
                >
                  CECTRACK is an all-in-one digital ecosystem engineered specifically for
                  the students, officers, and faculty of <strong>Davao Oriental State University – Cateel Extension Campus (DOrSU-CEC)</strong>.
                </p>
              </section>

              {/* What is CECTRACK */}
              <section
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '24px',
                  padding: '24px 20px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                  marginBottom: '36px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      backgroundColor: '#f0fdf4',
                      color: '#15803d',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      border: '1px solid #bbf7d0',
                    }}
                  >
                    📑
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                      What is CECTRACK?
                    </h2>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                      Institutional Governance &amp; Activity Operating Platform
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.65, margin: '0 0 10px 0' }}>
                  <strong>CECTRACK</strong> is a purpose-built web and mobile platform designed to modernize campus administration. It eliminates slow paper sign-in sheets, misplaced tally forms, and disorganized spreadsheets by providing automated, tamper-proof digital attendance and student tracking.
                </p>
                <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.65, margin: 0 }}>
                  Equipped with camera QR scanners, live duplicate check-in prevention, and instant student profile verification, CECTRACK ensures total transparency, accuracy, and operational ease for both student leaders and faculty advisers.
                </p>
              </section>

              {/* Who Uses CECTRACK */}
              <section style={{ marginBottom: '40px' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0' }}>
                    Who Uses CECTRACK?
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                    Tailored workspaces engineered for every member of the academic community.
                  </p>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '16px',
                  }}
                >
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '20px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '12px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', marginBottom: '10px' }}>
                      👤
                    </div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0' }}>
                      Students &amp; Members
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                      Access personalized digital ID badges, view attendance history, explore upcoming assemblies, and verify compliance records in real time.
                    </p>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '20px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '12px', backgroundColor: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', marginBottom: '10px' }}>
                      📷
                    </div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0' }}>
                      Attendance Officers
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                      High-speed event check-in using mobile camera scanning, photo verification, and automated duplicate check-in prevention.
                    </p>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '20px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '12px', backgroundColor: '#fefce8', color: '#ca8a04', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', marginBottom: '10px' }}>
                      💼
                    </div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0' }}>
                      Department Heads
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                      Manage member rosters across BSCRIM, BSBA, BSA, BEED, and BSAM programs, and monitor general assembly participation rates.
                    </p>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '20px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '12px', backgroundColor: '#faf5ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', marginBottom: '10px' }}>
                      🏛️
                    </div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0' }}>
                      Executive Officers
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                      Publish official events with custom banners, oversee student enrollment whitelists, and export verified attendance records.
                    </p>
                  </div>
                </div>
              </section>

              {/* Developer Profile */}
              <section
                style={{
                  background: 'linear-gradient(145deg, #064e3b 0%, #022c22 100%)',
                  borderRadius: '24px',
                  padding: '28px 22px',
                  color: '#ffffff',
                  boxShadow: '0 16px 36px rgba(6, 78, 59, 0.25)',
                  border: '1px solid rgba(52, 211, 153, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
                  <div
                    style={{
                      width: '95px',
                      height: '95px',
                      borderRadius: '20px',
                      backgroundColor: '#065f46',
                      border: '3px solid #34d399',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.35)',
                    }}
                  >
                    <img
                      src="/beloy.jpg"
                      alt="Renowee Beloy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center 15%',
                      }}
                      onError={(e) => {
                        e.currentTarget.src = 'https://github.com/renoweebeloy.png';
                      }}
                    />
                  </div>

                  <div>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 900,
                        color: '#fbbf24',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        display: 'block',
                        marginBottom: '4px',
                      }}
                    >
                      DEVELOPED BY
                    </span>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 900, margin: '0 0 4px 0', letterSpacing: '-0.02em', color: '#ffffff' }}>
                      Renowee Beloy
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: '#a7f3d0', margin: 0, fontWeight: 700, lineHeight: 1.45 }}>
                      Lead Creator • BS Information Technology (BSIT)
                      <br />
                      Faculty of Computing, Engineering, and Technology (FaCET)
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
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

                <p
                  style={{
                    fontSize: '0.85rem',
                    color: '#d1fae5',
                    lineHeight: 1.65,
                    margin: 0,
                    borderTop: '1px solid rgba(52, 211, 153, 0.2)',
                    paddingTop: '14px',
                  }}
                >
                  CECTRACK was conceptualized and developed by <strong>Renowee Beloy</strong> from the <strong>Faculty of Computing, Engineering, and Technology (FaCET)</strong> as a specialized institutional software initiative for Davao Oriental State University. Engineered to resolve manual attendance bottlenecks, it replaces tedious paper logs with reliable digital identification, camera-based QR scanning, and automated attendance reporting.
                </p>
              </section>
            </div>
          )}
        </main>
      </div>

      {/* SIGN OUT / LOGOUT CONFIRMATION MODAL (TEXT ONLY) */}
      {isLogoutModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            zIndex: 130,
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
              borderRadius: '22px',
              padding: '24px 22px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>Sign Out</h3>
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1rem',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            {/* TEKSTO LAMANG (WALA NANG LOGO/ICON) */}
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
              Are you sure you want to log out of the Student Portal?[cite: 10]
            </p>

            {/* Modal Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
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
                  padding: '10px',
                  backgroundColor: '#e11d48',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  color: '#ffffff',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

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
                  style={{ flex: 1, padding: '10px', backgroundColor: '#15803d', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', touchAction: 'manipulation' }}
                >
                  {passwordLoading ? 'Saving...' : 'Save Password'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  style={{ padding: '10px 16px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', touchAction: 'manipulation' }}
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
