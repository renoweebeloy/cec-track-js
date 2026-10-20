import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  Menu, X, Clock, ShieldCheck, Search, ArrowRight, UserCheck, 
  BookOpen, Calendar, MapPin, Code, Compass, Layers, Calculator, 
  Activity, Eye, EyeOff, Lock, Mail, Users, CheckCircle2, ChevronRight,
  Sparkles, AlertCircle, RefreshCw
} from 'lucide-react';

export default function Home() {
  // Mobile drawer state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // View states: 'home' | 'login'
  const [currentView, setCurrentView] = useState('home');
  // Modals
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [searchIdInput, setSearchIdInput] = useState('');
  const [searchedStudent, setSearchedStudent] = useState(null);
  const [searchError, setSearchError] = useState('');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Live PHT Clock
  const [phtTime, setPhtTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const options = {
        timeZone: 'Asia/Manila',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      };
      const formatter = new Intl.DateTimeFormat([], options);
      setPhtTime(formatter.format(new Date()));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sample Student Database for Search
  const mockStudents = [
    { id: '2024-00123', name: 'Juan Dela Cruz', course: 'BSIT', status: 'Enrolled', idStatus: 'ID Ready', attendance: 'Present (Siglakas 2026)' },
    { id: '2024-00124', name: 'Maria Santos', course: 'BSCE', status: 'Enrolled', idStatus: 'ID Ready', attendance: 'Pending' },
    { id: '2023-08912', name: 'Renowe Beloy', course: 'BSIT', status: 'Enrolled', idStatus: 'ID Ready', attendance: 'Present' },
  ];

  const handleSearchRecord = (e) => {
    e?.preventDefault();
    if (!searchIdInput.trim()) {
      setSearchError('Please enter a valid Student ID.');
      return;
    }
    const found = mockStudents.find(s => s.id.toLowerCase() === searchIdInput.trim().toLowerCase());
    if (found) {
      setSearchedStudent(found);
      setSearchError('');
    } else {
      setSearchedStudent(null);
      setSearchError(`No record found for ID: "${searchIdInput}"`);
    }
    setShowRecordModal(true);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setTimeout(() => {
      setLoginLoading(false);
      setLoginSuccess(true);
      setTimeout(() => {
        setLoginSuccess(false);
        setCurrentView('home');
      }, 1500);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 font-sans antialiased selection:bg-green-500 selection:text-white pb-16">
      <Head>
        <title>CEC TRACK</title>
      </Head>
      
      {/* HEADER / NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => setCurrentView('home')} 
            className="flex items-center space-x-2 text-left focus:outline-none"
          >
            <span className="text-2xl font-black tracking-tight text-[#16A34A]">
              CEC TRACK <span className="text-gray-800 text-lg font-bold"></span>
            </span>
          </button>

          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {isMenuOpen ? <X className="w-6 h-6 text-gray-800" /> : <Menu className="w-6 h-6 text-gray-800" />}
          </button>
        </div>
      </header>

      {/* MOBILE NAVIGATION DRAWER */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end transition-opacity">
          <div className="w-full max-w-sm bg-white h-full shadow-2xl p-6 flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-gray-100">
                <span className="text-xl font-black text-[#16A34A]">CEC TRACK</span>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="mt-6 space-y-3">
                <button 
                  onClick={() => { setCurrentView('home'); setIsMenuOpen(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-green-50 text-gray-700 font-semibold transition"
                >
                  <AlertCircle className="w-5 h-5 text-green-600" />
                  <span>About</span>
                </button>
                <button 
                  onClick={() => { setCurrentView('home'); setIsMenuOpen(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-green-50 text-gray-700 font-semibold transition"
                >
                  <Calendar className="w-5 h-5 text-green-600" />
                  <span>Events</span>
                </button>
                <button 
                  onClick={() => { setCurrentView('home'); setIsMenuOpen(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-green-50 text-gray-700 font-semibold transition"
                >
                  <Users className="w-5 h-5 text-green-600" />
                  <span>Members</span>
                </button>
              </nav>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <button 
                onClick={() => { setCurrentView('login'); setIsMenuOpen(false); }}
                className="w-full py-3 px-4 bg-[#16A34A] hover:bg-green-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2"
              >
                <ArrowRight className="w-5 h-5" />
                <span>Login to Portal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW CONDITIONAL: HOME PAGE VS LOGIN PAGE */}
      {currentView === 'home' ? (
        <main className="max-w-3xl mx-auto px-4 pt-4 space-y-6">

          {/* DYNAMIC STATUS BADGES ROW */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs font-semibold">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>LIVE PHT</span>
            </div>
            
            <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full border border-gray-200">
              <Clock className="w-3.5 h-3.5 text-green-600" />
              <span>{phtTime || "04:51:15 PM"}</span>
            </div>

            <div className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-green-50 text-green-800 rounded-full border border-green-200">
              <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
              <span>Official CEC Portal</span>
            </div>
          </div>

          {/* HERO SECTION WITH EMBLEM */}
          <section className="text-center pt-4 pb-2 space-y-4">
            {/* CEC LOGO EMBLEM */}
            <div className="flex justify-center">
              <div className="relative w-32 h-32 md:w-36 md:h-36 rounded-full bg-white p-2 shadow-xl border-2 border-green-200 flex items-center justify-center">
                <div className="w-full h-full rounded-full border-4 border-dashed border-green-500/30 flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-100 p-2">
                  {/* SVG CEC Emblem Graphic */}
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="46" fill="none" stroke="#1E293B" strokeWidth="2" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#16A34A" strokeWidth="1.5" />
                    <text x="50" y="22" textAnchor="middle" fontSize="6.5" fontWeight="bold" fill="#0F172A">COLLEGE OF ENGINEERING</text>
                    <text x="50" y="83" textAnchor="middle" fontSize="6.5" fontWeight="bold" fill="#0F172A">AND COMPUTING</text>
                    {/* Inner Graphic */}
                    <path d="M 30 35 L 50 25 L 70 35 L 70 65 L 50 75 L 30 65 Z" fill="#16A34A" opacity="0.9" />
                    <path d="M 50 25 L 50 75" stroke="#FFFFFF" strokeWidth="2" />
                    <path d="M 30 35 L 70 65" stroke="#FFFFFF" strokeWidth="1.5" />
                    <text x="50" y="54" textAnchor="middle" fontSize="11" fontWeight="black" fill="#FFFFFF">CEC</text>
                  </svg>
                </div>
              </div>
            </div>

            {/* EMPOWERING FUTURE LEADERS BADGE */}
            <div className="inline-flex items-center space-x-1.5 bg-green-100 text-[#16A34A] font-bold text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              <span>EMPOWERING FUTURE LEADERS</span>
            </div>

            {/* TITLE & DESCRIPTION */}
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                CEC TRACK
              </h1>
              <p className="text-base font-bold text-gray-800">
                College of Engineering and Computing Students
              </p>
              <p className="text-xs md:text-sm text-gray-600 max-w-lg mx-auto leading-relaxed">
                Uniting students across computing, engineering, and technology disciplines. Innovate, collaborate, and excel together.
              </p>
            </div>
          </section>

          {/* SEARCH & QUICK ACTION BUTTONS */}
          <section className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <form onSubmit={handleSearchRecord} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchIdInput}
                onChange={(e) => setSearchIdInput(e.target.value)}
                placeholder="Search Student ID (e.g. 2024-00123)..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
              />
            </form>

            <button
              onClick={handleSearchRecord}
              className="w-full py-3 px-4 bg-green-100 hover:bg-green-200 text-[#16A34A] font-bold rounded-xl text-sm flex items-center justify-center space-x-2 transition"
            >
              <Search className="w-4 h-4" />
              <span>Check Record</span>
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setCurrentView('login')}
                className="w-full py-3.5 px-4 bg-[#16A34A] hover:bg-green-700 text-white font-bold rounded-xl text-sm shadow-md shadow-green-600/20 flex items-center justify-center space-x-2 transition"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Access Member Portal</span>
              </button>

              <button
                onClick={() => {
                  const eventsElem = document.getElementById('upcoming-events');
                  eventsElem?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-3.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-sm flex items-center justify-center space-x-2 transition"
              >
                <span>Explore Events</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* DEPARTMENT MEMBERS BY COURSE SECTION */}
          <section className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-gray-100 pb-2">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#16A34A]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  DEPARTMENT MEMBERS BY COURSE
                </h2>
              </div>
              <div className="flex items-center space-x-2 text-xs font-semibold">
                <span className="text-gray-600">Total Members: <strong className="text-green-700 font-bold">1000</strong></span>
                <span className="text-gray-300">•</span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Digital IDs: <strong>903 (90%)</strong>
                </span>
              </div>
            </div>

            {/* COURSE CARDS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* BSIT */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block text-xs font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md mb-1">
                      BSIT
                    </span>
                    <h3 className="text-sm font-bold text-gray-900">Information Technology</h3>
                  </div>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Code className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-gray-900">430</div>
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-50">
                  <span>Enrolled <strong className="text-gray-700">Active</strong></span>
                  <span className="text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    ID Ready <strong>386 (90%)</strong>
                  </span>
                </div>
              </div>

              {/* BSCE */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block text-xs font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md mb-1">
                      BSCE
                    </span>
                    <h3 className="text-sm font-bold text-gray-900">Civil Engineering</h3>
                  </div>
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <Compass className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-gray-900">116</div>
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-50">
                  <span>Enrolled <strong className="text-gray-700">Active</strong></span>
                  <span className="text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    ID Ready <strong>106 (91%)</strong>
                  </span>
                </div>
              </div>

              {/* BITM */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md mb-1">
                      BITM
                    </span>
                    <h3 className="text-sm font-bold text-gray-900">Bachelor of Industrial T...</h3>
                  </div>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Layers className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-gray-900">275</div>
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-50">
                  <span>Enrolled <strong className="text-gray-700">Active</strong></span>
                  <span className="text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    ID Ready <strong>245 (89%)</strong>
                  </span>
                </div>
              </div>

              {/* BSM */}
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block text-xs font-extrabold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-md mb-1">
                      BSM
                    </span>
                    <h3 className="text-sm font-bold text-gray-900">Mathematics</h3>
                  </div>
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                    <Calculator className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-gray-900">128</div>
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-50">
                  <span>Enrolled <strong className="text-gray-700">Active</strong></span>
                  <span className="text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    ID Ready <strong>118 (92%)</strong>
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* UPCOMING EVENTS SECTION */}
          <section id="upcoming-events" className="space-y-4 pt-4">
            <div className="text-center space-y-1">
              <span className="inline-block px-3 py-1 bg-green-100 text-green-700 font-bold text-xs uppercase tracking-wider rounded-md">
                UPCOMING EVENTS
              </span>
              <h2 className="text-2xl font-black text-gray-900">Don't Miss What's Coming</h2>
              <p className="text-xs text-gray-500">
                Stay up to date with the latest workshops, assemblies, and activities organized by CEC.
              </p>
            </div>

            {/* EVENT CARDS */}
            <div className="space-y-3">

              {/* ACTIVE EVENT: Siglakas 2026 */}
              <div className="bg-white rounded-2xl border border-green-200 overflow-hidden shadow-sm hover:shadow-md transition">
                <div className="p-4 space-y-3">
                  <span className="inline-block px-2.5 py-0.5 bg-green-100 text-[#16A34A] font-bold text-[10px] uppercase tracking-wide rounded">
                    ACTIVE EVENT
                  </span>

                  {/* Placeholder Banner Image */}
                  <div className="w-full h-36 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                    <div className="text-center space-y-1">
                      <Calendar className="w-8 h-8 mx-auto stroke-1" />
                      <span className="text-xs font-medium">Event Banner Image</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-gray-900">Siglakas 2026 (2nd Day)</h3>
                    <p className="text-xs text-gray-500 mt-0.5">No description provided.</p>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-600 pt-1">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-green-600" />
                      <span>Oct 20, 2026</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-green-600" />
                      <span>08:30 AM - 03:00 PM</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-green-600" />
                      <span>FaCET Facade</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex justify-end">
                    <button 
                      onClick={() => setCurrentView('login')}
                      className="text-xs font-bold text-[#16A34A] hover:text-green-700 flex items-center space-x-1"
                    >
                      <span>Join via Portal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* INACTIVE EVENT: SALUDO */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3 opacity-80 hover:opacity-100 transition">
                <span className="inline-block px-2.5 py-0.5 bg-gray-100 text-gray-600 font-bold text-[10px] uppercase tracking-wide rounded">
                  INACTIVE
                </span>
                <div>
                  <h3 className="text-base font-bold text-gray-900">SALUDO</h3>
                  <p className="text-xs text-gray-500">No description provided.</p>
                </div>
                <div className="space-y-1.5 text-xs text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>Oct 19, 2026</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>12:00 PM - 09:30 PM</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>FaCET Facade</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-100 flex justify-end">
                  <button 
                    onClick={() => setCurrentView('login')}
                    className="text-xs font-bold text-gray-500 hover:text-gray-700 flex items-center space-x-1"
                  >
                    <span>Join via Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          </section>

        </main>
      ) : (
        /* LOGIN PORTAL VIEW */
        <main className="max-w-md mx-auto px-4 pt-8">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-xl space-y-6">
            
            {/* EMBLEM & BRANDING */}
            <div className="text-center space-y-2">
              <div className="w-20 h-20 mx-auto rounded-full bg-white p-1 shadow-md border border-green-200 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="#1E293B" strokeWidth="3" />
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#16A34A" strokeWidth="2" />
                  <path d="M 30 35 L 50 25 L 70 35 L 70 65 L 50 75 L 30 65 Z" fill="#16A34A" />
                  <text x="50" y="55" textAnchor="middle" fontSize="12" fontWeight="black" fill="#FFFFFF">CEC</text>
                </svg>
              </div>

              <h1 className="text-2xl font-black text-[#16A34A]">
                CEC TRACK
              </h1>
              <h2 className="text-base font-bold text-gray-900">
                Welcome to <span className="text-[#16A34A]">CEC TRACK</span>
              </h2>
              <p className="text-xs text-gray-500">
                Enter your credentials to login.
              </p>
            </div>

            {/* LOGIN FORM */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  EMAIL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. juandelacruz@gmail.com"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  PASSWORD
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {loginSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Success! Redirecting to Portal...</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 px-4 bg-[#16A34A] hover:bg-green-700 text-white font-bold rounded-xl text-sm shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loginLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Logging in...</span>
                  </>
                ) : (
                  <span>Log In</span>
                )}
              </button>
            </form>

            <div className="pt-2 text-center border-t border-gray-100">
              <button
                onClick={() => setCurrentView('home')}
                className="text-xs font-bold text-gray-600 hover:text-gray-900 inline-flex items-center space-x-1"
              >
                <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                <span>Back to Home</span>
              </button>
            </div>

          </div>
        </main>
      )}

      {/* STUDENT RECORD CHECK MODAL */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-[#16A34A]" />
                <h3 className="font-extrabold text-gray-900">Student Record Details</h3>
              </div>
              <button 
                onClick={() => setShowRecordModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {searchedStudent ? (
              <div className="space-y-3 pt-1">
                <div className="p-4 bg-green-50 rounded-xl border border-green-100 space-y-2">
                  <div className="text-xs font-bold uppercase text-green-700">
                    ID: {searchedStudent.id}
                  </div>
                  <div className="text-lg font-black text-gray-900">
                    {searchedStudent.name}
                  </div>
                  <div className="text-xs text-gray-600 font-medium">
                    Program: <strong className="text-gray-900">{searchedStudent.course}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-gray-500 block">Enrollment Status</span>
                    <span className="font-bold text-emerald-600">{searchedStudent.status}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-gray-500 block">Digital ID</span>
                    <span className="font-bold text-blue-600">{searchedStudent.idStatus}</span>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                  <span className="text-gray-500 block">Event Attendance Log</span>
                  <span className="font-bold text-gray-800">{searchedStudent.attendance}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-2">
                <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                <p className="text-sm font-semibold text-gray-800">{searchError}</p>
                <p className="text-xs text-gray-500">
                  Please verify the student ID format (e.g. 2024-00123) and try again.
                </p>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={() => setShowRecordModal(false)}
                className="w-full py-2.5 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
