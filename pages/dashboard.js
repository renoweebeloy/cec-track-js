import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Home.module.css';

export default function StudentDashboard() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const idCardRef = useRef(null); // Reference para sa pag-download ng ID card

  const [activeTab, setActiveTab] = useState('my-id'); // 'my-id' | 'attendance' | 'events' | 'profile'
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
    avatar_url: '', // Naka-save na 2x2 ID photo
  });

  // Events & Attendance States
  const [events, setEvents] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [attendanceFilter, setAttendanceFilter] = useState('all'); // 'all' | 'present' | 'absent'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      if (!supabase) return;

      const cachedEmail = typeof window !== 'undefined' ? sessionStorage.getItem('cec_user_email') : null;
      let userEmail = cachedEmail;

      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) userEmail = user.email;

      if (userEmail) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', userEmail)
          .single();

        if (userProfile) {
          const cachedPhoto = typeof window !== 'undefined' ? localStorage.getItem(`cec_photo_${userProfile.school_id}`) : '';
          setProfile((prev) => ({
            ...prev,
            full_name: userProfile.full_name || prev.full_name,
            school_id: userProfile.school_id || prev.school_id,
            email: userProfile.email || userEmail,
            course: userProfile.course || prev.course,
            year_level: userProfile.year_level || prev.year_level,
            section: userProfile.section || prev.section,
            avatar_url: userProfile.avatar_url || cachedPhoto || '',
          }));
        }
      }

      // Kumuha ng mga events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false });

      if (eventsData) {
        setEvents(eventsData);
      }

      // Kumuha ng attendance logs
      const { data: logsData } = await supabase
        .from('attendance')
        .select('*')
        .order('created_at', { ascending: false });

      if (logsData && logsData.length > 0) {
        setAttendanceLogs(logsData);
      } else {
        setAttendanceLogs([
          {
            id: 1,
            title: 'Siglakas (Day 2)',
            location: 'FaCET Facade',
            date: 'Oct 20, 2026',
            time_in: '08:44 AM',
            time_out: '02:31 PM',
            event_status: 'ACTIVE (OPEN)',
            status: 'PRESENT',
          },
          {
            id: 2,
            title: 'General Campus Assembly',
            location: 'FaCET Facade',
            date: 'Oct 19, 2026',
            time_in: '12:14 PM',
            time_out: '08:07 PM',
            event_status: 'INACTIVE (CLOSED)',
            status: 'PRESENT',
          },
          {
            id: 3,
            title: 'Evening Convocation',
            location: 'FaCET Facade',
            date: 'Oct 18, 2026',
            time_in: '--:--',
            time_out: '--:--',
            event_status: 'INACTIVE (CLOSED)',
            status: 'ABSENT',
          },
        ]);
      }
    } catch (err) {
      console.error('Error loading student dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // PHOTO UPLOAD HANDLER
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Pumili ng wastong larawan (PNG, JPG, o JPEG).');
      return;
    }

    setUploadingPhoto(true);

    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      const base64Photo = uploadEvent.target.result;

      setProfile((prev) => ({ ...prev, avatar_url: base64Photo }));
      if (typeof window !== 'undefined') {
        localStorage.setItem(`cec_photo_${profile.school_id}`, base64Photo);
      }

      try {
        await supabase
          .from('profiles')
          .update({ avatar_url: base64Photo })
          .eq('school_id', profile.school_id);
      } catch (err) {
        console.warn('Database avatar update note:', err);
      }

      setUploadingPhoto(false);
    };

    reader.readAsDataURL(file);
  };

  // DOWNLOAD OFFICIAL DIGITAL ID AS HIGH-RES PNG IMAGE
  const handleDownloadIdCard = async () => {
    if (!idCardRef.current) return;
    setDownloadingId(true);

    try {
      // Dynamic load ng html2canvas mula sa CDN kung wala pa sa window
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
        scale: 3, // Mataas na resolution (malinaw kahit i-zoom o i-print)
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
      // Fallback gamit ang browser print kapag may aberya
      window.print();
    } finally {
      setDownloadingId(false);
    }
  };

  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
    }
    router.replace('/');
  };

  // Attendance stats
  const totalEventsCount = attendanceLogs.length;
  const totalPresentCount = attendanceLogs.filter((l) => l.status === 'PRESENT').length;
  const totalAbsencesCount = attendanceLogs.filter((l) => l.status === 'ABSENT').length;
  const complianceRate = totalEventsCount > 0 ? Math.round((totalPresentCount / totalEventsCount) * 100) : 0;

  const filteredLogs = attendanceLogs.filter((log) => {
    if (attendanceFilter === 'present') return log.status === 'PRESENT';
    if (attendanceFilter === 'absent') return log.status === 'ABSENT';
    return true;
  }).filter((log) =>
    log.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    profile.school_id
  )}`;

  return (
    <div className={styles.container} style={{ paddingBottom: 0 }}>
      <Head>
        <title>Student Portal • CEC TRACK</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" async />
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
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxSizing: 'border-box',
          }}
        >
          {/* Left: Hamburger & Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label="Toggle Navigation Menu"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #e2e8f0',
                fontSize: '1.35rem',
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

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#15803d', letterSpacing: '-0.025em' }}>
                  CEC TRACK
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: '#dcfce7',
                    color: '#15803d',
                    border: '1px solid #bbf7d0',
                    textTransform: 'uppercase',
                  }}
                >
                  Student
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block' }}>
                Student Access Portal
              </span>
            </div>
          </div>

          {/* Right: Student Profile Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '6px 12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              flexShrink: 0,
            }}
          >
            <div style={{ textAlign: 'right' }}>
              <span
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 900,
                  color: '#0f172a',
                  display: 'block',
                  lineHeight: 1.2,
                  maxWidth: '130px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {profile.full_name}
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#15803d' }}>
                {profile.school_id}
              </span>
            </div>

            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1rem',
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
        {/* SIDEBAR NAVIGATION DRAWER */}
        <aside
          style={{
            position: 'fixed',
            top: 0,
            bottom: 0,
            left: 0,
            width: '290px',
            maxWidth: '85vw',
            backgroundColor: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '24px 18px',
            boxShadow: isSidebarOpen ? '6px 0 25px rgba(0,0,0,0.15)' : 'none',
            transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflowY: 'auto',
            boxSizing: 'border-box',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#15803d', margin: 0 }}>
                  Portal
                </h2>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  STUDENT ACCESS
                </span>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.25rem',
                  fontWeight: 900,
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '6px',
                }}
              >
                ✕
              </button>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => { setActiveTab('my-id'); setIsSidebarOpen(false); }}
                className={activeTab === 'my-id' ? `${styles.portalNavLink} ${styles.portalNavLinkActive}` : styles.portalNavLink}
                style={{ fontSize: '0.95rem', padding: '14px 16px' }}
              >
                <span>🪪</span>
                <span>My ID</span>
              </button>

              <button
                onClick={() => { setActiveTab('attendance'); setIsSidebarOpen(false); }}
                className={activeTab === 'attendance' ? `${styles.portalNavLink} ${styles.portalNavLinkActive}` : styles.portalNavLink}
                style={{ fontSize: '0.95rem', padding: '14px 16px' }}
              >
                <span>📅</span>
                <span>Attendance</span>
              </button>

              <button
                onClick={() => { setActiveTab('events'); setIsSidebarOpen(false); }}
                className={activeTab === 'events' ? `${styles.portalNavLink} ${styles.portalNavLinkActive}` : styles.portalNavLink}
                style={{ fontSize: '0.95rem', padding: '14px 16px' }}
              >
                <span>✨</span>
                <span>Events</span>
              </button>

              <button
                onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }}
                className={activeTab === 'profile' ? `${styles.portalNavLink} ${styles.portalNavLinkActive}` : styles.portalNavLink}
                style={{ fontSize: '0.95rem', padding: '14px 16px' }}
              >
                <span>👤</span>
                <span>Profile</span>
              </button>

              <div style={{ padding: '14px 16px 4px 16px', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Organization
              </div>

              <div className={styles.portalNavLink} style={{ opacity: 0.5, cursor: 'not-allowed', fontSize: '0.95rem', padding: '14px 16px' }}>
                <span>🎗️</span>
                <span>Officers</span>
              </div>
              <div className={styles.portalNavLink} style={{ opacity: 0.5, cursor: 'not-allowed', fontSize: '0.95rem', padding: '14px 16px' }}>
                <span>💳</span>
                <span>Finance</span>
              </div>
              <div className={styles.portalNavLink} style={{ opacity: 0.5, cursor: 'not-allowed', fontSize: '0.95rem', padding: '14px 16px' }}>
                <span>🛡️</span>
                <span>Sanctions</span>
              </div>
            </nav>
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '18px', marginTop: '20px' }}>
            <button
              onClick={handleSignOut}
              className={styles.portalNavLink}
              style={{ color: '#b91c1c', fontWeight: 900, fontSize: '0.95rem', padding: '14px 16px' }}
            >
              <span>➔</span>
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* MAIN BODY CONTENT */}
        <main className={styles.portalContentArea} style={{ padding: '20px 16px' }}>
          {/* ========================================================= */}
          {/* TAB 1: MY DIGITAL ID */}
          {/* ========================================================= */}
          {activeTab === 'my-id' && (
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h1 className={styles.adminTitle}>My Digital ID</h1>
                  <p className={styles.adminSubtitle}>Your official scannable organization credentials.</p>
                </div>
                {profile.avatar_url && (
                  <button
                    onClick={handleDownloadIdCard}
                    disabled={downloadingId}
                    className={styles.adminPrimaryBtn}
                    style={{ minHeight: '48px', fontSize: '0.95rem' }}
                  >
                    {downloadingId ? '⏳ Generating ID Image...' : '📥 Download Official ID'}
                  </button>
                )}
              </div>

              {/* Tago na file input para sa pag-upload ng litrato */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', alignItems: 'start' }}>
                {/* ID CARD CONTAINER NA MAY ATTACHED REF PARA SA DOWNLOAD */}
                <div className={styles.digitalIdCard}>
                  <div
                    ref={idCardRef}
                    className={styles.idCardInner}
                    style={{
                      position: 'relative',
                      overflow: 'hidden',
                      paddingTop: '68px',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    {/* BERDENG HEADER COVER NA MAY "CEC- TRACK" BADGE */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '115px',
                        backgroundColor: '#15803d',
                        borderTopLeftRadius: '26px',
                        borderTopRightRadius: '26px',
                        borderBottomLeftRadius: '36px',
                        borderBottomRightRadius: '36px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        paddingTop: '16px',
                        zIndex: 1,
                      }}
                    >
                      <span
                        style={{
                          color: '#ffffff',
                          fontSize: '0.85rem',
                          fontWeight: 900,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          backgroundColor: 'rgba(255, 255, 255, 0.22)',
                          backdropFilter: 'blur(5px)',
                          padding: '4px 16px',
                          borderRadius: '9999px',
                          border: '1px solid rgba(255, 255, 255, 0.38)',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                        }}
                      >
                        CEC- TRACK
                      </span>
                    </div>

                    {/* PHOTO CONTAINER (CLICK TO UPLOAD) */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={styles.idPhotoWrap}
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
                      }}
                      title="Pindutin para mag-upload o magpalit ng litrato"
                    >
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Student ID Photo"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#64748b' }}>
                          <span style={{ fontSize: '2rem' }}>👤</span>
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
                      {uploadingPhoto ? 'Uploading photo...' : profile.avatar_url ? 'Change Photo' : 'Upload 2x2 Photo'}
                    </button>

                    <h2 className={styles.idStudentName} style={{ marginTop: '8px', position: 'relative', zIndex: 2 }}>
                      {profile.full_name}
                    </h2>

                    <div className={styles.idLabel} style={{ position: 'relative', zIndex: 2 }}>STUDENT ID</div>
                    <div className={styles.idSchoolNumber} style={{ position: 'relative', zIndex: 2 }}>{profile.school_id}</div>

                    {/* QR CODE CONDITION: LALABAS LAMANG KUNG NAKA-UPLOAD NA NG LITRATO */}
                    {profile.avatar_url ? (
                      <div style={{ position: 'relative', zIndex: 2 }}>
                        <div className={styles.idQrBox}>
                          <img src={qrCodeUrl} alt="Student QR Code" crossOrigin="anonymous" />
                        </div>

                        {/* SCAN FOR ATTENDANCE SA ILALIM NG QR CODE */}
                        <div
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 900,
                            color: '#15803d',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            marginTop: '10px',
                          }}
                        >
                          SCAN FOR ATTENDANCE
                        </div>
                      </div>
                    ) : (
                      /* KUNG WALA PANG LITRATO: NAKA-LOCK ANG QR CODE */
                      <div
                        style={{
                          position: 'relative',
                          zIndex: 2,
                          margin: '18px 0',
                          padding: '18px 14px',
                          backgroundColor: '#fef2f2',
                          border: '1px dashed #fca5a5',
                          borderRadius: '20px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <span style={{ fontSize: '1.8rem' }}>🔒</span>
                        <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#991b1b' }}>
                          QR Code Locked
                        </div>
                        <p style={{ fontSize: '0.72rem', color: '#b91c1c', margin: 0, lineHeight: 1.4, maxWidth: '220px' }}>
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
                            padding: '6px 14px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          📷 Upload Photo Now
                        </button>
                      </div>
                    )}

                    {/* FOOTER: CATEEL EXTENSION CAMPUS */}
                    <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '16px', paddingTop: '10px', position: 'relative', zIndex: 2 }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
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

                {/* Right Column: Info Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className={styles.adminFormCard} style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', padding: '20px' }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.6rem' }}>📱</span>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 900, color: '#166534' }}>
                          Universal Device Downloads
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#15803d', lineHeight: 1.5 }}>
                          Pindutin ang <strong>Download Official ID</strong> sa itaas upang awtomatikong ma-save ang iyong digital ID card bilang malinaw na PNG image sa iyong Photos o Downloads folder.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={styles.adminFormCard} style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.6rem' }}>🛡️</span>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 900, color: '#0f172a' }}>
                          Official Usage Policy
                        </h4>
                        <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6 }}>
                          <li>Present this QR code for attendance monitoring at all official assemblies.</li>
                          <li>This code is non-transferable. Presenting another student&apos;s code is strictly prohibited.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: ATTENDANCE RECORDS */}
          {/* ========================================================= */}
          {activeTab === 'attendance' && (
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span className={styles.tagBadge}>OFFICIAL ATTENDANCE HISTORY</span>
                  <h1 className={styles.adminTitle} style={{ marginTop: '6px' }}>My Attendance Record</h1>
                  <p className={styles.adminSubtitle}>Track your attendance participation, logged times, and compliance status.</p>
                </div>

                <button onClick={fetchStudentData} className={styles.eventsBtn} style={{ minHeight: '44px', fontSize: '0.9rem' }}>
                  🔄 Refresh Records
                </button>
              </div>

              <div className={styles.attendanceStatsGrid}>
                <div className={styles.attStatCard} style={{ padding: '20px' }}>
                  <span className={styles.attStatLabel} style={{ fontSize: '0.8rem' }}>Total Events</span>
                  <div className={styles.attStatValue} style={{ fontSize: '2.2rem' }}>{totalEventsCount}</div>
                </div>

                <div className={styles.attStatCard} style={{ padding: '20px' }}>
                  <span className={styles.attStatLabel} style={{ fontSize: '0.8rem' }}>Total Present</span>
                  <div className={`${styles.attStatValue} ${styles.attGreenText}`} style={{ fontSize: '2.2rem' }}>{totalPresentCount}</div>
                </div>

                <div className={styles.attStatCard} style={{ padding: '20px' }}>
                  <span className={styles.attStatLabel} style={{ fontSize: '0.8rem' }}>Absences</span>
                  <div className={styles.attStatValue} style={{ color: '#b91c1c', fontSize: '2.2rem' }}>{totalAbsencesCount}</div>
                </div>

                <div className={styles.attStatCard} style={{ padding: '20px' }}>
                  <span className={styles.attStatLabel} style={{ fontSize: '0.8rem' }}>Compliance Rate</span>
                  <div className={`${styles.attStatValue} ${styles.attGreenText}`} style={{ fontSize: '2.2rem' }}>{complianceRate}%</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setAttendanceFilter('all')}
                    className={attendanceFilter === 'all' ? `${styles.adminTabBtn} ${styles.adminTabBtnActive}` : styles.adminTabBtn}
                    style={{ fontSize: '0.85rem', padding: '10px 16px' }}
                  >
                    All Logs ({attendanceLogs.length})
                  </button>
                  <button
                    onClick={() => setAttendanceFilter('present')}
                    className={attendanceFilter === 'present' ? `${styles.adminTabBtn} ${styles.adminTabBtnActive}` : styles.adminTabBtn}
                    style={{ fontSize: '0.85rem', padding: '10px 16px' }}
                  >
                    ✓ Present ({totalPresentCount})
                  </button>
                  <button
                    onClick={() => setAttendanceFilter('absent')}
                    className={attendanceFilter === 'absent' ? `${styles.adminTabBtn} ${styles.adminTabBtnActive}` : styles.adminTabBtn}
                    style={{ fontSize: '0.85rem', padding: '10px 16px' }}
                  >
                    ✕ Absent ({totalAbsencesCount})
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="🔍 Search event or venue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.loginInput}
                  style={{ width: '220px', padding: '8px 14px', fontSize: '0.9rem' }}
                />
              </div>

              <div className={styles.adminTableWrapper}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th>Event & Location</th>
                      <th>Date</th>
                      <th>Time In</th>
                      <th>Time Out</th>
                      <th>Event Status</th>
                      <th style={{ textAlign: 'center' }}>Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => {
                      const isPresent = log.status === 'PRESENT';
                      return (
                        <tr key={log.id}>
                          <td>
                            <div style={{ fontWeight: 800 }}>{log.title}</div>
                            <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 700 }}>
                              📍 {log.location || 'FaCET Facade'}
                            </div>
                          </td>
                          <td style={{ fontWeight: 600 }}>{log.date}</td>
                          <td style={{ fontWeight: 800 }}>{log.time_in || '--:--'}</td>
                          <td style={{ fontWeight: 800 }}>{log.time_out || '--:--'}</td>
                          <td>
                            <span className={styles.idBadge} style={{ fontSize: '0.7rem' }}>
                              {log.event_status || 'CLOSED'}
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
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: EVENTS & SCHEDULE */}
          {/* ========================================================= */}
          {activeTab === 'events' && (
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span className={styles.tagBadge}>OFFICIAL ORGANIZATION ACTIVITIES</span>
                  <h1 className={styles.adminTitle} style={{ marginTop: '6px' }}>Organization Events</h1>
                  <p className={styles.adminSubtitle}>Explore upcoming assemblies, seminars, and official college activities.</p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className={styles.idBadge}>Total: {events.length}</span>
                  <span className={styles.idBadge} style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
                    Active: {events.filter((e) => e.status === 'active').length}
                  </span>
                </div>
              </div>

              {events.length === 0 ? (
                <div className={styles.adminFormCard} style={{ textAlign: 'center', padding: '48px 24px' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📅</div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', fontWeight: 900 }}>
                    No Events Available
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>
                    There are no official events scheduled at this time. Please check back later.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  {events.map((ev) => {
                    const isActive = ev.status === 'active';
                    return (
                      <div key={ev.id} className={styles.adminFormCard} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '22px' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <span
                              className={styles.idBadge}
                              style={{
                                backgroundColor: isActive ? '#dcfce7' : '#f1f5f9',
                                color: isActive ? '#15803d' : '#64748b',
                                fontSize: '0.7rem',
                              }}
                            >
                              {isActive ? '● ACTIVE (OPEN)' : 'CLOSED'}
                            </span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8' }}>
                              {ev.date}
                            </span>
                          </div>

                          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>
                            {ev.title}
                          </h3>
                          <div style={{ fontSize: '0.82rem', color: '#15803d', fontWeight: 800, marginBottom: '8px' }}>
                            📍 {ev.location || 'FaCET Facade'}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', gap: '12px', fontWeight: 700, marginBottom: '12px' }}>
                            <span>In: {ev.time_in || '08:00'}</span>
                            <span>Out: {ev.time_out || '17:00'}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
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

          {/* ========================================================= */}
          {/* TAB 4: PROFILE */}
          {/* ========================================================= */}
          {activeTab === 'profile' && (
            <div style={{ maxWidth: '640px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div
                  style={{
                    width: '84px',
                    height: '84px',
                    borderRadius: '24px',
                    backgroundColor: '#dcfce7',
                    color: '#15803d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.2rem',
                    margin: '0 auto 12px auto',
                    border: '1px solid #bbf7d0',
                    overflow: 'hidden',
                  }}
                >
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    '👤'
                  )}
                </div>
                <h1 className={styles.adminTitle} style={{ fontSize: '1.75rem' }}>{profile.full_name}</h1>
                <p className={styles.adminSubtitle} style={{ fontSize: '0.9rem' }}>
                  {profile.course} • {profile.section} • {profile.year_level}
                </p>
              </div>

              <div className={styles.adminFormCard} style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase' }}>
                    VERIFIED STUDENT DETAILS
                  </span>
                  <span className={styles.idBadge}>OFFICIAL RECORD</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.92rem' }}>
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
                    <span style={{ color: '#94a3b8', fontWeight: 700 }}>Course / Program</span>
                    <span className={styles.idBadge}>{profile.course}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8', fontWeight: 700 }}>Year & Section</span>
                    <span style={{ fontWeight: 800 }}>{profile.year_level} - {profile.section}</span>
                  </div>
                </div>
              </div>

              <div className={styles.adminFormCard} style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', marginTop: '16px', padding: '18px' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#166534', lineHeight: 1.5 }}>
                  ℹ️ <strong>ADMINISTRATOR MANAGED:</strong> Your official student credentials are maintained by the organization administrators. For any corrections to your course or name, please contact an authorized officer.
                </p>
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
