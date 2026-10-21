import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Home.module.css';

export default function StudentDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('my-id'); // 'my-id' | 'attendance' | 'events' | 'profile'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Student Profile Data
  const [profile, setProfile] = useState({
    full_name: 'Renowee Beloy',
    school_id: '2024-0616',
    email: 'renowee.beloy@dorsu.edu.ph',
    course: 'BSCRIM',
    section: 'Section A',
    year_level: '3rd Year',
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

      // Kuhaon ang email gikan sa session storage o supabase auth
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
          setProfile((prev) => ({
            ...prev,
            full_name: userProfile.full_name || prev.full_name,
            school_id: userProfile.school_id || prev.school_id,
            email: userProfile.email || userEmail,
            course: userProfile.course || prev.course,
            year_level: userProfile.year_level || prev.year_level,
            section: userProfile.section || prev.section,
          }));
        }
      }

      // Kuhaon ang mga official events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false });

      if (eventsData) {
        setEvents(eventsData);
      }

      // Kuhaon ang attendance logs sa estudyante
      const { data: logsData } = await supabase
        .from('attendance')
        .select('*')
        .order('created_at', { ascending: false });

      if (logsData && logsData.length > 0) {
        setAttendanceLogs(logsData);
      } else {
        // Fallback sample records kon bag-ong rehistro pa
        setAttendanceLogs([
          {
            id: 1,
            title: 'Siglakas 2026 (2nd Day)',
            location: 'FaCET Facade',
            date: 'Oct 20, 2026',
            time_in: '08:44 AM',
            time_out: '02:31 PM',
            event_status: 'ACTIVE (OPEN)',
            status: 'PRESENT',
          },
          {
            id: 2,
            title: 'SALUDO',
            location: 'FaCET Facade',
            date: 'Oct 19, 2026',
            time_in: '12:14 PM',
            time_out: '08:07 PM',
            event_status: 'INACTIVE (CLOSED)',
            status: 'PRESENT',
          },
          {
            id: 3,
            title: 'SALUDO 3RD NIGHT',
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

  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
    }
    router.replace('/');
  };

  // Calculations para sa Attendance stats
  const totalEventsCount = attendanceLogs.length;
  const totalPresentCount = attendanceLogs.filter((l) => l.status === 'PRESENT').length;
  const totalAbsencesCount = attendanceLogs.filter((l) => l.status === 'ABSENT').length;
  const complianceRate = totalEventsCount > 0 ? Math.round((totalPresentCount / totalEventsCount) * 100) : 0;

  // Filter attendance logs
  const filteredLogs = attendanceLogs.filter((log) => {
    if (attendanceFilter === 'present') return log.status === 'PRESENT';
    if (attendanceFilter === 'absent') return log.status === 'ABSENT';
    return true;
  }).filter((log) =>
    log.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Dynamic QR Code base sa School ID
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    profile.school_id
  )}`;

  return (
    <div className={styles.container} style={{ paddingBottom: 0 }}>
      <Head>
        <title>Student Portal • CECTRACK 3.0</title>
      </Head>

      {/* MOBILE RESPONSIVE HEADER */}
      <header className={styles.header} style={{ display: 'flex', alignItems: 'center' }}>
        <div className={styles.headerContent} style={{ height: '64px' }}>
          <div>
            <span className={styles.logoText} style={{ fontSize: '1.2rem' }}>
              CECTRACK 3.0
            </span>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase' }}>
              Student Portal Access
            </span>
          </div>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={styles.hamburgerBtn}
            style={{ display: 'block' }}
          >
            {isSidebarOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      <div className={styles.portalWrapper}>
        {/* SIDEBAR NAVIGATION */}
        <aside
          className={styles.portalSidebar}
          style={{
            display: isSidebarOpen ? 'flex' : undefined,
            position: isSidebarOpen ? 'fixed' : undefined,
            inset: isSidebarOpen ? '0 auto 0 0' : undefined,
            zIndex: isSidebarOpen ? 60 : undefined,
            boxShadow: isSidebarOpen ? '0 20px 25px -5px rgba(0,0,0,0.1)' : undefined,
          }}
        >
          <div>
            <div className={styles.portalBrand}>
              <h2 className={styles.portalBrandTitle}>Student Access</h2>
              <span className={styles.portalBrandSub}>Official CEC Credentials</span>
            </div>

            <nav className={styles.portalNav}>
              {/* 1. My ID */}
              <button
                onClick={() => { setActiveTab('my-id'); setIsSidebarOpen(false); }}
                className={activeTab === 'my-id' ? `${styles.portalNavLink} ${styles.portalNavLinkActive}` : styles.portalNavLink}
              >
                <span>🪪</span>
                <span>My Digital ID</span>
              </button>

              {/* 2. Attendance */}
              <button
                onClick={() => { setActiveTab('attendance'); setIsSidebarOpen(false); }}
                className={activeTab === 'attendance' ? `${styles.portalNavLink} ${styles.portalNavLinkActive}` : styles.portalNavLink}
              >
                <span>📅</span>
                <span>Attendance Logs</span>
              </button>

              {/* 3. Events */}
              <button
                onClick={() => { setActiveTab('events'); setIsSidebarOpen(false); }}
                className={activeTab === 'events' ? `${styles.portalNavLink} ${styles.portalNavLinkActive}` : styles.portalNavLink}
              >
                <span>✨</span>
                <span>Events & Schedule</span>
              </button>

              {/* 4. Profile */}
              <button
                onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }}
                className={activeTab === 'profile' ? `${styles.portalNavLink} ${styles.portalNavLinkActive}` : styles.portalNavLink}
              >
                <span>👤</span>
                <span>My Profile</span>
              </button>

              <div style={{ padding: '12px 14px 4px 14px', fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                Organization
              </div>

              <div className={styles.portalNavLink} style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                <span>🎗️</span>
                <span>Officers</span>
              </div>
              <div className={styles.portalNavLink} style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                <span>💳</span>
                <span>Finance & Dues</span>
              </div>
              <div className={styles.portalNavLink} style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                <span>🛡️</span>
                <span>Sanctions</span>
              </div>
            </nav>
          </div>

          {/* Sign Out Button */}
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
            <button
              onClick={handleSignOut}
              className={styles.portalNavLink}
              style={{ color: '#b91c1c', fontWeight: 800 }}
            >
              <span>➔</span>
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className={styles.portalContentArea}>
          {/* Top User Greeting Badge */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '8px 16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#0f172a', display: 'block', lineHeight: 1.2 }}>
                  {profile.full_name}
                </span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#15803d' }}>
                  {profile.school_id} • {profile.course}
                </span>
              </div>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '12px',
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '0.9rem',
                }}
              >
                {profile.full_name.charAt(0)}
              </div>
            </div>
          </div>

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
                <button onClick={() => window.print()} className={styles.adminPrimaryBtn}>
                  📥 Download Official ID
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', alignItems: 'start' }}>
                {/* ID Card Front */}
                <div className={styles.digitalIdCard}>
                  <div className={styles.idCardInner}>
                    <div className={styles.idCardHeaderCover} />
                    <span className={styles.idBadgePill}>• CEC TRACK 3.0 • DOrSU •</span>

                    <div className={styles.idPhotoWrap}>
                      <span style={{ fontSize: '2.5rem' }}>👤</span>
                    </div>

                    <h2 className={styles.idStudentName}>{profile.full_name}</h2>

                    <div className={styles.idLabel}>STUDENT ID</div>
                    <div className={styles.idSchoolNumber}>{profile.school_id}</div>

                    <div className={styles.idQrBox}>
                      <img src={qrCodeUrl} alt="Student QR Code" />
                    </div>

                    <div className={styles.idScanNotice}>SCAN FOR ATTENDANCE</div>

                    <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '16px', paddingTop: '10px' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>
                        College of Engineering and Computing
                      </span>
                    </div>
                  </div>
                </div>

                {/* Info Guide Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className={styles.adminFormCard} style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.5rem' }}>📱</span>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 900, color: '#166534' }}>
                          Universal Device Downloads
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#15803d', lineHeight: 1.5 }}>
                          I-save kini sa imong cellphone Photos o i-download sa laptop aron dali ipakita panahon sa attendance scanning.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={styles.adminFormCard}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.5rem' }}>🛡️</span>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 900, color: '#0f172a' }}>
                          Official Usage Policy
                        </h4>
                        <ul style={{ margin: '6px 0 0 0', paddingLeft: '16px', fontSize: '0.78rem', color: '#64748b', lineHeight: 1.6 }}>
                          <li>Gamita kini sa pag-check-in ug check-out sa mga official assemblies.</li>
                          <li>Personal kining QR code; ginadili ang pagpa-scan para sa laing estudyante.</li>
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
                  <p className={styles.adminSubtitle}>Track your attendance logs, timestamps, and compliance percentage.</p>
                </div>

                <button onClick={fetchStudentData} className={styles.eventsBtn}>
                  🔄 Refresh Records
                </button>
              </div>

              {/* Attendance Statistics Cards */}
              <div className={styles.attendanceStatsGrid}>
                <div className={styles.attStatCard}>
                  <span className={styles.attStatLabel}>Total Events</span>
                  <div className={styles.attStatValue}>{totalEventsCount}</div>
                </div>

                <div className={styles.attStatCard}>
                  <span className={styles.attStatLabel}>Total Present</span>
                  <div className={`${styles.attStatValue} ${styles.attGreenText}`}>{totalPresentCount}</div>
                </div>

                <div className={styles.attStatCard}>
                  <span className={styles.attStatLabel}>Absences</span>
                  <div className={styles.attStatValue} style={{ color: '#b91c1c' }}>{totalAbsencesCount}</div>
                </div>

                <div className={styles.attStatCard}>
                  <span className={styles.attStatLabel}>Compliance Rate</span>
                  <div className={`${styles.attStatValue} ${styles.attGreenText}`}>{complianceRate}%</div>
                </div>
              </div>

              {/* Filters & Search */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setAttendanceFilter('all')}
                    className={attendanceFilter === 'all' ? `${styles.adminTabBtn} ${styles.adminTabBtnActive}` : styles.adminTabBtn}
                  >
                    All Logs ({attendanceLogs.length})
                  </button>
                  <button
                    onClick={() => setAttendanceFilter('present')}
                    className={attendanceFilter === 'present' ? `${styles.adminTabBtn} ${styles.adminTabBtnActive}` : styles.adminTabBtn}
                  >
                    ✓ Present ({totalPresentCount})
                  </button>
                  <button
                    onClick={() => setAttendanceFilter('absent')}
                    className={attendanceFilter === 'absent' ? `${styles.adminTabBtn} ${styles.adminTabBtnActive}` : styles.adminTabBtn}
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
                  style={{ width: '220px', padding: '6px 12px' }}
                />
              </div>

              {/* Attendance Logs Table */}
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
                            <div style={{ fontSize: '0.7rem', color: '#15803d', fontWeight: 700 }}>
                              📍 {log.location || 'FaCET Facade'}
                            </div>
                          </td>
                          <td style={{ fontWeight: 600 }}>{log.date}</td>
                          <td style={{ fontWeight: 800 }}>{log.time_in || '--:--'}</td>
                          <td style={{ fontWeight: 800 }}>{log.time_out || '--:--'}</td>
                          <td>
                            <span className={styles.idBadge} style={{ fontSize: '0.65rem' }}>
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
                  <p className={styles.adminSubtitle}>Explore upcoming assemblies, workshops, seminars, and activities.</p>
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
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 900 }}>
                    Walay Events sa Pagkakaron
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                    Blangko pa kini kay wala pay napatik nga event ang mga opisyal sa sistema.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                  {events.map((ev) => {
                    const isActive = ev.status === 'active';
                    return (
                      <div key={ev.id} className={styles.adminFormCard} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <span
                              className={styles.idBadge}
                              style={{
                                backgroundColor: isActive ? '#dcfce7' : '#f1f5f9',
                                color: isActive ? '#15803d' : '#64748b',
                                fontSize: '0.65rem',
                              }}
                            >
                              {isActive ? '● ACTIVE (OPEN)' : 'CLOSED'}
                            </span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>
                              {ev.date}
                            </span>
                          </div>

                          <h3 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>
                            {ev.title}
                          </h3>
                          <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 800, marginBottom: '8px' }}>
                            📍 {ev.location || 'FaCET Facade'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', gap: '10px', fontWeight: 700, marginBottom: '10px' }}>
                            <span>In: {ev.time_in || '08:00'}</span>
                            <span>Out: {ev.time_out || '17:00'}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
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
                    width: '72px',
                    height: '72px',
                    borderRadius: '24px',
                    backgroundColor: '#dcfce7',
                    color: '#15803d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    margin: '0 auto 12px auto',
                  }}
                >
                  👤
                </div>
                <h1 className={styles.adminTitle}>{profile.full_name}</h1>
                <p className={styles.adminSubtitle}>
                  {profile.course} • {profile.section} • {profile.year_level}
                </p>
              </div>

              {/* Verified Details Card */}
              <div className={styles.adminFormCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase' }}>
                    VERIFIED STUDENT DETAILS
                  </span>
                  <span className={styles.idBadge}>OFFICIAL RECORD</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem' }}>
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

              {/* Security Policy Notice */}
              <div className={styles.adminFormCard} style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', marginTop: '16px' }}>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#166534', lineHeight: 1.5 }}>
                  ℹ️ <strong>ADMINISTRATOR MANAGED:</strong> Ang imong opisyal nga record gi-manage sa organization admin. Kon aduna kay kinahanglan usbon sa imong course o spelling sa ngalan, palihug pakigkita sa admin.
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
