const express = require('express'), { Pool } = require('pg'), bcrypt = require('bcryptjs'),
  jwt = require('jsonwebtoken'), QR = require('qrcode'), crypto = require('crypto'), cookie = require('cookie-parser');
const app = express();
app.use(express.urlencoded({ extended: false, limit: '500kb' }), cookie());
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 1, idleTimeoutMillis: 10000 });
const q = async (s, a = []) => (await pool.query(s, a)).rows;
const one = async (s, a) => (await q(s, a))[0];
const SECRET = process.env.SECRET_KEY || 'dev', TZ = 'Asia/Manila';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const go = (res, url, m) => res.redirect(m ? `${url}?m=${encodeURIComponent(m)}` : url);

let ready;
const init = () => ready ??= (async () => {
  await pool.query(`CREATE TABLE IF NOT EXISTS users(id SERIAL PRIMARY KEY, school_id TEXT UNIQUE, name TEXT, email TEXT UNIQUE, pw TEXT, role TEXT DEFAULT 'student', photo TEXT);
  ALTER TABLE users ADD COLUMN IF NOT EXISTS photo TEXT;
  CREATE TABLE IF NOT EXISTS events(id SERIAL PRIMARY KEY, title TEXT, location TEXT, event_date DATE, active BOOLEAN DEFAULT FALSE);
  CREATE TABLE IF NOT EXISTS attendance(id SERIAL PRIMARY KEY, event_id INT REFERENCES events(id) ON DELETE CASCADE, user_id INT REFERENCES users(id) ON DELETE CASCADE, time_in TIMESTAMPTZ, time_out TIMESTAMPTZ, UNIQUE(event_id,user_id));
  CREATE TABLE IF NOT EXISTS resets(token TEXT PRIMARY KEY, user_id INT, expires TIMESTAMPTZ);`);
  if (!await one("SELECT 1 FROM users WHERE role='admin'"))
    await q("INSERT INTO users(school_id,name,email,pw,role) VALUES('ADMIN','Administrator',$1,$2,'admin')",
      [(process.env.ADMIN_EMAIL || 'admin@gmail.com').toLowerCase(), await bcrypt.hash(process.env.ADMIN_PASSWORD || 'ChangeMe123', 10)]);
})().catch(e => { ready = undefined; throw e; });

app.get('/health', async (req, res) => {
  try { res.json({ ok: true, ...(await one('SELECT now() AS time, current_database() AS db')), has_database_url: !!process.env.DATABASE_URL }); }
  catch (e) { res.status(500).json({ ok: false, has_database_url: !!process.env.DATABASE_URL, error: e.message }); }
});

app.use(async (req, res, next) => {
  await init();
  try { req.u = await one('SELECT id,school_id,name,email,role FROM users WHERE id=$1', [jwt.verify(req.cookies.t, SECRET).uid]); } catch {}
  next();
});
const home = u => u.role === 'admin' ? '/admin' : u.role === 'staff' ? '/scan' : '/my-id';
// lvl: 'admin' = admin lang | 'staff' = admin o staff | 'student' = estudyante lang
const need = lvl => (req, res, next) => {
  const u = req.u; if (!u) return res.redirect('/login');
  const ok = lvl === 'admin' ? u.role === 'admin' : lvl === 'staff' ? u.role !== 'student' : u.role === 'student';
  ok ? next() : res.redirect(home(u));
};

const CSS = `:root{--o:#f26b21;--n:#12303b}*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#f7f8fa;color:var(--n)}
header{background:#fff;padding:12px 16px;display:flex;align-items:center;gap:10px;box-shadow:0 1px 6px #0001;flex-wrap:wrap}
header b{color:var(--o);font-size:20px}header img{height:36px}nav{margin-left:auto;display:flex;gap:12px;flex-wrap:wrap}nav a{color:var(--n);font-weight:600;text-decoration:none}
main{max-width:720px;margin:auto;padding:16px}.card{background:#fff;border-radius:18px;padding:16px;margin:12px 0;box-shadow:0 2px 10px #0001}
input,select{width:100%;padding:12px;margin:6px 0;border:1px solid #ccd;border-radius:12px;font-size:16px}
button,.btn{background:var(--o);color:#fff;border:0;border-radius:12px;padding:12px 16px;font-weight:700;font-size:16px;cursor:pointer;text-decoration:none;display:inline-block}
.sm{padding:6px 10px;font-size:13px}.g{background:#2e9b5f}.r{background:#d33}.d{background:var(--n)}.c{text-align:center}.msg{background:#fff3e6;border:1px solid #f6c;padding:10px;border-radius:12px;margin:8px 0}
.tag{padding:2px 10px;border-radius:99px;font-size:12px;font-weight:700;background:#e5e7eb}.ok{background:#d9f5e5;color:#1a7a44}.no{background:#fde2e2;color:#b22}
.row{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}.logo{width:130px}form.i{display:inline}
.idc{border-radius:36px;padding:22px 16px;text-align:center;background:linear-gradient(#ee7230 0,#f2a45a 30%,#f6dcc5 55%,#fff7f0 100%);border:3px solid #f7c892;max-width:380px;margin:14px auto}
.pill{display:inline-block;background:#fff;border-radius:99px;padding:6px 16px;font-size:12px;font-weight:800;letter-spacing:1.5px}
.ph{width:140px;height:140px;border-radius:28px;object-fit:cover;border:5px solid #fff;margin:14px auto 6px;background:#fff;display:block}
.av{display:flex;align-items:center;justify-content:center;font-size:56px;font-weight:800;color:var(--o)}
.sid{display:inline-block;background:#fff;border-radius:99px;padding:6px 22px;font:800 22px ui-monospace,monospace;letter-spacing:2px}
.qrb{background:#fff;border-radius:22px;padding:10px;display:inline-block;margin-top:14px}.ft{font-size:11px;font-weight:800;letter-spacing:1px;margin-top:12px;border-top:1px solid #0002;padding-top:10px}`;
const NAV = { admin: '<a href=/admin>Admin</a><a href=/scan>Scan</a>', staff: '<a href=/scan>Scan</a>', student: '<a href=/my-id>My ID</a><a href=/attendance>Attendance</a><a href=/events>Mga Event</a>' };
const page = (req, body, m = req.query.m) => `<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>CEC-TRACK</title><style>${CSS}</style></head><body>
<header><img src=/logo.jpg><b>CEC-TRACK</b><nav>${req.u ? NAV[req.u.role] + '<a href=/logout>Mag-sign out</a>' : '<a href=/login>Mag-login</a>'}</nav></header>
<main>${m ? `<div class=msg>${esc(m)}</div>` : ''}${body}</main></body></html>`;

async function sendMail(to, subject, body) {
  await fetch(process.env.APPS_SCRIPT_URL, { method: 'POST', body: JSON.stringify({ secret: process.env.APPS_SCRIPT_SECRET, to, subject, body }) });
}

app.get('/', (req, res) => res.send(page(req, `<div class=c><img class=logo src=/logo.jpg><h1>CEC-TRACK</h1><p>Cateel Extension Campus<br>Davao Oriental State University</p><a class=btn href=/login>Pumasok sa Portal</a></div>`)));
app.get('/login', (req, res) => res.send(page(req, `<div class="card c"><img class=logo src=/logo.jpg><h2>Maligayang pagdating sa CEC-TRACK</h2><form method=post><input name=email type=email placeholder="Gmail" required><input name=password type=password placeholder="Password" required><button style=width:100%>Mag-log In</button></form><p><a href=/forgot>Nakalimutan ang password?</a></p></div>`)));
app.post('/login', async (req, res) => {
  const u = await one('SELECT * FROM users WHERE email=$1', [req.body.email.trim().toLowerCase()]);
  if (u && await bcrypt.compare(req.body.password, u.pw)) {
    res.cookie('t', jwt.sign({ uid: u.id }, SECRET, { expiresIn: '7d' }), { httpOnly: true, secure: true, sameSite: 'lax' });
    return res.redirect(home(u));
  }
  go(res, '/login', 'Mali ang email o password.');
});
app.get('/logout', (req, res) => { res.clearCookie('t'); res.redirect('/'); });

app.get('/forgot', (req, res) => res.send(page(req, `<div class=card><h2>Nakalimutan ang Password</h2><form method=post><input name=email type=email placeholder="Iyong Gmail" required><button>Ipadala ang reset link</button></form></div>`)));
app.post('/forgot', async (req, res) => {
  const u = await one('SELECT * FROM users WHERE email=$1', [req.body.email.trim().toLowerCase()]);
  if (u) {
    const t = crypto.randomBytes(32).toString('base64url');
    await q('INSERT INTO resets VALUES($1,$2,now()+interval \'30 minutes\')', [t, u.id]);
    try { await sendMail(u.email, 'CEC-TRACK: I-reset ang password', `I-click ito para i-reset ang password mo (may bisa ng 30 minuto):\n${req.protocol}://${req.get('host')}/reset/${t}`); } catch (e) { console.log(e); }
  }
  go(res, '/forgot', 'Kung may account ang email na iyon, naipadala na ang reset link.');
});
app.get('/reset/:t', async (req, res) => {
  if (!await one('SELECT 1 FROM resets WHERE token=$1 AND expires>now()', [req.params.t])) return res.status(400).send('Hindi wasto o nag-expire na ang link.');
  res.send(page(req, `<div class=card><h2>Bagong password</h2><form method=post><input name=password type=password minlength=6 placeholder="Bagong password" required><button>I-save</button></form></div>`));
});
app.post('/reset/:t', async (req, res) => {
  const r = await one('SELECT * FROM resets WHERE token=$1 AND expires>now()', [req.params.t]);
  if (!r) return res.status(400).send('Hindi wasto o nag-expire na ang link.');
  await q('UPDATE users SET pw=$1 WHERE id=$2', [await bcrypt.hash(req.body.password, 10), r.user_id]);
  await q('DELETE FROM resets WHERE user_id=$1', [r.user_id]);
  go(res, '/login', 'Na-update na ang password. Mag-log in na.');
});

// ---------- ESTUDYANTE: ID CARD + QR (awtomatiko) + LARAWAN ----------
app.get('/my-id', need('student'), async (req, res) => {
  const u = await one('SELECT * FROM users WHERE id=$1', [req.u.id]);
  const qr = await QR.toDataURL(u.school_id, { width: 240, margin: 1 });
  res.send(page(req, `<div class=c><button onclick="dl()">⬇ I-download ang ID</button>
<form id=pf method=post action=/photo style=display:inline><input type=hidden name=photo id=ph></form>
<label class="btn d">📷 ${u.photo ? 'Palitan' : 'Mag-upload ng'} Larawan<input type=file accept="image/*" hidden onchange="pick(this)"></label></div>
<div class=idc id=idc><span class=pill>● CEC-TRACK · DOrSU</span>
${u.photo ? `<img class=ph src="${u.photo}">` : `<div class="ph av">${esc(u.name[0])}</div>`}
<h2 style=margin:6px>${esc(u.name)}</h2><small style=letter-spacing:2px;color:#667>ID NG ESTUDYANTE</small><br><span class=sid>${esc(u.school_id)}</span><br>
<div class=qrb><img src="${qr}" width=210></div><p style=letter-spacing:3px;font-weight:800;font-size:12px>I-SCAN PARA SA ATTENDANCE</p>
<div class=ft>CATEEL EXTENSION CAMPUS · DAVAO ORIENTAL STATE UNIVERSITY</div></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<script>
function pick(i){const f=i.files[0];if(!f)return;const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=c.height=320;const s=Math.min(im.width,im.height);c.getContext('2d').drawImage(im,(im.width-s)/2,(im.height-s)/2,s,s,0,0,320,320);document.getElementById('ph').value=c.toDataURL('image/jpeg',.8);document.getElementById('pf').submit()};im.src=URL.createObjectURL(f)}
function dl(){html2canvas(document.getElementById('idc'),{scale:2}).then(c=>{const a=document.createElement('a');a.download='CEC-ID.png';a.href=c.toDataURL();a.click()})}
</script>`));
});
app.post('/photo', need('student'), async (req, res) => {
  const p = req.body.photo || '';
  if (!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(p) || p.length > 200000) return go(res, '/my-id', 'Hindi wasto ang larawan.');
  await q('UPDATE users SET photo=$1 WHERE id=$2', [p, req.u.id]);
  go(res, '/my-id', 'Na-update na ang larawan.');
});
app.get('/attendance', need('student'), async (req, res) => {
  const rows = await q(`SELECT e.title,e.location,to_char(e.event_date,'Mon DD, YYYY') d,
    to_char(a.time_in AT TIME ZONE '${TZ}','HH12:MI AM') tin, to_char(a.time_out AT TIME ZONE '${TZ}','HH12:MI AM') tout
    FROM events e LEFT JOIN attendance a ON a.event_id=e.id AND a.user_id=$1 ORDER BY e.event_date DESC,e.id DESC`, [req.u.id]);
  const p = rows.filter(r => r.tin).length, t = rows.length;
  res.send(page(req, `<h2>Aking Attendance</h2><div class=card>Kabuuan: <b>${t}</b> · Present: <b>${p}</b> · Absent: <b>${t - p}</b> · Rate: <b>${t ? Math.floor(p * 100 / t) : 0}%</b></div>` +
    rows.map(r => `<div class=card><div class=row><b>${esc(r.title)}</b><span class="tag ${r.tin ? 'ok' : 'no'}">${r.tin ? 'PRESENT' : 'ABSENT'}</span></div><small>${esc(r.location)} · ${r.d}</small><p>In: ${r.tin || '--:--'} &nbsp; Out: ${r.tout || '--:--'}</p></div>`).join('')));
});
app.get('/events', need('student'), async (req, res) => {
  const rows = await q(`SELECT *,to_char(event_date,'Mon DD, YYYY') d FROM events ORDER BY event_date DESC,id DESC`);
  res.send(page(req, '<h2>Mga Event</h2>' + rows.map(r => `<div class=card><div class=row><b>${esc(r.title)}</b><span class="tag ${r.active ? 'ok' : ''}">${r.active ? 'ACTIVE' : 'SARADO'}</span></div><small>${esc(r.location)} · ${r.d}</small></div>`).join('')));
});

// ---------- ADMIN ----------
app.get('/admin', need('admin'), async (req, res) => {
  const ev = await q(`SELECT *,to_char(event_date,'Mon DD, YYYY') d FROM events ORDER BY event_date DESC,id DESC`);
  const us = await q("SELECT id,school_id,name,email,role FROM users WHERE role IN ('student','staff') ORDER BY role DESC,name");
  const row = s => `<div class=card><div class=row><div><b>${esc(s.name)}</b><br><small>${esc(s.school_id)} · ${esc(s.email)}</small></div>
<form method=post action=/admin/user/${s.id}/delete onsubmit="return confirm('Burahin?')"><button class="sm r">Burahin</button></form></div></div>`;
  const staff = us.filter(u => u.role === 'staff'), st = us.filter(u => u.role === 'student');
  res.send(page(req, `<h2>Admin Dashboard</h2><a class=btn href=/scan>📷 Buksan ang Scanner</a>
<div class=card><h3>Magdagdag ng Event</h3><form method=post action=/admin/event><input name=title placeholder="Pamagat ng event" required><input name=location placeholder="Lugar" required><input name=event_date type=date required><button>Magdagdag ng Event</button></form></div>
${ev.map(e => `<div class=card><div class=row><div><b>${esc(e.title)}</b><br><small>${esc(e.location)} · ${e.d}</small></div><div>
<form class=i method=post action=/admin/event/${e.id}/toggle><button class="sm ${e.active ? 'g' : ''}">${e.active ? 'Active' : 'Sarado'}</button></form>
<form class=i method=post action=/admin/event/${e.id}/delete onsubmit="return confirm('Burahin?')"><button class="sm r">Burahin</button></form></div></div></div>`).join('')}
<div class=card><h3>Magdagdag ng Staff (puwedeng mag-scan)</h3><form method=post action=/admin/staff><input name=name placeholder="Buong pangalan" required><input name=email type=email placeholder="Gmail" required><input name=password type=text minlength=6 placeholder="Password ng staff" required><button>Magdagdag ng Staff</button></form></div>
<h3>Mga Staff (${staff.length})</h3>${staff.map(row).join('')}
<div class=card><h3>Magdagdag ng Estudyante</h3><form method=post action=/admin/student><input name=school_id placeholder="School ID (e.g. 2024-0515)" required><input name=name placeholder="Buong pangalan" required><input name=email type=email placeholder="Gmail" required><button>Magdagdag ng Estudyante</button></form></div>
<h3>Mga Estudyante (${st.length})</h3>${st.map(row).join('')}`));
});
app.post('/admin/event', need('admin'), async (req, res) => { const f = req.body; await q('INSERT INTO events(title,location,event_date) VALUES($1,$2,$3)', [f.title, f.location, f.event_date]); res.redirect('/admin'); });
app.post('/admin/event/:id/toggle', need('admin'), async (req, res) => { await q('UPDATE events SET active=NOT active WHERE id=$1', [req.params.id]); res.redirect('/admin'); });
app.post('/admin/event/:id/delete', need('admin'), async (req, res) => { await q('DELETE FROM events WHERE id=$1', [req.params.id]); res.redirect('/admin'); });
const dup = (e, res, m) => e.code === '23505' ? go(res, '/admin', m) : Promise.reject(e);
app.post('/admin/student', need('admin'), async (req, res) => {
  const f = req.body, sid = f.school_id.trim();
  try {
    await q('INSERT INTO users(school_id,name,email,pw) VALUES($1,$2,$3,$4)', [sid, f.name.trim(), f.email.trim().toLowerCase(), await bcrypt.hash(sid, 10)]);
    go(res, '/admin', `Naidagdag na ang estudyante. Default na password = School ID (${sid}).`);
  } catch (e) { await dup(e, res, 'Ginagamit na ang School ID o Gmail na ito.'); }
});
app.post('/admin/staff', need('admin'), async (req, res) => {
  const f = req.body;
  try {
    await q("INSERT INTO users(school_id,name,email,pw,role) VALUES($1,$2,$3,$4,'staff')", ['STF-' + crypto.randomBytes(3).toString('hex'), f.name.trim(), f.email.trim().toLowerCase(), await bcrypt.hash(f.password, 10)]);
    go(res, '/admin', 'Naidagdag na ang staff. Puwede na siyang mag-login at mag-scan.');
  } catch (e) { await dup(e, res, 'Ginagamit na ang Gmail na ito.'); }
});
app.post('/admin/user/:id/delete', need('admin'), async (req, res) => { await q("DELETE FROM users WHERE id=$1 AND role<>'admin'", [req.params.id]); res.redirect('/admin'); });

// ---------- SCANNER (admin at staff) ----------
app.get('/scan', need('staff'), async (req, res) => {
  const evs = await q('SELECT * FROM events WHERE active ORDER BY id DESC');
  res.send(page(req, `<h2>I-scan ang Attendance</h2><div class=card>
${evs.length ? `<select id=ev>${evs.map(e => `<option value=${e.id}>${esc(e.title)}</option>`).join('')}</select>
<div id=reader style=width:100%></div><input id=sid placeholder="o i-type ang School ID"><button onclick="mark(document.getElementById('sid').value)">Isumite</button>` : '<p>Walang active na event. Hilingin sa admin na i-activate ito.</p>'}</div><div id=res></div>
${evs.length ? `<script src="https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js"></script><script>
let last='',lt=0;
async function mark(code){code=(code||'').trim();if(!code||(code===last&&Date.now()-lt<4000))return;last=code;lt=Date.now();
const box=document.getElementById('res'),c=document.createElement('div');c.className='card c';
try{const r=await fetch('/scan/mark',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({event_id:document.getElementById('ev').value,school_id:code})});const d=await r.json();
c.style.border='3px solid '+(d.ok?'#2e9b5f':'#d33');
if(d.photo){const i=new Image();i.className='ph';i.src=d.photo;c.appendChild(i)}
const h=document.createElement('h2');h.textContent=d.name||'';const b=document.createElement('b');b.textContent=d.msg;c.append(h,b)}
catch(e){c.textContent='May error. Subukan muli.'}
box.innerHTML='';box.appendChild(c);document.getElementById('sid').value=''}
new Html5Qrcode('reader').start({facingMode:'environment'},{fps:10,qrbox:250},t=>mark(t),()=>{}).catch(e=>{document.getElementById('reader').textContent='Hindi mabuksan ang camera. I-allow ang camera o i-type ang School ID.'});
</script>` : ''}`));
});
app.post('/scan/mark', need('staff'), async (req, res) => {
  const ev = await one('SELECT id FROM events WHERE id=$1 AND active', [req.body.event_id]);
  if (!ev) return res.json({ ok: false, msg: 'Sarado na o walang ganitong event.' });
  const s = await one("SELECT id,name,photo FROM users WHERE school_id=$1 AND role='student'", [(req.body.school_id || '').trim()]);
  if (!s) return res.json({ ok: false, msg: 'Hindi nahanap ang School ID.' });
  const a = await one('SELECT * FROM attendance WHERE event_id=$1 AND user_id=$2', [ev.id, s.id]);
  let msg, ok = true;
  if (!a) { await q('INSERT INTO attendance(event_id,user_id,time_in) VALUES($1,$2,now())', [ev.id, s.id]); msg = '✅ TIME-IN'; }
  else if (!a.time_out) { await q('UPDATE attendance SET time_out=now() WHERE id=$1', [a.id]); msg = '✅ TIME-OUT'; }
  else { msg = 'May time-in at time-out na'; ok = false; }
  res.json({ ok, name: s.name, photo: s.photo, msg });
});

app.use((err, req, res, next) => { console.error(err); res.status(500).send('May error sa server'); });
module.exports = app;
