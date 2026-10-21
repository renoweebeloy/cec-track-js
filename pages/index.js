import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Home.module.css';

export default function Home() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  // Dynamic Course Counts gikan sa Database
  const [counts, setCounts] = useState({
    BSBA: 0,
    BSCRIM: 0,
    BSA: 0,
    BEED: 0,
    BSAM: 0,
    total: 0,
  });

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
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      );
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Live Database Student Counts
  const fetchAnalytics = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('course, role, status');

      if (data) {
        // Estudyante lamang (dili apil ang staff o admin)
        const studentMembers = data.filter((p) => p.role !== 'admin' && p.role !== 'staff');

        setCounts({
          BSBA: studentMembers.filter((s) => s.course === 'BSBA').length,
          BSCRIM: studentMembers.filter((s) => s.course === 'BSCRIM').length,
          BSA: studentMembers.filter((s) => s.course === 'BSA').length,
          BEED: studentMembers.filter((s) => s.course === 'BEED').length,
          BSAM: studentMembers.filter((s) => s.course === 'BSAM').length,
          total: studentMembers.length,
        });
      }
    } catch (err) {
      console.error('Error fetching course analytics:', err);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Check Student ID Whitelist Record
  const handleCheckRecord = async (e) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setSearchLoading(true);
    try {
      const { data, error } = await supabase
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
          msg: `Student ID "${data.school_id}" is officially verified and whitelisted!`,
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
        msg: `Unable to verify "${searchId.trim()}". Please verify the ID format (e.g. 2024-0616).`,
      });
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setMenuOpen(false);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>CECTRACK • Cateel Extension Campus</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      {/* Header Navigation Bar */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <button onClick={() => router.push('/')} className={styles.logoText}>
            CECTRACK
          </button>

          {/* Mobile Hamburger Button */}
          <button
            className={styles.hamburgerBtn}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
          >
            ☰
          </button>

          {/* Navigation Links (Matches Screenshot: About, Events, Members, Login) */}
          <div className={`${styles.navLinks} ${menuOpen ? styles.navLinksMobileOpen : ''}`}>
            <button onClick={() => scrollToSection('about')} className={styles.navItem}>
              About
            </button>
            <button onClick={() => router.push('/login')} className={styles.navItem}>
              Events
            </button>
            <button onClick={() => scrollToSection('analytics')} className={styles.navItem}>
              Members
            </button>
            <button onClick={() => router.push('/login')} className={styles.loginBtn}>
              <span>➔</span> Login
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* Live Status Row Badges */}
        <div className={styles.statusRow}>
          <div className={styles.statusBadgeLeft}>
            <span><span className={styles.liveDot}></span> LIVE PHT</span>
            <span>|</span>
            <span>🕒 {currentTime || 'Loading...'}</span>
            <span>|</span>
            <span>📅 {currentDate || 'Tuesday, October 20, 2026'}</span>
          </div>
          <div className={styles.statusBadgeRight}>
            🛡️ Official CEC Portal
          </div>
        </div>

        {/* Hero Section */}
        <section className={styles.heroSection} id="about">
          {/* Logo Container with Balanced Dimensions */}
          <div className={styles.logoContainer} style={{ marginBottom: '18px' }}>
            <img
              src="/logo.png"
              alt="Cateel Extension Campus Logo"
              style={{
                width: '135px',
                height: '135px',
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
          <h1 className={styles.heroTitle} style={{ fontSize: '3.2rem', marginBottom: '4px' }}>
            CEC
          </h1>
          <h2 className={styles.heroSubtitle} style={{ fontSize: '1.25rem', marginBottom: '10px' }}>
            Cateel Extension Campus
          </h2>
          <p className={styles.heroDescription}>
            Uniting students across CEC Dorsu disciplines.<br />
            Innovate, collaborate, and excel together.
          </p>
        </section>

        {/* Search Student ID & Action Buttons */}
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
            <button onClick={() => router.push('/login')} className={styles.eventsBtn}>
              Explore Events ➔
            </button>
          </div>
        </section>

        {/* Department Members Analytics Grid (Real-time Supabase Data) */}
        <section className={styles.analyticsSection} id="analytics">
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
      </main>

      {/* Search Record Modal Notification */}
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
              maxWidth: '420px',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '16px',
                backgroundColor: searchModal.success ? '#dcfce7' : '#fee2e2',
                color: searchModal.success ? '#15803d' : '#b91c1c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                margin: '0 auto 12px auto',
              }}
            >
              {searchModal.success ? '✓' : '✕'}
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0' }}>
              {searchModal.success ? 'Record Verified' : 'Record Not Found'}
            </h3>

            <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              {searchModal.msg}
            </p>

            {searchModal.success && searchModal.data && (
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '14px',
                  marginBottom: '16px',
                  textAlign: 'left',
                  fontSize: '0.8rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
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
                  style={{ width: '100%', padding: '10px 14px', fontSize: '0.82rem' }}
                >
                  Proceed to Login ➔
                </button>
              )}
              <button
                onClick={() => setSearchModal({ open: false, success: false, data: null, msg: '' })}
                className={styles.eventsBtn}
                style={{ width: '100%', padding: '10px 14px', fontSize: '0.82rem' }}
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
