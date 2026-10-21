import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Home.module.css';

export default function Home() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  // Dynamic Course Counts galing sa Database
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

  // Kumuha ng Live Student Counts mula sa Supabase
  const fetchAnalytics = async () => {
    if (!supabase) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('course, role, status');

      if (data) {
        // Mga estudyante lamang (hindi kasama ang staff o admin)
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

  return (
    <div className={styles.container}>
      <Head>
        <title>CECTRACK • Cateel Extension Campus</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      {/* Header: Tinanggal ang About, Events, Members — Malinis na Logo at Login Button */}
      <header className={styles.header}>
        <div className={styles.headerContent} style={{ justifyContent: 'space-between' }}>
          <button onClick={() => router.push('/')} className={styles.logoText}>
            CECTRACK
          </button>

          {/* Direktang Login Button (Swak sa Mobile at Desktop) */}
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
        {/* Status Row: Pinaliit ang font at nilagyan ng tamang espasyo para sa CP screen */}
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
          {/* Live Clock Badge */}
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

          {/* Official Portal Badge na may kaunting space */}
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
            <button onClick={() => router.push('/login')} className={styles.eventsBtn}>
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
      </main>

      {/* Result Modal kapag nag-check ng Student ID */}
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
