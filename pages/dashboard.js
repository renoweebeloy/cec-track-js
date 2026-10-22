import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Home.module.css';

export default function StudentDashboard() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const idCardRef = useRef(null);
  const scannerRef = useRef(null);

  const [activeTab, setActiveTab] = useState('my-id'); // 'my-id' | 'attendance' | 'events' | 'profile' | 'scan-attendance'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [downloadingId, setDownloadingId] = useState(false);

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

  // Scanner Clearance States
  const [selectedEventId, setSelectedEventId] = useState('');
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [scannedStudentData, setScannedStudentData] = useState(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [confirmingAttendance, setConfirmingAttendance] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Helper: Format Time to 12-Hour (AM/PM)
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
      const lastActive = localStorage.getItem('cec_last_active_time');
      const now = Date.now();

      if (lastActive) {
        const timeElapsed = now - parseInt(lastActive, 10);
        if (timeElapsed > FIVE_MINUTES_MS) {
          sessionStorage.clear();
          localStorage.removeItem('cec_last_active_time');

          if (supabase) {
            try {
              await supabase.auth.signOut();
            } catch (e) {}
          }

          alert('Your session has expired due to 5 minutes of inactivity or browser closure. Please log in again.');
          router.replace('/login');
          return;
        }
      }

      localStorage.setItem('cec_last_active_time', now.toString());
    };

    checkSessionActivity();

    const updateActivity = () => {
      localStorage.setItem('cec_last_active_time', Date.now().toString());
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
    if (typeof window !== 'undefined' && !window.Html5Qrcode) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    fetchStudentData();
  }, []);

  // Kumuha ng data mula sa Supabase (Naka-sync ang Profile Photo sa Laptop at Mobile)
  const fetchStudentData = async () => {
    setLoading(true);
    try {
      if (!supabase) return;

      const cachedEmail = typeof window !== 'undefined' ? sessionStorage.getItem('cec_user_email') : null;
      let userEmail = cachedEmail;

      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) userEmail = user.email;

      let currentStudentId = profile.school_id;

      if (userEmail) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', userEmail.trim().toLowerCase())
          .single();

        if (userProfile) {
          currentStudentId = userProfile.school_id || currentStudentId;
          const hasScanClearance = userProfile.can_scan === true || userProfile.role === 'staff' || userProfile.role === 'admin';

          // Kunin ang avatar_url mula sa Supabase Database upang pareho sa Laptop at Mobile
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

          if (typeof window !== 'undefined') {
            sessionStorage.setItem('cec_can_scan', hasScanClearance ? 'true' : 'false');
          }
        }
      }

      // Kunin ang mga events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false });

      if (eventsData) {
        setEvents(eventsData);
        if (eventsData.length > 0 && !selectedEventId) {
          setSelectedEventId(eventsData[0].id);
        }
      }

      // Kunin ang attendance logs para sa naturang estudyante
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

      // Pagsamahin ang events at attendance: Kung Time In pa lang, nananatiling '--:--' ang Time Out!
      if (eventsData && eventsData.length > 0) {
        const mergedRecords = eventsData.map((ev) => {
          const matchingLog = logsMap[ev.id];
          const isPresent = Boolean(matchingLog && matchingLog.status === 'PRESENT');

          return {
            id: ev.id,
            event_id: ev.id,
            title: ev.title || 'College Event',
            location: ev.location || 'FaCET Facade',
            date: ev.date || 'Scheduled',
            time_in: matchingLog && matchingLog.time_in ? formatTime12Hour(matchingLog.time_in) : '--:--',
            // Blangko ang time_out kung wala pang na-scan na Time Out
            time_out: matchingLog && matchingLog.time_out ? formatTime12Hour(matchingLog.time_out) : '--:--',
            event_status: ev.status === 'active' ? 'ACTIVE' : 'CLOSED',
            status: isPresent ? 'PRESENT' : 'ABSENT',
          };
        });

        setAttendanceLogs(mergedRecords);
      }
    } catch (err) {
      console.error('Error loading student dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // I-save ang photo direkta sa Supabase Database (Hindi sa Local Storage lamang)
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
        // I-compress ang 2x2 photo para magaan mai-save sa Supabase
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

        // Agarang i-update ang local state
        setProfile((prev) => ({ ...prev, avatar_url: compressedBase64 }));

        try {
          // Direktang i-sync sa Supabase Cloud Database!
          const { error: dbError } = await supabase
            .from('profiles')
            .update({ avatar_url: compressedBase64 })
            .eq('school_id', profile.school_id);

          if (dbError) {
            console.error('Error updating profile photo in Supabase:', dbError);
            alert('Could not sync photo to server: ' + dbError.message);
          } else {
            showNotify('success', 'Profile photo saved and synced across all devices!');
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
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
      localStorage.removeItem('cec_last_active_time');
    }
    router.replace('/');
  };

  // Stats Counters
  const totalEventsCount = attendanceLogs.length;
  const totalPresentCount = attendanceLogs.filter((l) => l.status === 'PRESENT').length;
  const totalAbsencesCount = attendanceLogs.filter((l) => l.status === 'ABSENT').length;
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
    <div className={styles.container} style={{ paddingBottom: 0, overflowX: 'hidden', maxWidth: '100vw' }}>
      <Head>
        <title>Student Portal • CEC TRACK</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" async />
        <script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js" async />
      </Head>

      {/* TOP HEADER */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '8px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '6px',
            boxSizing: 'border-box',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexShrink: 1 }}>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label="Toggle Navigation Menu"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #e2e8f0',
                fontSize: '1.2rem',
                fontWeight: 900,
                color: '#0f172a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {isSidebarOpen ? '✕' : '☰'}
            </button>

            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 900,
                    color: '#15803d',
                    letterSpacing: '-0.025em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  CEC TRACK
                </span>
                <span
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 900,
                    padding: '2px 6px',
                    borderRadius: '9999px',
                    backgroundColor: profile.can_scan ? '#fef3c7' : '#dcfce7',
                    color: profile.can_scan ? '#b45309' : '#15803d',
                    border: `1px solid ${profile.can_scan ? '#fde68a' : '#bbf7d0'}`,
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {profile.can_scan ? 'Scanner' : 'Student'}
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: '#64748b',
                  display: 'block',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Student Access Portal
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '4px 8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              flexShrink: 0,
              maxWidth: '145px',
            }}
          >
            <div style={{ textAlign: 'right', minWidth: 0 }}>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 900,
                  color: '#0f172a',
                  display: 'block',
                  lineHeight: 1.15,
                  maxWidth: '85px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {profile.full_name}
              </span>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#15803d' }}>
                {profile.school_id}
              </span>
            </div>

            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '0.88rem',
                flexShrink: 0,
                border: '1px solid #bbf7d0',
                overflow: 'hidden',
              }}
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                profile.full_name.charAt(0).toUpperCase()
              )}
            </div>
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

      <div className={styles.portalWrapper}>
        {/* SIDEBAR NAVIGATION */}
        <aside
          style={{
            position: 'fixed',
            top: 0,
            bottom: 0,
            left: 0,
            width: '280px',
            maxWidth: '82vw',
            backgroundColor: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '20px 16px',
            boxShadow: isSidebarOpen ? '6px 0 25px rgba(0,0,0,0.15)' : 'none',
            transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflowY: 'auto',
            boxSizing: 'border-box',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#15803d', margin: 0 }}>Portal</h2>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  STUDENT ACCESS
                </span>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.2rem',
                  fontWeight: 900,
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => { setActiveTab('my-id'); setIsSidebarOpen(false); }}
                className={activeTab === 'my-id' ? `${styles.portalNavLink} ${styles.portalNavLinkActive}` : styles.portalNavLink}
                style={{ fontSize: '0.92rem', padding: '12px 14px' }}
              >
                <span>My ID</span>
              </button>

              <button
                onClick={() => { setActiveTab('attendance'); setIsSidebarOpen(false); }}
                className={activeTab === 'attendance' ? `${styles.portalNavLink} ${styles.portalNavLinkActive}` : styles.portalNavLink}
                style={{ fontSize: '0.92rem', padding: '12px 14px' }}
              >
                <span>Attendance</span>
              </button>

              <button
                onClick={() => { setActiveTab('events'); setIsSidebarOpen(false); }}
                className={activeTab === 'events' ? `${styles.portalNavLink} ${styles.portalNavLinkActive}` : styles.portalNavLink}
                style={{ fontSize: '0.92rem', padding: '12px 14px' }}
              >
                <span>Events</span>
              </button>

              <button
                onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }}
                className={activeTab === 'profile' ? `${styles.portalNavLink} ${styles.portalNavLinkActive}` : styles.portalNavLink}
                style={{ fontSize: '0.92rem', padding: '12px 14px' }}
              >
                <span>Profile</span>
              </button>
            </nav>
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginTop: '16px' }}>
            <button
              onClick={handleSignOut}
              className={styles.portalNavLink}
              style={{ color: '#b91c1c', fontWeight: 900, fontSize: '0.92rem', padding: '12px 14px' }}
            >
              <span>➔</span>
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* MAIN BODY CONTENT */}
        <main className={styles.portalContentArea} style={{ padding: '16px 12px', width: '100%', boxSizing: 'border-box' }}>
          {notification.message && (
            <div
              className={styles.alertMessage}
              style={{
                marginBottom: '1rem',
                fontSize: '0.85rem',
                color: notification.type === 'error' ? '#b91c1c' : '#15803d',
                backgroundColor: notification.type === 'error' ? '#fef2f2' : '#f0fdf4',
                borderColor: notification.type === 'error' ? '#fee2e2' : '#bbf7d0',
                padding: '10px 14px',
              }}
            >
              {notification.message}
            </div>
          )}

          {/* TAB 1: MY DIGITAL ID */}
          {activeTab === 'my-id' && (
            <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h1 className={styles.adminTitle} style={{ fontSize: '1.45rem', margin: 0 }}>My Digital ID</h1>
                  <p className={styles.adminSubtitle} style={{ fontSize: '0.82rem', margin: '4px 0 0 0' }}>
                    Your official scannable organization credentials.
                  </p>
                </div>
                {profile.avatar_url && (
                  <button
                    onClick={handleDownloadIdCard}
                    disabled={downloadingId}
                    className={styles.adminPrimaryBtn}
                    style={{ minHeight: '44px', fontSize: '0.88rem', padding: '10px 16px' }}
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '20px', alignItems: 'start', width: '100%' }}>
                <div className={styles.digitalIdCard} style={{ margin: '0 auto', maxWidth: '340px', width: '100%' }}>
                  <div
                    ref={idCardRef}
                    className={styles.idCardInner}
                    style={{
                      position: 'relative',
                      overflow: 'hidden',
                      paddingTop: '64px',
                      backgroundColor: '#ffffff',
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
                        borderTopLeftRadius: '26px',
                        borderTopRightRadius: '26px',
                        borderBottomLeftRadius: '36px',
                        borderBottomRightRadius: '36px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        paddingTop: '14px',
                        zIndex: 1,
                      }}
                    >
                      <span
                        style={{
                          color: '#ffffff',
                          fontSize: '0.82rem',
                          fontWeight: 900,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          backgroundColor: 'rgba(255, 255, 255, 0.22)',
                          backdropFilter: 'blur(5px)',
                          padding: '3px 14px',
                          borderRadius: '9999px',
                          border: '1px solid rgba(255, 255, 255, 0.38)',
                        }}
                      >
                        CEC- TRACK
                      </span>
                    </div>

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={styles.idPhotoWrap}
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
                        width: '90px',
                        height: '90px',
                        borderRadius: '24px',
                        margin: '8px auto 0 auto',
                      }}
                    >
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Student ID Photo"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#64748b' }}>
                          <span style={{ fontSize: '1.8rem' }}>👤</span>
                          <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#15803d', marginTop: '2px' }}>
                            + Upload
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#15803d',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        marginTop: '4px',
                        textDecoration: 'underline',
                        position: 'relative',
                        zIndex: 2,
                      }}
                    >
                      {uploadingPhoto ? 'Uploading...' : profile.avatar_url ? 'Change Photo' : 'Upload 2x2 Photo'}
                    </button>

                    <h2 className={styles.idStudentName} style={{ marginTop: '6px', fontSize: '1.25rem', position: 'relative', zIndex: 2 }}>
                      {profile.full_name}
                    </h2>

                    <div className={styles.idLabel} style={{ position: 'relative', zIndex: 2 }}>STUDENT ID</div>
                    <div className={styles.idSchoolNumber} style={{ position: 'relative', zIndex: 2, fontSize: '1.1rem' }}>{profile.school_id}</div>

                    {profile.avatar_url ? (
                      <div style={{ position: 'relative', zIndex: 2 }}>
                        <div className={styles.idQrBox} style={{ maxWidth: '190px', margin: '10px auto' }}>
                          <img src={qrCodeUrl} alt="Student QR Code" crossOrigin="anonymous" style={{ width: '100%', height: 'auto' }} />
                        </div>

                        <div
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 900,
                            color: '#15803d',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            marginTop: '8px',
                          }}
                        >
                          SCAN FOR ATTENDANCE
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          position: 'relative',
                          zIndex: 2,
                          margin: '14px 10px',
                          padding: '16px 12px',
                          backgroundColor: '#fef2f2',
                          border: '1px dashed #fca5a5',
                          borderRadius: '18px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span style={{ fontSize: '1.6rem' }}>🔒</span>
                        <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#991b1b' }}>
                          QR Code Locked
                        </div>
                        <p style={{ fontSize: '0.7rem', color: '#b91c1c', margin: 0, lineHeight: 1.35, maxWidth: '200px' }}>
                          Please upload your official ID photo above to activate and display your Attendance QR Code.
                        </p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            marginTop: '4px',
                            backgroundColor: '#15803d',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '6px 12px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          Upload Photo Now
                        </button>
                      </div>
                    )}

                    <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '14px', paddingTop: '8px', position: 'relative', zIndex: 2 }}>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 900,
                          color: '#94a3b8',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        CATEEL EXTENSION CAMPUS
                      </span>
                    </div>
                  </div>
                </div>

                {/* INFO CARDS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
                  <div className={styles.adminFormCard} style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.4rem' }}>📱</span>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 900, color: '#166534' }}>
                          Universal Device Cloud Sync
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#15803d', lineHeight: 1.45 }}>
                          Your uploaded ID picture is saved directly to your account. Open your account on your laptop or phone anytime and your picture is immediately updated.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={styles.adminFormCard} style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.4rem' }}>🛡️</span>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 900, color: '#0f172a' }}>
                          Official Usage Policy
                        </h4>
                        <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px', fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
                          <li>Present this QR code for attendance monitoring at all official assemblies.</li>
                          <li>This code is non-transferable. Presenting another student&apos;s code is prohibited.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ATTENDANCE RECORDS (BLANK TIME OUT WHEN TIME IN ONLY) */}
          {activeTab === 'attendance' && (
            <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <span className={styles.tagBadge}>OFFICIAL ATTENDANCE HISTORY</span>
                  <h1 className={styles.adminTitle} style={{ marginTop: '4px', fontSize: '1.45rem' }}>My Attendance Record</h1>
                  <p className={styles.adminSubtitle} style={{ fontSize: '0.82rem' }}>Track your attendance participation and status.</p>
                </div>

                <button onClick={fetchStudentData} className={styles.eventsBtn} style={{ minHeight: '40px', fontSize: '0.85rem' }}>
                  Refresh Records
                </button>
              </div>

              <div className={styles.attendanceStatsGrid}>
                <div className={styles.attStatCard} style={{ padding: '16px' }}>
                  <span className={styles.attStatLabel} style={{ fontSize: '0.75rem' }}>Total Events</span>
                  <div className={styles.attStatValue} style={{ fontSize: '1.8rem' }}>{totalEventsCount}</div>
                </div>

                <div className={styles.attStatCard} style={{ padding: '16px' }}>
                  <span className={styles.attStatLabel} style={{ fontSize: '0.75rem' }}>Total Present</span>
                  <div className={`${styles.attStatValue} ${styles.attGreenText}`} style={{ fontSize: '1.8rem' }}>{totalPresentCount}</div>
                </div>

                <div className={styles.attStatCard} style={{ padding: '16px' }}>
                  <span className={styles.attStatLabel} style={{ fontSize: '0.75rem' }}>Absences</span>
                  <div className={styles.attStatValue} style={{ color: '#b91c1c', fontSize: '1.8rem' }}>{totalAbsencesCount}</div>
                </div>

                <div className={styles.attStatCard} style={{ padding: '16px' }}>
                  <span className={styles.attStatLabel} style={{ fontSize: '0.75rem' }}>Compliance Rate</span>
                  <div className={`${styles.attStatValue} ${styles.attGreenText}`} style={{ fontSize: '1.8rem' }}>{complianceRate}%</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setAttendanceFilter('all')}
                    className={attendanceFilter === 'all' ? `${styles.adminTabBtn} ${styles.adminTabBtnActive}` : styles.adminTabBtn}
                    style={{ fontSize: '0.8rem', padding: '8px 12px' }}
                  >
                    All ({attendanceLogs.length})
                  </button>
                  <button
                    onClick={() => setAttendanceFilter('present')}
                    className={attendanceFilter === 'present' ? `${styles.adminTabBtn} ${styles.adminTabBtnActive}` : styles.adminTabBtn}
                    style={{ fontSize: '0.8rem', padding: '8px 12px' }}
                  >
                    ✓ Present ({totalPresentCount})
                  </button>
                  <button
                    onClick={() => setAttendanceFilter('absent')}
                    className={attendanceFilter === 'absent' ? `${styles.adminTabBtn} ${styles.adminTabBtnActive}` : styles.adminTabBtn}
                    style={{ fontSize: '0.8rem', padding: '8px 12px' }}
                  >
                    ✕ Absent ({totalAbsencesCount})
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Search event..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.loginInput}
                  style={{ width: '100%', maxWidth: '200px', padding: '8px 12px', fontSize: '0.85rem' }}
                />
              </div>

              <div className={styles.adminTableWrapper}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th>Event &amp; Location</th>
                      <th>Date</th>
                      <th>Time In</th>
                      <th>Time Out</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'center' }}>Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                          No attendance records found.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => {
                        const isPresent = log.status === 'PRESENT';
                        return (
                          <tr key={log.id}>
                            <td>
                              <div style={{ fontWeight: 800 }}>{log.title}</div>
                              <div style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 700 }}>
                                📍 {log.location}
                              </div>
                            </td>
                            <td style={{ fontWeight: 600 }}>{log.date}</td>
                            <td style={{ fontWeight: 800, color: isPresent ? '#15803d' : '#94a3b8' }}>
                              {log.time_in}
                            </td>
                            <td style={{ fontWeight: 800, color: log.time_out !== '--:--' ? '#15803d' : '#94a3b8' }}>
                              {log.time_out}
                            </td>
                            <td>
                              <span className={styles.idBadge} style={{ fontSize: '0.68rem' }}>
                                {log.event_status}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span
                                className={styles.idBadge}
                                style={{
                                  backgroundColor: isPresent ? '#dcfce7' : '#fef2f2',
                                  color: isPresent ? '#15803d' : '#b91c1c',
                                  borderColor: isPresent ? '#bbf7d0' : '#fecaca',
                                  fontWeight: 900,
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
            <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <span className={styles.tagBadge}>OFFICIAL ORGANIZATION ACTIVITIES</span>
                  <h1 className={styles.adminTitle} style={{ marginTop: '4px', fontSize: '1.45rem' }}>Organization Events</h1>
                  <p className={styles.adminSubtitle} style={{ fontSize: '0.82rem' }}>Explore upcoming assemblies and official activities.</p>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <span className={styles.idBadge}>Total: {events.length}</span>
                  <span className={styles.idBadge} style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
                    Active: {events.filter((e) => e.status === 'active').length}
                  </span>
                </div>
              </div>

              {events.length === 0 ? (
                <div className={styles.adminFormCard} style={{ textAlign: 'center', padding: '36px 16px' }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 900 }}>
                    No Events Available
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                    There are no official events scheduled at this time.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  {events.map((ev) => {
                    const isActive = ev.status === 'active';
                    return (
                      <div
                        key={ev.id}
                        className={styles.adminFormCard}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          padding: '0',
                          overflow: 'hidden',
                        }}
                      >
                        {ev.image_url ? (
                          <div style={{ width: '100%', height: '150px', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
                            <img src={ev.image_url} alt={ev.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ) : (
                          <div style={{ width: '100%', height: '90px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800, color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>
                            EVENT
                          </div>
                        )}

                        <div style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span
                              className={styles.idBadge}
                              style={{
                                backgroundColor: isActive ? '#dcfce7' : '#f1f5f9',
                                color: isActive ? '#15803d' : '#64748b',
                                fontSize: '0.68rem',
                              }}
                            >
                              {isActive ? '● ACTIVE (OPEN)' : 'CLOSED'}
                            </span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>
                              {ev.date}
                            </span>
                          </div>

                          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
                            {ev.title}
                          </h3>
                          <div style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 800, marginBottom: '6px' }}>
                            📍 {ev.location || 'FaCET Facade'}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', gap: '10px', fontWeight: 700, marginBottom: '10px' }}>
                            <span>In: {formatTime12Hour(ev.time_in)}</span>
                            <span>Out: {formatTime12Hour(ev.time_out)}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: 1.45 }}>
                            {ev.description || 'No description provided.'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PROFILE */}
          {activeTab === 'profile' && (
            <div style={{ maxWidth: '580px', margin: '0 auto', width: '100%' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '76px',
                    height: '76px',
                    borderRadius: '22px',
                    backgroundColor: '#dcfce7',
                    color: '#15803d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    fontWeight: 900,
                    margin: '0 auto 10px auto',
                    border: '1px solid #bbf7d0',
                    overflow: 'hidden',
                  }}
                >
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    'USER'
                  )}
                </div>
                <h1 className={styles.adminTitle} style={{ fontSize: '1.5rem' }}>{profile.full_name}</h1>
                <p className={styles.adminSubtitle} style={{ fontSize: '0.85rem' }}>
                  {profile.course} • {profile.section} • {profile.year_level}
                </p>
              </div>

              <div className={styles.adminFormCard} style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase' }}>
                    VERIFIED STUDENT DETAILS
                  </span>
                  <span className={styles.idBadge}>OFFICIAL RECORD</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8', fontWeight: 700 }}>Full Name</span>
                    <span style={{ fontWeight: 800 }}>{profile.full_name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8', fontWeight: 700 }}>Student ID</span>
                    <span style={{ fontWeight: 800, color: '#15803d' }}>{profile.school_id}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8', fontWeight: 700 }}>Email Address</span>
                    <span style={{ fontWeight: 800 }}>{profile.email}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8', fontWeight: 700 }}>Scanner Privilege</span>
                    <span className={styles.idBadge} style={{ backgroundColor: profile.can_scan ? '#dcfce7' : '#f1f5f9', color: profile.can_scan ? '#15803d' : '#64748b' }}>
                      {profile.can_scan ? 'AUTHORIZED SCANNER' : 'STANDARD MEMBER'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8', fontWeight: 700 }}>Course &amp; Section</span>
                    <span className={styles.idBadge}>{profile.course} - {profile.section}</span>
                  </div>
                </div>
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
