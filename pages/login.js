import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

const POLICIES = [
  ['Confidentiality & Non-Disclosure', 'You agree that all member directories, attendance logs, voting ballots, and internal organization materials accessible via CECTRACK are strictly confidential.'],
  ['Personal Data Protection (No Sharing)', 'You must not screenshot, scrape, share, or disclose any personal details (names, student IDs, contact numbers, or emails) of fellow students or officers with external parties.'],
  ['Digital ID & QR Code Security', "Your Digital ID and generated QR code are strictly personal. Sharing or presenting another student's QR code for proxy attendance is considered a violation."],
  ['Account Integrity & Accountability', 'You are solely responsible for activities occurring under your credentials. Any deliberate breach may result in suspension of portal access and disciplinary review.'],
];

export default function Login() {
  const router = useRouter();

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Data Privacy Modal States
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [hasAgreedTerms, setHasAgreedTerms] = useState(false);

  // ========================================================
  // BULLETPROOF LOGIN HANDLER (WITH DEVELOPER ROLE ROUTING)
  // ========================================================
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsSuccess(false);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      if (!supabase) {
        throw new Error('Database connection failed. Please check your internet connection.');
      }

      // 1. Fetch user profile by email
      const { data: directProfile, error: fetchErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (fetchErr) {
        console.error('Error fetching user profile:', fetchErr);
      }

      if (!directProfile) {
        throw new Error('Invalid email or password.');
      }

      // Check account status
      if (directProfile.status && directProfile.status !== 'Active') {
        throw new Error('Your account is currently inactive. Please contact the administrator.');
      }

      let authenticatedProfile = null;

      // 2. Check if the account has already set a custom password
      const isDefaultAccount =
        directProfile.must_change_password === true ||
        !directProfile.password ||
        directProfile.password.trim() === directProfile.school_id?.trim();

      const enteredDefaultSchoolId =
        directProfile.school_id &&
        cleanPassword.toLowerCase() === directProfile.school_id.trim().toLowerCase();

      // STRICT CHECK: If user entered their Student ID as password
      if (enteredDefaultSchoolId) {
        if (!isDefaultAccount) {
          // BLOCK: Once a new password is set, the default Student ID CANNOT be used anymore!
          throw new Error('You have already set a new password. Please log in using your new password instead of your Student ID.');
        } else {
          // Allow login ONLY if it is still a default/first-time account
          authenticatedProfile = directProfile;
        }
      }

      // 3. Authenticate with custom updated password
      if (!authenticatedProfile) {
        // Direct plain-text match (the updated password saved from dashboard / password change)
        if (directProfile.password && directProfile.password.trim() === cleanPassword) {
          authenticatedProfile = directProfile;
        }

        // Secure Bcrypt RPC fallback if password was hashed
        if (!authenticatedProfile) {
          try {
            const { data: rpcData, error: rpcErr } = await supabase.rpc('check_profile_login', {
              user_email: cleanEmail,
              input_password: cleanPassword,
            });

            if (!rpcErr && rpcData) {
              authenticatedProfile = rpcData;
            }
          } catch (rpcException) {
            console.warn('RPC check bypassed:', rpcException);
          }
        }
      }

      if (!authenticatedProfile) {
        throw new Error('Invalid email or password.');
      }

      // 4. Save session data
      const userRole = authenticatedProfile.role || 'student';
      sessionStorage.setItem('cec_role', userRole);
      sessionStorage.setItem('cec_user_email', authenticatedProfile.email);
      sessionStorage.setItem('cec_school_id', authenticatedProfile.school_id || '');
      sessionStorage.setItem('cec_full_name', authenticatedProfile.full_name || '');
      sessionStorage.setItem('cec_can_scan', authenticatedProfile.can_scan ? 'true' : 'false');
      localStorage.setItem('cec_last_active_time', Date.now().toString());

      // 5. Role Routing
      if (userRole === 'developer' || authenticatedProfile.email === 'developer@gmail.com') {
        // Direct route para sa Lead Developer Portal
        sessionStorage.setItem('cec_developer_session', 'developer@gmail.com');
        sessionStorage.setItem('cec_dev_active', 'authorized_developer');
        router.push('/developer');
      } else if (userRole === 'admin') {
        router.push('/admin');
      } else if (authenticatedProfile.must_change_password) {
        router.push('/update-password');
      } else if (userRole === 'staff') {
        router.push('/admin');
      } else {
        // Normal students proceed to Data Privacy Modal
        setHasAgreedTerms(false);
        setShowPrivacyModal(true);
      }
    } catch (err) {
      setMessage(err.message || 'Invalid credentials.');
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAgreePrivacy = () => {
    if (!hasAgreedTerms) return;
    setShowPrivacyModal(false);
    router.push('/dashboard');
  };

  return (
    <div className="lg-page">
      <Head>
        <title>Login • CEC TRACK</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Figtree:wght@500;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        :root{--g8:#064e3b;--g7:#047857;--g6:#059669;--g5:#10b981;--g1:#d1fae5;--g0:#ecfdf5;--ink:#0b2a1e;--mut:#56705f;--line:#cfe5d8}
        *{box-sizing:border-box}
        body{margin:0}
        button{font-family:inherit}
        :focus-visible{outline:3px solid var(--g5);outline-offset:2px}
        .lg-page{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px 16px 24px;font-family:'Figtree',system-ui,sans-serif;color:var(--ink);position:relative;overflow:hidden;
          background:radial-gradient(700px 340px at 6% -8%,rgba(16,185,129,.2),transparent 60%),radial-gradient(600px 320px at 100% 0,rgba(163,230,53,.16),transparent 60%),radial-gradient(760px 380px at 50% 112%,rgba(16,185,129,.12),transparent 60%),#ffffff}
        .lg-page::after{content:'';position:absolute;inset:0;background-image:radial-gradient(rgba(5,150,105,.09) 1px,transparent 1px);background-size:22px 22px;pointer-events:none}
        .lg-page>*{position:relative;z-index:1}
        .lg-card{width:100%;max-width:440px;background:#fff;border-radius:30px;padding:62px 26px 26px;margin-top:58px;position:relative;box-shadow:0 0 0 1px #d6ebdf,0 24px 60px rgba(6,78,59,.14);animation:lg-rise .6s both}
        @keyframes lg-rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        .lg-logo{position:absolute;top:-54px;left:50%;transform:translateX(-50%);width:108px;height:108px;border-radius:50%;background:#fff;padding:9px;box-shadow:0 0 0 1px #d6ebdf,0 0 0 7px var(--g0),0 12px 28px rgba(5,150,105,.28);display:flex;align-items:center;justify-content:center}
        .lg-logo img{width:100%;height:100%;object-fit:contain}
        .lg-logo span{display:none;font-weight:800;color:var(--g7);font-size:1.2rem}
        .lg-head{text-align:center;margin-bottom:22px}
        .lg-head h1{font-family:'Bricolage Grotesque','Figtree',sans-serif;font-size:1.75rem;font-weight:800;letter-spacing:-.03em;line-height:1.15;margin:0 0 8px;color:var(--ink)}
        .lg-head h1 b{color:var(--g6)}
        .lg-head p{margin:0;font-size:.92rem;color:var(--mut);line-height:1.5}

        .lg-form{display:flex;flex-direction:column;gap:14px}
        .lg-l{display:block;font-size:.84rem;font-weight:700;color:#2f4d3e;margin-bottom:5px}
        .lg-iw{position:relative}
        .lg-ic{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#78a38c;display:flex;pointer-events:none}
        .lg-in{width:100%;padding:13px 14px 13px 44px;border-radius:14px;border:1.5px solid var(--line);font-size:.95rem;font-family:inherit;font-weight:600;color:var(--ink);background:#fafdfb;outline:0;transition:border-color .2s,box-shadow .2s,background .2s}
        .lg-in:focus{border-color:var(--g5);background:#fff;box-shadow:0 0 0 4px rgba(16,185,129,.16)}
        .lg-tg{position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:0;color:var(--g7);font-weight:800;font-size:.82rem;cursor:pointer;padding:8px 10px;border-radius:10px}
        .lg-tg:hover{background:var(--g0)}
        .lg-fp{text-align:right;margin-top:-4px}
        .lg-fp a{color:var(--g7);font-weight:800;font-size:.86rem;text-decoration:none}
        .lg-fp a:hover{text-decoration:underline}
        .lg-btn{width:100%;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:14px;border:0;border-radius:999px;background:linear-gradient(135deg,var(--g5),var(--g7));color:#fff;font-size:.98rem;font-weight:800;cursor:pointer;box-shadow:0 10px 24px rgba(5,150,105,.34);transition:transform .2s,box-shadow .2s}
        .lg-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 14px 30px rgba(5,150,105,.42)}
        .lg-btn:disabled{opacity:.55;cursor:not-allowed;box-shadow:none}
        .lg-btn.alt{background:#f1f6f3;color:#4b6558;box-shadow:none;font-weight:700;padding:12px}
        .lg-btn.alt:hover{background:#e6efe9;box-shadow:none;transform:none}
        .lg-n{margin-top:16px;font-size:.86rem;font-weight:700;line-height:1.45;padding:12px 14px;border-radius:14px;border:1px solid}
        .lg-n.ok{color:#047857;background:var(--g0);border-color:#b7ecd3}
        .lg-n.er{color:#b91c1c;background:#fef2f2;border-color:#fecaca}
        .lg-back{display:flex;justify-content:center;margin-top:20px}
        .lg-back a{display:inline-flex;align-items:center;gap:4px;color:var(--mut);font-weight:700;font-size:.86rem;text-decoration:none}
        .lg-back a:hover{color:var(--g7)}
        .lg-foot{margin-top:22px;font-size:.8rem;color:#4f7a63;font-weight:700;text-align:center}

        .lg-ov{position:fixed;inset:0;z-index:100;background:rgba(4,38,26,.55);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;animation:lg-fade .25s both}
        @keyframes lg-fade{from{opacity:0}to{opacity:1}}
        .lg-md{width:100%;max-width:560px;max-height:92vh;overflow-y:auto;background:#fff;border-radius:28px;padding:24px;display:flex;flex-direction:column;gap:18px;box-shadow:0 30px 70px rgba(0,0,0,.35);animation:lg-rise .35s both}
        .lg-mh{display:flex;align-items:center;gap:14px;border-bottom:1px solid #e6f1ea;padding-bottom:16px}
        .lg-mi{width:46px;height:46px;border-radius:15px;background:linear-gradient(135deg,var(--g5),var(--g7));color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 8px 18px rgba(5,150,105,.3)}
        .lg-mh h3{margin:0;font-family:'Bricolage Grotesque',sans-serif;font-size:1.3rem;font-weight:800;color:var(--g8)}
        .lg-mh small{font-size:.8rem;font-weight:700;color:var(--g6)}
        .lg-pl{display:flex;flex-direction:column;gap:14px}
        .lg-p{display:flex;gap:12px;align-items:flex-start}
        .lg-p i{width:26px;height:26px;border-radius:50%;background:var(--g1);color:var(--g7);font-style:normal;font-weight:800;font-size:.8rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
        .lg-p h4{margin:0 0 3px;font-size:.92rem;font-weight:800;color:var(--ink)}
        .lg-p p{margin:0;font-size:.82rem;color:var(--mut);line-height:1.5}
        .lg-ag{display:flex;align-items:center;gap:12px;background:var(--g0);border:1px solid #b7ecd3;border-radius:16px;padding:13px 14px;cursor:pointer}
        .lg-ag input{width:19px;height:19px;accent-color:var(--g7);cursor:pointer;flex-shrink:0}
        .lg-ag span{font-size:.84rem;font-weight:700;color:var(--ink);line-height:1.4;user-select:none}
        .lg-ma{display:flex;flex-direction:column;gap:8px}

        @media(max-width:420px){.lg-card{padding:60px 18px 22px;border-radius:26px}.lg-md{padding:20px 16px}}
        @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
      `}</style>

      <div className="lg-card">
        <div className="lg-logo">
          <img
            src="/logo.png"
            alt="CEC Logo"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'block';
            }}
          />
          <span>CEC</span>
        </div>

        <div className="lg-head">
          <h1>Welcome to <br /><b>CECTRACK</b></h1>
          <p>Enter your credentials to access your portal.</p>
        </div>

        <form className="lg-form" onSubmit={handleLogin}>
          <div>
            <label className="lg-l" htmlFor="lg-email">Email address</label>
            <div className="lg-iw">
              <span className="lg-ic">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              <input id="lg-email" className="lg-in" type="email" placeholder="juandelacruz@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>

          <div>
            <label className="lg-l" htmlFor="lg-pass">Password</label>
            <div className="lg-iw">
              <span className="lg-ic">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input id="lg-pass" className="lg-in" style={{ paddingRight: 70 }} type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" className="lg-tg" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button>
            </div>
          </div>

          <div className="lg-fp"><Link href="/forgot-password">Forgot password?</Link></div>

          <button type="submit" className="lg-btn" disabled={loading}>{loading ? 'Authenticating...' : 'Log in'}</button>
        </form>

        {message && <div className={`lg-n ${isSuccess ? 'ok' : 'er'}`}>{message}</div>}

        <div className="lg-back">
          <Link href="/">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            Back to home
          </Link>
        </div>
      </div>

      <div className="lg-foot">© 2026 CEC-TRACK • DOrSU Cateel Extension Campus</div>

      {/* Data Privacy Modal */}
      {showPrivacyModal && (
        <div className="lg-ov">
          <div className="lg-md" role="dialog" aria-modal="true" aria-label="Data Privacy Notice">
            <div className="lg-mh">
              <div className="lg-mi">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
              </div>
              <div>
                <h3>Data Privacy Notice</h3>
                <small>RA 10173 compliance • Official policy</small>
              </div>
            </div>

            <div className="lg-pl">
              {POLICIES.map(([t, d], i) => (
                <div className="lg-p" key={t}>
                  <i>{i + 1}</i>
                  <div><h4>{t}</h4><p>{d}</p></div>
                </div>
              ))}
            </div>

            <label className="lg-ag">
              <input type="checkbox" checked={hasAgreedTerms} onChange={(e) => setHasAgreedTerms(e.target.checked)} />
              <span>I have read, understood, and agree to abide by the Data Privacy and Non-Disclosure Policy.</span>
            </label>

            <div className="lg-ma">
              <button type="button" className="lg-btn" onClick={handleAgreePrivacy} disabled={!hasAgreedTerms}>✓ Agree &amp; enter portal</button>
              <button type="button" className="lg-btn alt" onClick={() => { setShowPrivacyModal(false); setHasAgreedTerms(false); }}>Cancel</button>
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
