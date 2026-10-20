import React, { useState } from 'react';
import Head from 'next/head';
import { 
  Menu, X, Search, ArrowRight, UserCheck, 
  Calendar, Mail, Lock, Eye, EyeOff, Users, CheckCircle2, ChevronRight,
  Sparkles, AlertCircle, RefreshCw, Info, Download, LogOut, ShieldAlert,
  Briefcase, Shield, Landmark, GraduationCap, Building2
} from 'lucide-react';

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState('home');

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

  // DORSU Cateel Extension Campus Logo Component
  const CateelCampusLogo = ({ className = "w-32 h-32" }) => (
    <div className={`relative rounded-full bg-white p-1.5 shadow-xl border-2 border-orange-200 flex items-center justify-center overflow-hidden ${className}`}>
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <path d="M 100 10 A 90 90 0 1 0 100 190 A 90 90 0 1 0 100 10" fill="#0A2533" />
        <circle cx="100" cy="100" r="82" fill="none" stroke="#0A2533" strokeWidth="8" strokeDasharray="12, 10" />
        <circle cx="100" cy="100" r="80" fill="#0A2533" stroke="#FFFFFF" strokeWidth="2" />
        <circle cx="100" cy="100" r="68" fill="none" stroke="#FFFFFF" strokeWidth="2" />

        <text x="100" y="32" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontFamily="sans-serif" fontWeight="900" letterSpacing="0.5">
          CATEEL EXTENSION CAMPUS
        </text>
        <text x="100" y="44" textAnchor="middle" fill="#FFFFFF" fontSize="7.5" fontFamily="sans-serif" fontWeight="700" letterSpacing="0.8">
          DAVAO ORIENTAL STATE UNIVERSITY
        </text>

        <circle cx="100" cy="112" r="54" fill="#65B32E" />
        <path d="M 46 112 A 54 54 0 0 1 154 112 Z" fill="#FACC15" />
        
        <path d="M 100 60 Q 115 75 110 90 Q 125 70 120 50 Q 105 70 100 60 Z" fill="#EA580C" />
        <path d="M 98 65 Q 108 75 105 88 Q 115 72 110 58 Q 102 72 98 65 Z" fill="#F97316" />
        <path d="M 95 72 Q 102 80 100 90 Q 108 80 104 70 Q 98 80 95 72 Z" fill="#FACC15" />

        <path d="M 88 92 L 112 92 L 108 115 L 92 115 Z" fill="#522504" />
        <rect x="85" y="90" width="30" height="4" rx="2" fill="#78350F" />
        <text x="100" y="102" textAnchor="middle" fill="#FFFFFF" fontSize="6" fontWeight="900">1999</text>

        <path d="M 60 105 Q 80 100 95 125" fill="none" stroke="#15803D" strokeWidth="3" />
        <ellipse cx="65" cy="98" rx="4" ry="7" fill="#16A34A" transform="rotate(-30 65 98)" />
        <ellipse cx="73" cy="92" rx="4" ry="7" fill="#16A34A" transform="rotate(-10 73 92)" />
        <ellipse cx="82" cy="88" rx="4" ry="7" fill="#16A34A" transform="rotate(15 82 88)" />

        <path d="M 50 145 Q 75 130 100 142 Q 125 130 150 145 L 140 162 Q 120 148 100 155 Q 80 148 60 162 Z" fill="#451A03" stroke="#FFFFFF" strokeWidth="1.5" />
        <path d="M 52 143 Q 75 128 100 140 Q 125 128 148 143 L 140 155 Q 120 143 100 150 Q 80 143 60 155 Z" fill="#FFFBEB" />
        <line x1="100" y1="140" x2="100" y2="155" stroke="#451A03" strokeWidth="1.5" />
      </svg>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 font-sans antialiased pb-16">
      <Head>
        <title>CEC TRACK 3.0 - DORSU Cateel</title>
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
            className="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors focus:outline-none"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
                className="p-2 rounded-full bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <button onClick={() => setIsMenuOpen(false)} className="w-full flex items-center space-x-3 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 font-bold text-gray-800">
                <Info className="w-5 h-5 text-[#F97316]" />
                <span>About</span>
              </button>
              <button onClick={() => setIsMenuOpen(false)} className="w-full flex items-center space-x-3 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 font-bold text-gray-800">
                <Calendar className="w-5 h-5 text-[#F97316]" />
                <span>Events</span>
              </button>
              <button onClick={() => setIsMenuOpen(false)} className="w-full flex items-center space-x-3 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 font-bold text-gray-800">
                <Users className="w-5 h-5 text-[#F97316]" />
                <span>Members</span>
              </button>
              
              <div className="pt-4">
                <button 
                  onClick={() => { setCurrentView('login'); setIsMenuOpen(false); }}
                  className="w-full py-4 px-4 bg-[#F97316] text-white font-bold rounded-2xl shadow-md flex items-center justify-center space-x-2"
                >
                  <ArrowRight className="w-5 h-5" />
                  <span>Login to Portal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto">
        {/* VIEW 1: HOME PAGE */}
        {currentView === 'home' && (
          <main className="px-4 pt-8 space-y-8 animate-in fade-in duration-300">
            
            {/* 1. HERO SECTION (PHOTO 1) */}
            <section className="text-center space-y-5">
              <div className="flex justify-center">
                <CateelCampusLogo className="w-36 h-36" />
              </div>

              <div className="flex justify-center">
                <span className="inline-flex items-center space-x-1.5 bg-orange-100 text-[#F97316] font-bold text-xs uppercase tracking-wider px-4 py-1.5 rounded-full border border-orange-200">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>EMPOWERING FUTURE LEADERS</span>
                </span>
              </div>

              <div className="space-y-2">
                <h1 className="text-4xl font-black text-[#0F172A] tracking-tight">
                  CEC TRACK
                </h1>
                <h2 className="text-sm font-bold text-[#1E293B] px-4 leading-tight">
                  Davao Oriental State University - Cateel Extension Campus
                </h2>
                <p className="text-xs text-gray-500 px-6 leading-relaxed">
                  Uniting students across all academic programs. Innovate, collaborate, and excel together.
                </p>
              </div>
            </section>

            {/* SEARCH & ACTIONS */}
            <section className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search Student ID (e.g. 2024-00123)..."
                  className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <button className="w-full py-3.5 bg-orange-300/60 hover:bg-orange-300 text-orange-700 font-bold rounded-2xl text-sm flex items-center justify-center space-x-2 transition">
                <Search className="w-4 h-4" />
                <span>Check Record</span>
              </button>

              <button
                onClick={() => setCurrentView('login')}
                className="w-full py-4 bg-[#F97316] hover:bg-orange-600 text-white font-bold rounded-2xl text-sm flex items-center justify-center space-x-2 shadow-lg shadow-orange-500/30 transition"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Access Member Portal</span>
              </button>

              <button className="w-full py-4 bg-white border-2 border-gray-100 text-gray-800 font-bold rounded-2xl text-sm flex items-center justify-center space-x-2 hover:bg-gray-50 transition">
                <span>Explore Events</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </section>

            {/* 2. DEPARTMENT MEMBERS BY COURSE SECTION (PHOTO 2 WITH NEW COURSES) */}
            <section className="space-y-4 pt-4">
              <div className="flex flex-col space-y-2 border-b border-gray-200 pb-3">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-[#F97316]" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-gray-500">
                    DEPARTMENT MEMBERS BY COURSE
                  </h2>
                </div>
                <div className="flex items-center space-x-2 text-xs font-semibold">
                  <span className="text-gray-600">Total Members: <strong className="text-orange-600 font-black">1000</strong></span>
                  <span className="text-gray-300">•</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Digital IDs: <strong>903 (90%)</strong>
                  </span>
                </div>
              </div>

              {/* UPDATED COURSE CARDS GRID */}
              <div className="grid grid-cols-2 gap-3">
                
                {/* BSBA */}
                <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-2">
                  <div className="flex items-start justify-between">
                    <span className="inline-block text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                      BSBA
                    </span>
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                      <Briefcase className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-xs font-bold text-gray-800 leading-snug">Business Administration</h3>
                  <div className="text-2xl font-black text-gray-900">320</div>
                  <div className="text-[10px] text-gray-500 pt-2 border-t border-gray-50 flex items-center justify-between">
                    <span>Active</span>
                    <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                      ID Ready 288
                    </span>
                  </div>
                </div>

                {/* BSCRIM */}
                <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-2">
                  <div className="flex items-start justify-between">
                    <span className="inline-block text-[10px] font-black text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                      BSCRIM
                    </span>
                    <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
                      <Shield className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-xs font-bold text-gray-800 leading-snug">Criminology</h3>
                  <div className="text-2xl font-black text-gray-900">250</div>
                  <div className="text-[10px] text-gray-500 pt-2 border-t border-gray-50 flex items-center justify-between">
                    <span>Active</span>
                    <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                      ID Ready 225
                    </span>
                  </div>
                </div>

                {/* BSA */}
                <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-2">
                  <div className="flex items-start justify-between">
                    <span className="inline-block text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                      BSA
                    </span>
                    <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                      <Landmark className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-xs font-bold text-gray-800 leading-snug">Accountancy</h3>
                  <div className="text-2xl font-black text-gray-900">180</div>
                  <div className="text-[10px] text-gray-500 pt-2 border-t border-gray-50 flex items-center justify-between">
                    <span>Active</span>
                    <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                      ID Ready 162
                    </span>
                  </div>
                </div>

                {/* BEED */}
                <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-2">
                  <div className="flex items-start justify-between">
                    <span className="inline-block text-[10px] font-black text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                      BEED
                    </span>
                    <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-xs font-bold text-gray-800 leading-snug">Elementary Education</h3>
                  <div className="text-2xl font-black text-gray-900">150</div>
                  <div className="text-[10px] text-gray-500 pt-2 border-t border-gray-50 flex items-center justify-between">
                    <span>Active</span>
                    <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                      ID Ready 140
                    </span>
                  </div>
                </div>

                {/* BSAM */}
                <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-2 col-span-2">
                  <div className="flex items-start justify-between">
                    <span className="inline-block text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      BSAM
                    </span>
                    <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                      <Building2 className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-xs font-bold text-gray-800 leading-snug">Agribusiness Management</h3>
                  <div className="text-2xl font-black text-gray-900">100</div>
                  <div className="text-[10px] text-gray-500 pt-2 border-t border-gray-50 flex items-center justify-between">
                    <span>Active</span>
                    <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                      ID Ready 88 (88%)
                    </span>
                  </div>
                </div>

              </div>
            </section>

          </main>
        )}

        {/* VIEW 2: LOGIN PAGE */}
        {currentView === 'login' && (
          <main className="px-4 pt-10 animate-in slide-in-from-bottom-4 duration-300">
            <div className="text-center space-y-4 mb-8">
              <div className="flex justify-center">
                <CateelCampusLogo className="w-24 h-24" />
              </div>
              <h1 className="text-3xl font-black text-[#F97316]">
                CEC TRACK 3.0
              </h1>
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Welcome to <span className="text-[#F97316]">CEC TRACK</span>
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Enter your credentials to login.
                </p>
              </div>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 pl-1">
                  EMAIL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. juandelacruz@gmail.com"
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 pl-1">
                  PASSWORD
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-4 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-4 bg-[#F97316] text-white font-bold rounded-2xl text-base shadow-lg shadow-orange-500/30 flex items-center justify-center space-x-2"
                >
                  {loginLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <span>Log In</span>}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <button
                onClick={() => setCurrentView('home')}
                className="text-sm font-bold text-gray-500 hover:text-gray-800 flex items-center justify-center space-x-1 mx-auto"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                <span>Back to Home</span>
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
                  <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 leading-tight">Data Privacy &<br/>Confidentiality</h2>
                    <p className="text-xs text-gray-500 font-medium">Official Policy • RA 10173 Compliance</p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex space-x-3">
                <AlertCircle className="w-5 h-5 text-orange-600 shrink-0" />
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
              </div>

              <div className="pt-4 space-y-3">
                <button 
                  onClick={handleAgreePrivacy}
                  className="w-full py-4 bg-[#F97316] text-white font-bold rounded-2xl text-base shadow-md flex items-center justify-center space-x-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Agree & Log In</span>
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
              <Download className="w-5 h-5" />
              <span>Download Official ID</span>
            </button>

            {/* ID Card Wrapper */}
            <div className="bg-gradient-to-br from-orange-400 via-orange-500 to-orange-400 p-1 rounded-3xl shadow-xl">
              <div className="bg-white rounded-[22px] overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#F97316] to-orange-400 rounded-b-[40px]"></div>
                
                <div className="relative z-10 p-6 flex flex-col items-center pb-8 pt-4">
                  <span className="bg-white/20 backdrop-blur text-white text-[10px] font-black tracking-widest px-4 py-1 rounded-full uppercase mb-4 shadow-sm border border-white/30">
                    • CEC TRACK 3.0 •
                  </span>
                  
                  <div className="w-28 h-28 rounded-2xl bg-gray-200 border-4 border-white shadow-lg mb-4 overflow-hidden flex items-center justify-center">
                    <UserCheck className="w-12 h-12 text-gray-400" />
                  </div>

                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Juan Dela Cruz</h2>
                  
                  <div className="mt-2 text-center">
                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest block mb-1">
                      STUDENT ID
                    </span>
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
                      DAVAO ORIENTAL STATE UNIVERSITY - CATEEL CAMPUS
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
                 <LogOut className="w-4 h-4" />
                 <span>Sign Out</span>
               </button>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
