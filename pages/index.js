import React, { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [currentView, setCurrentView] = useState('home');
  const [currentTime, setCurrentTime] = useState('11:02:00 PM');

  // Update time every second (Client-side only)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Manila' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simplified ACES Logo matching the color scheme
  const ACESLogo = () => (
    <div className="relative flex justify-center items-center py-10">
      {/* Subtle Glow Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-100/50 via-transparent to-transparent scale-150 rounded-full blur-2xl"></div>
      
      <div className="relative w-56 h-56 bg-white rounded-full p-2 shadow-lg border border-gray-100 flex items-center justify-center z-10 overflow-hidden">
        <svg viewBox="0 0 100 100" className="w-full h-full rounded-full">
          {/* Base Circle */}
          <circle cx="50" cy="50" r="48" fill="#FFFFFF" stroke="#111827" strokeWidth="4" />
          
          {/* Quadrants */}
          <path d="M 50 4 L 50 50 L 4 50 A 46 46 0 0 1 50 4 Z" fill="#F97316" />
          <path d="M 50 4 L 96 50 A 46 46 0 0 0 50 4 Z" fill="#FFFFFF" />
          <path d="M 50 50 L 96 50 A 46 46 0 0 1 50 96 Z" fill="#F97316" />
          <path d="M 4 50 L 50 50 L 50 96 A 46 46 0 0 1 4 50 Z" fill="#111827" />
          
          {/* Center Circle */}
          <circle cx="50" cy="50" r="22" fill="#FFFFFF" stroke="#111827" strokeWidth="2" />
          
          {/* Text Path Approximation (Outer ring text) */}
          <path id="curve" d="M 12 50 A 38 38 0 1 1 88 50 A 38 38 0 1 1 12 50" fill="transparent" />
          <text fontSize="7.5" fontWeight="900" fill="#111827" letterSpacing="1.5">
            <textPath href="#curve" startOffset="50%" textAnchor="middle">
              ASSOCIATION OF COMPUTING AND ENGINEERING STUDENTS
            </textPath>
          </text>
        </svg>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased selection:bg-orange-200">
      <Head>
        <title>ACETRACK 3.0</title>
      </Head>

      {/* DESKTOP HEADER NAVBAR */}
      <header className="w-full bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => setCurrentView('home')} className="flex items-center focus:outline-none">
            <span className="text-2xl font-black tracking-tight text-[#F97316] uppercase">
              ACETRACK 3.0
            </span>
          </button>

          <nav className="hidden md:flex items-center space-x-8">
            <button className="text-sm font-bold text-gray-600 hover:text-[#F97316] transition-colors">About</button>
            <button className="text-sm font-bold text-gray-600 hover:text-[#F97316] transition-colors">Events</button>
            <button className="text-sm font-bold text-gray-600 hover:text-[#F97316] transition-colors">Members</button>
            <button 
              onClick={() => setCurrentView('login')}
              className="px-6 py-2.5 bg-[#F97316] hover:bg-orange-600 text-white rounded-xl font-bold text-sm flex items-center space-x-2 transition-all shadow-md shadow-orange-500/20"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>
              </svg>
              <span>Login</span>
            </button>
          </nav>
        </div>
      </header>

      {currentView === 'home' && (
        <main className="w-full max-w-5xl mx-auto px-4 pt-6 pb-20 animate-in fade-in duration-500">
          
          {/* STATUS BADGES */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
            <div className="flex flex-wrap items-center justify-center gap-4 bg-white border border-gray-200 rounded-full px-5 py-2 shadow-sm text-xs font-bold text-gray-600">
              <span className="flex items-center text-emerald-500 tracking-wide uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span> 
                LIVE PHT
              </span>
              <span className="hidden md:block w-px h-4 bg-gray-300"></span>
              <span className="flex items-center">
                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                {currentTime}
              </span>
              <span className="hidden md:block w-px h-4 bg-gray-300"></span>
              <span className="flex items-center">
                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Tuesday, October 20, 2026
              </span>
            </div>

            <div className="flex items-center bg-white border border-gray-200 rounded-full px-5 py-2 shadow-sm text-xs font-bold text-gray-600">
              <svg className="w-4 h-4 mr-2 text-[#F97316]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Official ACES Portal
            </div>
          </div>

          {/* HERO SECTION */}
          <section className="text-center space-y-6 max-w-3xl mx-auto">
            <ACESLogo />

            <div className="flex justify-center">
              <span className="inline-flex items-center space-x-2 bg-orange-50 text-[#F97316] font-bold text-xs uppercase tracking-wider px-5 py-2 rounded-full border border-orange-200">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v18M3 12h18M5 5l14 14M19 5L5 19"/>
                </svg>
                <span>EMPOWERING FUTURE LEADERS</span>
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="text-5xl md:text-6xl font-black text-[#111827] tracking-tight uppercase">
                ACES
              </h1>
              <h2 className="text-lg md:text-xl font-bold text-[#1F2937]">
                Association of Computing and Engineering Students
              </h2>
              <p className="text-sm md:text-base text-gray-500 px-4 max-w-2xl mx-auto leading-relaxed">
                Uniting students across computing, engineering, and technology disciplines.<br className="hidden md:block"/> Innovate, collaborate, and excel together.
              </p>
            </div>
          </section>

          {/* ACTIONS */}
          <section className="mt-12 max-w-xl mx-auto space-y-3">
            <div className="relative shadow-sm rounded-xl">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <input
                type="text"
                placeholder="Search Student ID (e.g. 2024-00123)..."
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] transition-all"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button className="w-full py-4 bg-[#FFF7ED] border border-orange-200 hover:bg-orange-100 text-[#F97316] font-bold rounded-xl text-sm flex items-center justify-center space-x-2 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <span>Check Record</span>
              </button>
              <button className="w-full py-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-bold rounded-xl text-sm flex items-center justify-center space-x-2 transition-colors">
                <span>Explore Events</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>
          </section>

          {/* DEPARTMENT MEMBERS BY COURSE (ZEROED OUT) */}
          <section className="mt-16 max-w-5xl mx-auto space-y-6 pt-10 border-t border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <h2 className="text-base font-black uppercase tracking-widest text-[#111827]">
                  Department Analytics
                </h2>
              </div>
              
              <div className="flex items-center space-x-4 text-sm bg-gray-50 px-5 py-2.5 rounded-xl border border-gray-200">
                <span className="font-semibold text-gray-600">Total: <strong className="text-gray-900 font-black">0</strong></span>
                <span className="w-px h-4 bg-gray-300"></span>
                <span className="font-semibold text-gray-600">Digital IDs: <strong className="text-emerald-600 font-black">0 (0%)</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {/* BSBA */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow space-y-3">
                <div className="flex justify-between items-start">
                  <span className="inline-block text-[11px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md">BSBA</span>
                </div>
                <div>
                  <div className="text-3xl font-black text-[#111827]">0</div>
                  <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mt-1">Business Admin</h3>
                </div>
                <div className="text-[11px] font-bold flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-gray-400">ID Ready</span>
                  <span className="text-gray-400">0</span>
                </div>
              </div>

              {/* BSCRIM */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow space-y-3">
                <div className="flex justify-between items-start">
                  <span className="inline-block text-[11px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">BSCRIM</span>
                </div>
                <div>
                  <div className="text-3xl font-black text-[#111827]">0</div>
                  <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mt-1">Criminology</h3>
                </div>
                <div className="text-[11px] font-bold flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-gray-400">ID Ready</span>
                  <span className="text-gray-400">0</span>
                </div>
              </div>

              {/* BSA */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow space-y-3">
                <div className="flex justify-between items-start">
                  <span className="inline-block text-[11px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">BSA</span>
                </div>
                <div>
                  <div className="text-3xl font-black text-[#111827]">0</div>
                  <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mt-1">Accountancy</h3>
                </div>
                <div className="text-[11px] font-bold flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-gray-400">ID Ready</span>
                  <span className="text-gray-400">0</span>
                </div>
              </div>

              {/* BEED */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow space-y-3">
                <div className="flex justify-between items-start">
                  <span className="inline-block text-[11px] font-black text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-md">BEED</span>
                </div>
                <div>
                  <div className="text-3xl font-black text-[#111827]">0</div>
                  <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mt-1">Elem. Education</h3>
                </div>
                <div className="text-[11px] font-bold flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-gray-400">ID Ready</span>
                  <span className="text-gray-400">0</span>
                </div>
              </div>

              {/* BSAM */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow space-y-3 col-span-2 md:col-span-1">
                <div className="flex justify-between items-start">
                  <span className="inline-block text-[11px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md">BSAM</span>
                </div>
                <div>
                  <div className="text-3xl font-black text-[#111827]">0</div>
                  <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mt-1">Agribusiness</h3>
                </div>
                <div className="text-[11px] font-bold flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-gray-400">ID Ready</span>
                  <span className="text-gray-400">0</span>
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* LOGIN PAGE */}
      {currentView === 'login' && (
        <main className="max-w-md mx-auto px-4 pt-20 animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50">
            <div className="text-center space-y-2 mb-8">
              <h1 className="text-2xl font-black text-[#F97316]">
                Portal Login
              </h1>
              <p className="text-sm text-gray-500">
                Enter your credentials to access the ACES portal.
              </p>
            </div>

            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); }}>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">EMAIL</label>
                <input
                  type="email"
                  placeholder="student@domain.edu.ph"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">PASSWORD</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 mt-4 bg-[#F97316] hover:bg-orange-600 text-white font-bold rounded-xl text-sm shadow-md transition-colors"
              >
                Sign In
              </button>
            </form>
            
            <button
              onClick={() => setCurrentView('home')}
              className="w-full mt-6 text-sm font-bold text-gray-400 hover:text-gray-700 transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </main>
      )}
    </div>
  );
}
