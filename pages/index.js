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
  const [searchResult, setSearchResult] = useState(null);

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

  // Fetch Student Analytics at Events mula sa Supabase
  const fetchData = async () => {
    if (!supabase) return;
    try {
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

  // Pag-check ng Student ID at pagkuha ng kanyang Attendance Record
  const handleCheckRecord = async (e) => {
    if (e) e.preventDefault();
    const cleanId = searchId.trim();
    if (!cleanId) return;

    setSearchLoading(true);
    setSearchResult(null);

    try {
      // 1. Hanapin ang profile ng estudyante
      const { data: student, error: studentErr } = await supabase
        .from('profiles')
        .select('school_id, full_name, course, year_level, section, status, avatar_url')
        .eq('school_id', cleanId)
        .maybeSingle();

      if (studentErr || !student) {
        setSearchResult({
          success: false,
          msg: `Student ID "${cleanId}" was not found in the official registry. Please coordinate with an administrator.`,
        });
        setSearchLoading(false);
        return;
      }

      // 2. Kumuha ng attendance record ng naturang estudyante
      const { data: studentLogs } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', cleanId);

      // 3. Kumuha ng kabuuang bilang ng mga events
      const { data: allEvents } = await supabase
        .from('events')
        .select('id');

      const totalEvents = allEvents ? allEvents.length : 0;
      const attendedCount = studentLogs ? studentLogs.filter((l) => l.status === 'PRESENT').length : 0;
      const absencesCount = Math.max(0, totalEvents - attendedCount);

      setSearchResult({
        success: true,
        student,
        stats: {
          totalEvents,
          attended: attendedCount,
          absences: absencesCount,
        },
      });
    } catch (err) {
      setSearchResult({
        success: false,
        msg: `Unable to verify "${cleanId}". Please check your ID format.`,
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchId('');
    setSearchResult(null);
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

      {/* MOBILE RESPONSIVE STYLES PARA PLASTAR SA CELLPHONE */}
      <style jsx>{`
        .search-form-wrapper {
          background-color: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 9999px;
          padding: 5px 6px 5px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
          width: 100%;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .search-btn-green {
          background-color: #15803d;
          color: #ffffff;
          border: none;
          border-radius: 9999px;
          padding: 10px 20px;
          font-size: 0.85rem;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 3px 10px rgba(21, 128, 61, 0.25);
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }
        .verified-card {
          background-color: #f0fdf4;
          border: 1.5px solid #a7f3d0;
          border-radius: 22px;
          padding: 20px 18px;
          position: relative;
          box-shadow: 0 10px 25px rgba(21, 128, 61, 0.07);
          display: flex;
          align-items: flex-start;
          gap: 14px;
          box-sizing: border-box;
          text-align: left;
          width: 100%;
        }
        @media (max-width: 600px) {
          .search-form-wrapper {
            padding: 4px 5px 4px 12px;
          }
          .search-btn-green {
            padding: 9px 15px;
            font-size: 0.78rem;
          }
          .verified-card {
            padding: 16px 14px;
            gap: 12px;
            border-radius: 18px;
          }
          .verified-icon-box {
            width: 38px !important;
            height: 38px !important;
            border-radius: 12px !important;
          }
          .verified-title {
            font-size: 1.05rem !important;
          }
          .verified-desc {
            font-size: 0.8rem !important;
          }
          .stats-row-box {
            padding: 10px 12px !important;
            gap: 6px !important;
          }
          .stats-number {
            font-size: 1.15rem !important;
          }
          .mobile-btn-stack {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
          }
          .mobile-btn-stack button {
            width: 100% !important;
            justify-content: center !important;
            text-align: center !important;
          }
        }
      `}</style>

      {/* Header na may About Link at Login Button */}
      <header className={styles.header}>
        <div className={styles.headerContent} style={{ justifyContent: 'space-between' }}>
          <button onClick={() => router.push('/')} className={styles.logoText}>
            CECTRACK
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => router.push('/about')}
              style={{
                background: 'none',
                border: 'none',
                color: '#334155',
                fontSize: '0.88rem',
                fontWeight: 800,
                cursor: 'pointer',
                padding: '6px 10px',
              }}
            >
              About
            </button>

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
            margin: '0 auto 20px auto',
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
            Official CEC Portal
          </div>
        </div>

        {/* Hero Section */}
        <section className={styles.heroSection}>
          <div className={styles.logoContainer} style={{ marginBottom: '14px' }}>
            <img
              src="/logo.png"
              alt="Cateel Extension Campus Logo"
              style={{
                width: '110px',
                height: '110px',
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

          <div className={styles.tagBadge}>EMPOWERING FUTURE LEADERS</div>
          <h1 className={styles.heroTitle} style={{ fontSize: 'clamp(2.2rem, 6vw, 3rem)', marginBottom: '2px' }}>
            CEC
          </h1>
          <h2 className={styles.heroSubtitle} style={{ fontSize: '1.15rem', marginBottom: '8px' }}>
            Cateel Extension Campus
          </h2>
          <p className={styles.heroDescription} style={{ fontSize: '0.88rem', margin: '0 auto 20px auto' }}>
            Uniting students across CEC Dorsu disciplines.<br />
            Innovate, collaborate, and excel together.
          </p>
        </section>

        {/* ======================================================== */}
        {/* SEARCH BAR (GREEN BUTTON, CLEAN PLACEHOLDER, COMPACT) */}
        {/* ======================================================== */}
        <section className={styles.actionArea} style={{ maxWidth: '600px', margin: '0 auto 30px auto', width: '100%', padding: '0 10px', boxSizing: 'border-box' }}>
          <form onSubmit={handleCheckRecord} className="search-form-wrapper">
            {/* ID CARD ICON */}
            <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="3" />
                <line x1="7" y1="8" x2="11" y2="8" />
                <line x1="7" y1="12" x2="11" y2="12" />
                <rect x="14" y="8" width="4" height="4" />
              </svg>
            </div>

            {/* INPUT FIELD (TINANGGAL ANG E.G. 2024-0616) */}
            <input
              type="text"
              placeholder="Search Student ID..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '0.92rem',
                fontWeight: 700,
                color: '#0f172a',
                backgroundColor: 'transparent',
                minWidth: 0,
              }}
            />

            {/* CLEAR 'X' BUTTON */}
            {searchId && (
              <button
                type="button"
                onClick={handleClearSearch}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.95rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  padding: '2px 4px',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            )}

            {/* GREEN CHECK RECORD BUTTON */}
            <button
              type="submit"
              disabled={searchLoading}
              className="search-btn-green"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>{searchLoading ? 'Checking...' : 'Check Record'}</span>
            </button>
          </form>

          {/* ======================================================== */}
          {/* SEARCH RESULT: PLASTAR SA CELLPHONE & MATCHING DESIGN */}
          {/* ======================================================== */}
          {searchResult && (
            <div style={{ marginTop: '14px', width: '100%', boxSizing: 'border-box' }}>
              {searchResult.success && searchResult.student ? (
                <div className="verified-card">
                  {/* CLOSE BUTTON */}
                  <button
                    onClick={() => setSearchResult(null)}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '14px',
                      background: 'none',
                      border: 'none',
                      color: '#059669',
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      padding: '4px',
                      lineHeight: 1,
                    }}
                  >
                    ✕
                  </button>

                  {/* LEFT GREEN ICON */}
                  <div
                    className="verified-icon-box"
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      backgroundColor: '#00a86b',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      flexShrink: 0,
                      boxShadow: '0 4px 10px rgba(0, 168, 107, 0.2)',
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="9 12 11.5 14.5 15.5 9.5" />
                    </svg>
                  </div>

                  {/* DETAILS */}
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '14px' }}>
                    {/* BADGE: RECORDED & VERIFIED */}
                    <div style={{ marginBottom: '6px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          backgroundColor: '#dcfce7',
                          color: '#047857',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          fontSize: '0.68rem',
                          fontWeight: 900,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          <path d="m9 12 2 2 4-4" />
                        </svg>
                        RECORDED &amp; VERIFIED
                      </span>
                    </div>

                    {/* TITLE */}
                    <h3
                      className="verified-title"
                      style={{
                        margin: '0 0 4px 0',
                        fontSize: '1.1rem',
                        fontWeight: 900,
                        color: '#0f172a',
                        lineHeight: 1.25,
                      }}
                    >
                      You are already recorded! Please sign in now.
                    </h3>

                    {/* WELCOME TEXT */}
                    <p
                      className="verified-desc"
                      style={{
                        margin: '0 0 12px 0',
                        fontSize: '0.82rem',
                        color: '#475569',
                        lineHeight: 1.5,
                      }}
                    >
                      Welcome, <strong>{searchResult.student.full_name}</strong> (
                      <strong style={{ color: '#047857' }}>{searchResult.student.school_id}</strong> •{' '}
                      {searchResult.student.course} - {searchResult.student.year_level || '1st Year'}{' '}
                      {searchResult.student.section ? `Sec ${searchResult.student.section.replace('Section ', '')}` : ''}
                      )! Your account is officially registered in the CECTRACK system.
                    </p>

                    {/* COMPACT ATTENDANCE SUMMARY */}
                    <div
                      className="stats-row-box"
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #bbf7d0',
                        borderRadius: '14px',
                        padding: '10px 14px',
                        marginBottom: '14px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '8px',
                        textAlign: 'center',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>TOTAL EVENTS</span>
                        <div className="stats-number" style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                          {searchResult.stats.totalEvents}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>ATTENDED</span>
                        <div className="stats-number" style={{ fontSize: '1.2rem', fontWeight: 900, color: '#059669' }}>
                          {searchResult.stats.attended}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>ABSENCES</span>
                        <div className="stats-number" style={{ fontSize: '1.2rem', fontWeight: 900, color: searchResult.stats.absences > 0 ? '#dc2626' : '#059669' }}>
                          {searchResult.stats.absences}
                        </div>
                      </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => router.push('/login')}
                        style={{
                          backgroundColor: '#00875a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '10px 18px',
                          fontSize: '0.85rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 3px 10px rgba(0, 135, 90, 0.22)',
                        }}
                      >
                        <span>Sign In Now ➔</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleClearSearch}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#64748b',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                      >
                        Check another ID
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* ERROR CARD KUNG HINDI NAKITA ANG RECORD */
                <div
                  style={{
                    backgroundColor: '#fff1f2',
                    border: '1.5px solid #fecdd3',
                    borderRadius: '18px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 8px 20px rgba(225, 29, 72, 0.05)',
                    textAlign: 'left',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        backgroundColor: '#fee2e2',
                        color: '#be123c',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.1rem',
                        fontWeight: 900,
                        flexShrink: 0,
                      }}
                    >
                      ✕
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 2px 0', fontSize: '0.9rem', fontWeight: 900, color: '#9f1239' }}>
                        Record Not Found
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#be123c' }}>
                        {searchResult.msg}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSearchResult(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#be123c',
                      fontSize: '1rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}

          {/* PORTAL ACCESS & EXPLORE BUTTONS */}
          <div className="mobile-btn-stack" style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '16px', width: '100%' }}>
            <button
              onClick={() => router.push('/login')}
              className={styles.portalBtn}
              style={{ padding: '12px 20px', fontSize: '0.88rem' }}
            >
              ➔ Access Member Portal
            </button>
            <button
              onClick={scrollToEvents}
              className={styles.eventsBtn}
              style={{ padding: '12px 20px', fontSize: '0.88rem' }}
            >
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

      {/* Puti na Footer */}
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
            <span
              onClick={() => router.push('/about')}
              style={{ cursor: 'pointer', color: '#15803d', fontWeight: 900 }}
            >
              ABOUT
            </span>
            <span style={{ cursor: 'pointer', color: '#64748b' }}>PRIVACY POLICY</span>
            <span style={{ cursor: 'pointer', color: '#64748b' }}>TERMS OF USE</span>
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
    </div>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
