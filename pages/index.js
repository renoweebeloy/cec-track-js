import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

const COURSES = [
  { k: 'BSBA', n: 'Business Administration', c: '#16a34a' },
  { k: 'BSCRIM', n: 'Criminology', c: null },
  { k: 'BSA', n: 'Accountancy', c: null },
  { k: 'BEED', n: 'Elementary Education', c: null },
  { k: 'BSAM', n: 'Agribusiness Management', c: null },
];

const P = {
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',
  search: 'M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z',
  login: 'M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3',
  users: 'M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M10 11a4 4 0 100-8 4 4 0 000 8zM21 21v-2a4 4 0 00-3-3.85M16 3.13a4 4 0 010 7.75',
  cal: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
  img: 'M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21',
  award: 'M12 15a6 6 0 100-12 6 6 0 000 12zM8.21 13.89L7 23l5-3 5 3-1.21-9.12',
  clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
  pin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z',
};

const Ic = ({ d, s = 18, w = 2.2 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d={P[d]} />
  </svg>
);

export default function Home() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [counts, setCounts] = useState({ BSBA: 0, BSCRIM: 0, BSA: 0, BEED: 0, BSAM: 0, total: 0 });
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [officers, setOfficers] = useState([]);
  const [officersLoading, setOfficersLoading] = useState(true);
  const [searchId, setSearchId] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState(null);

  const formatTimeWithAmPm = (timeStr) => {
    if (!timeStr) return '';
    const trimmed = String(timeStr).trim();
    if (/am|pm/i.test(trimmed)) return trimmed.toUpperCase();
    const parts = trimmed.split(':');
    if (parts.length >= 2) {
      let hours = parseInt(parts[0], 10);
      const minutes = parts[1].slice(0, 2);
      if (isNaN(hours)) return trimmed;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    }
    return trimmed;
  };

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('en-US', { timeZone: 'Asia/Manila', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const fetchData = async () => {
    if (!supabase) return;
    setEventsLoading(true);
    setOfficersLoading(true);
    try {
      const [profilesRes, eventsRes, officersRes] = await Promise.all([
        supabase.from('profiles').select('course, role, status'),
        supabase.from('events').select('*').order('date', { ascending: false }),
        supabase.from('officers').select('*').order('id', { ascending: true }),
      ]);
      if (profilesRes.data) {
        const members = profilesRes.data.filter((p) => p.role !== 'admin' && p.role !== 'staff');
        const nc = { BSBA: 0, BSCRIM: 0, BSA: 0, BEED: 0, BSAM: 0, total: members.length };
        members.forEach((s) => { if (nc[s.course] !== undefined) nc[s.course] += 1; });
        setCounts(nc);
      }
      if (eventsRes.data) setEvents(eventsRes.data);
      if (officersRes.data) setOfficers(officersRes.data);
    } catch (err) {
      console.error('Error fetching landing page data:', err);
    } finally {
      setEventsLoading(false);
      setOfficersLoading(false);
    }
  };
  useEffect(() => { fetchData(); }, []);

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
        setSearchResult({ success: false, msg: `Student ID "${cleanId}" was not found in the official registry. Please coordinate with an administrator.` });
        return;
      }
      const [logsRes, eventsRes] = await Promise.all([
        supabase.from('attendance').select('*').eq('student_id', cleanId),
        supabase.from('events').select('id'),
      ]);
      const totalEvents = eventsRes.data ? eventsRes.data.length : 0;
      const attended = logsRes.data ? logsRes.data.filter((l) => l.status === 'PRESENT').length : 0;
      setSearchResult({ success: true, student, stats: { totalEvents, attended, absences: Math.max(0, totalEvents - attended) } });
    } catch (err) {
      setSearchResult({ success: false, msg: `Unable to verify "${cleanId}". Please check your ID format.` });
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = () => { setSearchId(''); setSearchResult(null); };
  const scrollToEvents = () => document.getElementById('events-section')?.scrollIntoView({ behavior: 'smooth' });
  const st = searchResult?.student;

  return (
    <div>
      <Head>
        <title>CECTRACK • Cateel Extension Campus</title>
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

        .hd{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.85);backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}
        .hd-in{max-width:1180px;margin:auto;padding:10px 18px;display:flex;align-items:center;justify-content:space-between}
        .brand{display:flex;align-items:center;gap:10px;background:none;border:0;font:800 1.2rem 'Bricolage Grotesque',sans-serif;color:var(--g8);letter-spacing:-.02em}
        .nav{display:flex;align-items:center;gap:6px}
        .lnk{background:none;border:0;font-weight:700;font-size:.9rem;color:#2f4d3e;padding:8px 14px;border-radius:999px}
        .lnk:hover{background:var(--g0)}
        .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:0;border-radius:999px;font-weight:800;font-size:.88rem;padding:11px 20px;transition:transform .2s,box-shadow .2s,background .2s}
        .btn-g{background:linear-gradient(135deg,var(--g5),var(--g7));color:#fff;box-shadow:0 8px 20px rgba(5,150,105,.32)}
        .btn-g:hover{transform:translateY(-2px);box-shadow:0 12px 26px rgba(5,150,105,.4)}
        .btn-w{background:#fff;color:var(--g7);border:1px solid #b7ecd3}
        .btn-w:hover{background:var(--g0)}

        .hero{position:relative;color:var(--ink);text-align:center;padding:40px 18px 110px;overflow:hidden;border-radius:0 0 48px 48px;border-bottom:1px solid var(--line);box-shadow:0 18px 40px rgba(6,78,59,.06);
          background:radial-gradient(700px 340px at 6% -8%,rgba(16,185,129,.22),transparent 60%),radial-gradient(600px 320px at 100% 0,rgba(163,230,53,.18),transparent 60%),radial-gradient(760px 380px at 50% 112%,rgba(16,185,129,.12),transparent 60%),#ffffff}
        .hero::after{content:'';position:absolute;inset:0;background-image:radial-gradient(rgba(5,150,105,.09) 1px,transparent 1px);background-size:22px 22px;pointer-events:none}
        .hero>*{position:relative;z-index:1}
        .pills{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-bottom:28px}
        .pill{display:inline-flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--line);color:#2f4d3e;box-shadow:0 4px 12px rgba(6,78,59,.07);border-radius:999px;padding:7px 15px;font-size:.78rem;font-weight:700;white-space:nowrap}
        .pill.live{color:#047857;font-weight:800;letter-spacing:.05em}
        .oi{display:inline-flex;color:#16a34a}
        .dot{width:8px;height:8px;border-radius:50%;background:#4ade80;animation:pulse 1.8s infinite}
        @keyframes pulse{0%{box-shadow:0 0 0 0 rgba(74,222,128,.7)}70%{box-shadow:0 0 0 8px rgba(74,222,128,0)}100%{box-shadow:0 0 0 0 rgba(74,222,128,0)}}
        .logo{width:124px;height:124px;border-radius:50%;background:#fff;padding:9px;margin:0 auto 18px;box-shadow:0 0 0 1px var(--line),0 0 0 7px var(--g0),0 14px 30px rgba(5,150,105,.25);animation:rise .7s both}
        @keyframes rise{from{opacity:0;transform:translateY(16px) scale(.96)}to{opacity:1;transform:none}}
        .logo img{width:100%;height:100%;object-fit:contain}
        .tag{font-size:.86rem;font-weight:700;color:var(--g6);margin-bottom:4px}
        .h1{font-size:clamp(3.4rem,12vw,6rem);font-weight:800;letter-spacing:-.045em;margin:0;line-height:.95;color:var(--g8)}
        .sub{font-size:1.3rem;font-weight:700;margin:10px 0 8px;font-family:'Bricolage Grotesque',sans-serif}
        .desc{color:var(--mut);font-size:.96rem;line-height:1.65;max-width:470px;margin:0 auto 28px}

        .sr{max-width:620px;margin:0 auto;display:flex;align-items:center;gap:8px;background:#fff;border-radius:999px;padding:7px 7px 7px 20px;color:#6f8b7d;box-shadow:0 0 0 1px var(--line),0 14px 34px rgba(6,78,59,.12);transition:box-shadow .2s}
        .sr:focus-within{box-shadow:0 0 0 1px var(--g5),0 0 0 5px rgba(16,185,129,.18),0 14px 34px rgba(6,78,59,.12)}
        .sr input{flex:1;min-width:0;border:0;outline:0;font-size:.95rem;font-weight:700;font-family:inherit;color:var(--ink);background:transparent}
        .x{background:none;border:0;color:#9db2a8;font-weight:900;padding:4px 6px}
        .acts{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:22px}

        .res{max-width:620px;margin:18px auto 0;text-align:left}
        .vc{background:#fff;color:var(--ink);border-radius:24px;padding:20px;display:flex;gap:14px;position:relative;box-shadow:0 0 0 1px var(--line),0 18px 44px rgba(6,78,59,.14)}
        .av{width:66px;height:66px;border-radius:20px;object-fit:cover;background:var(--g1);display:flex;align-items:center;justify-content:center;font-size:1.7rem;font-weight:800;color:var(--g7);flex-shrink:0}
        .ok{display:inline-flex;align-items:center;gap:5px;background:var(--g1);color:var(--g7);border-radius:999px;font-size:.72rem;font-weight:800;padding:4px 11px;margin-bottom:8px}
        .vc h3{margin:0 0 4px;font-size:1.12rem;line-height:1.25}
        .vc p{margin:0 0 12px;font-size:.84rem;color:var(--mut);line-height:1.55}
        .stt{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;background:var(--g0);border-radius:16px;padding:12px 8px;text-align:center;margin-bottom:14px}
        .stt small{display:block;font-size:.72rem;font-weight:700;color:#5f7d6d}
        .stt b{font-size:1.4rem;font-weight:800;font-family:'Bricolage Grotesque',sans-serif}
        .cl{position:absolute;top:12px;right:16px;background:none;border:0;color:#9db2a8;font-weight:900}
        .bad{background:#fff1f2;border:1px solid #fecdd3;border-radius:20px;padding:15px 18px;color:#9f1239;display:flex;justify-content:space-between;gap:10px;font-size:.84rem}
        .bad h4{margin:0 0 3px;font-size:.92rem}.bad p{margin:0}
        .lk{background:none;border:0;color:var(--mut);font-weight:700;font-size:.82rem;padding:4px}

        .wrap{max-width:1180px;margin:0 auto;padding:0 18px}
        .pull{margin-top:-62px;position:relative;z-index:2}
        .sec{margin-top:56px}
        .sh{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:20px}
        .stl{display:flex;align-items:center;gap:12px;font:800 1.3rem 'Bricolage Grotesque',sans-serif;color:var(--g8);letter-spacing:-.01em}
        .ico{width:42px;height:42px;border-radius:14px;background:linear-gradient(135deg,var(--g5),var(--g7));color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 18px rgba(5,150,105,.28)}
        .chips{display:flex;gap:8px;flex-wrap:wrap;font-size:.82rem;font-weight:700;color:var(--mut)}
        .chip{background:#fff;border:1px solid var(--line);border-radius:999px;padding:6px 14px}.chip b{color:var(--g7)}

        .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:16px}
        .cc,.ev,.of{background:#fff;border:1px solid var(--line);box-shadow:0 6px 18px rgba(6,78,59,.06);transition:transform .25s,box-shadow .25s,border-color .25s}
        .cc:hover,.ev:hover,.of:hover{transform:translateY(-5px);box-shadow:0 18px 38px rgba(5,150,105,.17);border-color:#86efac}
        .cc{border-radius:24px;padding:22px 20px 18px;position:relative;overflow:hidden}
        .cc::before{content:'';position:absolute;left:0;top:0;bottom:0;width:6px;background:var(--a)}
        .cb{display:inline-block;font-size:.8rem;font-weight:800;padding:4px 13px;border-radius:999px;color:var(--a);background:color-mix(in srgb,var(--a) 12%,white);margin-bottom:12px}
        .cn{font:800 3rem/1 'Bricolage Grotesque',sans-serif;letter-spacing:-.04em}
        .cm{font-size:.9rem;font-weight:700;color:var(--mut);margin:6px 0 16px}
        .bar{height:6px;background:#e5f3ea;border-radius:99px;overflow:hidden;margin-bottom:8px}.bar i{display:block;height:100%;width:100%;background:var(--a);border-radius:99px}
        .cf{display:flex;justify-content:space-between;font-size:.78rem;font-weight:700;color:#6f8b7d}.cf b{color:var(--g6)}

        /* Plain white cards (walay color-color except BSBA) */
        .cc.plain::before{display:none}
        .cc.plain .cb{color:var(--ink);background:#fff;border:1px solid var(--line)}
        .cc.plain .bar{background:#f1f5f9}
        .cc.plain .bar i{background:#e2e8f0}
        .cc.plain .cf b{color:var(--ink)}

        .eg{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:20px}
        .ev{border-radius:24px;overflow:hidden;display:flex;flex-direction:column}
        .ei{height:160px;overflow:hidden;background:linear-gradient(135deg,var(--g1),var(--g2));display:flex;align-items:center;justify-content:center;color:var(--g7)}
        .ei img{width:100%;height:100%;object-fit:cover;transition:transform .4s}.ev:hover .ei img{transform:scale(1.06)}
        .eb{padding:18px;display:flex;flex-direction:column;flex:1}
        .et{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-size:.8rem;font-weight:700;color:#7a9488}
        .sb{font-size:.74rem;font-weight:800;padding:4px 11px;border-radius:999px;background:#eef3f0;color:#6b8076}.sb.on{background:var(--g1);color:var(--g7)}
        .ev h3{margin:0 0 6px;font-size:1.18rem;line-height:1.25}
        .loc{display:flex;align-items:center;gap:5px;font-size:.84rem;font-weight:700;color:var(--g6);margin-bottom:8px}
        .tm{display:flex;gap:12px;font-size:.82rem;font-weight:700;color:#456a58;margin-bottom:10px;flex-wrap:wrap}
        .ev p{margin:0;font-size:.84rem;color:var(--mut);line-height:1.55;flex:1}
        .ev .btn{margin-top:16px;background:var(--g0);color:var(--g7);border:1px solid #bbf7d0;border-radius:14px;width:100%;box-shadow:none}
        .ev .btn:hover{background:var(--g1)}
        .emp{text-align:center;padding:42px 18px;background:#fff;border:1px dashed #b7dcc6;border-radius:24px;color:var(--mut);max-width:520px;margin:0 auto}
        .emp h4{margin:8px 0 4px;color:var(--ink);font-size:1rem}.emp p{margin:0;font-size:.86rem}

        .cen{text-align:center}.cen p{max-width:560px;margin:8px auto 26px;color:var(--mut);line-height:1.6}
        .h2{font-size:clamp(1.9rem,5vw,2.6rem);font-weight:800;margin:14px 0 0;letter-spacing:-.03em;color:var(--g8)}
        .og{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;text-align:center}
        .of{border-radius:26px;padding:24px 16px;min-width:0}
        .op{width:112px;height:112px;border-radius:50%;margin:0 auto 16px;overflow:hidden;background:var(--g0);border:4px solid #fff;box-shadow:0 0 0 3px var(--g5),0 12px 24px rgba(5,150,105,.22);display:flex;align-items:center;justify-content:center;color:var(--g6)}
        .op img{width:100%;height:100%;object-fit:cover}
        .pos{display:inline-block;background:var(--g0);color:var(--g7);border:1px solid #bbf7d0;font-size:.78rem;font-weight:800;padding:4px 13px;border-radius:999px;margin-bottom:10px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .of h3{margin:0 0 4px;font-size:1.08rem;word-break:break-word}.of small{display:block;color:var(--mut);font-weight:600;font-size:.82rem}

        .ft{margin-top:72px;background:linear-gradient(165deg,#075e45,#04261a);color:#b4e3cc;padding:28px 18px}
        .ft-in{max-width:1180px;margin:auto;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;font-size:.82rem;font-weight:700}
        .fl{display:flex;gap:20px;align-items:center;flex-wrap:wrap}.fl span{cursor:pointer}.fl span:hover{color:#fff}
        .fb{border:1px solid #34d399;color:#6ee7b7;border-radius:999px;padding:4px 12px;background:rgba(52,211,153,.1)}

        @media(max-width:640px){
          .hero{padding:30px 14px 100px;border-radius:0 0 34px 34px}
          .btn{padding:10px 16px}.lnk{padding:6px 8px}.vc{flex-direction:column}
          .sr .btn{padding:10px 14px}.stl{font-size:1.1rem}
          .og{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
          .of{padding:16px 10px;border-radius:20px}
          .op{width:78px;height:78px;margin-bottom:10px;border-width:3px}
          .pos{font-size:.7rem;padding:3px 9px;margin-bottom:6px}
          .of h3{font-size:.94rem}
          .of small{font-size:.74rem}
        }
        @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
      `}</style>

      <header className="hd">
        <div className="hd-in">
          <button className="brand" onClick={() => router.push('/')}>
            CECTRACK
          </button>
          <div className="nav">
            <button className="lnk" onClick={() => router.push('/about')}>About</button>
            <button className="btn btn-g" onClick={() => router.push('/login')}><Ic d="login" s={16} /> Login</button>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="pills">
          <span className="pill live"><span className="dot" /> LIVE PHT</span>
          <span className="pill"><span className="oi"><Ic d="clock" s={15} /></span> {currentTime || 'Loading...'}</span>
          <span className="pill"><span className="oi"><Ic d="cal" s={15} /></span> {currentDate || 'Loading...'}</span>
          <span className="pill" style={{ color: '#047857' }}><Ic d="shield" s={15} /> Official CEC Portal</span>
        </div>

        <div className="logo">
          <img src="/logo.png" alt="Cateel Extension Campus Logo" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        </div>
        <div className="tag">Empowering future leaders</div>
        <h1 className="h1">CEC</h1>
        <h2 className="sub">Cateel Extension Campus</h2>
        <p className="desc">Uniting students across CEC DOrSU disciplines. Innovate, collaborate, and excel together.</p>

        <form className="sr" onSubmit={handleCheckRecord}>
          <Ic d="search" s={19} />
          <input type="text" placeholder="Search your Student ID" value={searchId} onChange={(e) => setSearchId(e.target.value)} aria-label="Student ID" />
          {searchId && <button type="button" className="x" onClick={clearSearch} aria-label="Clear">✕</button>}
          <button type="submit" className="btn btn-g" disabled={searchLoading}>{searchLoading ? 'Checking...' : 'Check record'}</button>
        </form>

        {searchResult && (
          <div className="res">
            {searchResult.success && st ? (
              <div className="vc">
                <button className="cl" onClick={() => setSearchResult(null)} aria-label="Close">✕</button>
                {st.avatar_url ? <img className="av" src={st.avatar_url} alt="" /> : <div className="av">{(st.full_name || '?')[0]}</div>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className="ok"><Ic d="shield" s={13} /> Recorded and verified</span>
                  <h3>You are already recorded! Please sign in now.</h3>
                  <p>
                    Welcome, <strong>{st.full_name}</strong> (<strong style={{ color: '#047857' }}>{st.school_id}</strong> • {st.course} - {st.year_level || '1st Year'}
                    {st.section ? ` Sec ${String(st.section).replace('Section ', '')}` : ''}). Your account is officially registered in the CECTRACK system.
                  </p>
                  <div className="stt">
                    <div><small>Total events</small><b>{searchResult.stats.totalEvents}</b></div>
                    <div><small>Attended</small><b style={{ color: '#059669' }}>{searchResult.stats.attended}</b></div>
                    <div><small>Absences</small><b style={{ color: searchResult.stats.absences > 0 ? '#dc2626' : '#059669' }}>{searchResult.stats.absences}</b></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <button className="btn btn-g" onClick={() => router.push('/login')}><Ic d="login" s={16} /> Sign in now</button>
                    <button className="lk" onClick={clearSearch}>Check another ID</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bad">
                <div><h4>Record not found</h4><p>{searchResult.msg}</p></div>
                <button className="cl" style={{ position: 'static', color: '#be123c' }} onClick={() => setSearchResult(null)} aria-label="Close">✕</button>
              </div>
            )}
          </div>
        )}

        <div className="acts">
          <button className="btn btn-g" onClick={() => router.push('/login')}><Ic d="login" s={16} /> Access member portal</button>
          <button className="btn btn-w" onClick={scrollToEvents}>Explore events</button>
        </div>
      </section>

      <main className="wrap">
        <section className="pull">
          <div className="sh">
            <div className="stl"><span className="ico"><Ic d="users" s={21} /></span> Members by course</div>
            <div className="chips">
              <span className="chip">Total members <b>{counts.total}</b></span>
              <span className="chip">Digital IDs <b>{counts.total} (100%)</b></span>
            </div>
          </div>
          <div className="grid">
            {COURSES.map((c) => (
              <div key={c.k} className={`cc ${c.c ? '' : 'plain'}`} style={c.c ? { '--a': c.c } : undefined}>
                <span className="cb">{c.k}</span>
                <div className="cn">{counts[c.k]}</div>
                <div className="cm">{c.n}</div>
                <div className="bar"><i /></div>
                <div className="cf"><span>Enrolled active</span><span>ID ready <b>{counts[c.k]}</b></span></div>
              </div>
            ))}
          </div>
        </section>

        <section className="sec" id="events-section">
          <div className="sh">
            <div className="stl"><span className="ico"><Ic d="cal" s={21} /></span> Upcoming and official events</div>
            <div className="chips">
              <span className="chip">Total events <b>{events.length}</b></span>
              <span className="chip">Active <b>{events.filter((e) => e.status === 'active').length}</b></span>
            </div>
          </div>

          {eventsLoading ? (
            <div className="emp"><p>Loading official events...</p></div>
          ) : events.length === 0 ? (
            <div className="emp"><Ic d="cal" s={34} /><h4>No published events yet</h4><p>Check back soon for upcoming assemblies and college activities.</p></div>
          ) : (
            <div className="eg">
              {events.map((ev) => {
                const on = ev.status === 'active';
                return (
                  <div key={ev.id} className="ev">
                    <div className="ei">{ev.image_url ? <img src={ev.image_url} alt={ev.title} /> : <Ic d="img" s={40} w={1.6} />}</div>
                    <div className="eb">
                      <div className="et"><span className={`sb ${on ? 'on' : ''}`}>{on ? '● Active (open)' : 'Closed'}</span><span>{ev.date}</span></div>
                      <h3>{ev.title}</h3>
                      {ev.location && <div className="loc"><Ic d="pin" s={15} /> {ev.location}</div>}
                      <div className="tm">
                        <span><b style={{ color: '#15803d' }}>In</b> {formatTimeWithAmPm(ev.time_in) || '08:00 AM'}</span>
                        <span><b style={{ color: '#b91c1c' }}>Out</b> {formatTimeWithAmPm(ev.time_out) || '12:00 PM'}</span>
                      </div>
                      <p>{ev.description || 'No description provided.'}</p>
                      <button className="btn" onClick={() => router.push('/login')}>Check attendance in portal</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="sec cen">
          <span className="ico" style={{ margin: '0 auto' }}><Ic d="award" s={22} /></span>
          <h2 className="h2">Our officers and leaders</h2>
          <p>Dedicated student leaders and officers steering Cateel Extension Campus toward academic and professional excellence.</p>

          {officersLoading ? (
            <div className="emp"><p>Loading officers roster...</p></div>
          ) : officers.length === 0 ? (
            <div className="emp"><Ic d="users" s={34} /><h4>No officers published yet</h4><p>Student leaders and advisers will appear here once the administration updates the roster.</p></div>
          ) : (
            <div className="og">
              {officers.map((off) => (
                <div key={off.id} className="of">
                  <div className="op">{off.avatar_url ? <img src={off.avatar_url} alt={off.name} /> : <Ic d="users" s={40} w={1.6} />}</div>
                  <span className="pos">{off.position}</span>
                  <h3>{off.name}</h3>
                  <small>{off.department}</small>
                  <small style={{ marginTop: 6, color: '#7a9488' }}>A.Y. {off.term || '2026 - 2027'}</small>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="ft">
        <div className="ft-in">
          <span>© 2026 CEC TRACK. All rights reserved.</span>
          <div className="fl">
            <span onClick={() => router.push('/about')} style={{ color: '#fff' }}>About</span>
            <span>Privacy policy</span>
            <span>Terms of use</span>
            <span className="fb">Official portal</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
