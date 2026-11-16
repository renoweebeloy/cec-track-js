import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

const P = {
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  userplus: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM19 8v6M22 11h-6',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',
  cal: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
  award: 'M12 15a6 6 0 100-12 6 6 0 000 12zM8.21 13.89L7 23l5-3 5 3-1.21-9.12',
  qr: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM21 14v3M17 21h4',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  out: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  menu: 'M3 12h18M3 6h18M3 18h18',
  x: 'M18 6L6 18M6 6l12 12',
  check: 'M20 6L9 17l-5-5',
  alert: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
  pin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z',
  pencil: 'M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z',
  trash: 'M3 6h18M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2',
  search: 'M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z',
  user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  users: 'M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M10 11a4 4 0 100-8 4 4 0 000 8zM21 21v-2a4 4 0 00-3-3.85M16 3.13a4 4 0 010 7.75',
  cam: 'M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 17a4 4 0 100-8 4 4 0 000 8z',
  plus: 'M12 5v14M5 12h14',
  img: 'M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21',
  clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
  lock: 'M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4',
  power: 'M18.36 6.64a9 9 0 11-12.73 0M12 2v10',
  scan: 'M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2M7 12h10',
};

const Ic = ({ d, s = 18, w = 2.1 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true">
    <path d={P[d]} />
  </svg>
);

const COURSE_COLORS = { BSCRIM: '#0f766e', BSBA: '#16a34a', BSAM: '#15803d', BEED: '#059669', BSA: '#65a30d' };

const Field = ({ label, children }) => (
  <div>
    <label className="ad-l">{label}</label>
    {children}
  </div>
);

const PageHead = ({ icon, badge, title, sub, right }) => (
  <div className="ad-ph">
    <div>
      <span className="ad-badge"><Ic d={icon} s={14} /> {badge}</span>
      <h1>{title}</h1>
      {sub && <p>{sub}</p>}
    </div>
    {right}
  </div>
);

const Stat = ({ label, value, tone }) => (
  <div className="ad-stat"><small>{label}</small><b className={tone || ''}>{value}</b></div>
);

const Switch = ({ checked, onChange }) => (
  <label className="ad-sw">
    <input type="checkbox" checked={checked} onChange={onChange} />
    <span />
  </label>
);

const SearchBox = ({ value, onChange, placeholder }) => (
  <div className="ad-srch">
    <Ic d="search" s={15} />
    <input className="ad-in sm" type="text" placeholder={placeholder} value={value} onChange={onChange} />
  </div>
);

const EditActions = ({ onEdit, onDel, delLabel }) => (
  <div className="ad-acts">
    <button type="button" className="ad-b out sm" onClick={onEdit}><Ic d="pencil" s={14} /> Edit</button>
    {onDel && <button type="button" className="ad-b dng sm" onClick={onDel}><Ic d="trash" s={14} /> {delLabel}</button>}
  </div>
);

const FormButtons = ({ editing, saving, onCancel, addLabel, saveLabel, disabled }) => (
  <div className={editing ? 'ad-btns' : ''}>
    {editing && <button type="button" className="ad-b neu" onClick={onCancel}>Cancel</button>}
    <button type="submit" className="ad-b pri full" disabled={saving || disabled}>
      {saving ? 'Saving...' : editing ? saveLabel : addLabel}
    </button>
  </div>
);

function Styles() {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Figtree:wght@500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <style jsx global>{`
        :root{--g9:#04261a;--g8:#064e3b;--g7:#047857;--g6:#059669;--g5:#10b981;--g2:#a7f3d0;--g1:#d1fae5;--g0:#ecfdf5;--ink:#0b2a1e;--mut:#56705f;--line:#d6ebdf;--red:#dc2626;--blue:#2563eb}
        *{box-sizing:border-box}
        body{margin:0;font-family:'Figtree',system-ui,sans-serif;color:var(--ink);background:#f3faf5;overflow-x:hidden}
        button{font-family:inherit;cursor:pointer}
        h1,h2,h3{font-family:'Bricolage Grotesque','Figtree',sans-serif}
        :focus-visible{outline:3px solid var(--g5);outline-offset:2px}
        .ad-root{min-height:100vh;display:flex;flex-direction:column;overflow-x:clip}

        .ad-b{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:44px;padding:0 18px;border-radius:999px;border:1.5px solid transparent;font-size:.9rem;font-weight:800;line-height:1;white-space:nowrap;transition:transform .2s,box-shadow .2s,background .2s;touch-action:manipulation}
        .ad-b:disabled{opacity:.55;cursor:not-allowed;transform:none!important;box-shadow:none!important}
        .ad-b.sm{height:36px;padding:0 13px;font-size:.8rem;gap:6px}
        .ad-b.full{width:100%}
        .ad-b.pri{background:linear-gradient(135deg,var(--g5),var(--g7));color:#fff;box-shadow:0 8px 20px rgba(5,150,105,.3)}
        .ad-b.pri:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 12px 26px rgba(5,150,105,.4)}
        .ad-b.blue{background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;box-shadow:0 8px 20px rgba(37,99,235,.28)}
        .ad-b.out{background:var(--g0);color:var(--g7);border-color:#b7ecd3}.ad-b.out:hover:not(:disabled){background:var(--g1)}
        .ad-b.neu{background:#fff;color:#3f5a4b;border-color:var(--line)}.ad-b.neu:hover:not(:disabled){background:var(--g0)}
        .ad-b.dng{background:#fff;color:var(--red);border-color:#fecaca}.ad-b.dng:hover:not(:disabled){background:#fef2f2}
        .ad-b.org{background:#fff;color:#ea580c;border-color:#fed7aa}.ad-b.org:hover:not(:disabled){background:#fff7ed}
        .ad-b.dsol{background:linear-gradient(135deg,#f43f5e,#dc2626);color:#fff;box-shadow:0 8px 20px rgba(220,38,38,.28)}
        .ad-b.osol{background:linear-gradient(135deg,#fb923c,#ea580c);color:#fff;box-shadow:0 8px 20px rgba(234,88,12,.28)}
        .ad-b.gray{background:#94a3b8;color:#fff}

        .ad-hd{position:sticky;top:0;z-index:50;height:64px;background:rgba(255,255,255,.9);backdrop-filter:blur(14px);border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 16px;gap:10px}
        .ad-hl{display:flex;align-items:center;gap:10px;min-width:0}
        .ad-menu{display:none;width:40px;height:40px;border-radius:12px;border:1px solid var(--line);background:#fff;color:var(--g7);align-items:center;justify-content:center}
        .ad-brand b{font:800 1.15rem 'Bricolage Grotesque',sans-serif;color:var(--g8);letter-spacing:-.02em;margin-right:6px}
        .ad-chip{background:var(--g0);border:1px solid #b7ecd3;color:var(--g7);padding:2px 9px;border-radius:999px;font-size:.7rem;font-weight:800}
        .ad-chip.staff{background:#eff6ff;border-color:#bfdbfe;color:#1d4ed8}
        .ad-brand small{display:block;font-size:.72rem;color:var(--mut);font-weight:600}
        .ad-camp{display:inline-flex;align-items:center;gap:6px;background:var(--g0);border:1px solid #b7ecd3;color:var(--g7);border-radius:999px;padding:7px 14px;font-size:.8rem;font-weight:800;white-space:nowrap}

        .ad-shell{display:flex;flex:1;min-width:0;width:100%}
        .ad-side{width:250px;flex-shrink:0;background:#fff;border-right:1px solid var(--line);padding:22px 14px;display:flex;flex-direction:column;justify-content:space-between;overflow-y:auto;position:sticky;top:64px;height:calc(100vh - 64px)}
        .ad-st{padding:0 8px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center}
        .ad-st h2{margin:0;font-size:1.25rem;font-weight:800;color:var(--g8)}
        .ad-st small{font-size:.74rem;font-weight:700;color:#7a9488}
        .ad-nav{display:flex;flex-direction:column;gap:4px}
        .ad-nav button{display:flex;align-items:center;gap:12px;min-height:44px;padding:0 14px;border:0;border-radius:14px;background:transparent;color:#4b6558;font-size:.9rem;font-weight:700;text-align:left;transition:background .15s,color .15s}
        .ad-nav button:hover{background:var(--g0);color:var(--g7)}
        .ad-nav button.on{background:linear-gradient(135deg,var(--g5),var(--g7));color:#fff;font-weight:800;box-shadow:0 8px 18px rgba(5,150,105,.28)}
        .ad-so{display:flex;align-items:center;gap:12px;width:100%;height:46px;padding:0 14px;border:0;border-radius:14px;background:none;color:var(--red);font-size:.92rem;font-weight:800}
        .ad-so:hover{background:#fef2f2}
        .ad-main{flex:1;min-width:0;padding:28px 32px 40px}
        .ad-wrap{max-width:1180px;margin:0 auto;width:100%}
        .ad-bd{position:fixed;inset:0;background:rgba(4,38,26,.5);backdrop-filter:blur(3px);z-index:90}

        .ad-wt{position:fixed;top:76px;left:50%;transform:translateX(-50%);z-index:9999;background:#fff;border:1px solid #b7ecd3;padding:9px 12px 9px 16px;border-radius:999px;display:flex;align-items:center;gap:10px;box-shadow:0 12px 30px rgba(5,150,105,.2);white-space:nowrap;font-size:.86rem;font-weight:800;color:var(--g7);animation:ad-d .4s both}
        .ad-wt i{width:22px;height:22px;border-radius:50%;background:var(--g6);color:#fff;display:flex;align-items:center;justify-content:center}
        .ad-wt button{background:none;border:0;color:#7a9488;display:flex;padding:2px}
        @keyframes ad-d{from{opacity:0;transform:translate(-50%,-8px)}to{opacity:1;transform:translate(-50%,0)}}
        .ad-toast{display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:16px;margin-bottom:18px;font-size:.88rem;font-weight:700;border:1px solid;line-height:1.45}
        .ad-toast.ok{background:var(--g0);color:var(--g7);border-color:#b7ecd3}.ad-toast.er{background:#fef2f2;color:#b91c1c;border-color:#fecaca}

        .ad-ph{display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:14px;margin-bottom:22px}
        .ad-badge{display:inline-flex;align-items:center;gap:6px;background:var(--g0);color:var(--g7);border:1px solid #b7ecd3;border-radius:999px;padding:5px 13px;font-size:.8rem;font-weight:800;margin-bottom:10px}
        .ad-ph h1{margin:0 0 4px;font-size:clamp(1.6rem,4vw,2.1rem);font-weight:800;letter-spacing:-.03em;color:var(--g8)}
        .ad-ph p{margin:0;font-size:.92rem;color:var(--mut)}

        .ad-card{background:#fff;border:1px solid var(--line);border-radius:26px;padding:22px;box-shadow:0 8px 24px rgba(6,78,59,.06);min-width:0;max-width:100%}
        .ad-ct{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:16px}
        .ad-ct h3{margin:0;font-size:1.15rem;font-weight:800;color:var(--g8);display:flex;align-items:center;gap:10px}
        .ad-ci{width:38px;height:38px;border-radius:12px;background:linear-gradient(135deg,var(--g5),var(--g7));color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 6px 14px rgba(5,150,105,.25)}
        .ad-sub{margin:-8px 0 16px;font-size:.88rem;color:var(--mut);line-height:1.55}
        .ad-g4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px}
        .ad-stat{background:#fff;border:1px solid var(--line);border-radius:20px;padding:16px 18px;box-shadow:0 6px 18px rgba(6,78,59,.05)}
        .ad-stat small{display:block;font-size:.78rem;font-weight:700;color:#6f8b7d}
        .ad-stat b{display:block;font:800 2rem/1.15 'Bricolage Grotesque',sans-serif;margin-top:4px}
        .ad-stat b.g{color:var(--g6)}.ad-stat b.r{color:var(--red)}
        .ad-cg{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px}
        .ad-cc{background:#fff;border:1px solid var(--line);border-radius:22px;padding:20px 18px;position:relative;overflow:hidden}
        .ad-cc::before{content:'';position:absolute;left:0;top:0;bottom:0;width:6px;background:var(--a)}
        .ad-cb{display:inline-block;font-size:.8rem;font-weight:800;padding:3px 12px;border-radius:999px;color:var(--a);background:color-mix(in srgb,var(--a) 12%,white);margin-bottom:10px}
        .ad-cn{font:800 2.6rem/1 'Bricolage Grotesque',sans-serif;letter-spacing:-.04em}
        .ad-cm{font-size:.82rem;font-weight:700;color:var(--mut);margin-top:6px;line-height:1.35}

        .ad-g2{display:grid;grid-template-columns:minmax(300px,380px) minmax(0,1fr);gap:22px;align-items:start}
        .ad-g2.even{grid-template-columns:repeat(auto-fit,minmax(300px,1fr))}
        .ad-sticky{position:sticky;top:84px;align-self:start;max-height:calc(100vh - 104px);overflow-y:auto}
        .ad-fm{display:flex;flex-direction:column;gap:14px;min-width:0}
        .ad-fm>div,.ad-2>div{min-width:0}
        .ad-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .ad-l{display:block;font-size:.84rem;font-weight:700;color:#2f4d3e;margin-bottom:6px}
        .ad-in{width:100%;min-width:0;max-width:100%;min-height:46px;display:block;text-align:left;-webkit-appearance:none;appearance:none;padding:12px 14px;border-radius:14px;border:1.5px solid var(--line);font-size:.92rem;font-family:inherit;font-weight:600;color:var(--ink);background:#fafdfb;outline:0;transition:border-color .2s,box-shadow .2s,background .2s}
        textarea.ad-in{resize:vertical;line-height:1.5;font-weight:500}
        .ad-in:focus{border-color:var(--g5);background:#fff;box-shadow:0 0 0 4px rgba(16,185,129,.16)}
        .ad-in.sm{padding:0 14px 0 38px;min-height:40px;height:40px;border-radius:999px;background:#fff;font-size:.86rem}
        .ad-srch{position:relative;width:200px;max-width:100%}
        .ad-srch svg{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:#78a38c}
        .ad-ra{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
        .ad-btns{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:10px}

        .ad-tw{overflow-x:auto;border:1px solid var(--line);border-radius:20px}
        .ad-tw table{width:100%;min-width:560px;border-collapse:collapse;text-align:left;font-size:.86rem}
        .ad-tw th{padding:13px 14px;background:var(--g0);color:var(--g7);font-weight:800;font-size:.8rem;border-bottom:1px solid var(--line);white-space:nowrap}
        .ad-tw td{padding:12px 14px;border-bottom:1px solid #edf6f0;vertical-align:middle}
        .ad-tw tr:last-child td{border-bottom:0}.ad-tw tbody tr:hover{background:#f9fdfb}
        .ad-tw td b{display:block;font-weight:800;color:var(--ink)}
        .ad-tw td small{display:block;color:#6f8b7d;font-size:.76rem;margin-top:1px}
        .ad-id{font-weight:800;color:var(--g8);white-space:nowrap}
        .ad-pill{display:inline-flex;align-items:center;gap:5px;padding:3px 11px;border-radius:999px;font-size:.74rem;font-weight:800;background:var(--g1);color:var(--g7)}
        .ad-pill.no{background:#fee2e2;color:#b91c1c}.ad-pill.mu{background:#eef3f0;color:#6b8076}.ad-pill.org{background:#fff7ed;color:#ea580c}
        .ad-empty{text-align:center;padding:30px 16px;color:#7a9488;font-size:.9rem}
        .ad-acts{display:inline-flex;gap:6px}

        .ad-row{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:12px 14px;border:1px solid var(--line);border-radius:18px;background:#fff;transition:border-color .2s,box-shadow .2s}
        .ad-row:hover{border-color:#86efac;box-shadow:0 8px 20px rgba(5,150,105,.1)}
        .ad-row.sel{background:var(--g0);border-color:#86efac}
        .ad-rl{display:flex;align-items:center;gap:12px;min-width:0;flex:1}
        .ad-th{width:52px;height:52px;border-radius:14px;background:var(--g1);color:var(--g7);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0}
        .ad-th.round{border-radius:50%;box-shadow:0 0 0 2px #fff,0 0 0 4px var(--g5)}
        .ad-th img{width:100%;height:100%;object-fit:cover}
        .ad-rt{min-width:0}
        .ad-rt h4{margin:0 0 2px;font-size:.95rem;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .ad-rt div{font-size:.78rem;color:var(--mut);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .ad-rt .g{color:var(--g6);font-weight:800}
        .ad-list{display:flex;flex-direction:column;gap:10px}
        .ad-re{display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0;max-width:100%}

        .ad-up{border:2px dashed #b7ecd3;border-radius:18px;padding:14px;text-align:center;cursor:pointer;background:var(--g0);transition:background .2s,border-color .2s;color:var(--g7);font-weight:800;font-size:.86rem}
        .ad-up:hover{background:var(--g1);border-color:var(--g5)}
        .ad-up svg{display:block;margin:0 auto 4px}
        .ad-up img{max-height:120px;width:auto;border-radius:12px;margin:0 auto 6px;display:block}
        .ad-up img.av{width:80px;height:80px;border-radius:50%;object-fit:cover}
        .ad-up span{display:block;font-size:.76rem;color:var(--mut);font-weight:700}

        .ad-sw{position:relative;display:inline-block;width:46px;height:26px;flex-shrink:0;cursor:pointer}
        .ad-sw input{opacity:0;width:0;height:0;position:absolute}
        .ad-sw span{position:absolute;inset:0;background:#cbd5e1;border-radius:99px;transition:.25s}
        .ad-sw span::after{content:'';position:absolute;top:3px;left:3px;width:20px;height:20px;background:#fff;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,.2);transition:.25s}
        .ad-sw input:checked+span{background:var(--g6)}.ad-sw input:checked+span::after{transform:translateX(20px)}
        .ad-tg{display:flex;align-items:center;justify-content:space-between;gap:12px;background:#f7faf8;border:1.5px solid var(--line);border-radius:18px;padding:12px 14px;transition:background .2s,border-color .2s}
        .ad-tg.on{background:var(--g0);border-color:#86efac}
        .ad-tg b{display:block;font-size:.88rem;color:var(--ink)}.ad-tg small{font-size:.76rem;color:var(--mut);font-weight:600}
        .ad-perm{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;background:#f7faf8;border:1px solid var(--line);border-radius:14px;padding:8px 12px;font-size:.8rem;font-weight:700;color:var(--mut)}
        .ad-perm.on{background:var(--g0);border-color:#b7ecd3;color:var(--g7)}
        .ad-sc{border:1px solid var(--line);border-radius:20px;padding:14px;display:flex;flex-direction:column;gap:10px;background:#fff}
        .ad-sc.adm{border-color:#b7ecd3}
        .ad-scr{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}

        .ad-gate{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;border-radius:20px;padding:14px 16px;margin-bottom:16px;border:1px solid;text-align:left}
        .ad-gate.on{background:var(--g0);border-color:#b7ecd3}.ad-gate.off{background:#fef2f2;border-color:#fecaca}
        .ad-gate b{display:block;font-size:.92rem}.ad-gate.on b{color:var(--g7)}.ad-gate.off b{color:#b91c1c}
        .ad-gate small{font-size:.78rem;color:var(--mut);font-weight:600}
        .ad-seg{display:grid;grid-template-columns:1fr 1fr;gap:6px;background:#eef5f0;padding:6px;border-radius:999px}
        .ad-seg button{height:42px;border:0;border-radius:999px;background:transparent;color:#5f7d6d;font-weight:800;font-size:.86rem;display:flex;align-items:center;justify-content:center;gap:6px;transition:all .2s}
        .ad-seg button.in{background:linear-gradient(135deg,var(--g5),var(--g7));color:#fff;box-shadow:0 6px 14px rgba(5,150,105,.28)}
        .ad-seg button.ou{background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;box-shadow:0 6px 14px rgba(37,99,235,.28)}
        .ad-note{background:#f7faf8;border:1px solid var(--line);border-radius:14px;padding:9px 12px;font-size:.8rem;color:var(--mut);line-height:1.5;margin-top:8px;text-align:left}
        .ad-msg{margin-top:14px;font-size:.86rem;font-weight:700;padding:12px 14px;border-radius:14px;border:1px solid;line-height:1.45}
        .ad-msg.success,.ad-msg.info{background:var(--g0);color:var(--g7);border-color:#b7ecd3}.ad-msg.error{background:#fef2f2;color:#b91c1c;border-color:#fecaca}.ad-msg.warning{background:#fffbeb;color:#b45309;border-color:#fde68a}
        .ad-center{text-align:center}

        .ad-pf{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
        .ad-pa{width:72px;height:72px;border-radius:50%;overflow:hidden;background:var(--g1);color:var(--g7);display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 3px #fff,0 0 0 6px var(--g5);flex-shrink:0}
        .ad-pa img{width:100%;height:100%;object-fit:cover}
        .ad-pf h2{margin:6px 0 2px;font-size:1.35rem;color:var(--g8)}.ad-pf p{margin:0;font-size:.84rem;font-weight:700;color:var(--g7)}.ad-pf small{color:var(--mut);font-size:.78rem}
        .ad-lg{border:1px solid var(--line);border-radius:18px;padding:14px;background:#fff}
        .ad-lg.ab{border-color:#fecaca}
        .ad-lgt{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:10px}
        .ad-lgt h4{margin:0 0 2px;font-size:.95rem;font-weight:800;word-break:break-word}.ad-lgt div{font-size:.78rem;color:var(--g6);font-weight:700}
        .ad-lgg{display:grid;grid-template-columns:repeat(auto-fit,minmax(90px,1fr));gap:8px;background:#f7faf8;border-radius:12px;padding:10px 12px}
        .ad-lgg small{display:block;font-size:.72rem;color:#7a9488;font-weight:700}.ad-lgg b{font-size:.84rem}

        .ad-ov{position:fixed;inset:0;z-index:130;background:rgba(4,38,26,.6);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;animation:ad-f .25s both}
        @keyframes ad-f{from{opacity:0}to{opacity:1}}
        .ad-md{width:100%;max-width:400px;max-height:92vh;overflow-y:auto;background:#fff;border-radius:28px;padding:24px;box-shadow:0 30px 70px rgba(0,0,0,.35);text-align:center}
        .ad-md.sc{max-width:440px}
        .ad-mi{width:60px;height:60px;border-radius:20px;background:linear-gradient(135deg,var(--g5),var(--g7));color:#fff;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;box-shadow:0 10px 22px rgba(5,150,105,.3)}
        .ad-mi.red{background:linear-gradient(135deg,#f43f5e,#dc2626);box-shadow:0 10px 22px rgba(220,38,38,.3)}
        .ad-mi.org{background:linear-gradient(135deg,#fb923c,#ea580c);box-shadow:0 10px 22px rgba(234,88,12,.3)}
        .ad-md h3{margin:0 0 6px;font-size:1.25rem;font-weight:800;color:var(--g8)}
        .ad-md p{margin:0 0 20px;font-size:.9rem;color:var(--mut);line-height:1.6}
        .ad-md p strong{color:var(--ink)}
        .ad-ma{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .ad-mh{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
        .ad-xb{width:36px;height:36px;border-radius:50%;border:1px solid var(--line);background:#fff;color:#6f8b7d;display:flex;align-items:center;justify-content:center}
        .ad-rd{width:100%;height:280px;background:#0b2a1e;border-radius:20px;overflow:hidden;display:flex;align-items:center;justify-content:center;margin-bottom:14px}
        .ad-fbp{width:130px;height:130px;border-radius:30px;background:var(--g1);color:var(--g7);margin:0 auto 14px;overflow:hidden;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 24px rgba(0,0,0,.12);border:3px solid var(--g5)}
        .ad-fbp.warn{border-color:#f59e0b}.ad-fbp img{width:100%;height:100%;object-fit:cover}
        .ad-fbs{background:#f7faf8;border:1px solid var(--line);border-radius:16px;padding:12px 14px;margin:0 0 18px;text-align:left;font-size:.84rem;display:flex;flex-direction:column;gap:6px}
        .ad-fbs div{display:flex;justify-content:space-between;gap:10px}.ad-fbs span{color:var(--mut);font-weight:700}.ad-fbs div:last-child{border-top:1px solid var(--line);padding-top:6px}
        .ad-fbt{display:inline-flex;align-items:center;gap:6px;padding:5px 14px;border-radius:999px;font-size:.82rem;font-weight:800;margin-bottom:14px;background:var(--g1);color:var(--g7)}
        .ad-fbt.warning{background:#fef3c7;color:#a16207}.ad-fbt.error{background:#fee2e2;color:#b91c1c}

        .ad-spin{width:44px;height:44px;border-radius:50%;border:4px solid var(--g1);border-top-color:var(--g6);animation:ad-r 1s linear infinite;margin-bottom:14px}
        @keyframes ad-r{to{transform:rotate(360deg)}}

        @media(max-width:900px){
          .ad-g2,.ad-g2.even{grid-template-columns:minmax(0,1fr)}
          .ad-sticky{position:static;max-height:none;overflow:visible}
        }
        @media(max-width:768px){
          .ad-menu{display:inline-flex}
          .ad-side{position:fixed;top:0;bottom:0;left:0;height:auto;width:270px;max-width:82vw;z-index:100;transform:translateX(-100%);transition:transform .28s cubic-bezier(.4,0,.2,1)}
          .ad-side.open{transform:none;box-shadow:8px 0 30px rgba(0,0,0,.2)}
          .ad-main{padding:18px 14px 30px}
          .ad-g4{grid-template-columns:repeat(2,1fr);gap:10px}
          .ad-card{padding:18px 14px;border-radius:22px}
          .ad-b{max-width:100%;white-space:normal;text-align:center;height:auto;min-height:42px;padding:10px 14px;line-height:1.25}
          .ad-b.sm{height:auto;min-height:34px;padding:7px 12px}
          .ad-row .ad-rl,.ad-scr .ad-rl{flex:1 1 100%}
          .ad-row .ad-acts{width:100%;justify-content:flex-end}
          .ad-re{width:100%;flex-direction:row;align-items:center;justify-content:space-between;flex-wrap:wrap}
          .ad-scr>button,.ad-scr>.ad-pill{margin-left:auto}
          .ad-perm>button{width:100%}
        }
        @media(max-width:480px){.ad-2{grid-template-columns:minmax(0,1fr)}}
        @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
      `}</style>
    </>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const scannerRef = useRef(null);
  const eventImageInputRef = useRef(null);
  const officerAvatarInputRef = useRef(null);
  const formRef = useRef(null);
  const studentFormRef = useRef(null);
  const officerFormRef = useRef(null);

  // Scan Processing Lock
  const isProcessingScanRef = useRef(false);
  const lastScannedCodeRef = useRef('');

  // Authentication & Security Guard States
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [userRole, setUserRole] = useState('admin');
  const [currentUser, setCurrentUser] = useState({ name: '', email: '', school_id: '', can_add_students: false });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Welcome Toast & Logout Modal States
  const [showWelcomeToast, setShowWelcomeToast] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Navigation Tabs: 'profile' | 'add-student' | 'add-staff' | 'add-event' | 'manage-officers' | 'scan-qr' | 'search-student'
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Confirmation Modals
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: '', id: null, title: '' });
  const [deletingRecord, setDeletingRecord] = useState(false);

  // Edit Confirmation Modal
  const [confirmEditModal, setConfirmEditModal] = useState({
    isOpen: false,
    type: '',
    payload: null,
    title: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // 1. Student States
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentCourse, setStudentCourse] = useState('BSCRIM');
  const [studentYear, setStudentYear] = useState('1st Year');
  const [studentSection, setStudentSection] = useState('Section A');

  // 2. Staff States
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState('Staff Officer');
  const [staffCanAddStudent, setStaffCanAddStudent] = useState(false);

  // 3. Event States
  const [editingEventId, setEditingEventId] = useState(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [timeIn, setTimeIn] = useState('08:00');
  const [timeOut, setTimeOut] = useState('17:00');
  const [eventStatus, setEventStatus] = useState('active');
  const [eventImage, setEventImage] = useState('');
  const [compressingImage, setCompressingImage] = useState(false);

  // 4. Officer Management States
  const [editingOfficerId, setEditingOfficerId] = useState(null);
  const [officerName, setOfficerName] = useState('');
  const [officerPosition, setOfficerPosition] = useState('');
  const [officerDepartment, setOfficerDepartment] = useState('Supreme Student Government (SSG)');
  const [officerTerm, setOfficerTerm] = useState('2026 - 2027');
  const [officerAvatar, setOfficerAvatar] = useState('');
  const [compressingOfficerAvatar, setCompressingOfficerAvatar] = useState(false);
  const [officersList, setOfficersList] = useState([]);

  // 5. Scanner Controls & Gate State
  const [scanMode, setScanMode] = useState('time_in');
  const [isScannerGateOpen, setIsScannerGateOpen] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [manualStudentId, setManualStudentId] = useState('');
  const [scanLogMsg, setScanLogMsg] = useState({ type: '', text: '' });

  // Live Camera Scanner Feedback with Profile Details
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [liveScanFeedback, setLiveScanFeedback] = useState(null);

  // 6. Search Student Attendance History States
  const [searchHistoryId, setSearchHistoryId] = useState('');
  const [searchingHistory, setSearchingHistory] = useState(false);
  const [searchedStudent, setSearchedStudent] = useState(null);
  const [studentAttendanceRecords, setStudentAttendanceRecords] = useState([]);
  const [historySearchMessage, setHistorySearchMessage] = useState('');

  // Collections & Filters
  const [students, setStudents] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [events, setEvents] = useState([]);
  const [searchStudentQuery, setSearchStudentQuery] = useState('');
  const [searchEventQuery, setSearchEventQuery] = useState('');

  const courses = [
    { code: 'BSCRIM', name: 'Bachelor of Science in Criminology' },
    { code: 'BSBA', name: 'Bachelor of Science in Business Administration' },
    { code: 'BSAM', name: 'Bachelor of Science in Agribusiness Management' },
    { code: 'BEED', name: 'Bachelor of Elementary Education' },
    { code: 'BSA', name: 'Bachelor of Science in Accountancy' },
  ];

  const sectionsList = [
    'Section A', 'Section B', 'Section C', 'Section D', 'Section E',
    'Section F', 'Section G', 'Section H', 'Section I', 'Section J', 'Section K',
  ];

  const formatTime12Hour = (time24) => {
    if (!time24 || time24 === '--:--') return '--:--';
    if (time24.includes('AM') || time24.includes('PM')) return time24;
    const parts = time24.split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1] ? parts[1].substring(0, 2) : '00';
    if (isNaN(hours)) return time24;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes.padStart(2, '0')} ${ampm}`;
  };

  const showNotify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification({ type: '', message: '' });
    }, 4500);
  };

  const playBeepSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.16);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.16);
    } catch (e) {
      console.warn('AudioContext warning:', e);
    }
  };

  useEffect(() => {
    const welcomeTimer = setTimeout(() => {
      setShowWelcomeToast(false);
    }, 5000);
    return () => clearTimeout(welcomeTimer);
  }, []);

  // 5-Minute Inactivity Session Guard
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const FIVE_MINUTES_MS = 5 * 60 * 1000;

    const checkSessionActivity = async () => {
      let lastActive = null;
      try {
        lastActive = localStorage.getItem('cec_last_active_time');
      } catch (e) {}

      const now = Date.now();

      if (lastActive) {
        const timeElapsed = now - parseInt(lastActive, 10);
        if (timeElapsed > FIVE_MINUTES_MS) {
          try {
            sessionStorage.clear();
            localStorage.removeItem('cec_last_active_time');
            if (supabase) await supabase.auth.signOut();
          } catch (e) {}

          alert('Your session has expired due to 5 minutes of inactivity. Please log in again.');
          router.replace('/login');
          return;
        }
      }

      try {
        localStorage.setItem('cec_last_active_time', now.toString());
      } catch (e) {}
    };

    checkSessionActivity();

    const updateActivity = () => {
      try {
        localStorage.setItem('cec_last_active_time', Date.now().toString());
      } catch (e) {}
    };

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);
    window.addEventListener('touchstart', updateActivity);

    const intervalTimer = setInterval(checkSessionActivity, 10000);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      clearInterval(intervalTimer);
    };
  }, [router]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.Html5Qrcode) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Live Sync para sa Scanner Gate
  useEffect(() => {
    if (!supabase) return;

    const syncScannerGate = async () => {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'scanner_gate')
          .maybeSingle();

        if (!error && data) {
          setIsScannerGateOpen(data.value === 'open');
        }
      } catch (err) {}
    };

    syncScannerGate();
    const gatePollInterval = setInterval(syncScannerGate, 4000);

    return () => clearInterval(gatePollInterval);
  }, []);

  // Verification Access Clearance
  useEffect(() => {
    const verifyPortalAccess = async () => {
      try {
        setAuthChecking(true);

        const cachedEmail = typeof window !== 'undefined' ? sessionStorage.getItem('cec_user_email') : null;
        let userEmail = cachedEmail;

        if (supabase) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.email) userEmail = user.email;
        }

        if (!userEmail) {
          router.replace('/login');
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', userEmail.trim().toLowerCase())
          .maybeSingle();

        if (error || !profile) {
          router.replace('/login');
          return;
        }

        if (profile.role !== 'admin' && profile.role !== 'staff') {
          alert('Access Denied: Redirecting to Student Dashboard.');
          router.replace('/dashboard');
          return;
        }

        setUserRole(profile.role);
        setCurrentUser({
          name: profile.full_name || (profile.role === 'admin' ? 'System Administrator' : 'Staff Officer'),
          email: profile.email,
          school_id: profile.school_id || '',
          can_add_students: Boolean(profile.can_add_students),
        });

        if (profile.role === 'staff') {
          setActiveTab('scan-qr');
        }

        setIsAuthorized(true);
        fetchAllData();
      } catch (err) {
        console.error('Portal authorization error:', err);
        router.replace('/login');
      } finally {
        setAuthChecking(false);
      }
    };

    verifyPortalAccess();
  }, [router]);

  const fetchAllData = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesData) {
        setStudents(profilesData.filter((p) => p.role === 'student' || (!p.role && p.role !== 'admin' && p.role !== 'staff')));
        setStaffList(profilesData.filter((p) => p.role === 'admin' || p.role === 'staff' || p.can_scan === true));
      }

      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false });

      if (eventsData) {
        const now = new Date();
        const validatedEvents = await Promise.all(
          eventsData.map(async (ev) => {
            try {
              if (ev.date) {
                const timeParts = (ev.time_out || '23:59').split(':');
                const hours = parseInt(timeParts[0], 10) || 0;
                const minutes = parseInt(timeParts[1], 10) || 0;
                const eventEndDateTime = new Date(ev.date);
                eventEndDateTime.setHours(hours, minutes, 0, 0);

                if (now >= eventEndDateTime && ev.status === 'active') {
                  await supabase
                    .from('events')
                    .update({ status: 'inactive' })
                    .eq('id', ev.id);

                  return { ...ev, status: 'inactive' };
                }
              }
            } catch (checkErr) {}
            return ev;
          })
        );

        setEvents(validatedEvents);
        if (validatedEvents.length > 0 && !selectedEventId) {
          setSelectedEventId(validatedEvents[0].id);
        }
      }

      const { data: officersData } = await supabase
        .from('officers')
        .select('*')
        .order('id', { ascending: true });

      if (officersData) {
        setOfficersList(officersData);
      }
    } catch (err) {
      console.error('Error fetching database records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
    try {
      sessionStorage.clear();
      localStorage.removeItem('cec_last_active_time');
    } catch (e) {}
    router.replace('/');
  };

  const handleToggleScannerGate = async () => {
    if (userRole !== 'admin') return;
    const nextState = !isScannerGateOpen;
    setIsScannerGateOpen(nextState);

    try {
      await supabase
        .from('system_settings')
        .upsert({ key: 'scanner_gate', value: nextState ? 'open' : 'closed' }, { onConflict: 'key' });

      await supabase
        .from('profiles')
        .update({ can_scan: nextState })
        .eq('role', 'staff');

      showNotify('success', `Scanner Gate is now ${nextState ? 'OPEN (Active)' : 'CLOSED (Disabled for Staff)'}.`);
    } catch (err) {
      console.warn('Sync error:', err);
    }
  };

  // Toggle staff permission: can_add_students
  const handleToggleStaffAddStudentPermission = async (staffId, currentStatus, staffMemberName) => {
    if (userRole !== 'admin') {
      showNotify('error', 'Only administrators can change staff permissions.');
      return;
    }

    try {
      const nextStatus = !currentStatus;
      const { error } = await supabase
        .from('profiles')
        .update({ can_add_students: nextStatus })
        .eq('id', staffId);

      if (error) throw new Error(error.message);

      showNotify(
        'success',
        `Student Add permission for "${staffMemberName}" is now ${nextStatus ? 'ENABLED (Granted)' : 'DISABLED (Revoked)'}.`
      );
      fetchAllData();
    } catch (err) {
      showNotify('error', `Permission update failed: ${err.message}`);
    }
  };

  // STUDENT: ADD & EDIT
  const handleStartEditStudent = (st) => {
    setEditingStudentId(st.id);
    setStudentId(st.school_id || '');
    setStudentName(st.full_name || '');
    setStudentEmail(st.email || '');
    setStudentCourse(st.course || 'BSCRIM');
    setStudentYear(st.year_level || '1st Year');
    setStudentSection(st.section || 'Section A');

    if (studentFormRef.current) {
      studentFormRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancelEditStudent = () => {
    setEditingStudentId(null);
    setStudentId('');
    setStudentName('');
    setStudentEmail('');
    setStudentCourse('BSCRIM');
    setStudentYear('1st Year');
    setStudentSection('Section A');
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();

    if (userRole !== 'admin' && !currentUser.can_add_students) {
      showNotify('error', 'You do not have permission to add or update students.');
      return;
    }

    const idRegex = /^\d{4}-\d{4,5}$/;
    if (!idRegex.test(studentId.trim())) {
      showNotify('error', 'Invalid School ID format. Please use format: 2024-0616.');
      return;
    }

    const cleanEmail = studentEmail.trim().toLowerCase();

    if (editingStudentId) {
      setConfirmEditModal({
        isOpen: true,
        type: 'student',
        payload: {
          school_id: studentId.trim(),
          full_name: studentName.trim(),
          email: cleanEmail,
          course: studentCourse,
          year_level: studentYear,
          section: studentSection,
        },
        title: studentName.trim(),
      });
      return;
    }

    setLoading(true);
    try {
      const defaultPassword = studentId.trim();
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          school_id: studentId.trim(),
          full_name: studentName.trim(),
          email: cleanEmail,
          password: defaultPassword,
          course: studentCourse,
          year_level: studentYear,
          section: studentSection,
          role: 'student',
          can_scan: false,
          status: 'Active',
          must_change_password: true,
        },
      ]);

      if (profileError) throw new Error(profileError.message);

      showNotify('success', `Successfully added ${studentName.trim()} (${studentSection})! Default password: ${defaultPassword}`);
      handleCancelEditStudent();
      fetchAllData();
    } catch (err) {
      showNotify('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // OFFICER: ADD & EDIT
  const handleOfficerAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotify('error', 'Please select a valid image file (PNG, JPG, or JPEG).');
      return;
    }

    setCompressingOfficerAvatar(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        setOfficerAvatar(compressedBase64);
        setCompressingOfficerAvatar(false);
        showNotify('success', 'Officer photo attached successfully!');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleStartEditOfficer = (off) => {
    setEditingOfficerId(off.id);
    setOfficerName(off.name || '');
    setOfficerPosition(off.position || '');
    setOfficerDepartment(off.department || 'Supreme Student Government (SSG)');
    setOfficerTerm(off.term || '2026 - 2027');
    setOfficerAvatar(off.avatar_url || '');

    if (officerFormRef.current) {
      officerFormRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancelEditOfficer = () => {
    setEditingOfficerId(null);
    setOfficerName('');
    setOfficerPosition('');
    setOfficerDepartment('Supreme Student Government (SSG)');
    setOfficerTerm('2026 - 2027');
    setOfficerAvatar('');
  };

  const handleSaveOfficer = async (e) => {
    e.preventDefault();

    if (!officerName.trim() || !officerPosition.trim()) {
      showNotify('error', 'Please provide both the Officer Name and Position.');
      return;
    }

    if (editingOfficerId) {
      setConfirmEditModal({
        isOpen: true,
        type: 'officer',
        payload: {
          name: officerName.trim(),
          position: officerPosition.trim(),
          department: officerDepartment.trim(),
          term: officerTerm.trim(),
          avatar_url: officerAvatar || null,
        },
        title: officerName.trim(),
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('officers').insert([
        {
          name: officerName.trim(),
          position: officerPosition.trim(),
          department: officerDepartment.trim(),
          term: officerTerm.trim(),
          avatar_url: officerAvatar || null,
        },
      ]);

      if (error) throw new Error(error.message);

      showNotify('success', `Officer ${officerName.trim()} successfully registered as ${officerPosition.trim()}!`);
      handleCancelEditOfficer();
      fetchAllData();
    } catch (err) {
      showNotify('error', `Error saving officer: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteEditSave = async () => {
    if (!confirmEditModal.payload) return;
    setSavingEdit(true);

    try {
      if (confirmEditModal.type === 'student' && editingStudentId) {
        const { error } = await supabase
          .from('profiles')
          .update(confirmEditModal.payload)
          .eq('id', editingStudentId);

        if (error) throw new Error(error.message);

        showNotify('success', `Student "${confirmEditModal.title}" updated successfully!`);
        handleCancelEditStudent();
      } else if (confirmEditModal.type === 'officer' && editingOfficerId) {
        const { error } = await supabase
          .from('officers')
          .update(confirmEditModal.payload)
          .eq('id', editingOfficerId);

        if (error) throw new Error(error.message);

        showNotify('success', `Officer "${confirmEditModal.title}" updated successfully!`);
        handleCancelEditOfficer();
      }

      setConfirmEditModal({ isOpen: false, type: '', payload: null, title: '' });
      fetchAllData();
    } catch (err) {
      showNotify('error', `Update error: ${err.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  // EVENT HANDLERS
  const handleEventImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotify('error', 'Please select a valid image file (PNG, JPG, JPEG).');
      return;
    }

    setCompressingImage(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        setEventImage(compressedBase64);
        setCompressingImage(false);
        showNotify('success', 'Image optimized successfully!');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleStartEditEvent = (ev) => {
    setEditingEventId(ev.id);
    setEventTitle(ev.title || '');
    setEventLocation(ev.location || '');
    setEventDate(ev.date || '');
    setTimeIn(ev.time_in || '08:00');
    setTimeOut(ev.time_out || '17:00');
    setEventStatus(ev.status || 'active');
    setEventDesc(ev.description || '');
    setEventImage(ev.image_url || '');

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancelEditEvent = () => {
    setEditingEventId(null);
    setEventTitle('');
    setEventLocation('');
    setEventDate('');
    setTimeIn('08:00');
    setTimeOut('17:00');
    setEventStatus('active');
    setEventDesc('');
    setEventImage('');
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (compressingImage) {
      showNotify('error', 'Please wait for image optimization to finish.');
      return;
    }

    setLoading(true);

    try {
      const eventPayload = {
        title: eventTitle.trim(),
        location: eventLocation.trim(),
        date: eventDate,
        time_in: timeIn,
        time_out: timeOut,
        description: eventDesc.trim() || 'Official College Event',
        status: eventStatus,
        image_url: eventImage || null,
      };

      if (editingEventId) {
        const { error } = await supabase
          .from('events')
          .update(eventPayload)
          .eq('id', editingEventId);

        if (error) throw new Error(error.message);
        showNotify('success', `Event "${eventTitle}" updated successfully!`);
      } else {
        const { error } = await supabase
          .from('events')
          .insert([eventPayload]);

        if (error) throw new Error(error.message);
        showNotify('success', `Event "${eventTitle}" published successfully!`);
      }

      handleCancelEditEvent();
      fetchAllData();
    } catch (err) {
      showNotify('error', `Error saving event: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const triggerDeletePrompt = (type, id, title) => {
    if (userRole !== 'admin') {
      alert('Only administrators have permission to perform this action.');
      return;
    }
    setDeleteModal({ isOpen: true, type, id, title });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.id || userRole !== 'admin') return;
    setDeletingRecord(true);

    try {
      if (deleteModal.type === 'officer') {
        const { error } = await supabase.from('officers').delete().eq('id', deleteModal.id);
        if (error) throw new Error(error.message);
        showNotify('success', `Officer "${deleteModal.title}" removed successfully from the roster.`);
      } else if (deleteModal.type === 'event') {
        await supabase.from('attendance').delete().eq('event_id', deleteModal.id);
        const { error } = await supabase.from('events').delete().eq('id', deleteModal.id);
        if (error) throw new Error(error.message);
        showNotify('success', `Event "${deleteModal.title}" deleted successfully.`);
      } else if (deleteModal.type === 'student') {
        await supabase.from('attendance').delete().eq('student_id', deleteModal.title);
        const { error } = await supabase.from('profiles').delete().eq('id', deleteModal.id);
        if (error) throw new Error(error.message);
        showNotify('success', `Student record removed successfully.`);
      } else if (deleteModal.type === 'all_students') {
        await supabase.from('attendance').delete().neq('id', 0);
        const { error } = await supabase.from('profiles').delete().eq('role', 'student');
        if (error) throw new Error(error.message);
        showNotify('success', 'All enrolled student records have been permanently removed.');
      } else if (deleteModal.type === 'staff') {
        const targetStaff = staffList.find((s) => s.id === deleteModal.id);
        if (targetStaff && targetStaff.role === 'admin') {
          showNotify('error', 'Denied: The System Administrator account is permanent and cannot be revoked.');
          setDeleteModal({ isOpen: false, type: '', id: null, title: '' });
          setDeletingRecord(false);
          return;
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            role: 'student',
            can_scan: false,
            can_add_students: false,
          })
          .eq('id', deleteModal.id);

        if (updateError) throw new Error(updateError.message);

        showNotify('success', `Scanner access revoked for ${deleteModal.title}. Successfully returned to Student status.`);
      }

      setDeleteModal({ isOpen: false, type: '', id: null, title: '' });
      fetchAllData();
    } catch (err) {
      showNotify('error', `Action error: ${err.message}`);
    } finally {
      setDeletingRecord(false);
    }
  };

  const startCameraScanner = async () => {
    if (!selectedEventId) {
      showNotify('error', 'Please select an Active Event Schedule before scanning.');
      return;
    }

    if (!isScannerGateOpen) {
      showNotify('error', 'Scanner is currently CLOSED by Administrator. Please contact the Admin to turn it ON.');
      return;
    }

    if (!window.Html5Qrcode) {
      showNotify('error', 'Scanner library is loading. Please try again in a moment.');
      return;
    }

    setIsCameraModalOpen(true);
    setLiveScanFeedback(null);
    isProcessingScanRef.current = false;
    lastScannedCodeRef.current = '';

    setTimeout(async () => {
      try {
        const qrScanner = new window.Html5Qrcode('interactive-qr-reader');
        scannerRef.current = qrScanner;

        await qrScanner.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: { width: 280, height: 280 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            handleQrCodeDetected(decodedText);
          },
          () => {}
        );
      } catch (err) {
        console.error('Error starting camera scanner:', err);
        showNotify('error', 'Unable to access camera. Please ensure camera permissions are granted.');
        setIsCameraModalOpen(false);
      }
    }, 400);
  };

  const stopCameraScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Scanner stop warning:', err);
      }
      scannerRef.current = null;
    }
    isProcessingScanRef.current = false;
    lastScannedCodeRef.current = '';
  };

  const closeCameraModal = async () => {
    await stopCameraScanner();
    setIsCameraModalOpen(false);
    setLiveScanFeedback(null);
  };

  const handleAcknowledgeScan = () => {
    setLiveScanFeedback(null);
    setTimeout(() => {
      isProcessingScanRef.current = false;
      lastScannedCodeRef.current = '';
    }, 400);
  };

  const handleRejectScan = async () => {
    if (!liveScanFeedback) return;

    try {
      if (liveScanFeedback.actionType === 'inserted' && liveScanFeedback.attendanceId) {
        await supabase
          .from('attendance')
          .delete()
          .eq('id', liveScanFeedback.attendanceId);
      } else if (liveScanFeedback.actionType === 'updated_timeout' && liveScanFeedback.attendanceId) {
        await supabase
          .from('attendance')
          .update({ time_out: null })
          .eq('id', liveScanFeedback.attendanceId);
      }
      showNotify('info', `Cancelled record for ${liveScanFeedback.student?.full_name || 'student'}.`);
    } catch (err) {
      console.warn('Error undoing scan:', err);
    } finally {
      handleAcknowledgeScan();
    }
  };

  const handleQrCodeDetected = async (decodedText) => {
    let rawText = (decodedText || '').trim();
    if (!rawText) return;

    if (!isScannerGateOpen) {
      setLiveScanFeedback({
        type: 'error',
        title: 'SCANNER CLOSED',
        message: 'Attendance scanning is currently turned OFF by Administrator.',
      });
      return;
    }

    let cleanSchoolId = rawText;

    try {
      if (rawText.startsWith('{') && rawText.endsWith('}')) {
        const parsed = JSON.parse(rawText);
        cleanSchoolId = parsed.school_id || parsed.student_id || parsed.id || cleanSchoolId;
      }
    } catch (parseErr) {
      const match = rawText.match(/\d{4}-\d{4,5}/);
      if (match) cleanSchoolId = match[0];
    }

    cleanSchoolId = cleanSchoolId.trim();

    if (isProcessingScanRef.current) return;
    if (lastScannedCodeRef.current === cleanSchoolId) return;

    isProcessingScanRef.current = true;
    lastScannedCodeRef.current = cleanSchoolId;

    try {
      const { data: student, error } = await supabase
        .from('profiles')
        .select('school_id, full_name, course, year_level, section, avatar_url')
        .eq('school_id', cleanSchoolId)
        .maybeSingle();

      if (error || !student) {
        setLiveScanFeedback({
          type: 'error',
          title: 'ACCESS DENIED',
          message: `School ID "${cleanSchoolId}" not found in whitelist database.`,
        });
        return;
      }

      const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', student.school_id)
        .eq('event_id', selectedEventId)
        .maybeSingle();

      if (scanMode === 'time_in') {
        if (existingAttendance && existingAttendance.time_in) {
          playBeepSound();
          setLiveScanFeedback({
            type: 'warning',
            title: 'ALREADY TIMED IN',
            student,
            time: existingAttendance.time_in,
            mode: 'TIME IN',
            actionType: 'already_done',
          });
        } else if (existingAttendance) {
          await supabase
            .from('attendance')
            .update({
              time_in: currentTime,
              status: 'PRESENT',
            })
            .eq('id', existingAttendance.id);

          playBeepSound();
          setLiveScanFeedback({
            type: 'success',
            title: 'TIME IN RECORDED!',
            student,
            time: currentTime,
            mode: 'TIME IN',
            attendanceId: existingAttendance.id,
            actionType: 'updated_timein',
          });
        } else {
          const { data: insertedData } = await supabase.from('attendance').insert([
            {
              student_id: student.school_id,
              student_name: student.full_name || 'CEC Student',
              event_id: selectedEventId,
              status: 'PRESENT',
              time_in: currentTime,
              time_out: null,
              scanned_by: currentUser.email || userRole,
            },
          ]).select().maybeSingle();

          playBeepSound();
          setLiveScanFeedback({
            type: 'success',
            title: 'TIME IN RECORDED!',
            student,
            time: currentTime,
            mode: 'TIME IN',
            attendanceId: insertedData ? insertedData.id : null,
            actionType: 'inserted',
          });
        }
      }

      if (scanMode === 'time_out') {
        if (existingAttendance && existingAttendance.time_out && existingAttendance.time_out !== '--:--') {
          playBeepSound();
          setLiveScanFeedback({
            type: 'warning',
            title: 'ALREADY TIMED OUT',
            student,
            time: existingAttendance.time_out,
            mode: 'TIME OUT',
            actionType: 'already_done',
          });
        } else if (existingAttendance) {
          await supabase
            .from('attendance')
            .update({
              time_out: currentTime,
            })
            .eq('id', existingAttendance.id);

          playBeepSound();
          setLiveScanFeedback({
            type: 'success',
            title: 'TIME OUT RECORDED!',
            student,
            time: currentTime,
            mode: 'TIME OUT',
            attendanceId: existingAttendance.id,
            actionType: 'updated_timeout',
          });
        } else {
          const { data: insertedData } = await supabase.from('attendance').insert([
            {
              student_id: student.school_id,
              student_name: student.full_name || 'CEC Student',
              event_id: selectedEventId,
              status: 'PRESENT',
              time_in: null,
              time_out: currentTime,
              scanned_by: currentUser.email || userRole,
            },
          ]).select().maybeSingle();

          playBeepSound();
          setLiveScanFeedback({
            type: 'success',
            title: 'TIME OUT RECORDED!',
            student,
            time: currentTime,
            mode: 'TIME OUT',
            attendanceId: insertedData ? insertedData.id : null,
            actionType: 'inserted',
          });
        }
      }
    } catch (err) {
      console.error('Scan lookup error:', err);
    }
  };

  const handleSearchStudentHistory = async (e) => {
    e.preventDefault();
    const cleanId = searchHistoryId.trim();

    if (!cleanId) {
      setHistorySearchMessage('Please enter the student\'s School ID.');
      return;
    }

    setSearchingHistory(true);
    setHistorySearchMessage('');
    setSearchedStudent(null);
    setStudentAttendanceRecords([]);

    try {
      const { data: student, error: studentErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('school_id', cleanId)
        .maybeSingle();

      if (studentErr || !student) {
        setHistorySearchMessage(`No student found with School ID: "${cleanId}"`);
        setSearchingHistory(false);
        return;
      }

      setSearchedStudent(student);

      const { data: allEvents } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false });

      const { data: attLogs } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', cleanId);

      const logsMap = {};
      if (attLogs) {
        attLogs.forEach((log) => {
          logsMap[log.event_id] = log;
        });
      }

      const combinedRecords = (allEvents || []).map((ev) => {
        const matchingLog = logsMap[ev.id];
        const isPresent = Boolean(matchingLog && matchingLog.status === 'PRESENT');

        return {
          eventId: ev.id,
          eventTitle: ev.title,
          eventDate: ev.date,
          eventLocation: ev.location,
          scheduledTimeIn: ev.time_in,
          scheduledTimeOut: ev.time_out,
          status: isPresent ? 'PRESENT' : 'ABSENT',
          actualTimeIn: matchingLog && matchingLog.time_in ? formatTime12Hour(matchingLog.time_in) : '--:--',
          actualTimeOut: matchingLog && matchingLog.time_out ? formatTime12Hour(matchingLog.time_out) : '--:--',
          scannedBy: matchingLog ? matchingLog.scanned_by : 'N/A',
        };
      });

      setStudentAttendanceRecords(combinedRecords);
    } catch (err) {
      console.error('Error searching student history:', err);
      setHistorySearchMessage('An error occurred while retrieving attendance records.');
    } finally {
      setSearchingHistory(false);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (userRole !== 'admin') {
      showNotify('error', 'Only administrators can register or authorize staff.');
      return;
    }

    setLoading(true);
    const cleanEmail = staffEmail.trim().toLowerCase();

    try {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, can_scan, can_add_students')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingUser) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            can_scan: isScannerGateOpen,
            can_add_students: staffCanAddStudent,
            role: 'staff',
          })
          .eq('email', cleanEmail);

        if (updateError) throw new Error(updateError.message);

        showNotify(
          'success',
          `Account upgraded. Scanner clearance granted to ${existingUser.full_name} (Add Student: ${staffCanAddStudent ? 'Enabled' : 'Disabled'}).`
        );
      } else {
        const generatedStaffId = `STAFF-${Math.floor(1000 + Math.random() * 9000)}`;
        const { error: insertError } = await supabase.from('profiles').insert([
          {
            school_id: generatedStaffId,
            full_name: staffName.trim(),
            email: cleanEmail,
            password: generatedStaffId,
            role: 'staff',
            can_scan: isScannerGateOpen,
            can_add_students: staffCanAddStudent,
            status: 'Active',
            must_change_password: true,
          },
        ]);

        if (insertError) throw new Error(insertError.message);

        showNotify(
          'success',
          `Staff member ${staffName} successfully registered! Default password: ${generatedStaffId}`
        );
      }

      setStaffName('');
      setStaffEmail('');
      setStaffCanAddStudent(false);
      fetchAllData();
    } catch (err) {
      showNotify('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualScanSubmit = async (e) => {
    e.preventDefault();
    if (!manualStudentId) return;

    if (!isScannerGateOpen) {
      setScanLogMsg({ type: 'error', text: 'Scanner Gate is currently CLOSED by Administrator.' });
      return;
    }

    setScanLogMsg({ type: 'info', text: 'Validating School ID with database...' });

    const studentMatch = students.find(
      (s) => s.school_id?.toLowerCase() === manualStudentId.trim().toLowerCase()
    );

    if (!studentMatch) {
      setScanLogMsg({
        type: 'error',
        text: 'Access Denied: School ID is not registered in the whitelist database.',
      });
      return;
    }

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentMatch.school_id)
      .eq('event_id', selectedEventId)
      .maybeSingle();

    if (scanMode === 'time_in') {
      if (existing && existing.time_in) {
        setScanLogMsg({
          type: 'warning',
          text: `ALREADY TIMED IN: Recorded at ${existing.time_in} for ${studentMatch.full_name} (${studentMatch.school_id}).`,
        });
        return;
      }

      const { error } = await supabase.from('attendance').insert([
        {
          student_id: studentMatch.school_id,
          student_name: studentMatch.full_name || 'CEC Student',
          event_id: selectedEventId,
          status: 'PRESENT',
          time_in: currentTime,
          time_out: null,
          scanned_by: currentUser.email || userRole,
        },
      ]);

      if (error) {
        setScanLogMsg({ type: 'error', text: `Error: ${error.message}` });
      } else {
        playBeepSound();
        setScanLogMsg({
          type: 'success',
          text: `Time In confirmed: ${studentMatch.full_name} (${studentMatch.school_id}) at ${currentTime}.`,
        });
        setManualStudentId('');
      }
    } else {
      if (existing && existing.time_out && existing.time_out !== '--:--') {
        setScanLogMsg({
          type: 'warning',
          text: `ALREADY TIMED OUT: Recorded at ${existing.time_out} for ${studentMatch.full_name} (${studentMatch.school_id}).`,
        });
        return;
      }

      if (existing) {
        await supabase
          .from('attendance')
          .update({ time_out: currentTime })
          .eq('id', existing.id);
      } else {
        await supabase.from('attendance').insert([
          {
            student_id: studentMatch.school_id,
            student_name: studentMatch.full_name || 'CEC Student',
            event_id: selectedEventId,
            status: 'PRESENT',
            time_in: null,
            time_out: currentTime,
            scanned_by: currentUser.email || userRole,
          },
        ]);
      }

      playBeepSound();
      setScanLogMsg({
        type: 'success',
        text: `Time Out confirmed: ${studentMatch.full_name} (${studentMatch.school_id}) at ${currentTime}.`,
      });
      setManualStudentId('');
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.school_id?.toLowerCase().includes(searchStudentQuery.toLowerCase()) ||
      s.full_name?.toLowerCase().includes(searchStudentQuery.toLowerCase()) ||
      s.course?.toLowerCase().includes(searchStudentQuery.toLowerCase())
  );

  const filteredEvents = events.filter(
    (e) =>
      e.title?.toLowerCase().includes(searchEventQuery.toLowerCase()) ||
      e.location?.toLowerCase().includes(searchEventQuery.toLowerCase())
  );

  if (authChecking) {
    return (
      <div className="ad-root" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Styles />
        <div className="ad-spin" />
        <p style={{ fontWeight: 800, color: '#047857', margin: 0 }}>Verifying portal clearance...</p>
      </div>
    );
  }

  if (!isAuthorized) return null;

  const isAdmin = userRole === 'admin';
  const canAddStudentTab = isAdmin || currentUser.can_add_students;

  const historyPresentCount = studentAttendanceRecords.filter((r) => r.status === 'PRESENT').length;
  const historyAbsentCount = studentAttendanceRecords.filter((r) => r.status === 'ABSENT').length;
  const historyTotalEvents = studentAttendanceRecords.length;
  const historyComplianceRate = historyTotalEvents > 0 ? Math.round((historyPresentCount / historyTotalEvents) * 100) : 0;

  const activeEventObj = events.find((e) => e.id === selectedEventId);

  const navItems = [
    isAdmin && { id: 'profile', label: 'System overview', icon: 'grid' },
    canAddStudentTab && { id: 'add-student', label: 'Add student', icon: 'userplus' },
    isAdmin && { id: 'add-staff', label: 'Manage staff & scanners', icon: 'shield' },
    isAdmin && { id: 'add-event', label: 'Manage events', icon: 'cal' },
    isAdmin && { id: 'manage-officers', label: 'Manage officers', icon: 'award' },
    { id: 'scan-qr', label: 'Scan QR & quick log', icon: 'qr' },
    { id: 'search-student', label: 'Student records & logs', icon: 'list' },
  ].filter(Boolean);

  const modeIn = scanMode === 'time_in';

  return (
    <div className="ad-root">
      <Head>
        <title>CEC TRACK • {isAdmin ? 'Admin Portal' : 'Staff Portal'}</title>
      </Head>
      <Styles />

      {/* TOP HEADER */}
      <header className="ad-hd">
        <div className="ad-hl">
          <button type="button" className="ad-menu" onClick={() => setIsSidebarOpen(!isSidebarOpen)} aria-label="Toggle navigation menu">
            <Ic d={isSidebarOpen ? 'x' : 'menu'} s={20} />
          </button>
          <div className="ad-brand">
            <div><b>CEC TRACK</b><span className={`ad-chip ${isAdmin ? '' : 'staff'}`}>{isAdmin ? 'Admin' : 'Staff'}</span></div>
            <small>{isAdmin ? 'Administrator access' : 'Staff officer access'}</small>
          </div>
        </div>
        <span className="ad-camp"><Ic d="pin" s={15} /> Cateel Campus</span>
      </header>

      {isSidebarOpen && <div className="ad-bd" onClick={() => setIsSidebarOpen(false)} />}

      {showWelcomeToast && (
        <div className="ad-wt" role="status">
          <i><Ic d="check" s={13} w={3} /></i>
          Welcome to the {isAdmin ? 'Admin' : 'Staff'} Portal!
          <button type="button" onClick={() => setShowWelcomeToast(false)} aria-label="Close"><Ic d="x" s={14} /></button>
        </div>
      )}

      <div className="ad-shell">
        {/* SIDEBAR NAVIGATION */}
        <aside className={`ad-side ${isSidebarOpen ? 'open' : ''}`}>
          <div>
            <div className="ad-st">
              <div>
                <h2>Portal menu</h2>
                <small>{isAdmin ? 'Administrator access' : 'Staff officer access'}</small>
              </div>
              {isSidebarOpen && (
                <button type="button" className="ad-xb" onClick={() => setIsSidebarOpen(false)} aria-label="Close menu"><Ic d="x" s={16} /></button>
              )}
            </div>
            <nav className="ad-nav">
              {navItems.map((n) => (
                <button type="button" key={n.id} className={activeTab === n.id ? 'on' : ''} onClick={() => { setActiveTab(n.id); setIsSidebarOpen(false); }}>
                  <Ic d={n.icon} s={19} /> <span>{n.label}</span>
                </button>
              ))}
            </nav>
          </div>
          <div style={{ paddingTop: 16 }}>
            <button type="button" className="ad-so" onClick={() => setIsLogoutModalOpen(true)}>
              <Ic d="out" s={19} /> <span>Sign out</span>
            </button>
          </div>
        </aside>

        {/* MAIN BODY VIEWPORT */}
        <main className="ad-main">
          <div className="ad-wrap">
            {notification.message && (
              <div className={`ad-toast ${notification.type === 'error' ? 'er' : 'ok'}`} role="status">
                <Ic d={notification.type === 'error' ? 'alert' : 'check'} s={18} /> {notification.message}
              </div>
            )}

            {/* TAB 1: SYSTEM OVERVIEW */}
            {activeTab === 'profile' && isAdmin && (
              <div>
                <PageHead icon="grid" badge="Command center" title="System overview" sub="Official administration & attendance hub." />
                <div className="ad-g4">
                  <Stat label="Enrolled students" value={students.length} />
                  <Stat label="Authorized staff" value={staffList.length} tone="g" />
                  <Stat label="Campus officers" value={officersList.length} tone="g" />
                  <Stat label="Total events" value={events.length} />
                </div>

                <div className="ad-card">
                  <div className="ad-ct"><h3><span className="ad-ci"><Ic d="users" s={19} /></span> Students distribution by course</h3></div>
                  <div className="ad-cg">
                    {courses.map((c) => (
                      <div key={c.code} className="ad-cc" style={{ '--a': COURSE_COLORS[c.code] }}>
                        <span className="ad-cb">{c.code}</span>
                        <div className="ad-cn">{students.filter((s) => s.course === c.code).length}</div>
                        <div className="ad-cm">{c.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ADD & EDIT STUDENT (STICKY FORM) */}
            {activeTab === 'add-student' && canAddStudentTab && (
              <div>
                <PageHead icon="userplus" badge="Enrollment" title="Add student" sub="Register students to the official whitelist." />
                <div className="ad-g2">
                  <div className="ad-card ad-sticky" ref={studentFormRef}>
                    <div className="ad-ct">
                      <h3><span className="ad-ci"><Ic d={editingStudentId ? 'pencil' : 'userplus'} s={19} /></span> {editingStudentId ? 'Edit student details' : 'Add student'}</h3>
                      {editingStudentId && (
                        <button type="button" className="ad-b neu sm" onClick={handleCancelEditStudent}><Ic d="x" s={14} /> Cancel edit</button>
                      )}
                    </div>

                    <form className="ad-fm" onSubmit={handleSaveStudent}>
                      <Field label="School ID (format: 2024-0616) *">
                        <input className="ad-in" type="text" placeholder="e.g. 2024-0616" value={studentId} onChange={(e) => setStudentId(e.target.value)} pattern="\d{4}-\d{4,5}" required />
                      </Field>
                      <Field label="Full name *">
                        <input className="ad-in" type="text" placeholder="e.g. Juan Dela Cruz" value={studentName} onChange={(e) => setStudentName(e.target.value)} required />
                      </Field>
                      <Field label="Student email address *">
                        <input className="ad-in" type="email" placeholder="e.g. student@dorsu.edu.ph" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} required />
                      </Field>
                      <div className="ad-2">
                        <Field label="Course">
                          <select className="ad-in" value={studentCourse} onChange={(e) => setStudentCourse(e.target.value)}>
                            {courses.map((c) => (<option key={c.code} value={c.code}>{c.code}</option>))}
                          </select>
                        </Field>
                        <Field label="Year level">
                          <select className="ad-in" value={studentYear} onChange={(e) => setStudentYear(e.target.value)}>
                            {['1st Year', '2nd Year', '3rd Year', '4th Year'].map((y) => (<option key={y} value={y}>{y}</option>))}
                          </select>
                        </Field>
                      </div>
                      <Field label="Section (A - K) *">
                        <select className="ad-in" value={studentSection} onChange={(e) => setStudentSection(e.target.value)}>
                          {sectionsList.map((sec) => (<option key={sec} value={sec}>{sec}</option>))}
                        </select>
                      </Field>
                      <FormButtons editing={Boolean(editingStudentId)} saving={loading} onCancel={handleCancelEditStudent} addLabel="Add student" saveLabel="Save changes" />
                    </form>
                  </div>

                  {/* ENROLLED STUDENTS LIST */}
                  <div className="ad-card">
                    <div className="ad-ct">
                      <h3><span className="ad-ci"><Ic d="users" s={19} /></span> Enrolled students ({filteredStudents.length})</h3>
                      <div className="ad-ra">
                        <SearchBox value={searchStudentQuery} onChange={(e) => setSearchStudentQuery(e.target.value)} placeholder="Search..." />
                        {isAdmin && students.length > 0 && (
                          <button type="button" className="ad-b dng sm" onClick={() => triggerDeletePrompt('all_students', 'ALL', 'ALL enrolled students')}>
                            <Ic d="trash" s={14} /> Remove all
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="ad-tw">
                      <table>
                        <thead>
                          <tr><th>Student ID</th><th>Student details</th><th>Course &amp; section</th><th style={{ textAlign: 'center' }}>Action</th></tr>
                        </thead>
                        <tbody>
                          {filteredStudents.length === 0 ? (
                            <tr><td colSpan={4} className="ad-empty">No student records found.</td></tr>
                          ) : (
                            filteredStudents.map((st) => (
                              <tr key={st.id}>
                                <td className="ad-id">{st.school_id}</td>
                                <td><b>{st.full_name}</b><small>{st.email}</small></td>
                                <td>
                                  <span className="ad-pill" style={{ color: COURSE_COLORS[st.course] || '#047857' }}>{st.course}</span>
                                  <small style={{ color: '#047857', fontWeight: 800 }}>{st.section || 'Section A'} • {st.year_level || '1st Year'}</small>
                                </td>
                                <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                  <EditActions onEdit={() => handleStartEditStudent(st)} onDel={isAdmin ? () => triggerDeletePrompt('student', st.id, st.school_id) : null} delLabel="Remove" />
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: MANAGE STAFF & AUTHORIZED SCANNERS */}
            {activeTab === 'add-staff' && isAdmin && (
              <div>
                <PageHead icon="shield" badge="Access control" title="Manage staff & scanners" sub="Authorize officers who can scan attendance." />
                <div className="ad-g2">
                  <div className="ad-card ad-sticky">
                    <div className="ad-ct"><h3><span className="ad-ci"><Ic d="shield" s={19} /></span> Authorize staff / student scanner</h3></div>
                    <form className="ad-fm" onSubmit={handleAddStaff}>
                      <Field label="Staff / student name *">
                        <input className="ad-in" type="text" placeholder="e.g. Maria Santos" value={staffName} onChange={(e) => setStaffName(e.target.value)} required />
                      </Field>
                      <Field label="Registered email address *">
                        <input className="ad-in" type="email" placeholder="e.g. maria@dorsu.edu.ph" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} required />
                      </Field>
                      <Field label="Designation / title">
                        <input className="ad-in" type="text" value={staffRole} onChange={(e) => setStaffRole(e.target.value)} />
                      </Field>

                      <div className={`ad-tg ${staffCanAddStudent ? 'on' : ''}`}>
                        <div>
                          <b>Allow adding students</b>
                          <small>{staffCanAddStudent ? 'Staff can register new students' : 'Only allowed to scan attendance'}</small>
                        </div>
                        <Switch checked={staffCanAddStudent} onChange={(e) => setStaffCanAddStudent(e.target.checked)} />
                      </div>

                      <button type="submit" className="ad-b pri full" disabled={loading}>
                        {loading ? 'Authorizing...' : 'Authorize scanner privilege'}
                      </button>
                    </form>
                  </div>

                  <div className="ad-card">
                    <div className="ad-ct"><h3><span className="ad-ci"><Ic d="users" s={19} /></span> Authorized scanners ({staffList.length})</h3></div>
                    {staffList.length === 0 ? (
                      <div className="ad-empty">No authorized scanners registered yet.</div>
                    ) : (
                      <div className="ad-list">
                        {staffList.map((st) => {
                          const isPermanentAdmin = st.role === 'admin';
                          const canAddSt = Boolean(st.can_add_students);
                          return (
                            <div key={st.id} className={`ad-sc ${isPermanentAdmin ? 'adm' : ''}`}>
                              <div className="ad-scr">
                                <div className="ad-rl">
                                  <span className="ad-th round" style={{ width: 44, height: 44 }}><Ic d="user" s={22} /></span>
                                  <div className="ad-rt">
                                    <h4>{st.full_name} {isPermanentAdmin && <span className="ad-pill" style={{ marginLeft: 4 }}>Admin</span>}</h4>
                                    <div>{st.email}</div>
                                  </div>
                                </div>
                                {isPermanentAdmin ? (
                                  <span className="ad-pill" style={{ flexShrink: 0 }}><Ic d="lock" s={13} /> Permanent admin</span>
                                ) : (
                                  <button type="button" className="ad-b org sm" onClick={() => triggerDeletePrompt('staff', st.id, st.full_name)}>Revoke</button>
                                )}
                              </div>

                              {!isPermanentAdmin && (
                                <div className={`ad-perm ${canAddSt ? 'on' : ''}`}>
                                  <span>Can add student: <strong>{canAddSt ? 'ALLOWED' : 'LOCKED'}</strong></span>
                                  <button
                                    type="button"
                                    className={`ad-b sm ${canAddSt ? 'dng' : 'out'}`}
                                    onClick={() => handleToggleStaffAddStudentPermission(st.id, canAddSt, st.full_name)}
                                  >
                                    {canAddSt ? 'Revoke permission' : 'Grant permission'}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: MANAGE EVENTS */}
            {activeTab === 'add-event' && isAdmin && (
              <div>
                <PageHead icon="cal" badge="Events" title="Manage events" sub="Publish and update official campus activities." />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                  <div className="ad-card" ref={formRef}>
                    <div className="ad-ct">
                      <h3><span className="ad-ci"><Ic d={editingEventId ? 'pencil' : 'plus'} s={19} /></span> {editingEventId ? 'Edit event' : 'Publish new event'}</h3>
                      {editingEventId && <button type="button" className="ad-b neu sm" onClick={handleCancelEditEvent}><Ic d="x" s={14} /> Cancel edit</button>}
                    </div>

                    <form className="ad-fm" onSubmit={handleSaveEvent}>
                      <Field label="Event poster">
                        <input type="file" ref={eventImageInputRef} onChange={handleEventImageUpload} accept="image/*" style={{ display: 'none' }} />
                        <div className="ad-up" onClick={() => eventImageInputRef.current?.click()}>
                          {compressingImage ? (
                            'Optimizing image...'
                          ) : eventImage ? (
                            <><img src={eventImage} alt="Event preview" /><span>Click to change picture</span></>
                          ) : (
                            <><Ic d="img" s={30} w={1.7} /> Upload event picture</>
                          )}
                        </div>
                      </Field>
                      <Field label="Event title *">
                        <input className="ad-in" type="text" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} required />
                      </Field>
                      <div className="ad-2">
                        <Field label="Location *">
                          <input className="ad-in" type="text" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} required />
                        </Field>
                        <Field label="Mode">
                          <select className="ad-in" value={eventStatus} onChange={(e) => setEventStatus(e.target.value)}>
                            <option value="active">Active (Open)</option>
                            <option value="inactive">Inactive (Closed)</option>
                          </select>
                        </Field>
                      </div>
                      <div className="ad-2">
                        <Field label="Event date *">
                          <input className="ad-in" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
                        </Field>
                        <div className="ad-2" style={{ gap: 8 }}>
                          <Field label="Time in *">
                            <input className="ad-in" type="time" value={timeIn} onChange={(e) => setTimeIn(e.target.value)} required />
                          </Field>
                          <Field label="Time out *">
                            <input className="ad-in" type="time" value={timeOut} onChange={(e) => setTimeOut(e.target.value)} required />
                          </Field>
                        </div>
                      </div>
                      <Field label="Description">
                        <textarea className="ad-in" rows="2" value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} placeholder="Brief details..." />
                      </Field>
                      <FormButtons editing={Boolean(editingEventId)} saving={loading} disabled={compressingImage} onCancel={handleCancelEditEvent} addLabel="Publish event" saveLabel="Save changes" />
                    </form>
                  </div>

                  {/* PUBLISHED EVENTS */}
                  <div className="ad-card">
                    <div className="ad-ct">
                      <h3><span className="ad-ci"><Ic d="cal" s={19} /></span> Published events ({filteredEvents.length})</h3>
                      <SearchBox value={searchEventQuery} onChange={(e) => setSearchEventQuery(e.target.value)} placeholder="Search event..." />
                    </div>

                    {filteredEvents.length === 0 ? (
                      <div className="ad-empty">No events found.</div>
                    ) : (
                      <div className="ad-list">
                        {filteredEvents.map((ev) => {
                          const isActive = ev.status === 'active';
                          return (
                            <div key={ev.id} className={`ad-row ${editingEventId === ev.id ? 'sel' : ''}`}>
                              <div className="ad-rl">
                                <span className="ad-th">{ev.image_url ? <img src={ev.image_url} alt="Event" /> : <Ic d="cal" s={22} />}</span>
                                <div className="ad-rt">
                                  <h4>{ev.title}</h4>
                                  <div className="g">{ev.location || 'FaCET Facade'}</div>
                                  <div>{ev.date} • {formatTime12Hour(ev.time_in)} - {formatTime12Hour(ev.time_out)}</div>
                                </div>
                              </div>
                              <div className="ad-re">
                                <span className={`ad-pill ${isActive ? '' : 'mu'}`}>{isActive ? 'Active' : 'Closed'}</span>
                                <EditActions onEdit={() => handleStartEditEvent(ev)} onDel={() => triggerDeletePrompt('event', ev.id, ev.title)} delLabel="Delete" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: MANAGE OFFICERS */}
            {activeTab === 'manage-officers' && isAdmin && (
              <div>
                <PageHead icon="award" badge="Leadership" title="Manage officers" sub="Publish the official student leadership roster." />
                <div className="ad-g2">
                  <div className="ad-card ad-sticky" ref={officerFormRef}>
                    <div className="ad-ct">
                      <h3><span className="ad-ci"><Ic d={editingOfficerId ? 'pencil' : 'plus'} s={19} /></span> {editingOfficerId ? 'Edit officer' : 'Add officer'}</h3>
                      {editingOfficerId && <button type="button" className="ad-b neu sm" onClick={handleCancelEditOfficer}><Ic d="x" s={14} /> Cancel edit</button>}
                    </div>

                    <form className="ad-fm" onSubmit={handleSaveOfficer}>
                      <input type="file" ref={officerAvatarInputRef} onChange={handleOfficerAvatarUpload} accept="image/*" style={{ display: 'none' }} />
                      <Field label="Officer 2x2 / formal photo">
                        <div className="ad-up" onClick={() => officerAvatarInputRef.current?.click()}>
                          {compressingOfficerAvatar ? (
                            'Compressing image...'
                          ) : officerAvatar ? (
                            <><img className="av" src={officerAvatar} alt="Officer preview" /><span>Click to change photo</span></>
                          ) : (
                            <><Ic d="user" s={30} w={1.7} /> Upload formal photo</>
                          )}
                        </div>
                      </Field>
                      <Field label="Full name *">
                        <input className="ad-in" type="text" placeholder="e.g. Juan Dela Cruz" value={officerName} onChange={(e) => setOfficerName(e.target.value)} required />
                      </Field>
                      <Field label="Official position / role *">
                        <input className="ad-in" type="text" placeholder="e.g. President, Vice President, Treasurer" value={officerPosition} onChange={(e) => setOfficerPosition(e.target.value)} required />
                      </Field>
                      <Field label="Department / council">
                        <select className="ad-in" value={officerDepartment} onChange={(e) => setOfficerDepartment(e.target.value)}>
                          {['Supreme Student Government (SSG)', 'BSCRIM Department', 'BSBA Department', 'BSA Department', 'BEED Department', 'BSAM Department'].map((d) => (<option key={d} value={d}>{d}</option>))}
                        </select>
                      </Field>
                      <Field label="Term / academic year">
                        <input className="ad-in" type="text" value={officerTerm} onChange={(e) => setOfficerTerm(e.target.value)} />
                      </Field>
                      <FormButtons editing={Boolean(editingOfficerId)} saving={loading} disabled={compressingOfficerAvatar} onCancel={handleCancelEditOfficer} addLabel="Publish officer" saveLabel="Save changes" />
                    </form>
                  </div>

                  <div className="ad-card">
                    <div className="ad-ct"><h3><span className="ad-ci"><Ic d="award" s={19} /></span> Official officers roster ({officersList.length})</h3></div>
                    {officersList.length === 0 ? (
                      <div className="ad-empty">No officers registered yet.</div>
                    ) : (
                      <div className="ad-list">
                        {officersList.map((off) => (
                          <div key={off.id} className="ad-row">
                            <div className="ad-rl">
                              <span className="ad-th round">{off.avatar_url ? <img src={off.avatar_url} alt={off.name} /> : <Ic d="user" s={24} />}</span>
                              <div className="ad-rt">
                                <h4>{off.name}</h4>
                                <div className="g">{off.position}</div>
                                <div>{off.department} • {off.term}</div>
                              </div>
                            </div>
                            <EditActions onEdit={() => handleStartEditOfficer(off)} onDel={() => triggerDeletePrompt('officer', off.id, off.name)} delLabel="Remove" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: SCAN QR & QUICK LOG */}
            {activeTab === 'scan-qr' && (
              <div>
                <PageHead icon="qr" badge="Attendance scanner" title="Scan QR & quick log" sub="Record time-in and time-out for official events." />
                <div className="ad-g2 even">
                  <div className="ad-card ad-center">
                    <div className="ad-ct" style={{ justifyContent: 'center' }}><h3><span className="ad-ci"><Ic d="scan" s={19} /></span> Live attendance QR scanner</h3></div>
                    <p className="ad-sub" style={{ marginTop: -6 }}>Configure the scanning mode and schedule below, then launch the continuous camera scanner.</p>

                    {/* SCANNER GATE TOGGLE */}
                    <div className={`ad-gate ${isScannerGateOpen ? 'on' : 'off'}`}>
                      <div>
                        <b>Scanner gate: {isScannerGateOpen ? 'OPEN (accepting scans)' : 'CLOSED (paused)'}</b>
                        <small>{isScannerGateOpen ? 'Students and staff can scan right now' : 'Attendance logging is stopped by Administrator'}</small>
                      </div>
                      {isAdmin ? (
                        <button type="button" className={`ad-b sm ${isScannerGateOpen ? 'pri' : 'dsol'}`} onClick={handleToggleScannerGate}>
                          <Ic d="power" s={15} /> {isScannerGateOpen ? 'Turn OFF' : 'Turn ON'}
                        </button>
                      ) : (
                        <span className="ad-pill mu">Admin controlled</span>
                      )}
                    </div>

                    {/* TIME IN vs TIME OUT */}
                    <div style={{ textAlign: 'left', marginBottom: 16 }}>
                      <label className="ad-l">Select scanner mode</label>
                      <div className="ad-seg">
                        <button type="button" className={modeIn ? 'in' : ''} onClick={() => setScanMode('time_in')}><Ic d="check" s={16} /> Time in</button>
                        <button type="button" className={!modeIn ? 'ou' : ''} onClick={() => setScanMode('time_out')}><Ic d="clock" s={16} /> Time out</button>
                      </div>
                    </div>

                    {/* TARGET EVENT */}
                    <div style={{ textAlign: 'left', marginBottom: 18 }}>
                      <label className="ad-l">Target event schedule</label>
                      <select className="ad-in" value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
                        {events.map((ev) => (
                          <option key={ev.id} value={ev.id}>
                            {ev.title} ({ev.date}) - In: {formatTime12Hour(ev.time_in)} / Out: {formatTime12Hour(ev.time_out)}
                          </option>
                        ))}
                      </select>
                      {activeEventObj && (
                        <div className="ad-note">
                          <strong style={{ color: '#0b2a1e' }}>Scheduled hours: </strong>
                          Time in starts <strong style={{ color: '#047857' }}>{formatTime12Hour(activeEventObj.time_in)}</strong> • Time out <strong style={{ color: '#2563eb' }}>{formatTime12Hour(activeEventObj.time_out)}</strong>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className={`ad-b full ${!isScannerGateOpen ? 'gray' : modeIn ? 'pri' : 'blue'}`}
                      style={{ height: 48 }}
                      onClick={startCameraScanner}
                      disabled={!isScannerGateOpen}
                    >
                      <Ic d="cam" s={18} /> {!isScannerGateOpen ? 'Scanner gate is closed by admin' : `Launch ${modeIn ? 'time in' : 'time out'} scanner`}
                    </button>
                  </div>

                  {/* MANUAL CHECK-IN */}
                  <div className="ad-card">
                    <div className="ad-ct"><h3><span className="ad-ci"><Ic d="list" s={19} /></span> Manual school ID check-in</h3></div>
                    <p className="ad-sub" style={{ marginTop: -6 }}>
                      Mode: <strong style={{ color: modeIn ? '#047857' : '#2563eb' }}>{scanMode.toUpperCase()}</strong>. For students without smartphones or camera issues.
                    </p>

                    <form className="ad-fm" onSubmit={handleManualScanSubmit}>
                      <Field label="School ID (e.g. 2024-0616) *">
                        <input className="ad-in" type="text" placeholder="e.g. 2024-0616" value={manualStudentId} onChange={(e) => setManualStudentId(e.target.value)} required />
                      </Field>
                      <button type="submit" className={`ad-b full ${!isScannerGateOpen ? 'gray' : modeIn ? 'pri' : 'blue'}`} disabled={!isScannerGateOpen}>
                        {!isScannerGateOpen ? 'Scanner closed' : `Mark ${modeIn ? 'time in' : 'time out'}`}
                      </button>
                    </form>

                    {scanLogMsg.text && <div className={`ad-msg ${scanLogMsg.type}`}>{scanLogMsg.text}</div>}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: SEARCH STUDENT ATTENDANCE HISTORY */}
            {activeTab === 'search-student' && (
              <div style={{ maxWidth: 940, margin: '0 auto' }}>
                <PageHead icon="list" badge="Records" title="Student records & logs" sub="View complete attendance history of any student." />

                <div className="ad-card" style={{ marginBottom: 20 }}>
                  <div className="ad-ct"><h3><span className="ad-ci"><Ic d="search" s={19} /></span> Search student attendance records</h3></div>
                  <p className="ad-sub" style={{ marginTop: -6 }}>Enter the student&apos;s School ID to view total Present, Absent, and complete Time In / Time Out logs across all events.</p>
                  <form onSubmit={handleSearchStudentHistory} className="ad-ra" style={{ flexWrap: 'nowrap' }}>
                    <input className="ad-in" style={{ flex: 1, minWidth: 0 }} type="text" placeholder="e.g. 2024-0616" value={searchHistoryId} onChange={(e) => setSearchHistoryId(e.target.value)} required />
                    <button type="submit" className="ad-b pri" disabled={searchingHistory}><Ic d="search" s={16} /> {searchingHistory ? 'Searching...' : 'Search'}</button>
                  </form>
                  {historySearchMessage && <div className="ad-msg error">{historySearchMessage}</div>}
                </div>

                {searchedStudent && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div className="ad-card">
                      <div className="ad-pf">
                        <div className="ad-pa">{searchedStudent.avatar_url ? <img src={searchedStudent.avatar_url} alt={searchedStudent.full_name} /> : <Ic d="user" s={34} w={1.7} />}</div>
                        <div style={{ flex: 1, minWidth: 180 }}>
                          <span className="ad-pill"><Ic d="shield" s={13} /> Verified student</span>
                          <h2>{searchedStudent.full_name}</h2>
                          <p>ID: {searchedStudent.school_id} • {searchedStudent.course} ({searchedStudent.section || 'Section A'})</p>
                          <small>{searchedStudent.email}</small>
                        </div>
                      </div>
                    </div>

                    <div className="ad-g4" style={{ margin: 0 }}>
                      <Stat label="Total events" value={historyTotalEvents} />
                      <Stat label="Total present" value={historyPresentCount} tone="g" />
                      <Stat label="Total absences" value={historyAbsentCount} tone={historyAbsentCount > 0 ? 'r' : 'g'} />
                      <Stat label="Compliance rate" value={`${historyComplianceRate}%`} tone="g" />
                    </div>

                    <div className="ad-card">
                      <div className="ad-ct"><h3><span className="ad-ci"><Ic d="list" s={19} /></span> Detailed event attendance logs ({studentAttendanceRecords.length})</h3></div>
                      {studentAttendanceRecords.length === 0 ? (
                        <div className="ad-empty">No events recorded.</div>
                      ) : (
                        <div className="ad-list">
                          {studentAttendanceRecords.map((record) => {
                            const isPresent = record.status === 'PRESENT';
                            return (
                              <div key={record.eventId} className={`ad-lg ${isPresent ? '' : 'ab'}`}>
                                <div className="ad-lgt">
                                  <div>
                                    <h4>{record.eventTitle}</h4>
                                    <div>{record.eventLocation || 'FaCET Facade'}</div>
                                  </div>
                                  <span className={`ad-pill ${isPresent ? '' : 'no'}`}><Ic d={isPresent ? 'check' : 'x'} s={13} w={3} /> {isPresent ? 'Present' : 'Absent'}</span>
                                </div>
                                <div className="ad-lgg">
                                  <div><small>Date</small><b>{record.eventDate}</b></div>
                                  <div><small>Time in</small><b style={{ color: isPresent ? '#047857' : '#9db2a8' }}>{record.actualTimeIn}</b></div>
                                  <div><small>Time out</small><b style={{ color: isPresent ? '#047857' : '#9db2a8' }}>{record.actualTimeOut}</b></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* CONTINUOUS CAMERA SCANNER MODAL */}
      {isCameraModalOpen && (
        <div className="ad-ov" style={{ zIndex: 110 }}>
          <div className="ad-md sc">
            <div className="ad-mh">
              <span className={`ad-pill ${modeIn ? '' : 'no'}`} style={modeIn ? {} : { background: '#dbeafe', color: '#1d4ed8' }}>● {modeIn ? 'Time in mode' : 'Time out mode'}</span>
              <button type="button" className="ad-xb" onClick={closeCameraModal} aria-label="Close camera"><Ic d="x" s={16} /></button>
            </div>
            <div className="ad-rd"><div id="interactive-qr-reader" style={{ width: '100%', height: '100%' }} /></div>
            <button type="button" className="ad-b dsol full" onClick={closeCameraModal}>Close camera</button>
          </div>
        </div>
      )}

      {/* LIVE SCAN FEEDBACK CARD */}
      {liveScanFeedback && (
        <div className="ad-ov" style={{ zIndex: 140 }}>
          <div className="ad-md sc" style={{ border: `2px solid ${liveScanFeedback.type === 'success' ? '#86efac' : liveScanFeedback.type === 'warning' ? '#fde047' : '#fca5a5'}` }}>
            <span className={`ad-fbt ${liveScanFeedback.type}`}>
              <Ic d={liveScanFeedback.type === 'success' ? 'check' : 'alert'} s={15} w={3} /> {liveScanFeedback.title}
            </span>

            {liveScanFeedback.student ? (
              <div>
                <div className={`ad-fbp ${liveScanFeedback.type === 'success' ? '' : 'warn'}`}>
                  {liveScanFeedback.student.avatar_url ? <img src={liveScanFeedback.student.avatar_url} alt={liveScanFeedback.student.full_name} /> : <Ic d="user" s={56} w={1.6} />}
                </div>
                <h3 style={{ fontSize: '1.35rem', marginBottom: 4 }}>{liveScanFeedback.student.full_name}</h3>
                <div style={{ fontSize: '.95rem', fontWeight: 800, color: '#047857', marginBottom: 14 }}>ID: {liveScanFeedback.student.school_id}</div>

                <div className="ad-fbs">
                  <div><span>Program / course</span><strong>{liveScanFeedback.student.course}</strong></div>
                  <div><span>Year &amp; section</span><strong>{liveScanFeedback.student.year_level || '1st Year'} • {liveScanFeedback.student.section || 'Section A'}</strong></div>
                  <div><span>Recorded time</span><strong style={{ color: liveScanFeedback.type === 'success' ? '#047857' : '#ea580c' }}>{formatTime12Hour(liveScanFeedback.time)} ({liveScanFeedback.mode})</strong></div>
                </div>

                <div className="ad-ma">
                  <button type="button" className="ad-b neu" onClick={handleRejectScan}><Ic d="x" s={16} /> No (cancel)</button>
                  <button type="button" className="ad-b pri" onClick={handleAcknowledgeScan}><Ic d="check" s={16} /> OK (next)</button>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ marginTop: 6 }}>{liveScanFeedback.message}</p>
                <button type="button" className="ad-b dsol full" onClick={handleAcknowledgeScan}>OK • try next QR</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONFIRM EDIT MODAL */}
      {confirmEditModal.isOpen && (
        <div className="ad-ov" style={{ zIndex: 160 }}>
          <div className="ad-md">
            <div className="ad-mi"><Ic d="pencil" s={26} /></div>
            <h3>Confirm changes</h3>
            <p>Are you sure you want to save the changes made to <strong>&quot;{confirmEditModal.title}&quot;</strong>?</p>
            <div className="ad-ma">
              <button type="button" className="ad-b neu" onClick={() => setConfirmEditModal({ isOpen: false, type: '', payload: null, title: '' })} disabled={savingEdit}>No, cancel</button>
              <button type="button" className="ad-b pri" onClick={handleExecuteEditSave} disabled={savingEdit}>{savingEdit ? 'Saving...' : 'Yes, save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* SIGN OUT / LOGOUT CONFIRMATION MODAL */}
      {isLogoutModalOpen && (
        <div className="ad-ov" style={{ zIndex: 170 }}>
          <div className="ad-md" role="dialog" aria-modal="true" aria-label="Sign out">
            <div className="ad-mi red"><Ic d="out" s={26} /></div>
            <h3>Sign out</h3>
            <p>Are you sure you want to log out of the Admin Portal?</p>
            <div className="ad-ma">
              <button type="button" className="ad-b neu" onClick={() => setIsLogoutModalOpen(false)}>Cancel</button>
              <button type="button" className="ad-b dsol" onClick={handleConfirmSignOut}><Ic d="out" s={17} /> Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* IN-APP DELETE / REVOKE CONFIRMATION MODAL */}
      {deleteModal.isOpen && (
        <div className="ad-ov" style={{ zIndex: 150 }}>
          <div className="ad-md">
            <div className={`ad-mi ${deleteModal.type === 'staff' ? 'org' : 'red'}`}><Ic d={deleteModal.type === 'staff' ? 'shield' : 'trash'} s={26} /></div>
            <h3>{deleteModal.type === 'staff' ? 'Revoke scanner access' : 'Confirm delete'}</h3>
            <p>
              {deleteModal.type === 'staff' ? (
                <>Are you sure you want to revoke the scanner clearance of <strong>&quot;{deleteModal.title}&quot;</strong>? Their account will not be deleted and will safely return to regular Student status.</>
              ) : deleteModal.type === 'officer' ? (
                <>Are you sure you want to remove <strong>&quot;{deleteModal.title}&quot;</strong> from the official roster of officers?</>
              ) : (
                <>Are you sure you want to permanently delete <strong>&quot;{deleteModal.title}&quot;</strong>? This action cannot be undone.</>
              )}
            </p>
            <div className="ad-ma">
              <button type="button" className="ad-b neu" onClick={() => setDeleteModal({ isOpen: false, type: '', id: null, title: '' })} disabled={deletingRecord}>Cancel</button>
              <button type="button" className={`ad-b ${deleteModal.type === 'staff' ? 'osol' : 'dsol'}`} onClick={handleConfirmDelete} disabled={deletingRecord}>
                {deletingRecord ? 'Processing...' : deleteModal.type === 'staff' ? 'Yes, revoke' : 'Yes, proceed'}
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
