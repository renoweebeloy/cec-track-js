import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Home.module.css';

export default function AdminDashboard() {
  const router = useRouter();

  // Authentication & Security Guard States
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [userRole, setUserRole] = useState('admin'); // 'admin' | 'staff'
  const [currentUser, setCurrentUser] = useState({ name: '', email: '', school_id: '' });

  // Navigation: 'profile' | 'add-student' | 'add-staff' | 'add-event' | 'scan-qr'
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // 1. Student States (Strict ID validation & 5 Courses)
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentCourse, setStudentCourse] = useState('BSCRIM');
  const [studentYear, setStudentYear] = useState('1st Year');

  // 2. Staff States
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState('Staff Officer');

  // 3. Event States (Date, Time In, Time Out)
  const [eventTitle, setEventTitle] = useState('');
  const [eventLocation, setEventLocation] = useState('FaCET Facade');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [timeIn, setTimeIn] = useState('08:00');
  const [timeOut, setTimeOut] = useState('17:00');
  const [eventStatus, setEventStatus] = useState('active');

  // 4. Quick Manual QR / Attendance Logger States
  const [manualStudentId, setManualStudentId] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [scanLogMsg, setScanLogMsg] = useState({ type: '', text: '' });

  // Data Lists & Filters
  const [students, setStudents] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [events, setEvents] = useState([]);
  const [searchStudentQuery, setSearchStudentQuery] = useState('');
  const [searchEventQuery, setSearchEventQuery] = useState('');

  // 5 Opisyal nga Kurso
  const courses = [
    { code: 'BSCRIM', name: 'Bachelor of Science in Criminology' },
    { code: 'BSBA', name: 'Bachelor of Science in Business Administration' },
    { code: 'BSAM', name: 'Bachelor of Science in Agribusiness Management' },
    { code: 'BEED', name: 'Bachelor of Elementary Education' },
    { code: 'BSA', name: 'Bachelor of Science in Accountancy' },
  ];

  const showNotify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification({ type: '', message: '' });
    }, 4500);
  };

  // ========================================================
  // ROUTE GUARD: Gitugotan ang ADMIN ug STAFF
  // ========================================================
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
          .eq('email', userEmail)
          .single();

        if (error || !profile) {
          router.replace('/login');
          return;
        }

        // Gitugotan ang Admin ug Staff
        if (profile.role !== 'admin' && profile.role !== 'staff') {
          alert('⛔ ACCESS DENIED: Estudyante ka, dad-on ka sa imong Student Portal.');
          router.replace('/dashboard');
          return;
        }

        setUserRole(profile.role);
        setCurrentUser({
          name: profile.full_name || (profile.role === 'admin' ? 'Administrator' : 'Staff Officer'),
          email: profile.email,
          school_id: profile.school_id || '',
        });

        // Kon staff ang nag-login, default tab dayon ang QR Scanner
        if (profile.role === 'staff') {
          setActiveTab('scan-qr');
        }

        setIsAuthorized(true);
        fetchAllData();
      } catch (err) {
        console.error('Portal access verification error:', err);
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
        setStaffList(profilesData.filter((p) => p.role === 'staff'));
      }

      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false });

      if (eventsData) {
        setEvents(eventsData);
        if (eventsData.length > 0 && !selectedEventId) {
          setSelectedEventId(eventsData[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
    }
    router.replace('/');
  };

  // ADD STUDENT HANDLER (Regex Format Check)
  const handleAddStudent = async (e) => {
    e.preventDefault();

    const idRegex = /^\d{4}-\d{4,5}$/;
    if (!idRegex.test(studentId.trim())) {
      showNotify('error', '❌ Sayop nga Student ID format! Sunda ang format: 2024-0616.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('profiles').insert([
      {
        school_id: studentId.trim(),
        full_name: studentName.trim(),
        email: studentEmail.trim().toLowerCase(),
        course: studentCourse,
        year_level: studentYear,
        role: 'student',
        can_scan: false,
        status: 'Active',
      },
    ]);

    setLoading(false);

    if (error) {
      showNotify('error', `Error pag-add sa student: ${error.message}`);
    } else {
      showNotify('success', `✅ Student (${studentId.trim()}) narehistro na sa Whitelist!`);
      setStudentId('');
      setStudentName('');
      setStudentEmail('');
      fetchAllData();
    }
  };

  // ADD STAFF HANDLER
  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (userRole !== 'admin') {
      showNotify('error', 'Admin lamang ang gitugotan nga mag-rehistro og staff.');
      return;
    }

    setLoading(true);
    const generatedStaffId = `STAFF-${Math.floor(1000 + Math.random() * 9000)}`;

    const { error } = await supabase.from('profiles').insert([
      {
        school_id: generatedStaffId,
        full_name: staffName.trim(),
        email: staffEmail.trim().toLowerCase(),
        role: 'staff',
        can_scan: true,
        status: 'Active',
      },
    ]);

    setLoading(false);

    if (error) {
      showNotify('error', `Error: ${error.message}`);
    } else {
      showNotify('success', `🎉 Si ${staffName} narehistro na isip Staff! Active na iyang Scanner.`);
      setStaffName('');
      setStaffEmail('');
      fetchAllData();
    }
  };

  // ADD EVENT HANDLER
  const handleAddEvent = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('events').insert([
      {
        title: eventTitle.trim(),
        location: eventLocation.trim(),
        date: eventDate,
        time_in: timeIn,
        time_out: timeOut,
        description: eventDesc.trim(),
        status: eventStatus,
      },
    ]);

    setLoading(false);

    if (error) {
      showNotify('error', `Error: ${error.message}`);
    } else {
      showNotify('success', `📅 Event "${eventTitle}" opisyal nang napatik!`);
      setEventTitle('');
      setEventDesc('');
      setEventDate('');
      setTimeIn('08:00');
      setTimeOut('17:00');
      fetchAllData();
    }
  };

  // QUICK ATTENDANCE SCANNER
  const handleManualScanSubmit = async (e) => {
    e.preventDefault();
    if (!manualStudentId) return;

    setScanLogMsg({ type: 'info', text: 'Ginasusi ang Student ID...' });

    const studentMatch = students.find(
      (s) => s.school_id?.toLowerCase() === manualStudentId.trim().toLowerCase()
    );

    if (!studentMatch) {
      setScanLogMsg({
        type: 'error',
        text: '❌ BLOCKED: Kini nga School ID wala sa Whitelist! Dili maka-attendance.',
      });
      return;
    }

    const { error } = await supabase.from('attendance').insert([
      {
        student_id: studentMatch.school_id,
        student_name: studentMatch.full_name || 'CEC Student',
        event_id: selectedEventId,
        status: 'PRESENT',
        time_in: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        scanned_by: currentUser.email || userRole,
      },
    ]);

    if (error) {
      if (error.code === '23505') {
        setScanLogMsg({
          type: 'warning',
          text: `⚠️ Naka-record na daan og attendance si ${studentMatch.full_name} (${studentMatch.school_id})!`,
        });
      } else {
        setScanLogMsg({ type: 'error', text: `Error: ${error.message}` });
      }
    } else {
      setScanLogMsg({
        type: 'success',
        text: `✅ SUCCESS: Attendance recorded alang kang ${studentMatch.full_name} (${studentMatch.course})!`,
      });
      setManualStudentId('');
    }
  };

  const handleDeleteUser = async (id, identifier) => {
    if (userRole !== 'admin') {
      alert('Admin lamang ang makatangtang og user.');
      return;
    }
    if (!confirm(`Sigurado ka nga tangtangon si ${identifier}?`)) return;
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) showNotify('error', error.message);
    else {
      showNotify('success', 'Natangtang na sa sistema.');
      fetchAllData();
    }
  };

  const handleDeleteEvent = async (id, title) => {
    if (userRole !== 'admin') {
      alert('Admin lamang ang makatangtang og event.');
      return;
    }
    if (!confirm(`I-delete ang event nga "${title}"?`)) return;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) showNotify('error', error.message);
    else {
      showNotify('success', 'Event deleted.');
      fetchAllData();
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
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white px-4">
        <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border-2 border-orange-500 flex items-center justify-center animate-pulse mb-4">
          <span className="text-2xl font-black text-orange-500">C</span>
        </div>
        <p className="text-sm font-extrabold tracking-wider uppercase text-slate-300">
          Ginasusi ang imong Portal Clearance...
        </p>
      </div>
    );
  }

  if (!isAuthorized) return null;

  const isAdmin = userRole === 'admin';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased font-sans pb-20">
      <Head>
        <title>CEC TRACK 3.0 • {isAdmin ? 'Admin Portal' : 'Staff Portal'}</title>
      </Head>

      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-orange-400 flex items-center justify-center text-white font-black text-xl shadow-md shadow-orange-500/20">
              C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-slate-900">
                  CEC TRACK <span className="text-orange-600">3.0</span>
                </span>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider ${
                    isAdmin
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {isAdmin ? 'ADMIN COMMAND' : 'STAFF SCANNER ACCESS'}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400 block -mt-0.5">
                College of Engineering and Computing
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/scanner"
              className="text-xs font-black bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2.5 rounded-2xl shadow-md shadow-orange-500/20 transition flex items-center gap-2"
            >
              <span>📷</span>
              <span className="hidden sm:inline">Camera Scanner</span>
            </Link>

            <button
              onClick={handleSignOut}
              className="text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 px-3.5 py-2.5 rounded-2xl transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* BANNER GREETING */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600">
                PORTAL ACTIVE ({userRole.toUpperCase()})
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Welcome back, {currentUser.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {isAdmin
                ? 'Whitelist enrollment, staff delegation, event scheduling, ug live attendance.'
                : 'Staff Attendance Monitoring Portal & QR Code Verification.'}
            </p>
          </div>

          <button
            onClick={fetchAllData}
            disabled={loading}
            className="self-start sm:self-auto text-xs font-bold px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-sm flex items-center gap-2 transition"
          >
            <span className={loading ? 'animate-spin' : ''}>🔄</span>
            <span>{loading ? 'Refreshing...' : 'Sync Database'}</span>
          </button>
        </div>

        {/* NOTIFICATION */}
        {notification.message && (
          <div
            className={`mb-6 p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center justify-between shadow-sm transition-all ${
              notification.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification({ type: '', message: '' })}
              className="text-[10px] uppercase font-black ml-4 opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 5 NAVIGATION TABS */}
        <div className="flex gap-2 p-1.5 bg-slate-200/80 rounded-2xl mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition ${
              activeTab === 'profile'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            👤 1. System Overview
          </button>

          <button
            onClick={() => setActiveTab('add-student')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition ${
              activeTab === 'add-student'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🎓 2. Whitelist Students
          </button>

          {/* Ang Add Staff makita lamang kon Admin ang naka-login */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('add-staff')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition ${
                activeTab === 'add-staff'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🛡️ 3. Manage Staff
            </button>
          )}

          <button
            onClick={() => setActiveTab('add-event')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition ${
              activeTab === 'add-event'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📅 4. Manage Events
          </button>

          <button
            onClick={() => setActiveTab('scan-qr')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition ${
              activeTab === 'scan-qr'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📷 5. Scan QR & Quick Log
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: SYSTEM OVERVIEW */}
        {/* ========================================================= */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
                <span className="text-[11px] font-black uppercase text-slate-400">
                  WHITELISTED STUDENTS
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-slate-900">{students.length}</span>
                  <span className="text-[11px] bg-orange-50 text-orange-600 font-extrabold px-2 py-0.5 rounded-lg border border-orange-100">
                    5 Programs
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
                <span className="text-[11px] font-black uppercase text-blue-600">
                  AUTHORIZED STAFF
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-blue-600">{staffList.length}</span>
                  <span className="text-[11px] bg-blue-50 text-blue-700 font-extrabold px-2 py-0.5 rounded-lg border border-blue-100">
                    Active Scanners
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
                <span className="text-[11px] font-black uppercase text-emerald-600">
                  ACTIVE EVENTS
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-emerald-600">
                    {events.filter((e) => e.status === 'active').length}
                  </span>
                  <span className="text-[11px] bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded-lg border border-emerald-100">
                    Open Attendance
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
                <span className="text-[11px] font-black uppercase text-slate-400">
                  TOTAL EVENTS
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-slate-800">{events.length}</span>
                  <span className="text-[11px] bg-slate-100 text-slate-600 font-extrabold px-2 py-0.5 rounded-lg border border-slate-200">
                    History
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
              <h3 className="text-base font-black text-slate-900 mb-4">
                Students Distribution by Course
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {courses.map((c) => {
                  const count = students.filter((s) => s.course === c.code).length;
                  return (
                    <div key={c.code} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-xs font-black text-orange-600 block">{c.code}</span>
                      <span className="text-2xl font-black text-slate-900 my-1 block">{count}</span>
                      <span className="text-[10px] text-slate-400 font-medium block truncate" title={c.name}>
                        {c.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: WHITELIST STUDENTS */}
        {/* ========================================================= */}
        {activeTab === 'add-student' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Kon Admin: Makasulat og bag-ong student; Kon Staff: Tan-aw lang */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
              <span className="text-[11px] font-black uppercase text-orange-600">
                OFFICIAL WHITELIST
              </span>
              <h2 className="text-xl font-black text-slate-900 mb-1">
                {isAdmin ? 'Add Student Member' : 'Student Whitelist Info'}
              </h2>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                Ang School ID kinahanglan gayod sundon ang format: <strong>2024-0616</strong>.
              </p>

              {isAdmin ? (
                <form onSubmit={handleAddStudent} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      School ID (Format: 2024-0616) *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2024-0616"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      pattern="\d{4}-\d{4,5}"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Renowee Beloy"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Student Email Address *
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. renowee.beloy@dorsu.edu.ph"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                        Course
                      </label>
                      <select
                        value={studentCourse}
                        onChange={(e) => setStudentCourse(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        {courses.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.code}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                        Year Level
                      </label>
                      <select
                        value={studentYear}
                        onChange={(e) => setStudentYear(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black py-3.5 rounded-2xl shadow-md shadow-orange-500/25 transition mt-2"
                  >
                    {loading ? 'Saving Record...' : 'Enroll to Whitelist ➔'}
                  </button>
                </form>
              ) : (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl text-xs text-blue-800">
                  ℹ️ <strong>Staff Notice:</strong> Aduna kay access sa pag-tan-aw sa mga estudyante. Ang Head Admin lamang ang makadugang o makatangtang og bag-ong miyembro sa whitelist.
                </div>
              )}
            </div>

            {/* Students List Table */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Enrolled Students ({filteredStudents.length})
                  </h3>
                  <p className="text-xs text-slate-400">BSCRIM, BSBA, BSAM, BEED, BSA</p>
                </div>
                <input
                  type="text"
                  placeholder="🔍 Search ID, Name or Course..."
                  value={searchStudentQuery}
                  onChange={(e) => setSearchStudentQuery(e.target.value)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {filteredStudents.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Walay estudyante nga nakit-an.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-black uppercase text-[10px]">
                        <th className="py-2.5 px-3">School ID</th>
                        <th className="py-2.5 px-3">Student Name</th>
                        <th className="py-2.5 px-3">Course & Year</th>
                        {isAdmin && <th className="py-2.5 px-3 text-right">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.map((st) => (
                        <tr key={st.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-3 font-black text-slate-900">{st.school_id}</td>
                          <td className="py-3 px-3 font-bold text-slate-700">
                            <div>{st.full_name}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{st.email}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-md font-black text-[10px] bg-blue-50 text-blue-700 border border-blue-100 mr-1.5">
                              {st.course}
                            </span>
                            <span className="text-[10px] text-slate-500">{st.year_level}</span>
                          </td>
                          {isAdmin && (
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => handleDeleteUser(st.id, st.school_id)}
                                className="text-rose-600 hover:text-rose-800 font-extrabold px-2 py-1 rounded-lg hover:bg-rose-50 transition"
                              >
                                Remove
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: MANAGE STAFF (Admin Only) */}
        {/* ========================================================= */}
        {activeTab === 'add-staff' && isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
              <span className="text-[11px] font-black uppercase text-blue-600">
                STAFF PERMISSIONS
              </span>
              <h2 className="text-xl font-black text-slate-900 mb-1">Add Staff Officer</h2>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                Ang mga opisyal nga narehistro diri makagamit sa ilang account aron mo-scan og QR codes.
              </p>

              <form onSubmit={handleAddStaff} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Staff Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Officer Maria Santos"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Staff Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. staff.maria@dorsu.edu.ph"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Designation / Title
                  </label>
                  <input
                    type="text"
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3">
                  <span className="text-2xl">📷</span>
                  <div className="text-xs">
                    <p className="font-black text-blue-900">Scanner Authorization Active</p>
                    <p className="text-blue-700 text-[11px]">can_scan = true is granted automatically.</p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-2xl shadow-md shadow-blue-500/25 transition mt-2"
                >
                  {loading ? 'Saving Staff...' : 'Authorize Staff Scanner ➔'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-1">
                Authorized Staff Members ({staffList.length})
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Sila ang gitugotan sa pag-scan sa mga student QR codes.
              </p>

              {staffList.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Wala pay na-rehistro nga staff scanner.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {staffList.map((st) => (
                    <div key={st.id} className="py-3.5 flex items-center justify-between">
                      <div>
                        <div className="font-black text-slate-900 text-sm">{st.full_name}</div>
                        <div className="text-slate-400 text-[11px]">{st.email}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-black px-2.5 py-1 rounded-full text-[10px]">
                          ✓ Scanner Active
                        </span>
                        <button
                          onClick={() => handleDeleteUser(st.id, st.full_name)}
                          className="text-rose-600 hover:text-rose-800 font-bold"
                        >
                          Revoke
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: MANAGE EVENTS */}
        {/* ========================================================= */}
        {activeTab === 'add-event' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
              <span className="text-[11px] font-black uppercase text-emerald-600">
                EVENT SCHEDULING
              </span>
              <h2 className="text-xl font-black text-slate-900 mb-1">Publish New Event</h2>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                I-set ang schedule, Required Time In, ug Time Out alang sa attendance tracking.
              </p>

              <form onSubmit={handleAddEvent} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Siglakas 2026 (Day 2)"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Venue / Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. FaCET Facade"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Scanning Mode
                    </label>
                    <select
                      value={eventStatus}
                      onChange={(e) => setEventStatus(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="active">🟢 Active (Open)</option>
                      <option value="inactive">⚪ Inactive (Closed)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-emerald-600 mb-1">
                      ⏰ Required Time In *
                    </label>
                    <input
                      type="time"
                      value={timeIn}
                      onChange={(e) => setTimeIn(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-blue-600 mb-1">
                      ⏱️ Required Time Out *
                    </label>
                    <input
                      type="time"
                      value={timeOut}
                      onChange={(e) => setTimeOut(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Event Description *
                  </label>
                  <textarea
                    rows="2"
                    placeholder="Attendance guidelines o announcement..."
                    value={eventDesc}
                    onChange={(e) => setEventDesc(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-3.5 rounded-2xl shadow-md transition mt-2"
                >
                  {loading ? 'Publishing...' : 'Publish Official Event ➔'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-black text-slate-900">
                  Published Events ({filteredEvents.length})
                </h3>
                <input
                  type="text"
                  placeholder="🔍 Search event..."
                  value={searchEventQuery}
                  onChange={(e) => setSearchEventQuery(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {filteredEvents.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 text-xs">
                  Wala pay event nga napatik.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5">
                  {filteredEvents.map((ev) => {
                    const isActive = ev.status === 'active';
                    return (
                      <div
                        key={ev.id}
                        className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {isActive ? '● ACTIVE (OPEN)' : '✖ INACTIVE (CLOSED)'}
                            </span>
                            <span className="text-xs text-slate-400 font-bold">{ev.date}</span>
                          </div>
                          <h4 className="text-base font-black text-slate-900">{ev.title}</h4>
                          <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1 font-semibold pt-1">
                            <span>🟢 In: {ev.time_in || '08:00'}</span>
                            <span>⏱️ Out: {ev.time_out || '17:00'}</span>
                            <span className="text-orange-600">📍 {ev.location || 'FaCET Facade'}</span>
                          </div>
                        </div>

                        {isAdmin && (
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              onClick={() => handleDeleteEvent(ev.id, ev.title)}
                              className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-xl transition"
                            >
                              Delete
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
        )}

        {/* ========================================================= */}
        {/* TAB 5: SCAN QR CODE & QUICK LOG */}
        {/* ========================================================= */}
        {activeTab === 'scan-qr' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <span className="text-[11px] font-black uppercase text-purple-600">
                OFFICIAL QR SCANNER
              </span>
              <h2 className="text-xl font-black text-slate-900">Live Camera Attendance Scanner</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Gamita ang camera sa imong cellphone o laptop aron diretsong i-scan ang Digital ID QR code sa estudyante.
              </p>

              <div className="bg-purple-50 p-8 rounded-3xl border border-purple-100 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-purple-600 text-white flex items-center justify-center text-3xl shadow-lg shadow-purple-600/25">
                  📷
                </div>
                <h4 className="text-base font-black text-slate-900">Dedicated Scanner Window</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Awtomatikong magbasa sa QR streams ug mo-validate sa whitelist records.
                </p>
                <Link
                  href="/scanner"
                  className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-black text-xs px-6 py-3.5 rounded-2xl shadow-md transition"
                >
                  Ablihi ang Camera Scanner ➔
                </Link>
              </div>
            </div>

            {/* Quick Manual Fallback Logger */}
            <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <span className="text-[11px] font-black uppercase text-orange-600">
                MANUAL FALLBACK LOGGER
              </span>
              <h2 className="text-xl font-black text-slate-900">Quick School ID Check-in</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Para sa mga estudyante nga walay dalang cellphone o hinay ang camera, i-type direkta ang School ID (e.g. <strong>2024-0616</strong>).
              </p>

              <form onSubmit={handleManualScanSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Select Event Schedule
                  </label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title} ({ev.date})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    School ID (e.g. 2024-0616) *
                  </label>
                  <input
                    type="text"
                    placeholder="I-type o i-paste ang 2024-0616..."
                    value={manualStudentId}
                    onChange={(e) => setManualStudentId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black py-3.5 rounded-2xl shadow-md transition"
                >
                  ✓ Mark as Present
                </button>
              </form>

              {scanLogMsg.text && (
                <div
                  className={`p-4 rounded-2xl border text-xs font-bold ${
                    scanLogMsg.type === 'error'
                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                      : scanLogMsg.type === 'warning'
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : scanLogMsg.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  {scanLogMsg.text}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
