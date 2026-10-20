import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState('home'); // 'home', 'login', 'privacy', 'dashboard'
  
  // Login States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setTimeout(() => {
      setLoginLoading(false);
      setCurrentView('privacy'); 
    }, 1000);
  };

  const handleAgreePrivacy = () => {
    setCurrentView('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 font-sans antialiased pb-16">
      <Head>
        <title>CEC TRACK 3.0</title>
      </Head>
      
      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => setCurrentView('home')} className="flex items-center text-left focus:outline-none">
            <span className="text-xl font-black tracking-tight text-[#F97316]">
              CEC TRACK 3.0
            </span>
          </button>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors focus:outline-none font-bold text-sm"
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* MOBILE MENU DRAWER */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-sm bg-[#F5F5F5] h-full shadow-2xl flex flex-col">
            <div className="bg-white px-4 h-16 flex items-center justify-between border-b border-gray-200">
              <span className="text-xl font-black tracking-tight text-[#F97316]">
                CEC TRACK 3.0
              </span>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-full bg-gray-100 text-gray-500 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3">
              <button onClick={() => setIsMenuOpen(false)} className="w-full flex items-center space-x-3 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 font-bold text-gray-800">
                <span className="text-[#F97316]">ℹ️</span>
                <span>About</span>
              </button>
              <button onClick={() => setIsMenuOpen(false)} className="w-full flex items-center space-x-3 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 font-bold text-gray-800">
                <span className="text-[#F97316]">📅</span>
                <span>Events</span>
              </button>
              <button onClick={() => setIsMenuOpen(false)} className="w-full flex items-center space-x-3 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 font-bold text-gray-800">
                <span className="text-[#F97316]">👥</span>
                <span>Members</span>
              </button>
              
              <div className="pt-4 space-y-2">
                <button 
                  onClick={() => { setCurrentView('login'); setIsMenuOpen(false); }}
                  className="w-full py-4 px-4 bg-[#F97316] text-white font-bold rounded-2xl shadow-md flex items-center justify-center space-x-2"
                >
                  <span>Login to Portal ➔</span>
                </button>
                <Link
                  href="/admin"
                  className="w-full py-3 px-4 bg-slate-900 text-white font-bold rounded-2xl shadow-sm flex items-center justify-center space-x-2 text-sm"
                >
                  <span>Admin Dashboard</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto">
        {/* VIEW 1: HOME PAGE */}
        {currentView === 'home' && (
          <main className="px-4 pt-8 space-y-8 animate-in fade-in duration-300">
            <section className="text-center space-y-5">
              <div className="flex justify-center">
                <div className="w-32 h-32 rounded-full bg-white p-2 shadow-lg border border-gray-200 flex items-center justify-center relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-white opacity-50"></div>
                   <span className="text-xl font-black text-[#0F172A] relative z-10">CEC TRACK</span>
                </div>
              </div>

              <div className="flex justify-center">
                <span className="inline-flex items-center space-x-1.5 bg-orange-100 text-[#F97316] font-bold text-xs uppercase tracking-wider px-4 py-1.5 rounded-full border border-orange-200">
                  <span>✨ EMPOWERING FUTURE LEADERS</span>
                </span>
              </div>

              <div className="space-y-2">
                <h1 className="text-4xl font-black text-[#0F172A] tracking-tight">CEC</h1>
                <h2 className="text-sm font-bold text-[#1E293B] px-4 leading-tight">
                  College of Engineering and Computing Students
                </h2>
                <p className="text-xs text-gray-500 px-6 leading-relaxed">
                  Uniting students across computing, engineering, and technology disciplines. Innovate, collaborate, and excel together.
                </p>
              </div>
            </section>

            <section className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Search Student ID (e.g. 2024-00123)..."
                  className="w-full pl-4 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <button className="w-full py-3.5 bg-orange-300/60 hover:bg-orange-300 text-orange-700 font-bold rounded-2xl text-sm transition">
                🔍 Check Record
              </button>

              <button
                onClick={() => setCurrentView('login')}
                className="w-full py-4 bg-[#F97316] hover:bg-orange-600 text-white font-bold rounded-2xl text-sm shadow-lg shadow-orange-500/30 transition"
              >
                Access Member Portal ➔
              </button>

              <button className="w-full py-4 bg-white border-2 border-gray-100 text-gray-800 font-bold rounded-2xl text-sm flex items-center justify-between px-6 hover:bg-gray-50 transition">
                <span>Explore Events</span>
                <span>➔</span>
              </button>
            </section>
          </main>
        )}

        {/* VIEW 2: LOGIN PAGE */}
        {currentView === 'login' && (
          <main className="px-4 pt-12 animate-in slide-in-from-bottom-4 duration-300">
            <div className="text-center space-y-4 mb-8">
              <div className="w-16 h-16 mx-auto rounded-full bg-white shadow border border-gray-100 flex items-center justify-center">
                 <span className="text-xs font-black text-gray-800">CEC</span>
              </div>
              <h1 className="text-3xl font-black text-[#F97316]">CEC TRACK 3.0</h1>
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Welcome to <span className="text-[#F97316]">CEC TRACK</span>
                </h2>
                <p className="text-sm text-gray-500 mt-1">Enter your CEC TRACK credentials to login.</p>
              </div>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 pl-1">EMAIL</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="e.g. juandelacruz@gmail.com"
                  className="w-full px-4 py-4 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 pl-1">PASSWORD</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 pr-12 py-4 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 text-xs font-bold"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-4 bg-[#F97316] text-white font-bold rounded-2xl text-base shadow-lg shadow-orange-500/30 flex items-center justify-center space-x-2"
                >
                  {loginLoading ? <span>Loading...</span> : <span>Log In</span>}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <button
                onClick={() => setCurrentView('home')}
                className="text-sm font-bold text-gray-500 hover:text-gray-800"
              >
                ← Back to Home
              </button>
            </div>
          </main>
        )}

        {/* VIEW 3: DATA PRIVACY & CONFIDENTIALITY */}
        {currentView === 'privacy' && (
          <main className="animate-in slide-in-from-right duration-300 min-h-[calc(100vh-64px)] bg-[#374151] flex flex-col justify-end">
            <div className="bg-white rounded-t-3xl p-6 space-y-5 h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-xl text-orange-600 font-bold">🛡️</div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 leading-tight">Data Privacy &<br/>Confidentiality</h2>
                    <p className="text-xs text-gray-500 font-medium">Official Policy • RA 10173 Compliance</p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex space-x-3">
                <span className="text-orange-600 font-bold">⚠️</span>
                <p className="text-sm font-bold text-orange-800">
                  Please review and accept this student data agreement before entering your portal.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex space-x-3">
                  <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 font-bold text-xs flex items-center justify-center shrink-0">1</div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Confidentiality & Non-Disclosure</h4>
                    <p className="text-xs text-gray-500 mt-1">You agree that all member directories, attendance logs, voting ballots, and internal organization materials are strictly confidential.</p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 font-bold text-xs flex items-center justify-center shrink-0">2</div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Personal Data Protection (No Sharing)</h4>
                    <p className="text-xs text-gray-500 mt-1">You must not screenshot, scrape, share, or disclose any personal details of fellow students or officers with external parties.</p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 font-bold text-xs flex items-center justify-center shrink-0">3</div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Digital ID & QR Code Security</h4>
                    <p className="text-xs text-gray-500 mt-1">Your Digital ID and generated QR code are strictly personal. Sharing it for proxy attendance is a violation.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <button 
                  onClick={handleAgreePrivacy}
                  className="w-full py-4 bg-[#F97316] text-white font-bold rounded-2xl text-base shadow-md flex items-center justify-center space-x-2"
                >
                  <span>✓ Agree & Log In</span>
                </button>
                <button 
                  onClick={() => setCurrentView('login')}
                  className="w-full py-4 bg-gray-50 border border-gray-200 text-gray-700 font-bold rounded-2xl text-base"
                >
                  Cancel
                </button>
              </div>
            </div>
          </main>
        )}

        {/* VIEW 4: DIGITAL ID PORTAL (DASHBOARD) */}
        {currentView === 'dashboard' && (
          <main className="px-4 pt-6 space-y-6 animate-in zoom-in-95 duration-300">
            <p className="text-sm text-gray-600 font-medium">Your official scannable organization credentials.</p>
            
            <button className="w-full py-4 bg-[#F97316] text-white font-bold rounded-2xl text-sm flex items-center justify-center space-x-2 shadow-lg shadow-orange-500/30">
              <span>📥 Download Official ID</span>
            </button>

            <div className="bg-gradient-to-br from-orange-400 via-orange-500 to-orange-400 p-1 rounded-3xl shadow-xl">
              <div className="bg-white rounded-[22px] overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#F97316] to-orange-400 rounded-b-[40px]"></div>
                
                <div className="relative z-10 p-6 flex flex-col items-center pb-8 pt-4">
                  <span className="bg-white/20 backdrop-blur text-white text-[10px] font-black tracking-widest px-4 py-1 rounded-full uppercase mb-4 shadow-sm border border-white/30">
                    • CEC TRACK 3.0 •
                  </span>
                  
                  <div className="w-28 h-28 rounded-2xl bg-gray-200 border-4 border-white shadow-lg mb-4 overflow-hidden flex items-center justify-center">
                    <span className="text-gray-400 text-xs font-bold">PHOTO</span>
                  </div>

                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Juan Dela Cruz</h2>
                  
                  <div className="mt-2 text-center">
                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest block mb-1">STUDENT ID</span>
                    <span className="bg-gray-100 text-gray-900 font-black text-base px-5 py-1.5 rounded-full border border-gray-200 block">
                      2024-00123
                    </span>
                  </div>

                  <div className="mt-8 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                    <div className="w-40 h-40 bg-gray-900 rounded-xl flex items-center justify-center relative">
                       <span className="text-white text-xs font-bold">QR CODE</span>
                       <div className="absolute w-full h-full border-4 border-dashed border-white/20 rounded-xl"></div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-500 tracking-widest mt-4 uppercase">
                    SCAN FOR ATTENDANCE
                  </span>

                  <div className="w-full border-t border-gray-200 mt-6 pt-4 text-center">
                    <p className="text-[9px] font-black text-gray-900 uppercase">
                      COLLEGE OF ENGINEERING AND COMPUTING
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pb-10 pt-4 flex justify-center">
               <button 
                 onClick={() => setCurrentView('home')}
                 className="flex items-center space-x-2 text-rose-500 font-bold text-sm bg-rose-50 px-4 py-2 rounded-full border border-rose-100"
               >
                 <span>🚪 Sign Out</span>
               </button>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
