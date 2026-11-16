import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

const P = {
  doc: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M8 13h8M8 17h5',
  user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  cam: 'M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 17a4 4 0 100-8 4 4 0 000 8z',
  brief: 'M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16',
  bank: 'M3 21h18M5 21V9M19 21V9M9 21V9M15 21V9M2 9l10-6 10 6',
  login: 'M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3',
};
const Ic = ({ d, s = 22 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d={P[d]} />
  </svg>
);

const USERS = [
  { i: 'user', c: '#16a34a', t: 'Students & Organization Members', d: 'Access personalized digital ID badges, view attendance history, explore upcoming assemblies, and verify compliance records in real time.' },
  { i: 'cam', c: '#0f766e', t: 'Attendance Officers & Scanners', d: 'High-speed event check-in using mobile camera scanning, photo verification, and automated duplicate check-in prevention.' },
  { i: 'brief', c: '#65a30d', t: 'Department Heads & Treasurers', d: 'Manage member rosters across BSCRIM, BSBA, BSA, BEED, and BSAM programs, and monitor general assembly participation rates.' },
  { i: 'bank', c: '#15803d', t: 'Executive Officers & Advisers', d: 'Publish official events with custom banners, oversee student enrollment whitelists, and export verified attendance records.' },
];

export default function About() {
  const router = useRouter();

  // Opisyal na litrato mula sa public folder
  const developerPhotoUrl = '/beloy.jpg';

  return (
    <div>
      <Head>
        <title>About • CECTRACK (Cateel Extension Campus)</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Figtree:wght@500;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        :root{--g9:#04261a;--g8:#064e3b;--g7:#047857;--g6:#059669;--g5:#10b981;--g2:#a7f3d0;--g1:#d1fae5;--g0:#ecfdf5;--ink:#0b2a1e;--mut:#56705f;--line:#d6ebdf}
        *{box-sizing:border-box}
        body{margin:0;font-family:'Figtree',system-ui,sans-serif;background:#f3faf5;color:var(--ink);overflow-x:hidden}
        button{font-family:inherit;cursor:pointer}
        h1,h2,h3{font-family:'Bricolage Grotesque','Figtree',sans-serif}
        :focus-visible{outline:3px solid var(--g5);outline-offset:2px}

        .ab-hd{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.85);backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}
        .ab-hd-in{max-width:1180px;margin:auto;padding:10px 18px;display:flex;align-items:center;justify-content:space-between}
        .ab-brand{display:flex;align-items:center;gap:10px;background:none;border:0;font:800 1.2rem 'Bricolage Grotesque',sans-serif;color:var(--g8);letter-spacing:-.02em}
        .ab-brand img{width:34px;height:34px;object-fit:contain}
        .ab-nav{display:flex;align-items:center;gap:6px}
        .ab-lnk{background:none;border:0;font-weight:700;font-size:.9rem;color:#2f4d3e;padding:8px 14px;border-radius:999px}
        .ab-lnk:hover{background:var(--g0)}
        .ab-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:0;border-radius:999px;font-weight:800;font-size:.88rem;padding:11px 20px;background:linear-gradient(135deg,var(--g5),var(--g7));color:#fff;box-shadow:0 8px 20px rgba(5,150,105,.32);transition:transform .2s,box-shadow .2s}
        .ab-btn:hover{transform:translateY(-2px);box-shadow:0 12px 26px rgba(5,150,105,.4)}

        .ab-hero{text-align:center;padding:56px 18px 64px;position:relative;overflow:hidden;
          background:radial-gradient(700px 340px at 8% -10%,rgba(16,185,129,.22),transparent 60%),radial-gradient(600px 320px at 100% 0,rgba(163,230,53,.18),transparent 60%),#fff;border-bottom:1px solid var(--line)}
        .ab-hero::after{content:'';position:absolute;inset:0;background-image:radial-gradient(rgba(5,150,105,.09) 1px,transparent 1px);background-size:22px 22px;pointer-events:none}
        .ab-hero>*{position:relative;z-index:1}
        .ab-logo{width:104px;height:104px;border-radius:50%;background:#fff;padding:8px;margin:0 auto 18px;box-shadow:0 0 0 1px var(--line),0 0 0 7px var(--g0),0 14px 30px rgba(5,150,105,.25);animation:ab-rise .7s both}
        @keyframes ab-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        .ab-logo img{width:100%;height:100%;object-fit:contain}
        .ab-pill{display:inline-block;background:var(--g0);color:var(--g7);border:1px solid #b7ecd3;padding:6px 16px;border-radius:999px;font-size:.85rem;font-weight:800;margin-bottom:16px}
        .ab-hero h1{font-size:clamp(2.1rem,6vw,3.4rem);font-weight:800;letter-spacing:-.04em;line-height:1.08;margin:0 0 16px;color:var(--g8)}
        .ab-hero p{font-size:1.02rem;color:var(--mut);max-width:660px;margin:0 auto;line-height:1.65}
        .ab-hero p strong{color:var(--ink)}

        .ab-wrap{max-width:980px;margin:0 auto;padding:0 18px}
        .ab-what{margin-top:-30px;position:relative;z-index:2;background:#fff;border:1px solid var(--line);border-radius:28px;padding:30px 28px;box-shadow:0 18px 44px rgba(6,78,59,.1)}
        .ab-wh{display:flex;align-items:center;gap:14px;margin-bottom:16px}
        .ab-ico{width:48px;height:48px;border-radius:15px;background:linear-gradient(135deg,var(--g5),var(--g7));color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 18px rgba(5,150,105,.28);flex-shrink:0}
        .ab-wh h2{margin:0;font-size:1.4rem;font-weight:800;color:var(--g8)}
        .ab-wh small{display:block;font-size:.82rem;font-weight:600;color:#6f8b7d;margin-top:2px}
        .ab-what p{font-size:.95rem;color:#3f5a4b;line-height:1.7;margin:0 0 12px}
        .ab-what p:last-of-type{margin-bottom:0}
        .ab-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}
        .ab-chip{background:var(--g0);border:1px solid #b7ecd3;color:var(--g7);font-size:.82rem;font-weight:700;padding:6px 14px;border-radius:999px}

        .ab-sec{margin-top:64px}
        .ab-sh{text-align:center;margin-bottom:28px}
        .ab-sh h2{font-size:clamp(1.7rem,4.5vw,2.3rem);font-weight:800;letter-spacing:-.03em;margin:0 0 8px;color:var(--g8)}
        .ab-sh p{margin:0;color:var(--mut);font-size:.95rem}
        .ab-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px}
        .ab-card{background:#fff;border:1px solid var(--line);border-radius:24px;padding:24px 22px 22px;position:relative;overflow:hidden;box-shadow:0 6px 18px rgba(6,78,59,.06);transition:transform .25s,box-shadow .25s,border-color .25s}
        .ab-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:6px;background:var(--a)}
        .ab-card:hover{transform:translateY(-5px);box-shadow:0 18px 38px rgba(5,150,105,.17);border-color:#86efac}
        .ab-ci{width:46px;height:46px;border-radius:14px;color:var(--a);background:color-mix(in srgb,var(--a) 13%,white);display:flex;align-items:center;justify-content:center;margin-bottom:14px}
        .ab-card h3{margin:0 0 8px;font-size:1.12rem;font-weight:800;line-height:1.25}
        .ab-card p{margin:0;font-size:.88rem;color:var(--mut);line-height:1.6}

        .ab-dev{margin-top:64px;border-radius:32px;padding:34px 30px;color:#fff;position:relative;overflow:hidden;display:flex;flex-direction:column;gap:20px;
          background:radial-gradient(520px 260px at 0 0,rgba(52,211,153,.3),transparent 60%),linear-gradient(160deg,#075e45,#04261a);box-shadow:0 24px 50px rgba(6,78,59,.3)}
        .ab-dev::after{content:'';position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.07) 1px,transparent 1px);background-size:22px 22px;pointer-events:none}
        .ab-dev>*{position:relative;z-index:1}
        .ab-dt{display:flex;align-items:center;gap:22px;flex-wrap:wrap}
        .ab-ph{width:116px;height:116px;border-radius:50%;overflow:hidden;flex-shrink:0;background:#065f46;border:4px solid #fff;box-shadow:0 0 0 4px #34d399,0 14px 28px rgba(0,0,0,.4)}
        .ab-ph img{width:100%;height:100%;object-fit:cover;object-position:center 15%}
        .ab-by{font-size:.9rem;font-weight:700;color:#6ee7b7;margin-bottom:2px}
        .ab-dt h2{font-size:clamp(1.8rem,5vw,2.3rem);font-weight:800;margin:0 0 6px;letter-spacing:-.03em}
        .ab-dt p{margin:0;font-size:.92rem;color:#b4ecd0;font-weight:600;line-height:1.5}
        .ab-bd{display:flex;flex-wrap:wrap;gap:10px}
        .ab-bd span{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.26);color:#d9f7e8;padding:7px 15px;border-radius:999px;font-size:.82rem;font-weight:700}
        .ab-bio{margin:0;font-size:.94rem;color:#d1fae5;line-height:1.7;border-top:1px solid rgba(255,255,255,.18);padding-top:18px}
        .ab-bio strong{color:#fff}

        .ab-ft{margin-top:72px;background:linear-gradient(165deg,#075e45,#04261a);color:#b4e3cc;padding:28px 18px}
        .ab-ft-in{max-width:1180px;margin:auto;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;font-size:.82rem;font-weight:700}
        .ab-fl{display:flex;gap:20px;align-items:center;flex-wrap:wrap}.ab-fl span{cursor:pointer}.ab-fl span:hover{color:#fff}
        .ab-fb{border:1px solid #34d399;color:#6ee7b7;border-radius:999px;padding:4px 12px;background:rgba(52,211,153,.1)}

        @media(max-width:600px){
          .ab-hero{padding:40px 14px 56px}.ab-what{padding:24px 18px}.ab-dev{padding:26px 18px;border-radius:26px}
          .ab-btn{padding:10px 16px}.ab-lnk{padding:6px 8px}.ab-dt{flex-direction:column;text-align:center}
        }
        @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
      `}</style>

      <header className="ab-hd">
        <div className="ab-hd-in">
          <button className="ab-brand" onClick={() => router.push('/')}>
            <img src="/logo.g" alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            CECTRACK
          </button>
          <div className="ab-nav">
            <button className="ab-lnk" onClick={() => router.push('/')}>Home</button>
            <button className="ab-btn" onClick={() => router.push('/login')}><Ic d="login" s={16} /> Login</button>
          </div>
        </div>
      </header>

      <section className="ab-hero">
        <div className="ab-logo">
          <img src="/logo.png" alt="Cateel Extension Campus Logo" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        </div>
        <span className="ab-pill">About CECTRACK</span>
        <h1>Transforming student <br />organization operations</h1>
        <p>
          CECTRACK is an all-in-one centralized digital ecosystem engineered specifically for the students, officers, and faculty of{' '}
          <strong>Davao Oriental State University – Cateel Extension Campus (DOrSU-CEC)</strong>.
        </p>
      </section>

      <main className="ab-wrap">
        {/* What is CECTRACK? */}
        <section className="ab-what">
          <div className="ab-wh">
            <span className="ab-ico"><Ic d="doc" /></span>
            <div>
              <h2>What is CECTRACK?</h2>
              <small>Institutional governance and activity operating platform</small>
            </div>
          </div>
          <p>
            <strong>CECTRACK</strong> is a purpose-built web and mobile platform designed to modernize campus administration. It eliminates slow paper sign-in sheets, misplaced tally forms, and disorganized spreadsheets by providing automated, tamper-proof digital attendance and student tracking.
          </p>
          <p>
            Equipped with camera QR scanners, live duplicate check-in prevention, and instant student profile verification, CECTRACK ensures total transparency, accuracy, and operational ease for both student leaders and faculty advisers.
          </p>
          <div className="ab-chips">
            <span className="ab-chip">Camera QR scanners</span>
            <span className="ab-chip">Duplicate check-in prevention</span>
            <span className="ab-chip">Instant profile verification</span>
          </div>
        </section>

        {/* Who Uses CECTRACK? */}
        <section className="ab-sec">
          <div className="ab-sh">
            <h2>Who uses CECTRACK?</h2>
            <p>Tailored workspaces engineered for every member of the academic community.</p>
          </div>
          <div className="ab-grid">
            {USERS.map((u) => (
              <div key={u.t} className="ab-card" style={{ '--a': u.c }}>
                <div className="ab-ci"><Ic d={u.i} /></div>
                <h3>{u.t}</h3>
                <p>{u.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Developer Profile */}
        <section className="ab-dev">
          <div className="ab-dt">
            <div className="ab-ph">
              <img
                src={developerPhotoUrl}
                alt="Renowee Beloy"
                onError={(e) => { e.currentTarget.src = 'https://github.com/renoweebeloy.png'; }}
              />
            </div>
            <div>
              <div className="ab-by">Developed by</div>
              <h2>Renowee Beloy</h2>
              <p>
                Lead Creator • BS Information Technology (BSIT)
                <br />
                Faculty of Computing, Engineering, and Technology (FaCET)
              </p>
            </div>
          </div>

          <div className="ab-bd">
            <span>Developer</span>
            <span>💻 Full-Stack Web &amp; Database Systems</span>
            <span>📍 Davao Oriental State University Main Campus</span>
          </div>

          <p className="ab-bio">
            CECTRACK was conceptualized and developed by <strong>Renowee Beloy</strong> from the <strong>Faculty of Computing, Engineering, and Technology (FaCET)</strong> as a specialized institutional software initiative for Davao Oriental State University. Engineered to resolve manual attendance bottlenecks, it replaces tedious paper logs with reliable digital identification, camera-based QR scanning, and automated attendance reporting.
          </p>
        </section>
      </main>

      <footer className="ab-ft">
        <div className="ab-ft-in">
          <span>© 2026 CEC TRACK. All rights reserved.</span>
          <div className="ab-fl">
            <span onClick={() => router.push('/about')} style={{ color: '#fff' }}>About</span>
            <span>Privacy policy</span>
            <span>Terms of use</span>
            <span className="ab-fb">Official portal</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
