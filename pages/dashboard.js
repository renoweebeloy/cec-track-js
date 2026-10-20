import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function StudentDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('my-id'); // 'my-id' | 'attendance' | 'events' | 'profile'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Student Profile Data
  const [profile, setProfile] = useState({
    full_name: 'Renowee Beloy',
    school_id: '2024-0515',
    email: 'renowee.beloy@dorsu.edu.ph',
    course: 'BSIT',
    section: 'Section G',
    year_level: 'Year 3',
  });

  // Events & Attendance States
  const [events, setEvents] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [attendanceFilter, setAttendanceFilter] = useState('all'); // 'all' | 'present' | 'absent'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      if (!supabase) return;

      // 1. Kuhaon ang user gikan sa session/auth
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Kuhaon ang profile record sa Supabase
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', user.email)
          .single();

        if (userProfile) {
          setProfile((prev) => ({
            ...prev,
            full_name: userProfile.full_name || prev.full_name,
            school_id: userProfile.school_id || prev.school_id,
            email: userProfile.email || user.email,
            course: userProfile.course || prev.course,
            year_level: userProfile.year_level || prev.year_level,
          }));
        }
      }

      // 2. Kuhaon ang mga events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false });

      if (eventsData) {
        setEvents(eventsData);
      }

      // 3. Kuhaon ang attendance logs (fallback sample logs kon bag-o pa ang table)
      const { data: logsData } = await supabase
        .from('attendance')
        .select('*')
        .order('created_at', { ascending: false });

      if (logsData && logsData.length > 0) {
        setAttendanceLogs(logsData);
      } else {
        // Default sample records para dili hanap tan-awon inig sugod
        setAttendanceLogs([
          {
            id: 1,
            title: 'Siglakas 2026 (2nd Day)',
            location: 'FaCET Facade',
            date: 'Oct 20, 2026',
            time_in: '08:44 AM',
            time_out: '02:31 PM',
            event_status: 'ACTIVE (OPEN)',
            status: 'PRESENT',
          },
          {
            id: 2,
            title: 'SALUDO',
            location: 'FaCET Facade',
            date: 'Oct 19, 2026',
            time_in: '12:14 PM',
            time_out: '08:07 PM',
            event_status: 'INACTIVE (CLOSED)',
            status: 'PRESENT',
          },
          {
            id: 3,
            title: 'SALUDO 3RD NIGHT',
            location: 'FaCET Facade',
            date: 'Oct 18, 2026',
            time_in: '--:--',
            time_out: '--:--',
            event_status: 'INACTIVE (CLOSED)',
            status: 'ABSENT',
          },
          {
            id: 4,
            title: 'SALUDO 2ND NIGHT',
            location: 'FaCET Facade',
            date: 'Oct 17, 2026',
            time_in: '--:--',
            time_out: '--:--',
            event_status: 'INACTIVE (CLOSED)',
            status: 'ABSENT',
          },
        ]);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
    router.push('/');
  };

  // Calculations para sa Attendance stats
  const totalEventsCount = attendanceLogs.length;
  const totalPresentCount = attendanceLogs.filter((l) => l.status === 'PRESENT').length;
  const totalAbsencesCount = attendanceLogs.filter((l) => l.status === 'ABSENT').length;
  const complianceRate = totalEventsCount > 0 ? Math.round((totalPresentCount / totalEventsCount) * 100) : 0;

  // Filter attendance logs
  const filteredLogs = attendanceLogs.filter((log) => {
    if (attendanceFilter === 'present') return log.status === 'PRESENT';
    if (attendanceFilter === 'absent') return log.status === 'ABSENT';
    return true;
  }).filter((log) => 
    log.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Dynamic QR Code link base sa School ID
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    profile.school_id
  )}`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col lg:flex-row antialiased font-sans">
      <Head>
        <title>Portal • CEC TRACK 3.0</title>
      </Head>

      {/* MOBILE HEADER */}
      <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <div>
          <span className="text-xs font-black uppercase text-slate-400 block tracking-widest leading-none">
            Portal
          </span>
          <span className="text-xs text-slate-500 font-semibold">STUDENT ACCESS</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm"
        >
          {isSidebarOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* SIDEBAR NAVIGATION */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 p-5 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          <div className="px-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Portal</h2>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Student Access
            </p>
          </div>

          <nav className="space-y-1.5">
            {/* 1. My ID */}
            <button
              onClick={() => { setActiveTab('my-id'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl font-bold text-sm transition ${
                activeTab === 'my-id'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
              </svg>
              <span>My ID</span>
            </button>

            {/* 2. Attendance */}
            <button
              onClick={() => { setActiveTab('attendance'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl font-bold text-sm transition ${
                activeTab === 'attendance'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Attendance</span>
            </button>

            {/* 3. Events */}
            <button
              onClick={() => { setActiveTab('events'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl font-bold text-sm transition ${
                activeTab === 'events'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Events</span>
            </button>

            {/* Inactive / Placeholder Modules (From Reference) */}
            <div className="pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-300 px-3">
              Organization
            </div>

            <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-semibold text-sm text-slate-400 cursor-not-allowed">
              <span>🎗️</span>
              <span>Officers</span>
            </div>
            <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-semibold text-sm text-slate-400 cursor-not-allowed">
              <span>💳</span>
              <span>Finance</span>
            </div>
            <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-semibold text-sm text-slate-400 cursor-not-allowed">
              <span>🛡️</span>
              <span>Sanctions</span>
            </div>
            <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-semibold text-sm text-slate-400 cursor-not-allowed">
              <span>☑️</span>
              <span>Voting</span>
            </div>

            {/* 4. Profile */}
            <button
              onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl font-bold text-sm transition mt-2 ${
                activeTab === 'profile'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Profile</span>
            </button>
          </nav>
        </div>

        {/* Sign Out Button */}
        <div className="pt-6 border-t border-slate-100">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-rose-500 hover:bg-rose-50 text-sm font-bold transition"
          >
            <span>➔</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-h-screen overflow-y-auto px-4 sm:px-8 py-6">
        {/* Top Header User Profile (Top Right) */}
        <div className="flex justify-end items-center mb-6">
          <div className="flex items-center gap-3 bg-white px-3.5 py-1.5 rounded-2xl border border-slate-200/70 shadow-sm">
            <div className="text-right">
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                {profile.full_name}
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                {profile.school_id}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-xs font-black text-orange-600">
              {profile.full_name.charAt(0)}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: MY ID (Matches Image 13) */}
        {/* ========================================================= */}
        {activeTab === 'my-id' && (
          <div className="space-y-6 max-w-5xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900">My Digital ID</h1>
                <p className="text-xs sm:text-sm text-slate-500">Your official scannable organization credentials.</p>
              </div>
              <button
                onClick={() => window.print()}
                className="self-start sm:self-auto bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-lg shadow-orange-500/25 flex items-center gap-2 hover:opacity-95 transition"
              >
                <span>📥</span>
                <span>Download Official ID</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: ID Card */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-full max-w-sm rounded-[32px] p-1 bg-gradient-to-b from-orange-400 via-orange-500 to-orange-400 shadow-xl">
                  <div className="bg-white rounded-[28px] overflow-hidden relative pb-6 text-center">
                    {/* Header Curve */}
                    <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-orange-500 to-orange-400 rounded-b-[40px]" />
                    
                    <div className="relative z-10 pt-4 px-6 flex flex-col items-center">
                      <span className="bg-white/20 backdrop-blur text-white text-[10px] font-black tracking-widest px-4 py-1 rounded-full uppercase mb-4 border border-white/30">
                        • CEC TRACK 3.0 • ACES •
                      </span>

                      {/* Photo Container */}
                      <div className="w-24 h-24 rounded-2xl bg-slate-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center mb-3">
                        <span className="text-3xl">👤</span>
                      </div>

                      <h2 className="text-xl font-black text-slate-900 tracking-tight">
                        {profile.full_name}
                      </h2>

                      <span className="text-[10px] font-extrabold text-orange-500 uppercase tracking-widest mt-2 block">
                        STUDENT ID
                      </span>
                      <span className="bg-slate-100 text-slate-800 font-extrabold text-sm px-4 py-1 rounded-full border border-slate-200 mt-1">
                        {profile.school_id}
                      </span>

                      {/* QR Code */}
                      <div className="mt-5 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <img
                          src={qrCodeUrl}
                          alt="Student QR Code"
                          className="w-40 h-40 object-contain rounded-xl"
                        />
                      </div>

                      <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mt-3">
                        SCAN FOR ATTENDANCE
                      </span>

                      <div className="w-full border-t border-slate-100 mt-4 pt-3">
                        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-tight">
                          COLLEGE OF ENGINEERING AND COMPUTING
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Info Cards (From ACETRACK Image 13) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-[#FFF8F2] border border-orange-100 p-5 rounded-3xl flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0">
                    📱
                  </div>
                  <div className="space-y-1 text-xs sm:text-sm">
                    <h3 className="font-extrabold text-slate-900">Universal Device Downloads</h3>
                    <p className="text-slate-500 text-xs">
                      One-click high-resolution download optimized for iPhones, iPads, Android, Laptops, and Desktop computers.
                    </p>
                    <ul className="list-disc list-inside text-xs text-slate-600 pt-1 space-y-1">
                      <li><strong>Laptop & PC:</strong> Downloads your official badge directly to Downloads folder.</li>
                      <li><strong>Mobile:</strong> Opens native share sheet to save directly to Photos.</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-[#F0FDF4] border border-emerald-100 p-5 rounded-3xl flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    🛡️
                  </div>
                  <div className="space-y-1 text-xs sm:text-sm">
                    <h3 className="font-extrabold text-slate-900">Official Usage Guide</h3>
                    <ul className="text-xs text-slate-600 space-y-1 pt-1">
                      <li>• Use this for attendance monitoring at all official CEC events.</li>
                      <li>• Show this when paying organization dues and clearances.</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 p-5 rounded-3xl flex items-start gap-4 shadow-sm">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    ℹ️
                  </div>
                  <div className="space-y-1 text-xs sm:text-sm">
                    <h3 className="font-extrabold text-slate-900">Security Protocol</h3>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      Your Digital ID is encrypted and linked directly to your student account. The QR code contains verification metadata to prevent duplication.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: ATTENDANCE (Matches Image 14) */}
        {/* ========================================================= */}
        {activeTab === 'attendance' && (
          <div className="space-y-6 max-w-5xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-extrabold text-orange-600 bg-orange-50 px-3 py-1 rounded-full uppercase border border-orange-100">
                  👥 OFFICIAL ATTENDANCE HISTORY
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                  My Attendance Record
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  Track your participation and time-in/out timestamps across all organization events.
                </p>
              </div>

              <button
                onClick={fetchStudentData}
                className="self-start sm:self-auto text-xs sm:text-sm font-bold px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 shadow-sm flex items-center gap-2"
              >
                <span>🔄</span> Refresh Records
              </button>
            </div>

            {/* Attendance Stat Cards (Image 14) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/70 shadow-sm">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase">TOTAL EVENTS</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-slate-900">{totalEventsCount}</span>
                  <span className="text-xs">📅</span>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-100 shadow-sm">
                <span className="text-[11px] font-extrabold text-emerald-600 uppercase">TOTAL PRESENT</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-emerald-600">{totalPresentCount}</span>
                  <span className="text-emerald-500 text-xs">✓</span>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-rose-100 shadow-sm">
                <span className="text-[11px] font-extrabold text-rose-500 uppercase">ABSENCES</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-rose-500">{totalAbsencesCount}</span>
                  <span className="text-rose-400 text-xs">✕</span>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-amber-100 shadow-sm">
                <span className="text-[11px] font-extrabold text-amber-700 uppercase">COMPLIANCE RATE</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-amber-600">{complianceRate}%</span>
                  <span className="text-amber-500 text-xs">📈</span>
                </div>
              </div>
            </div>

            {/* Attendance Filter Tabs & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex gap-1.5 p-1 bg-slate-100 rounded-2xl w-fit">
                <button
                  onClick={() => setAttendanceFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    attendanceFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  ALL LOGS ({attendanceLogs.length})
                </button>
                <button
                  onClick={() => setAttendanceFilter('present')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    attendanceFilter === 'present' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  ✓ PRESENT ({totalPresentCount})
                </button>
                <button
                  onClick={() => setAttendanceFilter('absent')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    attendanceFilter === 'absent' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  ✕ ABSENT ({totalAbsencesCount})
                </button>
              </div>

              <input
                type="text"
                placeholder="🔍 Search event or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 px-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Attendance Logs Table (Image 14) */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-extrabold uppercase text-slate-400">
                      <th className="py-3 px-4">Event & Location</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Time In</th>
                      <th className="py-3 px-4">Time Out</th>
                      <th className="py-3 px-4">Event Status</th>
                      <th className="py-3 px-4 text-center">Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredLogs.map((log) => {
                      const isPresent = log.status === 'PRESENT';
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-4 px-4">
                            <span className="font-extrabold text-slate-900 block text-sm">
                              {log.title}
                            </span>
                            <span className="text-[11px] text-slate-400 font-semibold">
                              📍 {log.location || 'FaCET Facade'}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-semibold text-slate-600">
                            {log.date}
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-700">
                            {log.time_in || '--:--'}
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-700">
                            {log.time_out || '--:--'}
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 uppercase">
                              {log.event_status || 'CLOSED'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-black px-3 py-1 rounded-full ${
                                isPresent
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {isPresent ? '✓ PRESENT' : '✕ ABSENT'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: EVENTS (Matches Image 15 - With Empty State Support) */}
        {/* ========================================================= */}
        {activeTab === 'events' && (
          <div className="space-y-6 max-w-5xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-extrabold text-orange-600 bg-orange-50 px-3 py-1 rounded-full uppercase border border-orange-100">
                  📅 OFFICIAL ORGANIZATION ACTIVITIES
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                  Organization Events
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  Explore upcoming assemblies, past workshops, seminars, and official activities.
                </p>
              </div>

              {/* Event Stat Badges */}
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200/80 shadow-sm self-start sm:self-auto">
                <div className="text-center px-2">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Total</span>
                  <span className="text-sm font-extrabold text-slate-800">{events.length}</span>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div className="text-center px-2">
                  <span className="text-[10px] font-bold text-emerald-600 block uppercase">Active</span>
                  <span className="text-sm font-extrabold text-emerald-600">
                    {events.filter((e) => e.status === 'active').length}
                  </span>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div className="text-center px-2">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Inactive</span>
                  <span className="text-sm font-extrabold text-slate-500">
                    {events.filter((e) => e.status !== 'active').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Empty State / List */}
            {events.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-3">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-orange-50 text-orange-500 flex items-center justify-center text-2xl font-black">
                  📅
                </div>
                <h3 className="text-lg font-black text-slate-900">Walay Events sa Pagkakaron</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Blangko pa kini kay wala pa nag-add og opisyal nga event ang admin sa system. Palihog balik unya kon naay bag-ong pahibalo.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map((ev) => {
                  const isActive = ev.status === 'active';
                  return (
                    <div
                      key={ev.id}
                      className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <span
                          className={`inline-block text-[10px] font-black px-3 py-1 rounded-full uppercase ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isActive ? '● ACTIVE EVENT' : '✖ INACTIVE (CLOSED)'}
                        </span>

                        <h3 className="text-base font-extrabold text-slate-900">{ev.title}</h3>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {ev.description || 'No description provided.'}
                        </p>

                        <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-100">
                          <p>📅 {ev.date ? new Date(ev.date).toLocaleDateString() : 'TBA'}</p>
                          <p>⏰ {ev.time_in || '08:00 AM'} - {ev.time_out || '05:00 PM'}</p>
                          <p className="text-orange-600 font-bold">📍 {ev.location || 'FaCET Facade'}</p>
                        </div>
                      </div>

                      <div className="pt-4 text-xs font-bold text-orange-600 flex items-center justify-between">
                        <span>Click to view full details</span>
                        <span>➔</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: PROFILE (Matches Image 16) */}
        {/* ========================================================= */}
        {activeTab === 'profile' && (
          <div className="space-y-6 max-w-2xl mx-auto">
            {/* Header info */}
            <div className="text-center space-y-1">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-orange-100 border border-orange-200 flex items-center justify-center text-3xl mb-2">
                👤
              </div>
              <h1 className="text-2xl font-black text-slate-900">{profile.full_name}</h1>
              <p className="text-xs font-bold text-slate-400">
                {profile.course} • {profile.section} • {profile.year_level}
              </p>
            </div>

            {/* PWA Mobile Banner (From Image 16) */}
            <div className="bg-[#FFF8F2] border border-orange-100 p-4 rounded-3xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📱</span>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">ACETRACK Mobile App <span className="bg-orange-100 text-orange-600 text-[9px] px-1.5 py-0.5 rounded font-black">PWA</span></h4>
                  <p className="text-[11px] text-slate-500">Install ACETRACK on your phone for fast QR scanning and instant access.</p>
                </div>
              </div>
              <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl shrink-0 transition">
                + Add to Mobile App
              </button>
            </div>

            {/* Verified Student Details Card (Image 16) */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span className="text-xs font-extrabold text-slate-900 uppercase">
                    VERIFIED STUDENT DETAILS
                  </span>
                </div>
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  OFFICIAL RECORD
                </span>
              </div>

              <div className="space-y-3.5 divide-y divide-slate-100 text-xs">
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-slate-400 font-bold uppercase">Full Name</span>
                  <span className="font-extrabold text-slate-900 text-sm">{profile.full_name}</span>
                </div>

                <div className="pt-3 flex items-center justify-between">
                  <span className="text-slate-400 font-bold uppercase">Student ID</span>
                  <span className="font-extrabold text-slate-900">{profile.school_id}</span>
                </div>

                <div className="pt-3 flex items-center justify-between">
                  <span className="text-slate-400 font-bold uppercase">Email Address</span>
                  <span className="font-extrabold text-slate-900">{profile.email}</span>
                </div>

                <div className="pt-3 flex items-center justify-between">
                  <span className="text-slate-400 font-bold uppercase">Course</span>
                  <span className="font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                    {profile.course}
                  </span>
                </div>

                <div className="pt-3 flex items-center justify-between">
                  <span className="text-slate-400 font-bold uppercase">Section</span>
                  <span className="font-extrabold text-slate-900">{profile.section}</span>
                </div>

                <div className="pt-3 flex items-center justify-between">
                  <span className="text-slate-400 font-bold uppercase">Year Level</span>
                  <span className="font-extrabold text-slate-900">{profile.year_level}</span>
                </div>
              </div>
            </div>

            {/* Account Password Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 flex items-center justify-between shadow-sm">
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">Portal Account Password</h4>
                <p className="text-[11px] text-slate-400">Keep your account secure by maintaining a strong password.</p>
              </div>
              <button className="text-xs font-bold border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-xl transition">
                Change Password
              </button>
            </div>

            {/* Administrator Managed Profile Notice */}
            <div className="bg-[#EFF6FF] border border-blue-100 rounded-3xl p-4 flex items-start gap-3">
              <span className="text-blue-500 font-bold">ℹ️</span>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                <strong>ADMINISTRATOR MANAGED PROFILE:</strong> Your official student record (Name, Student ID, Email, Course, Section, and Year) is maintained by the organization administrators. If you need any corrections, please contact an organization officer.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export async function getServerSideProps() {
  return {
    props: {},
  };
}
