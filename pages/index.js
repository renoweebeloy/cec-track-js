import React, { useState, useEffect } from 'react';
import Head from 'next/head';
// KINI ANG IMPORT NGA MAG-CONNECT SA IMONG CSS
import styles from '../styles/Home.module.css'; 

export default function Home() {
  const [currentView, setCurrentView] = useState('home');
  const [currentTime, setCurrentTime] = useState('Loading...');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Manila' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>ACETRACK 3.0</title>
      </Head>

      <header className={styles.header}>
        <div className={styles.headerContent}>
          <button onClick={() => setCurrentView('home')} className={styles.logoText}>
            ACETRACK 3.0
          </button>
          <div className={styles.navLinks}>
            <button className={styles.navItem}>About</button>
            <button className={styles.navItem}>Events</button>
            <button className={styles.navItem}>Members</button>
            <button onClick={() => setCurrentView('login')} className={styles.loginBtn}>
              <span>➔</span> Login
            </button>
          </div>
        </div>
      </header>

      {currentView === 'home' && (
        <main className={styles.main}>
          <div className={styles.statusRow}>
            <div className={styles.statusBadgeLeft}>
              <span><span className={styles.liveDot}></span> LIVE PHT</span>
              <span>|</span>
              <span>🕒 {currentTime}</span>
              <span>|</span>
              <span>📅 Tuesday, October 20, 2026</span>
            </div>
            <div className={styles.statusBadgeRight}>
              🛡️ Official ACES Portal
            </div>
          </div>

          <section className={styles.heroSection}>
            <div className={styles.logoContainer}>
              <svg width="220" height="220" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="48" fill="#FFFFFF" stroke="#000000" strokeWidth="4" />
                <path d="M 50 2 L 50 98 M 2 50 L 98 50" stroke="#000000" strokeWidth="2" />
                <rect x="8" y="8" width="42" height="42" fill="#EA580C" />
                <rect x="50" y="50" width="42" height="42" fill="#EA580C" />
                <rect x="50" y="8" width="42" height="42" fill="#000000" />
                <rect x="8" y="50" width="42" height="42" fill="#000000" />
                <circle cx="50" cy="50" r="22" fill="#FFFFFF" stroke="#000000" strokeWidth="2" />
                <path id="circlePath" d="M 16 50 A 34 34 0 1 1 84 50 A 34 34 0 1 1 16 50" fill="none" />
                <text fontSize="6" fontWeight="900" fill="#000000">
                  <textPath href="#circlePath" startOffset="50%" textAnchor="middle">
                    ASSOCIATION OF COMPUTING AND ENGINEERING STUDENTS
                  </textPath>
                </text>
              </svg>
            </div>
            <div className={styles.tagBadge}>✨ EMPOWERING FUTURE LEADERS</div>
            <h1 className={styles.heroTitle}>ACES</h1>
            <h2 className={styles.heroSubtitle}>Association of Computing and Engineering Students</h2>
            <p className={styles.heroDescription}>
              Uniting students across computing, engineering, and technology disciplines.<br />
              Innovate, collaborate, and excel together.
            </p>
          </section>

          <section className={styles.actionArea}>
            <div className={styles.searchBox}>
              <input type="text" placeholder="Search Student ID (e.g. 2024-00123)..." className={styles.searchInput} />
              <button className={styles.checkBtn}>🔍 Check Record</button>
            </div>
            <div className={styles.buttonRow}>
              <button className={styles.portalBtn}>➔ Access Member Portal</button>
              <button className={styles.eventsBtn}>Explore Events ➔</button>
            </div>
          </section>

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
      )}

      {currentView === 'login' && (
        <main className={styles.main}>
          <div style={{ textAlign: 'center', marginTop: '60px' }}>
            <h2>Portal Login</h2>
            <button onClick={() => setCurrentView('home')} style={{ marginTop: '20px' }}>
              ← Back to Home
            </button>
          </div>
        </main>
      )}
    </div>
  );
}
