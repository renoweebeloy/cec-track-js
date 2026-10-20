import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import styles from '../styles/Home.module.css'; 

export default function Home() {
  const [currentTime, setCurrentTime] = useState('Loading...');
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Manila' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>CECTRACK</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      <header className={styles.header}>
        <div className={styles.headerContent}>
          <button onClick={() => router.push('/')} className={styles.logoText}>
            CECTRACK
          </button>

          {/* Hamburger Menu Icon para sa Mobile */}
          <button 
            className={styles.hamburgerBtn} 
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            ☰
          </button>

          {/* Navigation Links (Gikuha ang Events, About ug Login nalang nabilin) */}
          <div className={`${styles.navLinks} ${menuOpen ? styles.navLinksMobileOpen : ''}`}>
            <button className={styles.navItem}>About</button>
            <button onClick={() => router.push('/login')} className={styles.loginBtn}>
              <span>➔</span> Login
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* Status Row Badges */}
        <div className={styles.statusRow}>
          <div className={styles.statusBadgeLeft}>
            <span><span className={styles.liveDot}></span> LIVE PHT</span>
            <span>|</span>
            <span>🕒 {currentTime}</span>
            <span>|</span>
            <span>📅 Tuesday, Oct 20, 2026</span>
          </div>
          <div className={styles.statusBadgeRight}>
            🛡️ Official CEC Portal
          </div>
        </div>

        {/* Hero Section */}
        <section className={styles.heroSection}>
          <div className={styles.logoContainer}>
            <img 
              src="/logo.png" 
              alt="Cateel Extension Campus Logo" 
              className={styles.mainLogo}
            />
          </div>
          
          <div className={styles.tagBadge}>✨ EMPOWERING FUTURE LEADERS</div>
          <h1 className={styles.heroTitle}>CEC</h1>
          <h2 className={styles.heroSubtitle}>Cateel Extension Campus</h2>
          <p className={styles.heroDescription}>
            Uniting students across CEC Dorsu disciplines.<br />
            Innovate, collaborate, and excel together.
          </p>
        </section>

        {/* Search & Actions */}
        <section className={styles.actionArea}>
          <div className={styles.searchBox}>
            <input type="text" placeholder="Search Student ID (e.g. 2024-00123)..." className={styles.searchInput} />
            <button className={styles.checkBtn}>🔍 Check Record</button>
          </div>
          <div className={styles.buttonRow}>
            <button onClick={() => router.push('/login')} className={styles.portalBtn}>
              ➔ Access Member Portal
            </button>
            <button className={styles.eventsBtn}>Explore Events ➔</button>
          </div>
        </section>

        {/* Course Analytics */}
        <section className={styles.analyticsSection}>
          <div className={styles.analyticsHeader}>
            <div className={styles.analyticsTitle}>👥 DEPARTMENT MEMBERS BY COURSE</div>
            <div className={styles.analyticsStats}>
              <span>Total Members: <strong>0</strong></span>
              <span>•</span>
              <span className={styles.idBadge}>Digital IDs: <strong>0 (0%)</strong></span>
            </div>
          </div>

          <div className={styles.courseGrid}>
            <div className={styles.courseCard}>
              <div className={styles.cardTop}>
                <span className={`${styles.badge} ${styles.bsbaBadge}`}>BSBA</span>
                <span>💼</span>
              </div>
              <div>
                <div className={styles.countValue}>0</div>
                <div className={styles.courseName}>Business Administration</div>
              </div>
              <div className={styles.cardBottom}>
                <span>Enrolled Active</span>
                <span className={styles.idReadyValue}>ID Ready 0</span>
              </div>
            </div>

            <div className={styles.courseCard}>
              <div className={styles.cardTop}>
                <span className={`${styles.badge} ${styles.bscrimBadge}`}>BSCRIM</span>
                <span>🛡️</span>
              </div>
              <div>
                <div className={styles.countValue}>0</div>
                <div className={styles.courseName}>Criminology</div>
              </div>
              <div className={styles.cardBottom}>
                <span>Enrolled Active</span>
                <span className={styles.idReadyValue}>ID Ready 0</span>
              </div>
            </div>

            <div className={styles.courseCard}>
              <div className={styles.cardTop}>
                <span className={`${styles.badge} ${styles.bsaBadge}`}>BSA</span>
                <span>🏛️</span>
              </div>
              <div>
                <div className={styles.countValue}>0</div>
                <div className={styles.courseName}>Accountancy</div>
              </div>
              <div className={styles.cardBottom}>
                <span>Enrolled Active</span>
                <span className={styles.idReadyValue}>ID Ready 0</span>
              </div>
            </div>

            <div className={styles.courseCard}>
              <div className={styles.cardTop}>
                <span className={`${styles.badge} ${styles.beedBadge}`}>BEED</span>
                <span>🎓</span>
              </div>
              <div>
                <div className={styles.countValue}>0</div>
                <div className={styles.courseName}>Elementary Education</div>
              </div>
              <div className={styles.cardBottom}>
                <span>Enrolled Active</span>
                <span className={styles.idReadyValue}>ID Ready 0</span>
              </div>
            </div>

            <div className={styles.courseCard}>
              <div className={styles.cardTop}>
                <span className={`${styles.badge} ${styles.bsamBadge}`}>BSAM</span>
                <span>🌾</span>
              </div>
              <div>
                <div className={styles.countValue}>0</div>
                <div className={styles.courseName}>Agribusiness Management</div>
              </div>
              <div className={styles.cardBottom}>
                <span>Enrolled Active</span>
                <span className={styles.idReadyValue}>ID Ready 0</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
