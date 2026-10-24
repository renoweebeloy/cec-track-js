import React from 'react';
import Head from 'next/head';

export default function Maintenance() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <Head>
        <title>Under Maintenance • CECTRACK</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '26px',
          border: '1px solid #e2e8f0',
          padding: '40px 28px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.04)',
        }}
      >
        {/* Maintenance Icon */}
        <div
          style={{
            width: '74px',
            height: '74px',
            borderRadius: '22px',
            backgroundColor: '#f0fdf4',
            border: '2px solid #bbf7d0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            fontSize: '2.2rem',
          }}
        >
          🛠️
        </div>

        {/* Status Badge */}
        <span
          style={{
            display: 'inline-block',
            backgroundColor: '#fef3c7',
            color: '#b45309',
            border: '1px solid #fde68a',
            padding: '4px 14px',
            borderRadius: '9999px',
            fontSize: '0.72rem',
            fontWeight: 900,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '14px',
          }}
        >
          SYSTEM UPGRADE IN PROGRESS
        </span>

        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 900,
            color: '#0f172a',
            margin: '0 0 10px 0',
            letterSpacing: '-0.02em',
          }}
        >
          Under Maintenance
        </h1>

        <p
          style={{
            fontSize: '0.88rem',
            color: '#64748b',
            lineHeight: 1.6,
            margin: '0 0 24px 0',
          }}
        >
          We are currently performing scheduled system maintenance and database optimization on <strong>CECTRACK</strong> to improve performance and enhance our campus services.
        </p>

        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '14px 16px',
            fontSize: '0.8rem',
            color: '#475569',
            lineHeight: 1.5,
          }}
        >
          ⏳ We will be back online shortly. Please check back soon. Thank you for your patience and understanding!
        </div>

        <div style={{ marginTop: '28px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            DOrSU - Cateel Extension Campus
          </span>
        </div>
      </div>
    </div>
  );
}
