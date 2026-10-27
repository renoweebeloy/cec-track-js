import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Home.module.css';

export default function Home() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  // Course counts mula sa database
  const [counts, setCounts] = useState({
    BSBA: 0,
    BSCRIM: 0,
    BSA: 0,
    BEED: 0,
    BSAM: 0,
    total: 0,
  });

  // Events mula sa database
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  // Officers & Leaders mula sa database
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

  // Pagkuha ng datos mula sa Supabase
  const fetchData = async () => {
    if (!supabase) return;
    try {
      // 1. Fetch Students
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('course, role, status');

      if (profilesData) {
        const studentMembers = profilesData.filter(
          (p) => p.role !== 'admin' && p.role !== 'staff'
        );

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
        /* STATIC LOGO NA PINALAKI */
        .hero-logo-img {
          width: 175px;
          height: 175px;
          object-fit: contain;
          display: block;
          margin: 0 auto;
          border-radius: 50%;
          filter: drop-shadow(0 10px 24px rgba(21, 128, 61, 0.16));
        }

        /* LIVE CLOCK DOT GLOW */
        @keyframes liveDotGlow {
          0% {
            transform: scale(0.92);
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.75);
          }
          65% {
            transform: scale(1.08);
            box-shadow: 0 0 0 7px rgba(34, 197, 94, 0);
          }
          100% {
            transform: scale(0.92);
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
          }
        }

        .live-dot-pulse {
          width: 8px;
          height: 8px;
          background-color: #16a34a;
          border-radius: 50%;
          display: inline-block;
          margin-right: 6px;
          animation: liveDotGlow 1.8s infinite cubic-bezier(0.4, 0, 0.6, 1);
          flex-shrink: 0;
        }

        /* RESPONSIVE HERO DESCRIPTION (PANTAY SA CP AT DESKTOP) */
        .hero-tagline-container {
          max-width: 520px;
          width: 95%;
          margin: 0 auto 24px auto;
          text-align: center;
          padding: 0 4px;
          box-sizing: border-box;
        }

        .hero-tagline-line {
          display: block;
          color: #64748b;
          font-size: 0.94rem;
          font-weight: 500;
          line-height: 1.55;
          text-wrap: balance;
        }

        /* SEARCH CONTAINER & BUTTONS */
        .search-container {
          background-color: #ffffff;
          border: 1.5px solid #cbd5e1;
          border-radius: 9999px;
          padding: 6px 8px 6px 18px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.05);
          width: 100%;
          box-sizing: border-box;
          transition: all 0.25s ease;
        }

        .search-container:focus-within {
          border-color: #15803d;
          box-shadow: 0 8px 24px rgba(21, 128, 61, 0.15);
        }

        .search-btn-green {
          background-color: #15803d;
          color: #ffffff;
          border: none;
          border-radius: 9999px;
          padding: 10px 22px;
          font-size: 0.88rem;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 4px 12px rgba(21, 128, 61, 0.25);
          white-space: nowrap;
          flex-shrink: 0;
          transition: background-color 0.2s, transform 0.15s;
        }

        .search-btn-green:hover {
          background-color: #166534;
          transform: translateY(-1px);
        }

        .verified-card {
          background-color: #f0fdf4;
          border: 1.5px solid #a7f3d0;
          border-radius: 24px;
          padding: 22px 20px;
          position: relative;
          box-shadow: 0 12px 30px rgba(21, 128, 61, 0.08);
          display: flex;
          align-items: flex-start;
          gap: 16px;
          box-sizing: border-box;
          text-align: left;
          width: 100%;
        }

        /* OFFICERS GRID */
        .officers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 22px;
          margin-top: 26px;
        }

        .officer-card {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          padding: 24px 18px;
          text-align: center;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
        }

        .officer-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 28px rgba(21, 128, 61, 0.1);
          border-color: #86efac;
        }

        @media (max-width: 600px) {
          .hero-logo-img {
            width: 140px;
            height: 140px;
          }
          .hero-tagline-line {
            font-size: 0.82rem;
            line-height: 1.45;
          }
          .search-container {
            padding: 5px 6px 5px 12px;
            gap: 6px;
          }
          .search-btn-green {
            padding: 8px 14px;
            font-size: 0.78rem;
          }
          .verified-card {
            padding: 16px 14px;
            gap: 12px;
            border-radius: 18px;
          }
          .officers-grid {
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 14px;
          }
          .officer-card {
            padding: 16px 12px;
            border-radius: 20px;
          }
        }
      `}</style>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent} style={{ maxWidth: '1120px', justifyContent: 'space-between' }}>
          <button onClick={() => router.push('/')} className={styles.logoText} style={{ fontSize: '1.3rem' }}>
            CECTRACK
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => router.push('/about')}
              style={{
                background: 'none',
                border: 'none',
                color: '#334155',
                fontSize: '0.92rem',
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
              style={{
                padding: '9px 20px',
                fontSize: '0.88rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '12px',
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
              <span>Login</span>
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main} style={{ maxWidth: '1120px', margin: '0 auto', width: '100%' }}>
        {/* Status Badge Row */}
        <div
          style={{
            width: '100%',
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
              gap: '8px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '9999px',
              padding: '7px 16px',
              fontSize: '0.74rem',
              fontWeight: 800,
              color: '#334155',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
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
            <span>📅 {currentDate || 'Oct 28, 2026'}</span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ffffff',
              border: '1px solid #bbf7d0',
              borderRadius: '9999px',
              padding: '7px 16px',
              fontSize: '0.74rem',
              fontWeight: 800,
              color: '#15803d',
              boxShadow: '0 2px 6px rgba(21, 128, 61, 0.05)',
              whiteSpace: 'nowrap',
            }}
          >
            Official CEC Portal
          </div>
        </div>

        {/* Hero Area */}
        <section className={styles.heroSection} style={{ padding: '16px 0 24px 0' }}>
          <div style={{ marginBottom: '18px' }}>
            <img
              src="/logo.png"
              alt="Cateel Extension Campus Logo"
              className="hero-logo-img"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          <div className={styles.tagBadge} style={{ fontSize: '0.74rem', padding: '5px 14px', letterSpacing: '0.08em' }}>
            EMPOWERING FUTURE LEADERS
          </div>

          <h1
            className={styles.heroTitle}
            style={{
              fontSize: 'clamp(2.5rem, 6.5vw, 3.8rem)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              marginBottom: '2px',
              color: '#0f172a',
            }}
          >
            CEC
          </h1>

          <h2
            className={styles.heroSubtitle}
            style={{
              fontSize: 'clamp(1.2rem, 3.2vw, 1.6rem)',
              fontWeight: 800,
              color: '#15803d',
              marginBottom: '10px',
            }}
          >
            Cateel Extension Campus
          </h2>

          {/* PINAGANDANG LINE LAYOUT SA CELLPHONE (HINDI NA PUTOL-PUTOL) */}
          <div className="hero-tagline-container">
            <span className="hero-tagline-line">
              Uniting students across CEC Dorsu disciplines.
            </span>
            <span className="hero-tagline-line" style={{ marginTop: '2px' }}>
              Innovate, collaborate, and excel together.
            </span>
          </div>
        </section>

        {/* Search Bar & Verification Record */}
        <section className={styles.actionArea} style={{ maxWidth: '640px', margin: '0 auto 36px auto', width: '100%', padding: '0 12px', boxSizing: 'border-box' }}>
          <form onSubmit={handleCheckRecord} className="search-container">
            <div style={{ display: 'flex', alignItems: 'center', color: '#15803d', flexShrink: 0, paddingLeft: '2px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="3" />
                <line x1="7" y1="8" x2="11" y2="8" />
                <line x1="7" y1="12" x2="11" y2="12" />
                <rect x="14" y="8" width="4" height="4" />
              </svg>
            </div>

            <input
              type="text"
              placeholder="Search Student ID (e.g. 2024-0516)..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '0.95rem',
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
                  fontSize: '1rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  padding: '4px',
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
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>{searchLoading ? 'Checking...' : 'Check Record'}</span>
            </button>
          </form>

          {/* Search Result Card */}
          {searchResult && (
            <div style={{ marginTop: '18px', width: '100%', boxSizing: 'border-box' }}>
              {searchResult.success && searchResult.student ? (
                <div className="verified-card">
                  <button
                    onClick={() => setSearchResult(null)}
                    style={{
                      position: 'absolute',
                      top: '14px',
                      right: '14px',
                      background: 'none',
                      border: 'none',
                      color: '#059669',
                      fontSize: '1.1rem',
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
                      width: '46px',
                      height: '46px',
                      borderRadius: '14px',
                      backgroundColor: '#00a86b',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 6px 14px rgba(0, 168, 107, 0.22)',
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="9 12 11.5 14.5 15.5 9.5" />
                    </svg>
                  </div>

                  <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: '#dcfce7',
                          color: '#047857',
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontSize: '0.68rem',
                          fontWeight: 900,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          <path d="m9 12 2 2 4-4" />
                        </svg>
                        RECORDED &amp; VERIFIED
                      </span>
                    </div>

                    <h3
                      className="title-text"
                      style={{
                        margin: '0 0 6px 0',
                        fontSize: '1.18rem',
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
                        margin: '0 0 14px 0',
                        fontSize: '0.85rem',
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

                    {/* Stats Table */}
                    <div
                      className="stats-grid"
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #bbf7d0',
                        borderRadius: '16px',
                        padding: '12px 16px',
                        marginBottom: '14px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '8px',
                        textAlign: 'center',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>TOTAL EVENTS</span>
                        <div className="stat-value" style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
                          {searchResult.stats.totalEvents}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>ATTENDED</span>
                        <div className="stat-value" style={{ fontSize: '1.35rem', fontWeight: 900, color: '#059669', marginTop: '2px' }}>
                          {searchResult.stats.attended}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>ABSENCES</span>
                        <div className="stat-value" style={{ fontSize: '1.35rem', fontWeight: 900, color: searchResult.stats.absences > 0 ? '#dc2626' : '#059669', marginTop: '2px' }}>
                          {searchResult.stats.absences}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => router.push('/login')}
                        style={{
                          backgroundColor: '#00875a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '10px 20px',
                          fontSize: '0.86rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          boxShadow: '0 4px 12px rgba(0, 135, 90, 0.22)',
                        }}
                      >
                        <svg
                          width="17"
                          height="17"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
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
                          fontSize: '0.82rem',
                          fontWeight: 800,
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
                <div
                  style={{
                    backgroundColor: '#fff1f2',
                    border: '1.5px solid #fecdd3',
                    borderRadius: '18px',
                    padding: '16px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        backgroundColor: '#fee2e2',
                        color: '#be123c',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.05rem',
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

          {/* Quick Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px', width: '100%', flexWrap: 'wrap' }}>
            <button
              onClick={() => router.push('/login')}
              className={styles.portalBtn}
              style={{
                padding: '12px 22px',
                fontSize: '0.88rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                borderRadius: '14px',
              }}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
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
              style={{ padding: '12px 22px', fontSize: '0.88rem', borderRadius: '14px' }}
            >
              Explore Events ➔
            </button>
          </div>
        </section>

        {/* Live Course Analytics Grid */}
        <section className={styles.analyticsSection} style={{ maxWidth: '1080px', margin: '0 auto' }}>
          <div className={styles.analyticsHeader}>
            <div className={styles.analyticsTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg
                width="24"
                height="24"
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

          <div className={styles.courseGrid} style={{ gap: '18px' }}>
            {/* BSBA */}
            <div className={styles.courseCard} style={{ minHeight: '155px', padding: '18px' }}>
              <div className={styles.cardTop}>
                <span className={`${styles.badge} ${styles.bsbaBadge}`} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>BSBA</span>
              </div>
              <div>
                <div className={styles.countValue} style={{ fontSize: '1.9rem' }}>{counts.BSBA}</div>
                <div className={styles.courseName} style={{ fontSize: '0.86rem' }}>Business Administration</div>
              </div>
              <div className={styles.cardBottom}>
                <span>Enrolled Active</span>
                <span className={styles.idReadyValue}>ID Ready {counts.BSBA}</span>
              </div>
            </div>

            {/* BSCRIM */}
            <div className={styles.courseCard} style={{ minHeight: '155px', padding: '18px' }}>
              <div className={styles.cardTop}>
                <span className={`${styles.badge} ${styles.bscrimBadge}`} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>BSCRIM</span>
              </div>
              <div>
                <div className={styles.countValue} style={{ fontSize: '1.9rem' }}>{counts.BSCRIM}</div>
                <div className={styles.courseName} style={{ fontSize: '0.86rem' }}>Criminology</div>
              </div>
              <div className={styles.cardBottom}>
                <span>Enrolled Active</span>
                <span className={styles.idReadyValue}>ID Ready {counts.BSCRIM}</span>
              </div>
            </div>

            {/* BSA */}
            <div className={styles.courseCard} style={{ minHeight: '155px', padding: '18px' }}>
              <div className={styles.cardTop}>
                <span className={`${styles.badge} ${styles.bsaBadge}`} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>BSA</span>
              </div>
              <div>
                <div className={styles.countValue} style={{ fontSize: '1.9rem' }}>{counts.BSA}</div>
                <div className={styles.courseName} style={{ fontSize: '0.86rem' }}>Accountancy</div>
              </div>
              <div className={styles.cardBottom}>
                <span>Enrolled Active</span>
                <span className={styles.idReadyValue}>ID Ready {counts.BSA}</span>
              </div>
            </div>

            {/* BEED */}
            <div className={styles.courseCard} style={{ minHeight: '155px', padding: '18px' }}>
              <div className={styles.cardTop}>
                <span className={`${styles.badge} ${styles.beedBadge}`} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>BEED</span>
              </div>
              <div>
                <div className={styles.countValue} style={{ fontSize: '1.9rem' }}>{counts.BEED}</div>
                <div className={styles.courseName} style={{ fontSize: '0.86rem' }}>Elementary Education</div>
              </div>
              <div className={styles.cardBottom}>
                <span>Enrolled Active</span>
                <span className={styles.idReadyValue}>ID Ready {counts.BEED}</span>
              </div>
            </div>

            {/* BSAM */}
            <div className={styles.courseCard} style={{ minHeight: '155px', padding: '18px' }}>
              <div className={styles.cardTop}>
                <span className={`${styles.badge} ${styles.bsamBadge}`} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>BSAM</span>
              </div>
              <div>
                <div className={styles.countValue} style={{ fontSize: '1.9rem' }}>{counts.BSAM}</div>
                <div className={styles.courseName} style={{ fontSize: '0.86rem' }}>Agribusiness Management</div>
              </div>
              <div className={styles.cardBottom}>
                <span>Enrolled Active</span>
                <span className={styles.idReadyValue}>ID Ready {counts.BSAM}</span>
              </div>
            </div>
          </div>
        </section>

        {/* UPCOMING & OFFICIAL CAMPUS EVENTS */}
        <section className={styles.analyticsSection} id="events-section" style={{ maxWidth: '1080px', margin: '42px auto 0 auto' }}>
          <div className={styles.analyticsHeader}>
            <div className={styles.analyticsTitle} style={{ fontSize: '1.05rem' }}>
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
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontWeight: 700 }}>
              Loading official events...
            </div>
          ) : events.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '22px',
                color: '#64748b',
              }}
            >
              <div style={{ fontSize: '2.4rem', marginBottom: '8px' }}>📅</div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
                No Published Events Yet
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                Check back soon for upcoming assemblies and college activities published by administrators.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '22px' }}>
              {events.map((ev) => {
                const isActive = ev.status === 'active';
                return (
                  <div
                    key={ev.id}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '22px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'transform 0.2s',
                    }}
                  >
                    {ev.image_url ? (
                      <div style={{ width: '100%', height: '170px', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
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
                          height: '95px',
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

                    <div style={{ padding: '18px 20px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span
                            className={styles.idBadge}
                            style={{
                              backgroundColor: isActive ? '#dcfce7' : '#f1f5f9',
                              color: isActive ? '#15803d' : '#64748b',
                              fontSize: '0.68rem',
                              padding: '3px 10px',
                            }}
                          >
                            {isActive ? '● ACTIVE (OPEN)' : 'CLOSED'}
                          </span>
                          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94a3b8' }}>
                            {ev.date}
                          </span>
                        </div>

                        <h3 style={{ margin: '0 0 6px 0', fontSize: '1.18rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.3 }}>
                          {ev.title}
                        </h3>

                        {ev.location && (
                          <div style={{ fontSize: '0.82rem', color: '#15803d', fontWeight: 800, marginBottom: '8px' }}>
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
                            padding: '11px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            color: '#15803d',
                            fontSize: '0.82rem',
                            fontWeight: 900,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
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

        {/* LEADERSHIP & FACULTY SECTION */}
        <section className={styles.analyticsSection} style={{ maxWidth: '1080px', margin: '54px auto 0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '9999px', padding: '6px 16px', marginBottom: '12px' }}>
            <svg
              width="16"
              height="16"
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
            <span style={{ fontSize: '0.74rem', fontWeight: 900, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              LEADERSHIP &amp; FACULTY
            </span>
          </div>

          <h2 style={{ fontSize: 'clamp(1.8rem, 4.5vw, 2.5rem)', fontWeight: 900, color: '#0f172a', margin: '0 0 10px 0', letterSpacing: '-0.02em' }}>
            Our Officers &amp; Leaders
          </h2>

          <p style={{ fontSize: '0.92rem', color: '#64748b', maxWidth: '640px', margin: '0 auto 28px auto', lineHeight: 1.6 }}>
            Dedicated student leaders and faculty advisers steering the Cateel Extension Campus toward academic and professional excellence.
          </p>

          {officersLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontWeight: 700 }}>
              Loading officers roster...
            </div>
          ) : officers.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '22px',
                color: '#64748b',
                maxWidth: '540px',
                margin: '0 auto',
              }}
            >
              <div style={{ fontSize: '2.2rem', marginBottom: '6px' }}>👤</div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>
                No Officers Published Yet
              </h4>
              <p style={{ margin: 0, fontSize: '0.82rem' }}>
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
                      width: '115px',
                      height: '115px',
                      borderRadius: '24px',
                      backgroundColor: '#f1f5f9',
                      border: '2px solid #e2e8f0',
                      overflow: 'hidden',
                      margin: '0 auto 16px auto',
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
                      <span style={{ fontSize: '2.8rem' }}>👤</span>
                    )}
                  </div>

                  {/* Position Pill Badge */}
                  <div style={{ marginBottom: '10px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 14px',
                        borderRadius: '9999px',
                        fontSize: '0.7rem',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        backgroundColor: '#f0fdf4',
                        color: '#15803d',
                        border: '1px solid #bbf7d0',
                      }}
                    >
                      {off.position}
                    </span>
                  </div>

                  {/* Full Name */}
                  <h3
                    style={{
                      margin: '0 0 6px 0',
                      fontSize: '1.05rem',
                      fontWeight: 900,
                      color: '#0f172a',
                      lineHeight: 1.3,
                    }}
                  >
                    {off.name}
                  </h3>

                  {/* Department / Council */}
                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, marginBottom: '8px' }}>
                    {off.department}
                  </div>

                  {/* Term / A.Y. */}
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800 }}>
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
          padding: '24px 20px',
          marginTop: '70px',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            maxWidth: '1120px',
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
              fontSize: '0.78rem',
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
