import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Home.module.css';

export default function Home() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  // Course counts from database
  const [counts, setCounts] = useState({
    BSBA: 0,
    BSCRIM: 0,
    BSA: 0,
    BEED: 0,
    BSAM: 0,
    total: 0,
  });

  // Events from database
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  // Officers & Leaders from database
  const [officers, setOfficers] = useState([]);
  const [officersLoading, setOfficersLoading] = useState(true);

  // Search ID states
  const [searchId, setSearchId] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState(null);

  // Philippine Standard Time Clock
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

  // Fetch data from database
  const fetchData = async () => {
    if (!supabase) return;
    try {
      // 1. Fetch Students
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

      // 2. Fetch Events
      setEventsLoading(true);
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false });

      if (eventsData) {
        setEvents(eventsData);
      }

      // 3. Fetch Officers
      setOfficersLoading(true);
      const { data: officersData } = await supabase
        .from('officers')
        .select('*')
        .order('id', { ascending: true });

      if (officersData) {
        setOfficers(officersData);
      }
    } catch (err) {
      console.error('Error fetching landing page data:', err);
    } finally {
      setEventsLoading(false);
      setOfficersLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Check Record logic
  const handleCheckRecord = async (e) => {
    if (e) e.preventDefault();
    const cleanId = searchId.trim();
    if (!cleanId) return;

    setSearchLoading(true);
    setSearchResult(null);

    try {
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

      const { data: studentLogs } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', cleanId);

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
    <div className={styles.container} style={{ paddingBottom: 0, overflowX: 'hidden' }}>
      <Head>
        <title>CECTRACK • Cateel Extension Campus</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      <style jsx>{`
        /* PULSING LIVE DOT ANIMATION */
        @keyframes liveDotGlow {
          0% {
            transform: scale(0.92);
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.75);
          }
          65% {
            transform: scale(1.08);
            box-shadow: 0 0 0 6px rgba(34, 197, 94, 0);
          }
          100% {
            transform: scale(0.92);
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
          }
        }
        .live-dot-pulse {
          width: 7px;
          height: 7px;
          background-color: #16a34a;
          border-radius: 50%;
          display: inline-block;
          margin-right: 5px;
          animation: liveDotGlow 1.8s infinite cubic-bezier(0.4, 0, 0.6, 1);
          flex-shrink: 0;
        }

        .search-container {
          background-color: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 9999px;
          padding: 4px 5px 4px 14px;
          display: flex;
          align-items: center;
          gap: 6px;
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
          padding: 8px 16px;
          font-size: 0.8rem;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 3px 8px rgba(21, 128, 61, 0.2);
          white-space: nowrap;
          flex-shrink: 0;
        }
        .verified-card {
          background-color: #f0fdf4;
          border: 1.5px solid #a7f3d0;
          border-radius: 20px;
          padding: 18px 16px;
          position: relative;
          box-shadow: 0 10px 25px rgba(21, 128, 61, 0.06);
          display: flex;
          align-items: flex-start;
          gap: 12px;
          box-sizing: border-box;
          text-align: left;
          width: 100%;
        }

        /* OFFICERS SECTION STYLES */
        .officers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 20px;
          margin-top: 24px;
        }
        .officer-card {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 22px;
          padding: 20px 16px;
          text-align: center;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.03);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          justifyContent: space-between;
        }
        .officer-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 24px rgba(21, 128, 61, 0.08);
          border-color: #bbf7d0;
        }

        @media (max-width: 600px) {
          .search-container {
            padding: 4px 4px 4px 10px;
            gap: 4px;
          }
          .search-btn-green {
            padding: 7px 11px;
            font-size: 0.74rem;
            gap: 4px;
          }
          .verified-card {
            padding: 14px 12px;
            gap: 10px;
            border-radius: 16px;
          }
          .icon-box {
            width: 36px !important;
            height: 36px !important;
            border-radius: 10px !important;
          }
          .title-text {
            font-size: 1rem !important;
          }
          .desc-text {
            font-size: 0.78rem !important;
          }
          .stats-grid {
            padding: 8px 10px !important;
          }
          .stat-value {
            font-size: 1.15rem !important;
          }
          .officers-grid {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 12px;
          }
          .officer-card {
            padding: 14px 10px;
            border-radius: 18px;
          }
        }
      `}</style>

      {/* Header with door icon on Login Button */}
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

            {/* Login button matching image_e2705d.png */}
            <button
              onClick={() => router.push('/login')}
              className={styles.loginBtn}
              style={{
                padding: '8px 18px',
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <line x1="3" y1="12" x2="15" y2="12" />
                <polyline points="10 7 15 12 10 17" />
                <path d="M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5" />
              </svg>
              <span>Login</span>
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* Status Badge Row */}
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
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', color: '#15803d' }}>
              <span className="live-dot-pulse" />
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

        {/* Hero Area */}
        <section className={styles.heroSection}>
          <div className={styles.logoContainer} style={{ marginBottom: '14px' }}>
            <img
              src="/logo.png"
              alt="Cateel Extension Campus Logo"
              style={{
                width: '105px',
                height: '105px',
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
          <p className={styles.heroDescription} style={{ fontSize: '0.86rem', margin: '0 auto 20px auto' }}>
            Uniting students across CEC Dorsu disciplines.<br />
            Innovate, collaborate, and excel together.
          </p>
        </section>

        {/* Compact Search Bar & Result */}
        <section className={styles.actionArea} style={{ maxWidth: '580px', margin: '0 auto 28px auto', width: '100%', padding: '0 8px', boxSizing: 'border-box' }}>
          <form onSubmit={handleCheckRecord} className="search-container">
            <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="3" />
                <line x1="7" y1="8" x2="11" y2="8" />
                <line x1="7" y1="12" x2="11" y2="12" />
                <rect x="14" y="8" width="4" height="4" />
              </svg>
            </div>

            <input
              type="text"
              placeholder="Search Student ID..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '0.88rem',
                fontWeight: 700,
                color: '#0f172a',
                backgroundColor: 'transparent',
                minWidth: 0,
              }}
            />

            {searchId && (
              <button
                type="button"
                onClick={handleClearSearch}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.9rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  padding: '2px 4px',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            )}

            <button
              type="submit"
              disabled={searchLoading}
              className="search-btn-green"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>{searchLoading ? 'Checking...' : 'Check Record'}</span>
            </button>
          </form>

          {/* Result Card */}
          {searchResult && (
            <div style={{ marginTop: '14px', width: '100%', boxSizing: 'border-box' }}>
              {searchResult.success && searchResult.student ? (
                <div className="verified-card">
                  <button
                    onClick={() => setSearchResult(null)}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'none',
                      border: 'none',
                      color: '#059669',
                      fontSize: '1rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      padding: '2px',
                      lineHeight: 1,
                    }}
                  >
                    ✕
                  </button>

                  <div
                    className="icon-box"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      backgroundColor: '#00a86b',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 4px 10px rgba(0, 168, 107, 0.2)',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="9 12 11.5 14.5 15.5 9.5" />
                    </svg>
                  </div>

                  <div style={{ flex: 1, minWidth: 0, paddingRight: '10px' }}>
                    <div style={{ marginBottom: '6px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          backgroundColor: '#dcfce7',
                          color: '#047857',
                          padding: '3px 8px',
                          borderRadius: '9999px',
                          fontSize: '0.64rem',
                          fontWeight: 900,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          <path d="m9 12 2 2 4-4" />
                        </svg>
                        RECORDED &amp; VERIFIED
                      </span>
                    </div>

                    <h3
                      className="title-text"
                      style={{
                        margin: '0 0 4px 0',
                        fontSize: '1.08rem',
                        fontWeight: 900,
                        color: '#0f172a',
                        lineHeight: 1.25,
                      }}
                    >
                      You are already recorded! Please sign in now.
                    </h3>

                    <p
                      className="desc-text"
                      style={{
                        margin: '0 0 12px 0',
                        fontSize: '0.8rem',
                        color: '#475569',
                        lineHeight: 1.45,
                      }}
                    >
                      Welcome, <strong>{searchResult.student.full_name}</strong> (
                      <strong style={{ color: '#047857' }}>{searchResult.student.school_id}</strong> •{' '}
                      {searchResult.student.course} - {searchResult.student.year_level || '1st Year'}{' '}
                      {searchResult.student.section ? `Sec ${searchResult.student.section.replace('Section ', '')}` : ''}
                      )! Your account is officially registered in the CECTRACK system.
                    </p>

                    {/* Stats Table */}
                    <div
                      className="stats-grid"
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #bbf7d0',
                        borderRadius: '12px',
                        padding: '10px 12px',
                        marginBottom: '12px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '6px',
                        textAlign: 'center',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>TOTAL EVENTS</span>
                        <div className="stat-value" style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
                          {searchResult.stats.totalEvents}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>ATTENDED</span>
                        <div className="stat-value" style={{ fontSize: '1.15rem', fontWeight: 900, color: '#059669' }}>
                          {searchResult.stats.attended}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>ABSENCES</span>
                        <div className="stat-value" style={{ fontSize: '1.15rem', fontWeight: 900, color: searchResult.stats.absences > 0 ? '#dc2626' : '#059669' }}>
                          {searchResult.stats.absences}
                        </div>
                      </div>
                    </div>

                    {/* Button Row with User Profile Icon */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => router.push('/login')}
                        style={{
                          backgroundColor: '#00875a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '8px 16px',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 3px 8px rgba(0, 135, 90, 0.2)',
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ flexShrink: 0 }}
                        >
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <line x1="19" y1="8" x2="19" y2="14" />
                          <line x1="22" y1="11" x2="16" y2="11" />
                        </svg>
                        <span>Sign In Now ➔</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleClearSearch}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#64748b',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: '2px',
                        }}
                      >
                        Check another ID
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    backgroundColor: '#fff1f2',
                    border: '1.5px solid #fecdd3',
                    borderRadius: '16px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: '#fee2e2',
                        color: '#be123c',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.95rem',
                        fontWeight: 900,
                        flexShrink: 0,
                      }}
                    >
                      ✕
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 2px 0', fontSize: '0.85rem', fontWeight: 900, color: '#9f1239' }}>
                        Record Not Found
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#be123c' }}>
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
                      fontSize: '0.95rem',
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

          {/* Quick Buttons: Door-Arrow Icon (->]) */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '16px', width: '100%', flexWrap: 'wrap' }}>
            <button
              onClick={() => router.push('/login')}
              className={styles.portalBtn}
              style={{
                padding: '11px 18px',
                fontSize: '0.84rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <line x1="3" y1="12" x2="15" y2="12" />
                <polyline points="10 7 15 12 10 17" />
                <path d="M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5" />
              </svg>
              <span>Access Member Portal</span>
            </button>
            <button
              onClick={scrollToEvents}
              className={styles.eventsBtn}
              style={{ padding: '11px 18px', fontSize: '0.84rem' }}
            >
              Explore Events ➔
            </button>
          </div>
        </section>

        {/* Live Course Analytics Grid */}
        <section className={styles.analyticsSection}>
          <div className={styles.analyticsHeader}>
            <div className={styles.analyticsTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#f97316"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <circle cx="9" cy="7" r="4" />
                <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                <path d="M21 21v-2a4 4 0 0 0-3-3.85" />
              </svg>
              <span>DEPARTMENT MEMBERS BY COURSE</span>
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
            {/* BSBA */}
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

            {/* BSCRIM */}
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

            {/* BSA */}
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

            {/* BEED */}
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

            {/* BSAM */}
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

        {/* ======================================================== */}
        {/* 1. UPCOMING & OFFICIAL CAMPUS EVENTS (NAUNA SA LIST) */}
        {/* ======================================================== */}
        <section className={styles.analyticsSection} id="events-section" style={{ marginTop: '36px' }}>
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
                padding: '36px 18px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '18px',
                color: '#64748b',
              }}
            >
              <div style={{ fontSize: '2.2rem', marginBottom: '6px' }}>📅</div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 900, color: '#0f172a' }}>
                No Published Events Yet
              </h4>
              <p style={{ margin: 0, fontSize: '0.8rem' }}>
                Check back soon for upcoming assemblies and college activities published by administrators.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {events.map((ev) => {
                const isActive = ev.status === 'active';
                return (
                  <div
                    key={ev.id}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '18px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    {ev.image_url ? (
                      <div style={{ width: '100%', height: '150px', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
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
                          height: '80px',
                          backgroundColor: '#f8fafc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.8rem',
                          borderBottom: '1px solid #f1f5f9',
                        }}
                      >
                        📅
                      </div>
                    )}

                    <div style={{ padding: '16px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span
                            className={styles.idBadge}
                            style={{
                              backgroundColor: isActive ? '#dcfce7' : '#f1f5f9',
                              color: isActive ? '#15803d' : '#64748b',
                              fontSize: '0.64rem',
                            }}
                          >
                            {isActive ? '● ACTIVE (OPEN)' : 'CLOSED'}
                          </span>
                          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#94a3b8' }}>
                            {ev.date}
                          </span>
                        </div>

                        <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.3 }}>
                          {ev.title}
                        </h3>

                        {ev.location && (
                          <div style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 800, marginBottom: '6px' }}>
                            📍 {ev.location}
                          </div>
                        )}

                        <div style={{ fontSize: '0.74rem', color: '#64748b', display: 'flex', gap: '10px', fontWeight: 700, marginBottom: '8px' }}>
                          <span>In: {ev.time_in || '08:00'}</span>
                          <span>Out: {ev.time_out || '17:00'}</span>
                        </div>

                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.45 }}>
                          {ev.description || 'No description provided.'}
                        </p>
                      </div>

                      <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                        <button
                          onClick={() => router.push('/login')}
                          style={{
                            width: '100%',
                            padding: '9px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            color: '#15803d',
                            fontSize: '0.78rem',
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

        {/* ======================================================== */}
        {/* 2. LEADERSHIP & FACULTY SECTION (SA UBOS NA SEKSYON) */}
        {/* ======================================================== */}
        <section className={styles.analyticsSection} style={{ marginTop: '48px', textAlign: 'center' }}>
          {/* Badge Tag with Green Vector Ribbon Icon matching image_e27083.png */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '9999px', padding: '5px 14px', marginBottom: '10px' }}>
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#15803d"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <circle cx="12" cy="8" r="6" />
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
            </svg>
            <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              LEADERSHIP &amp; FACULTY
            </span>
          </div>

          <h2 style={{ fontSize: 'clamp(1.7rem, 4vw, 2.3rem)', fontWeight: 900, color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
            Our Officers &amp; Leaders
          </h2>

          <p style={{ fontSize: '0.88rem', color: '#64748b', maxWidth: '580px', margin: '0 auto 24px auto', lineHeight: 1.55 }}>
            Dedicated student leaders and faculty advisers steering the Cateel Extension Campus toward academic and professional excellence.
          </p>

          {officersLoading ? (
            <div style={{ textAlign: 'center', padding: '36px', color: '#64748b', fontWeight: 700 }}>
              Loading officers roster...
            </div>
          ) : officers.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '36px 18px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                color: '#64748b',
                maxWidth: '500px',
                margin: '0 auto',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '6px' }}>👤</div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 900, color: '#0f172a' }}>
                No Officers Published Yet
              </h4>
              <p style={{ margin: 0, fontSize: '0.8rem' }}>
                Campus student leaders and advisers will be showcased here once updated by the administration.
              </p>
            </div>
          ) : (
            <div className="officers-grid">
              {officers.map((off) => (
                <div key={off.id} className="officer-card">
                  {/* Photo with subtle border */}
                  <div
                    style={{
                      width: '105px',
                      height: '105px',
                      borderRadius: '20px',
                      backgroundColor: '#f1f5f9',
                      border: '2px solid #e2e8f0',
                      overflow: 'hidden',
                      margin: '0 auto 14px auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {off.avatar_url ? (
                      <img
                        src={off.avatar_url}
                        alt={off.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '2.5rem' }}>👤</span>
                    )}
                  </div>

                  {/* Position Pill Badge */}
                  <div style={{ marginBottom: '8px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 12px',
                        borderRadius: '9999px',
                        fontSize: '0.66rem',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        backgroundColor: '#eff6ff',
                        color: '#1d4ed8',
                        border: '1px solid #bfdbfe',
                      }}
                    >
                      {off.position}
                    </span>
                  </div>

                  {/* Full Name */}
                  <h3
                    style={{
                      margin: '0 0 4px 0',
                      fontSize: '0.98rem',
                      fontWeight: 900,
                      color: '#0f172a',
                      lineHeight: 1.3,
                    }}
                  >
                    {off.name}
                  </h3>

                  {/* Department / Council */}
                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, marginBottom: '6px' }}>
                    {off.department}
                  </div>

                  {/* Term / A.Y. */}
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 800 }}>
                    A.Y. {off.term || '2026 - 2027'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: '#ffffff',
          color: '#64748b',
          borderTop: '1px solid #e2e8f0',
          padding: '20px 16px',
          marginTop: '60px',
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
            gap: '14px',
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
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
              gap: '16px',
              flexWrap: 'wrap',
              fontSize: '0.72rem',
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
                padding: '3px 10px',
                borderRadius: '9999px',
                fontSize: '0.68rem',
                fontWeight: 900,
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
