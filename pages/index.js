import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Home.module.css';

export default function Home() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  // Dynamic Course Counts mula sa Database
  const [counts, setCounts] = useState({
    BSBA: 0,
    BSCRIM: 0,
    BSA: 0,
    BEED: 0,
    BSAM: 0,
    total: 0,
  });

  // Dynamic Events mula sa Admin
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  // Search ID Check States
  const [searchId, setSearchId] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchModal, setSearchModal] = useState({ open: false, success: false, data: null, msg: '' });

  // Live Philippine Standard Time (PHT) Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Manila',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setCurrentDate(
        now.toLocaleDateString('en-US', {
          timeZone: 'Asia/Manila',
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      );
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Kumuha ng Student Analytics at Events mula sa Supabase
  const fetchData = async () => {
    if (!supabase) return;
    try {
      // 1. Profiles analytics
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('course, role, status');

      if (profilesData) {
        const studentMembers = profilesData.filter((p) => p.role !== 'admin' && p.role !== 'staff');

        setCounts({
          BSBA: studentMembers.filter((s) => s.course === 'BSBA').length,
          BSCRIM: studentMembers.filter((s) => s.course === 'BSCRIM').length,
          BSA: studentMembers.filter((s) => s.course === 'BSA').length,
          BEED: studentMembers.filter((s) => s.course === 'BEED').length,
          BSAM: studentMembers.filter((s) => s.course === 'BSAM').length,
          total: studentMembers.length,
        });
      }

      // 2. Official events mula sa Admin
      setEventsLoading(true);
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false });

      if (eventsData) {
        setEvents(eventsData);
      }
    } catch (err) {
      console.error('Error fetching landing page data:', err);
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Quick Verification ng Student ID
  const handleCheckRecord = async (e) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setSearchLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('school_id, full_name, course, year_level, status')
        .eq('school_id', searchId.trim())
        .single();

      setSearchLoading(false);

      if (data) {
        setSearchModal({
          open: true,
          success: true,
          data: data,
          msg: `Student ID "${data.school_id}" is verified and active on the whitelist.`,
        });
      } else {
        setSearchModal({
          open: true,
          success: false,
          data: null,
          msg: `Student ID "${searchId.trim()}" was not found in the whitelist. Please coordinate with an administrator.`,
        });
      }
    } catch (err) {
      setSearchLoading(false);
      setSearchModal({
        open: true,
        success: false,
        data: null,
        msg: `Unable to verify "${searchId.trim()}". Please check your ID format (e.g. 2024-0616).`,
      });
    }
  };

  const scrollToEvents = () => {
    const el = document.getElementById('events-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.container} style={{ paddingBottom: 0 }}>
      <Head>
        <title>CECTRACK • Cateel Extension Campus</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent} style={{ justifyContent: 'space-between' }}>
          <button onClick={() => router.push('/')} className={styles.logoText}>
            CECTRACK
          </button>

          <div>
            <button
              onClick={() => router.push('/login')}
              className={styles.loginBtn}
              style={{ padding: '8px 18px', fontSize: '0.85rem' }}
            >
              <span>➔</span> Login
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* Status Row */}
        <div
          style={{
            width: '100%',
            maxWidth: '900px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            margin: '0 auto 24px auto',
            padding: '0 8px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '9999px',
              padding: '6px 12px',
              fontSize: '0.68rem',
              fontWeight: 800,
              color: '#334155',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
              letterSpacing: '0.01em',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', color: '#15803d' }}>
              <span className={styles.liveDot} style={{ width: '6px', height: '6px', marginRight: '4px' }}></span>
              LIVE PHT
            </span>
            <span style={{ color: '#cbd5e1' }}>|</span>
            <span>🕒 {currentTime || 'Loading...'}</span>
            <span style={{ color: '#cbd5e1' }}>|</span>
            <span>📅 {currentDate || 'Oct 21, 2026'}</span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ffffff',
              border: '1px solid #bbf7d0',
              borderRadius: '9999px',
              padding: '6px 14px',
              fontSize: '0.68rem',
              fontWeight: 800,
              color: '#15803d',
              boxShadow: '0 1px 2px rgba(21, 128, 61, 0.05)',
              whiteSpace: 'nowrap',
            }}
          >
            🛡️ Official CEC Portal
          </div>
        </div>

        {/* Hero Section */}
        <section className={styles.heroSection}>
          <div className={styles.logoContainer} style={{ marginBottom: '16px' }}>
            <img
              src="/logo.png"
              alt="Cateel Extension Campus Logo"
              style={{
                width: '125px',
                height: '125px',
                objectFit: 'contain',
                display: 'block',
                margin: '0 auto',
                filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.06))',
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          <div className={styles.tagBadge}>✨ EMPOWERING FUTURE LEADERS</div>
          <h1 className={styles.heroTitle} style={{ fontSize: '3rem', marginBottom: '2px' }}>
            CEC
          </h1>
          <h2 className={styles.heroSubtitle} style={{ fontSize: '1.2rem', marginBottom: '10px' }}>
            Cateel Extension Campus
          </h2>
          <p className={styles.heroDescription}>
            Uniting students across CEC Dorsu disciplines.<br />
            Innovate, collaborate, and excel together.
          </p>
        </section>

        {/* Search Student ID & Actions */}
        <section className={styles.actionArea}>
          <form onSubmit={handleCheckRecord} className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search Student ID (e.g. 2024-00123)..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className={styles.searchInput}
            />
            <button type="submit" disabled={searchLoading} className={styles.checkBtn}>
              {searchLoading ? 'Checking...' : '🔍 Check Record'}
            </button>
          </form>

          <div className={styles.buttonRow}>
            <button onClick={() => router.push('/login')} className={styles.portalBtn}>
              ➔ Access Member Portal
            </button>
            <button onClick={scrollToEvents} className={styles.eventsBtn}>
              Explore Events ➔
            </button>
          </div>
        </section>

        {/* Live Course Analytics Grid */}
        <section className={styles.analyticsSection}>
          <div className={styles.analyticsHeader}>
            <div className={styles.analyticsTitle}>
              👥 DEPARTMENT MEMBERS BY COURSE
            </div>
            <div className={styles.analyticsStats}>
              <span>Total Members: <strong>{counts.total}</strong></span>
              <span>•</span>
              <span className={styles.idBadge}>
                Digital IDs: <strong>{counts.total} (100%)</strong>
              </span>
            </div>
          </div>

          <div className={styles.courseGrid}>
            {/* 1. BSBA */}
            <div className={styles.courseCard}>
              <div className={styles.cardTop}>
                <span className={`${styles.badge} ${styles.bsbaBadge}`}>BSBA</span>
                <span style={{ fontSize: '1.1rem' }}>💼</span>
              </div>
              <div>
                <div className={styles.countValue}>{counts.BSBA}</div>
                <div className={styles.courseName}>Business Administration</div>
              </div>
              <div className={styles.cardBottom}>
                <span>Enrolled Active</span>
                <span className={styles.idReadyValue}>ID Ready {counts.BSBA}</span>
              </div>
            </div>

            {/* 2. BSCRIM */}
            <div className={styles.courseCard}>
              <div className={styles.cardTop}>
                <span className={`${styles.badge} ${styles.bscrimBadge}`}>BSCRIM</span>
                <span style={{ fontSize: '1.1rem' }}>🛡️</span>
              </div>
              <div>
                <div className={styles.countValue}>{counts.BSCRIM}</div>
                <div className={styles.courseName}>Criminology</div>
              </div>
              <div className={styles.cardBottom}>
                <span>Enrolled Active</span>
                <span className={styles.idReadyValue}>ID Ready {counts.BSCRIM}</span>
              </div>
            </div>

            {/* 3. BSA */}
            <div className={styles.courseCard}>
              <div className={styles.cardTop}>
                <span className={`${styles.badge} ${styles.bsaBadge}`}>BSA</span>
                <span style={{ fontSize: '1.1rem' }}>🏛️</span>
              </div>
              <div>
                <div className={styles.countValue}>{counts.BSA}</div>
                <div className={styles.courseName}>Accountancy</div>
              </div>
              <div className={styles.cardBottom}>
                <span>Enrolled Active</span>
                <span className={styles.idReadyValue}>ID Ready {counts.BSA}</span>
              </div>
            </div>

            {/* 4. BEED */}
            <div className={styles.courseCard}>
              <div className={styles.cardTop}>
                <span className={`${styles.badge} ${styles.beedBadge}`}>BEED</span>
                <span style={{ fontSize: '1.1rem' }}>🎓</span>
              </div>
              <div>
                <div className={styles.countValue}>{counts.BEED}</div>
                <div className={styles.courseName}>Elementary Education</div>
              </div>
              <div className={styles.cardBottom}>
                <span>Enrolled Active</span>
                <span className={styles.idReadyValue}>ID Ready {counts.BEED}</span>
              </div>
            </div>

            {/* 5. BSAM */}
            <div className={styles.courseCard}>
              <div className={styles.cardTop}>
                <span className={`${styles.badge} ${styles.bsamBadge}`}>BSAM</span>
                <span style={{ fontSize: '1.1rem' }}>🌾</span>
              </div>
              <div>
                <div className={styles.countValue}>{counts.BSAM}</div>
                <div className={styles.courseName}>Agribusiness Management</div>
              </div>
              <div className={styles.cardBottom}>
                <span>Enrolled Active</span>
                <span className={styles.idReadyValue}>ID Ready {counts.BSAM}</span>
              </div>
            </div>
          </div>
        </section>

        {/* OFFICIAL EVENTS SECTION */}
        <section className={styles.analyticsSection} id="events-section" style={{ marginTop: '40px' }}>
          <div className={styles.analyticsHeader}>
            <div className={styles.analyticsTitle}>
              📅 UPCOMING &amp; OFFICIAL CAMPUS EVENTS
            </div>
            <div className={styles.analyticsStats}>
              <span>Total Events: <strong>{events.length}</strong></span>
              <span>•</span>
              <span className={styles.idBadge} style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
                Active: <strong>{events.filter((e) => e.status === 'active').length}</strong>
              </span>
            </div>
          </div>

          {eventsLoading ? (
            <div style={{ textAlign: 'center', padding: '36px', color: '#64748b', fontWeight: 700 }}>
              Loading official events...
            </div>
          ) : events.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                color: '#64748b',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📅</div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>
                No Published Events Yet
              </h4>
              <p style={{ margin: 0, fontSize: '0.82rem' }}>
                Check back soon for upcoming assemblies and college activities published by administrators.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '22px' }}>
              {events.map((ev) => {
                const isActive = ev.status === 'active';
                return (
                  <div
                    key={ev.id}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    {ev.image_url ? (
                      <div style={{ width: '100%', height: '160px', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
                        <img
                          src={ev.image_url}
                          alt={ev.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '90px',
                          backgroundColor: '#f8fafc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '2rem',
                          borderBottom: '1px solid #f1f5f9',
                        }}
                      >
                        📅
                      </div>
                    )}

                    <div style={{ padding: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
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
                          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94a3b8' }}>
                            {ev.date}
                          </span>
                        </div>

                        <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.3 }}>
                          {ev.title}
                        </h3>

                        {ev.location && (
                          <div style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 800, marginBottom: '8px' }}>
                            📍 {ev.location}
                          </div>
                        )}

                        <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', gap: '12px', fontWeight: 700, marginBottom: '10px' }}>
                          <span>In: {ev.time_in || '08:00'}</span>
                          <span>Out: {ev.time_out || '17:00'}</span>
                        </div>

                        <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
                          {ev.description || 'No description provided.'}
                        </p>
                      </div>

                      <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
                        <button
                          onClick={() => router.push('/login')}
                          style={{
                            width: '100%',
                            padding: '10px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            color: '#15803d',
                            fontSize: '0.82rem',
                            fontWeight: 900,
                            cursor: 'pointer',
                          }}
                        >
                          Check Attendance In Portal ➔
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* ======================================================== */}
      {/* PUTING FOOTER (TUMUGMA SA BACKGROUND NG WEBSITE) */}
      {/* ======================================================== */}
      <footer
        style={{
          backgroundColor: '#ffffff',
          color: '#64748b',
          borderTop: '1px solid #e2e8f0',
          padding: '24px 20px',
          marginTop: '70px',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          {/* Kaliwa: © 2026 CEC TRACK */}
          <div
            style={{
              fontSize: '0.8rem',
              fontWeight: 800,
              color: '#64748b',
              letterSpacing: '0.04em',
            }}
          >
            © 2026 CEC TRACK. ALL RIGHTS RESERVED.
          </div>

          {/* Kanan: Links at Green Badge sa Puting Background */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              flexWrap: 'wrap',
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
            }}
          >
            <span style={{ cursor: 'pointer', color: '#64748b' }}>PRIVACY POLICY</span>
            <span style={{ cursor: 'pointer', color: '#64748b' }}>TERMS OF USE</span>
            <span style={{ cursor: 'pointer', color: '#64748b' }}>ACCESSIBILITY</span>
            <span
              style={{
                border: '1px solid #bbf7d0',
                color: '#15803d',
                backgroundColor: '#f0fdf4',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '0.7rem',
                fontWeight: 900,
                letterSpacing: '0.06em',
                boxShadow: '0 1px 3px rgba(21, 128, 61, 0.08)',
              }}
            >
              OFFICIAL PORTAL
            </span>
          </div>
        </div>
      </footer>

      {/* Modal Result Record Check */}
      {searchModal.open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
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
              maxWidth: '400px',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                backgroundColor: searchModal.success ? '#dcfce7' : '#fee2e2',
                color: searchModal.success ? '#15803d' : '#b91c1c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                margin: '0 auto 12px auto',
              }}
            >
              {searchModal.success ? '✓' : '✕'}
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0' }}>
              {searchModal.success ? 'Record Verified' : 'Record Not Found'}
            </h3>

            <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              {searchModal.msg}
            </p>

            {searchModal.success && searchModal.data && (
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '12px',
                  marginBottom: '16px',
                  textAlign: 'left',
                  fontSize: '0.78rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px',
                }}
              >
                <div><strong>Name:</strong> {searchModal.data.full_name}</div>
                <div><strong>ID:</strong> {searchModal.data.school_id}</div>
                <div><strong>Program:</strong> {searchModal.data.course} ({searchModal.data.year_level})</div>
                <div><strong>Status:</strong> <span style={{ color: '#15803d', fontWeight: 800 }}>{searchModal.data.status}</span></div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              {searchModal.success && (
                <button
                  onClick={() => router.push('/login')}
                  className={styles.portalBtn}
                  style={{ width: '100%', padding: '10px 14px', fontSize: '0.8rem' }}
                >
                  Proceed to Login ➔
                </button>
              )}
              <button
                onClick={() => setSearchModal({ open: false, success: false, data: null, msg: '' })}
                className={styles.eventsBtn}
                style={{ width: '100%', padding: '10px 14px', fontSize: '0.8rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
