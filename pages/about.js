import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import styles from '../styles/Home.module.css';

export default function About() {
  const router = useRouter();

  // Opisyal nga litrato gikan sa public folder
  const developerPhotoUrl = '/beloy.jpg';

  return (
    <div className={styles.container} style={{ paddingBottom: 0, backgroundColor: '#f8fafc' }}>
      <Head>
        <title>About • CECTRACK (Cateel Extension Campus)</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      {/* Navigation Header */}
      <header className={styles.header}>
        <div className={styles.headerContent} style={{ justifyContent: 'space-between' }}>
          <button onClick={() => router.push('/')} className={styles.logoText}>
            CECTRACK
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                background: 'none',
                border: 'none',
                color: '#475569',
                fontSize: '0.88rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Home
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

      <main style={{ maxWidth: '980px', margin: '0 auto', padding: '40px 18px 80px 18px' }}>
        {/* Top Hero Section */}
        <section style={{ textAlign: 'center', marginBottom: '44px' }}>
          {/* GREEN ABOUT CECTRACK BADGE */}
          <div
            style={{
              display: 'inline-block',
              backgroundColor: '#f0fdf4',
              color: '#15803d',
              border: '1px solid #bbf7d0',
              padding: '6px 18px',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 900,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}
          >
             ABOUT CECTRACK
          </div>

          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.2rem)',
              fontWeight: 900,
              color: '#0f172a',
              letterSpacing: '-0.03em',
              margin: '0 0 16px 0',
              lineHeight: 1.15,
            }}
          >
            Transforming Student <br />
            Organization Operations
          </h1>

          <p
            style={{
              fontSize: '1rem',
              color: '#64748b',
              maxWidth: '680px',
              margin: '0 auto',
              lineHeight: 1.6,
              fontWeight: 500,
            }}
          >
            CECTRACK is an all-in-one centralized digital ecosystem engineered specifically for
            the students, officers, and faculty of <strong>Davao Oriental State University – Cateel Extension Campus (DOrSU-CEC)</strong>.
          </p>
        </section>

        {/* Section 1: What is CECTRACK? */}
        <section
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '26px',
            padding: '32px 28px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            marginBottom: '54px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                backgroundColor: '#f0fdf4',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                border: '1px solid #bbf7d0',
              }}
            >
              📑
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                What is CECTRACK?
              </h2>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                Institutional Governance &amp; Activity Operating Platform
              </span>
            </div>
          </div>

          <p style={{ fontSize: '0.92rem', color: '#475569', lineHeight: 1.65, margin: '0 0 14px 0' }}>
            <strong>CECTRACK</strong> is a purpose-built web and mobile platform designed to modernize campus administration. It eliminates slow paper sign-in sheets, misplaced tally forms, and disorganized spreadsheets by providing automated, tamper-proof digital attendance and student tracking.
          </p>
          <p style={{ fontSize: '0.92rem', color: '#475569', lineHeight: 1.65, margin: 0 }}>
            Equipped with camera QR scanners, live duplicate check-in prevention, and instant student profile verification, CECTRACK ensures total transparency, accuracy, and operational ease for both student leaders and faculty advisers.
          </p>
        </section>

        {/* Section 2: Who Uses CECTRACK? */}
        <section style={{ marginBottom: '60px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.9rem', fontWeight: 900, color: '#0f172a', margin: '0 0 8px 0' }}>
              Who Uses CECTRACK?
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
              Tailored workspaces engineered for every member of the academic community.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
            }}
          >
            {/* Card 1 */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  marginBottom: '14px',
                }}
              >
                👤
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', margin: '0 0 8px 0' }}>
                Students &amp; Organization Members
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                Access personalized digital ID badges, view attendance history, explore upcoming assemblies, and verify compliance records in real time.
              </p>
            </div>

            {/* Card 2 */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  backgroundColor: '#f0fdf4',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  marginBottom: '14px',
                }}
              >
                📷
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', margin: '0 0 8px 0' }}>
                Attendance Officers &amp; Scanners
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                High-speed event check-in using mobile camera scanning, photo verification, and automated duplicate check-in prevention.
              </p>
            </div>

            {/* Card 3 */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  backgroundColor: '#fefce8',
                  color: '#ca8a04',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  marginBottom: '14px',
                }}
              >
                💼
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', margin: '0 0 8px 0' }}>
                Department Heads &amp; Treasurers
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                Manage member rosters across BSCRIM, BSBA, BSA, BEED, and BSAM programs, and monitor general assembly participation rates.
              </p>
            </div>

            {/* Card 4 */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  backgroundColor: '#faf5ff',
                  color: '#9333ea',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  marginBottom: '14px',
                }}
              >
                🏛️
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', margin: '0 0 8px 0' }}>
                Executive Officers &amp; Advisers
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                Publish official events with custom banners, oversee student enrollment whitelists, and export verified attendance records.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 3: DEVELOPER PROFILE */}
        <section
          style={{
            background: 'linear-gradient(145deg, #064e3b 0%, #022c22 100%)',
            borderRadius: '28px',
            padding: '36px 30px',
            color: '#ffffff',
            boxShadow: '0 20px 40px rgba(6, 78, 59, 0.3)',
            border: '1px solid rgba(52, 211, 153, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '22px', flexWrap: 'wrap' }}>
            {/* Developer Picture */}
            <div
              style={{
                width: '110px',
                height: '110px',
                borderRadius: '24px',
                backgroundColor: '#065f46',
                border: '3px solid #34d399',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                flexShrink: 0,
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.35)',
              }}
            >
              <img
                src={developerPhotoUrl}
                alt="Renowee Beloy"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center 15%',
                }}
                onError={(e) => {
                  e.currentTarget.src = 'https://github.com/renoweebeloy.png';
                }}
              />
            </div>

            <div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 900,
                  color: '#fbbf24',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                DEVELOPED BY
              </span>
              <h2 style={{ fontSize: '1.85rem', fontWeight: 900, margin: '0 0 6px 0', letterSpacing: '-0.02em', color: '#ffffff' }}>
                Renowee Beloy
              </h2>
              {/* WITH FACULTY OF COMPUTING, ENGINEERING, AND TECHNOLOGY (FaCET) */}
              <p style={{ fontSize: '0.88rem', color: '#a7f3d0', margin: 0, fontWeight: 700, lineHeight: 1.45 }}>
                Lead Creator • BS Information Technology (BSIT)
                <br />
                Faculty of Computing, Engineering, and Technology (FaCET)
              </p>
            </div>
          </div>

          {/* Achievement & Location Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <span
              style={{
                backgroundColor: 'rgba(52, 211, 153, 0.15)',
                color: '#6ee7b7',
                border: '1px solid rgba(52, 211, 153, 0.35)',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 800,
              }}
            >
              Developer
            </span>

            <span
              style={{
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: '#7dd3fc',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 800,
              }}
            >
              💻 Full-Stack Web &amp; Database Systems
            </span>

            <span
              style={{
                backgroundColor: 'rgba(251, 191, 36, 0.15)',
                color: '#fde68a',
                border: '1px solid rgba(251, 191, 36, 0.35)',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 800,
              }}
            >
              📍 Davao Oriental State University Main Campus
            </span>
          </div>

          {/* Bio Description */}
          <p
            style={{
              fontSize: '0.88rem',
              color: '#d1fae5',
              lineHeight: 1.65,
              margin: 0,
              borderTop: '1px solid rgba(52, 211, 153, 0.2)',
              paddingTop: '18px',
            }}
          >
            CECTRACK was conceptualized and developed by <strong>Renowee Beloy</strong> from the <strong>Faculty of Computing, Engineering, and Technology (FaCET)</strong> as a specialized institutional software initiative for Davao Oriental State University. Engineered to resolve manual attendance bottlenecks, it replaces tedious paper logs with reliable digital identification, camera-based QR scanning, and automated attendance reporting.
          </p>
        </section>
      </main>

      {/* Clean White Footer */}
      <footer
        style={{
          backgroundColor: '#ffffff',
          color: '#64748b',
          borderTop: '1px solid #e2e8f0',
          padding: '24px 20px',
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
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.04em' }}>
            © 2026 CEC TRACK. ALL RIGHTS RESERVED.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap', fontSize: '0.75rem', fontWeight: 800 }}>
            <span onClick={() => router.push('/about')} style={{ cursor: 'pointer', color: '#15803d', fontWeight: 900 }}>
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
