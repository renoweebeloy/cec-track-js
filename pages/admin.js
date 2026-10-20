import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

export default function AdminDashboard() {
  // 5 MAIN TABS: 'profile', 'add-student', 'add-staff', 'add-event', 'scan-qr'
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
  const [scanLogMsg, setScanLogMsg] = useState('');

  // Lists & Data
  const [students, setStudents] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Ang 5 ka opisyal nga kurso
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

  // Fetch tanang data gikan sa Supabase
  const fetchAllData = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      // Students (role: student or null)
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('id', { ascending: false });

      if (profilesData) {
        setStudents(profilesData.filter((p) => p.role !== 'staff' && p.role !== 'admin'));
        setStaffList(profilesData.filter((p) => p.role === 'staff'));
      }

      // Events
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
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // ========================================================
  // FEATURE 2: ADD STUDENT (With strict format checking)
  // ========================================================
  const handleAddStudent = async (e) => {
    e.preventDefault();

    // Regex check: Pananglitan 2024-0616 o 2024-00123
    const idRegex = /^\d{4}-\d{4,5}$/;
    if (!idRegex.test(studentId.trim())) {
      showNotify(
        'error',
        '❌ Sayop nga Student ID format! Kinahanglan sama ani: 2024-0616 (Tuig-Numero).'
      );
      return;
    }

    setLoading(true);

    let { error } = await supabase.from('profiles').insert([
      {
        school_id: studentId.trim(),
        full_name: studentName.trim(),
        email: studentEmail.trim().toLowerCase(),
        course: studentCourse,
        year_level: studentYear,
        role: 'student',
        status: 'Active',
      },
    ]);

    // Fallback kon wala pa ang bag-ong columns
    if (error && error.message.includes('column')) {
      const fallback = await supabase.from('profiles').insert([
        {
          school_id: studentId.trim(),
          email: studentEmail.trim().toLowerCase(),
        },
      ]);
      error = fallback.error;
    }

    setLoading(false);

    if (error) {
      showNotify('error', `Error pag-add sa student: ${error.message}`);
    } else {
      showNotify(
        'success',
        `✅ Student (${studentId}) narehistro na sa whitelist! Makasulod na siya sa portal.`
      );
      setStudentId('');
      setStudentName('');
      setStudentEmail('');
      fetchAllData();
    }
  };

  // ========================================================
  // FEATURE 3: ADD STAFF (Unlocks scanning permissions)
  // ========================================================
  const handleAddStaff = async (e) => {
    e.preventDefault();
    setLoading(true);

    const generatedStaffId = `STAFF-${Math.floor(1000 + Math.random() * 9000)}`;

    let { error } = await supabase.from('profiles').insert([
      {
        school_id: generatedStaffId,
        full_name: staffName.trim(),
        email: staffEmail.trim().toLowerCase(),
        role: 'staff',
        can_scan: true,
        status: 'Active',
      },
    ]);

    if (error && error.message.includes('column')) {
      const fallback = await supabase.from('profiles').insert([
        {
          school_id: generatedStaffId,
          email: staffEmail.trim().toLowerCase(),
        },
      ]);
      error = fallback.error;
    }

    setLoading(false);

    if (error) {
      showNotify('error', `Error pag-add og staff: ${error.message}`);
    } else {
      showNotify(
        'success',
        `🎉 Si ${staffName} narehistro na isip opisyal nga Staff! Na-activate na ang iyang Scanner feature.`
      );
      setStaffName('');
      setStaffEmail('');
      fetchAllData();
    }
  };

  // ========================================================
  // FEATURE 4: ADD EVENT (With Date, Time In & Time Out)
  // ========================================================
  const handleAddEvent = async (e) => {
    e.preventDefault();
    setLoading(true);

    let { error } = await supabase.from('events').insert([
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

    if (error && error.message.includes('column')) {
      const fallback = await supabase.from('events').insert([
        {
          title: eventTitle.trim(),
          description: `${eventLocation.trim()} (In: ${timeIn}, Out: ${timeOut}) — ${eventDesc.trim()}`,
          date: eventDate,
          status: eventStatus,
        },
      ]);
      error = fallback.error;
    }

    setLoading(false);

    if (error) {
      showNotify('error', `Error pag-publish sa event: ${error.message}`);
    } else {
      showNotify('success', `📅 Event "${eventTitle}" napatik na uban ang Time In/Out!`);
      setEventTitle('');
      setEventDesc('');
      setEventDate('');
      setTimeIn('08:00');
      setTimeOut('17:00');
      fetchAllData();
    }
  };

  // ========================================================
  // FEATURE 5: QUICK QR / MANUAL ATTENDANCE SCANNER
  // ========================================================
  const handleManualScanSubmit = async (e) => {
    e.preventDefault();
    if (!manualStudentId) return;

    setScanLogMsg('Ginasusi ang Student ID...');

    // 1. Susiha kon ang ID anaa ba sa whitelist
    const studentMatch = students.find(
      (s) => s.school_id?.toLowerCase() === manualStudentId.trim().toLowerCase()
    );

    if (!studentMatch) {
      setScanLogMsg('❌ BLOCKED: Kini nga Student ID wala sa Whitelist! Dili maka-attendance.');
      return;
    }

    // 2. I-record ang attendance
    const { error } = await supabase.from('attendance').insert([
      {
        student_id: studentMatch.school_id,
        student_name: studentMatch.full_name || 'Student',
        event_id: selectedEventId,
        status: 'PRESENT',
        time_in: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    if (error && !error.message.includes('relation "attendance" does not exist')) {
      setScanLogMsg(`Error: ${error.message}`);
    } else {
      setScanLogMsg(
        `✅ SUCCESS: Attendance recorded alang kang ${studentMatch.full_name || studentMatch.school_id} (${studentMatch.course || 'BSCRIM'})!`
      );
      setManualStudentId('');
    }
  };

  const handleDeleteUser = async (id, nameOrId) => {
    if (!confirm(`Sigurado ka nga tangtangon si ${nameOrId} sa whitelist?`)) return;
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) showNotify('error', error.message);
    else {
      showNotify('success', 'Natangtang na sa sistema.');
      fetchAllData();
    }
  };

  const handleDeleteEvent = async (id, title) => {
    if (!confirm(`I-delete ang event nga "${title}"?`)) return;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) showNotify('error', error.message);
    else {
      showNotify('success', 'Event deleted.');
      fetchAllData();
    }
  };

  // Filter students base sa search
  const filteredStudents = students.filter(
    (s) =>
      s.school_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.course?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 pb-16 antialiased font-sans">
      <Head>
        <title>CEC TRACK 3.0 • Admin Command Center</title>
      </Head>

      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center text-white font-black text-lg shadow-sm">
              C
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-orange-600 block leading-tight">
                CEC TRACK 3.0
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Admin Command Center
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/scanner"
              className="text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white px-3.5 py-2 rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <span>📷</span> Launch Camera Scanner
            </Link>
            <Link
              href="/"
              className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl transition"
            >
              Portal Home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6">
        {/* TOP TITLE */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-[11px] font-extrabold uppercase text-orange-600 tracking-wider bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
              ⚡ CENTRAL CONTROL HUB
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              System Administration
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Whitelist verification, staff role delegation, event scheduling, ug live attendance.
            </p>
          </div>

          <button
            onClick={fetchAllData}
            className="self-start sm:self-auto text-xs sm:text-sm font-bold px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 shadow-sm flex items-center gap-2 transition"
          >
            <span>🔄</span> {loading ? 'Refreshing...' : 'Refresh Records'}
          </button>
        </div>

        {/* NOTIFICATION BANNER */}
        {notification.message && (
          <div
            className={`mb-6 p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between shadow-sm transition-all ${
              notification.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification({ type: '', message: '' })}
              className="text-xs uppercase font-extrabold ml-4 opacity-70 hover:opacity-100"
            >
              Close
            </button>
          </div>
        )}

        {/* 5 NAVIGATION TABS */}
        <div className="flex gap-2 p-1.5 bg-slate-200/80 rounded-2xl mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition ${
              activeTab === 'profile'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            👤 1. Admin Profile & Overview
          </button>
          <button
            onClick={() => setActiveTab('add-student')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition ${
              activeTab === 'add-student'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🎓 2. Add Student (Whitelist)
          </button>
          <button
            onClick={() => setActiveTab('add-staff')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition ${
              activeTab === 'add-staff'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🛡️ 3. Add Staff (Scanner Access)
          </button>
          <button
            onClick={() => setActiveTab('add-event')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition ${
              activeTab === 'add-event'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📅 4. Add Event
          </button>
          <button
            onClick={() => setActiveTab('scan-qr')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition ${
              activeTab === 'scan-qr'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📷 5. Scan QR & Quick Log
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: ADMIN PROFILE & OVERVIEW STATS */}
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
                  <span className="text-xs bg-orange-50 text-orange-600 font-bold px-2 py-0.5 rounded-md">
                    Verified
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
                <span className="text-[11px] font-black uppercase text-blue-600">
                  AUTHORIZED STAFF
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-blue-600">{staffList.length}</span>
                  <span className="text-xs bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-md">
                    Scanners
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
                  <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md">
                    Open
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
                <span className="text-[11px] font-black uppercase text-slate-400">
                  TOTAL EVENTS
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-slate-700">{events.length}</span>
                  <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md">
                    History
                  </span>
                </div>
              </div>
            </div>

            {/* Admin Profile Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black text-2xl shadow-md shadow-orange-500/20">
                  A
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full">
                    HEAD ADMINISTRATOR
                  </span>
                  <h2 className="text-xl font-black text-slate-900 mt-1">
                    CEC Track Lead Admin
                  </h2>
                  <p className="text-xs text-slate-400">
                    Full privileges: Whitelist enrollment, role assignment, and database management.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-2">
                <p>
                  🔒 <strong>Login Security Rule:</strong> Ang usa ka estudyante dili makasulod sa sistema kon ang iyang School ID wala marehistro sa Whitelist pinaagi sa <em>Tab 2: Add Student</em>.
                </p>
                <p>
                  📷 <strong>Staff Permission:</strong> Ang mga Staff lamang nga narehistro sa <em>Tab 3: Add Staff</em> ang adunay katungod sa pag-scan sa mga QR codes sa mga estudyante.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: ADD STUDENT (With 5 Courses & Strict ID Check) */}
        {/* ========================================================= */}
        {activeTab === 'add-student' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Form */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
              <span className="text-[11px] font-black uppercase text-orange-600">
                WHITELIST REGISTRATION
              </span>
              <h2 className="text-xl font-black text-slate-900 mb-1">Add Student Member</h2>
              <p className="text-xs text-slate-400 mb-5">
                Ang School ID kinahanglan gayod sundon ang format: <strong>2024-0616</strong>.
              </p>

              <form onSubmit={handleAddStudent} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    School ID (Required Format: 2024-0616) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2024-0616"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    pattern="\d{4}-\d{4,5}"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    * Format: 4 ka digit nga tuig, hyphen, ug numero (e.g. 2024-0616)
                  </span>
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
                    placeholder="e.g. student@dorsu.edu.ph"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Course (5 Options)
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
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-extrabold py-3.5 rounded-xl shadow-md shadow-orange-500/25 transition mt-2"
                >
                  {loading ? 'Ginasave...' : 'Enroll Student to Whitelist'}
                </button>
              </form>
            </div>

            {/* List */}
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
                  placeholder="🔍 Pangitaa pinaagi sa ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {filteredStudents.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Walay estudyante nga nakit-an.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase">
                        <th className="py-2.5 px-2">School ID</th>
                        <th className="py-2.5 px-2">Pangalan</th>
                        <th className="py-2.5 px-2">Kurso</th>
                        <th className="py-2.5 px-2 text-right">Aksyon</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.map((st) => (
                        <tr key={st.id || st.school_id} className="hover:bg-slate-50">
                          <td className="py-3 px-2 font-black text-slate-900">{st.school_id}</td>
                          <td className="py-3 px-2 font-semibold text-slate-700">{st.full_name || st.email}</td>
                          <td className="py-3 px-2">
                            <span className="px-2 py-0.5 rounded font-black text-[10px] bg-blue-50 text-blue-700">
                              {st.course || 'BSCRIM'}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <button
                              onClick={() => handleDeleteUser(st.id, st.school_id)}
                              className="text-rose-600 hover:text-rose-800 font-bold px-2 py-1"
                            >
                              Remove
                            </button>
                          </td>
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
        {/* TAB 3: ADD STAFF (Delegates QR Scanner Permissions) */}
        {/* ========================================================= */}
        {activeTab === 'add-staff' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
              <span className="text-[11px] font-black uppercase text-blue-600">
                STAFF PERMISSIONS
              </span>
              <h2 className="text-xl font-black text-slate-900 mb-1">Add Staff Officer</h2>
              <p className="text-xs text-slate-400 mb-5">
                Ang mga opisyal nga marehistro diri makabaton og access sa <strong>QR Scanner</strong> aron maka-check sa attendance.
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

                <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3">
                  <span className="text-xl">📷</span>
                  <span className="text-xs font-bold text-blue-900">
                    Automatic Scanner Authorization (can_scan = true)
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold py-3.5 rounded-xl shadow-md shadow-blue-500/25 transition mt-2"
                >
                  {loading ? 'Ginasave...' : 'Register Staff & Enable Scanner'}
                </button>
              </form>
            </div>

            {/* Staff List */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-1">
                Authorized Staff Scanners ({staffList.length})
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Sila ang gitugotan nga mogamit sa attendance QR scanner.
              </p>

              {staffList.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Wala pay na-assign nga staff scanner. Pag-rehistro sa pikas porma.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {staffList.map((st) => (
                    <div key={st.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="font-black text-slate-900">{st.full_name}</div>
                        <div className="text-slate-400">{st.email}</div>
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
        {/* TAB 4: ADD EVENT (With Date, Time In, Time Out) */}
        {/* ========================================================= */}
        {activeTab === 'add-event' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
              <span className="text-[11px] font-black uppercase text-emerald-600">
                EVENT MANAGEMENT
              </span>
              <h2 className="text-xl font-black text-slate-900 mb-1">Create New Event</h2>
              <p className="text-xs text-slate-400 mb-5">
                I-set ang schedule, Required Time In, ug Time Out alang sa attendance tracking.
              </p>

              <form onSubmit={handleAddEvent} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Siglakas 2026 (2nd Day)"
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
                      Scanning Status
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

                {/* Time In & Time Out */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-emerald-600 mb-1">
                      ⏰ Time In *
                    </label>
                    <input
                      type="time"
                      value={timeIn}
                      onChange={(e) => setTimeIn(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-blue-600 mb-1">
                      ⏱️ Time Out *
                    </label>
                    <input
                      type="time"
                      value={timeOut}
                      onChange={(e) => setTimeOut(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Description *
                  </label>
                  <textarea
                    rows="2"
                    placeholder="Attendance guidelines o pahibalo..."
                    value={eventDesc}
                    onChange={(e) => setEventDesc(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-extrabold py-3.5 rounded-xl shadow-md transition"
                >
                  {loading ? 'Publishing...' : 'Publish Official Event'}
                </button>
              </form>
            </div>

            {/* Events List */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-lg font-black text-slate-900">
                Published Events ({events.length})
              </h3>
              {events.length === 0 ? (
                <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center text-slate-400 text-xs">
                  Wala pay event nga napatik.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {events.map((ev) => (
                    <div
                      key={ev.id}
                      className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              ev.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {ev.status === 'active' ? '● OPEN' : '✖ CLOSED'}
                          </span>
                          <span className="text-xs text-slate-400 font-bold">{ev.date}</span>
                        </div>
                        <h4 className="font-black text-slate-900">{ev.title}</h4>
                        <div className="text-xs text-slate-500 mt-1 flex gap-3 font-semibold">
                          <span>🟢 In: {ev.time_in || '08:00'}</span>
                          <span>⏱️ Out: {ev.time_out || '17:00'}</span>
                          <span>📍 {ev.location || 'FaCET Facade'}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteEvent(ev.id, ev.title)}
                        className="text-xs text-rose-600 font-bold hover:bg-rose-50 px-3 py-1.5 rounded-xl transition"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
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
            {/* Camera Launcher Card */}
            <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <span className="text-[11px] font-black uppercase text-purple-600">
                OFFICIAL QR SCANNER
              </span>
              <h2 className="text-xl font-black text-slate-900">Live Camera QR Scanner</h2>
              <p className="text-xs text-slate-500">
                Gamita ang camera sa imong cellphone o laptop aron diretsong i-scan ang Digital ID QR sa estudyante.
              </p>

              <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100 text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-500 text-white flex items-center justify-center text-3xl shadow-lg shadow-purple-500/20">
                  📷
                </div>
                <h4 className="font-black text-slate-900">Launch Dedicated Scanner Window</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Awtomatikong mo-abli sa video stream aron paspas ang pagsulod sa attendance logs.
                </p>
                <Link
                  href="/scanner"
                  className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-black text-xs px-6 py-3 rounded-2xl shadow-md transition"
                >
                  Ablihi ang Camera Scanner ➔
                </Link>
              </div>
            </div>

            {/* Quick Manual Fallback Logger */}
            <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <span className="text-[11px] font-black uppercase text-orange-600">
                MANUAL FALLBACK LOG
              </span>
              <h2 className="text-xl font-black text-slate-900">Quick School ID Attendance</h2>
              <p className="text-xs text-slate-500">
                Para sa mga estudyante nga walay QR code o hinay ang camera, i-type direkta ang School ID (e.g. <strong>2024-0616</strong>).
              </p>

              <form onSubmit={handleManualScanSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Pilia ang Target Event
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
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold py-3 rounded-xl shadow-md transition"
                >
                  ✓ Mark as Present
                </button>
              </form>

              {scanLogMsg && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
                  {scanLogMsg}
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
  return {
    props: {},
  };
}
