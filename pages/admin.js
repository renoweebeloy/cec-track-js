import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'students' | 'events'
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Student Form States
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentCourse, setStudentCourse] = useState('BSCRIM');
  const [studentYear, setStudentYear] = useState('1st Year');

  // Event Form States (Naay Time In & Time Out)
  const [eventTitle, setEventTitle] = useState('');
  const [eventLocation, setEventLocation] = useState('FaCET Facade');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [timeIn, setTimeIn] = useState('08:00');
  const [timeOut, setTimeOut] = useState('17:00');
  const [eventStatus, setEventStatus] = useState('active');

  // Data Lists & Search
  const [students, setStudents] = useState([]);
  const [events, setEvents] = useState([]);
  const [searchStudent, setSearchStudent] = useState('');
  const [searchEvent, setSearchEvent] = useState('');

  // Bag-ong listahan sa mga kurso
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

  const fetchAllData = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('id', { ascending: false });

      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false });

      if (profilesData) setStudents(profilesData);
      if (eventsData) setEvents(eventsData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // 1. ADD STUDENT HANDLER
  const handleAddStudent = async (e) => {
    e.preventDefault();
    setLoading(true);

    let { error } = await supabase.from('profiles').insert([
      {
        school_id: studentId.trim(),
        email: studentEmail.trim().toLowerCase(),
        full_name: studentName.trim(),
        course: studentCourse,
        year_level: studentYear,
        status: 'Active',
      },
    ]);

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
      showNotify('error', `Error: ${error.message}`);
    } else {
      showNotify('success', `✅ Student (${studentId}) na-add na sa database!`);
      setStudentId('');
      setStudentName('');
      setStudentEmail('');
      fetchAllData();
    }
  };

  // 2. ADD EVENT HANDLER (Apil Time In & Time Out)
  const handleAddEvent = async (e) => {
    e.preventDefault();
    setLoading(true);

    let { error } = await supabase.from('events').insert([
      {
        title: eventTitle.trim(),
        description: eventDesc.trim(),
        location: eventLocation.trim(),
        date: eventDate,
        time_in: timeIn,
        time_out: timeOut,
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
      showNotify('error', `Error: ${error.message}`);
    } else {
      showNotify('success', `🎉 Event "${eventTitle}" na-publish na uban sa Time In/Out!`);
      setEventTitle('');
      setEventDesc('');
      setEventDate('');
      setTimeIn('08:00');
      setTimeOut('17:00');
      fetchAllData();
    }
  };

  // 3. TOGGLE EVENT STATUS
  const handleToggleEventStatus = async (eventItem) => {
    const newStatus = eventItem.status === 'active' ? 'inactive' : 'active';
    const { error } = await supabase
      .from('events')
      .update({ status: newStatus })
      .eq('id', eventItem.id);

    if (error) {
      showNotify('error', `Failed to update status: ${error.message}`);
    } else {
      showNotify('success', `Event "${eventItem.title}" is now ${newStatus.toUpperCase()}!`);
      fetchAllData();
    }
  };

  // 4. DELETE HANDLERS
  const handleDeleteEvent = async (id, title) => {
    if (!confirm(`Sigurado ka nga i-delete ang event nga "${title}"?`)) return;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) showNotify('error', error.message);
    else {
      showNotify('success', 'Event deleted.');
      fetchAllData();
    }
  };

  const handleDeleteStudent = async (id, schoolId) => {
    if (!confirm(`Remove student ${schoolId} from whitelist?`)) return;
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) showNotify('error', error.message);
    else {
      showNotify('success', `Student ${schoolId} removed.`);
      fetchAllData();
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      (s.school_id && s.school_id.toLowerCase().includes(searchStudent.toLowerCase())) ||
      (s.email && s.email.toLowerCase().includes(searchStudent.toLowerCase())) ||
      (s.full_name && s.full_name.toLowerCase().includes(searchStudent.toLowerCase())) ||
      (s.course && s.course.toLowerCase().includes(searchStudent.toLowerCase()))
  );

  const filteredEvents = events.filter(
    (ev) =>
      (ev.title && ev.title.toLowerCase().includes(searchEvent.toLowerCase())) ||
      (ev.description && ev.description.toLowerCase().includes(searchEvent.toLowerCase()))
  );

  const activeEventsCount = events.filter((e) => e.status === 'active').length;
  const inactiveEventsCount = events.length - activeEventsCount;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white font-extrabold shadow-sm">
              C
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-orange-600">
                CEC TRACK 3.0
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                ADMIN PORTAL
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/scanner"
              className="text-xs sm:text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white px-3.5 py-2 rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <span>📷</span> QR Scanner
            </Link>
            <Link
              href="/"
              className="text-xs sm:text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl transition"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange-600 mb-1">
              ✨ SYSTEM MANAGEMENT & WHITELIST
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Admin Command Center
            </h1>
            <p className="text-sm text-slate-500">
              Manage BSCRIM, BSBA, BSAM, BEED, BSA students, events, and schedules.
            </p>
          </div>

          <button
            onClick={fetchAllData}
            className="self-start sm:self-auto text-sm font-semibold px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 shadow-sm flex items-center gap-2 transition"
          >
            <span>🔄</span> {loading ? 'Refreshing...' : 'Refresh Records'}
          </button>
        </div>

        {notification.message && (
          <div
            className={`mb-6 p-4 rounded-2xl border flex items-center justify-between shadow-sm transition-all ${
              notification.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <span className="text-sm font-medium">{notification.message}</span>
            <button
              onClick={() => setNotification({ type: '', message: '' })}
              className="text-xs font-bold uppercase ml-4 opacity-70 hover:opacity-100"
            >
              Close
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold uppercase text-slate-400">TOTAL MEMBERS</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-900">{students.length}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600">Whitelisted</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold uppercase text-emerald-600">DIGITAL IDS READY</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-emerald-600">{students.length}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">100% Ready</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold uppercase text-blue-600">ACTIVE EVENTS</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-blue-600">{activeEventsCount}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">Scanning Open</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold uppercase text-slate-400">CLOSED EVENTS</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-700">{inactiveEventsCount}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Total: {events.length}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 p-1.5 bg-slate-200/70 rounded-2xl mb-6 w-full sm:w-fit">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeTab === 'overview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ⚡ Quick Forms
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeTab === 'students' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            👥 Students ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeTab === 'events' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📅 Events ({events.length})
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add Student Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-xs font-bold uppercase text-orange-600">WHITELIST REGISTRATION</span>
                  <h2 className="text-xl font-extrabold text-slate-900">Add Student Member</h2>
                </div>
                <span className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center text-lg">🪪</span>
              </div>

              <form onSubmit={handleAddStudent} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Student ID *</label>
                  <input
                    type="text"
                    placeholder="e.g. 2024-0515"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Renowee Beloy"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Student Email *</label>
                  <input
                    type="email"
                    placeholder="e.g. student@gmail.com"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Course / Program</label>
                    <select
                      value={studentCourse}
                      onChange={(e) => setStudentCourse(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {courses.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} - {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Year Level</label>
                    <select
                      value={studentYear}
                      onChange={(e) => setStudentYear(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-sm transition"
                >
                  {loading ? 'Saving...' : 'Register Student to Whitelist'}
                </button>
              </form>
            </div>

            {/* Create Event Card (Naay Time In & Time Out) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-xs font-bold uppercase text-blue-600">OFFICIAL ACTIVITIES & SCHEDULES</span>
                  <h2 className="text-xl font-extrabold text-slate-900">Create New Event</h2>
                </div>
                <span className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">📅</span>
              </div>

              <form onSubmit={handleAddEvent} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Event Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Siglakas 2026 (2nd Day)"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Venue / Location</label>
                    <input
                      type="text"
                      placeholder="e.g. FaCET Facade"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Scanning Status</label>
                    <select
                      value={eventStatus}
                      onChange={(e) => setEventStatus(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="active">🟢 Active (Scanning Open)</option>
                      <option value="inactive">⚪ Inactive (Closed)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Event Date *</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                    required
                  />
                </div>

                {/* TIME IN & TIME OUT FIELDS */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-emerald-600 mb-1">⏰ Required Time In *</label>
                    <input
                      type="time"
                      value={timeIn}
                      onChange={(e) => setTimeIn(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-blue-600 mb-1">⏱️ Required Time Out *</label>
                    <input
                      type="time"
                      value={timeOut}
                      onChange={(e) => setTimeOut(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-bold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Event Description *</label>
                  <textarea
                    rows="2"
                    placeholder="Brief details or attendance guidelines..."
                    value={eventDesc}
                    onChange={(e) => setEventDesc(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-sm transition"
                >
                  {loading ? 'Publishing...' : 'Publish Official Event & Schedule'}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Whitelisted Students</h2>
                <p className="text-xs text-slate-500">Filterable by BSCRIM, BSBA, BSAM, BEED, BSA</p>
              </div>
              <input
                type="text"
                placeholder="🔍 Search student ID, name or course..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="w-full sm:w-72 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {filteredStudents.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                Walay nakit-an nga student record.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-bold uppercase text-slate-400">
                      <th className="py-3 px-3">Student ID</th>
                      <th className="py-3 px-3">Name / Email</th>
                      <th className="py-3 px-3">Course</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredStudents.map((st) => (
                      <tr key={st.id || st.school_id} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-3 font-extrabold text-slate-900">{st.school_id}</td>
                        <td className="py-3.5 px-3">
                          {st.full_name && <div className="font-semibold text-slate-800">{st.full_name}</div>}
                          <div className="text-xs text-slate-500">{st.email}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                            {st.course || 'BSCRIM'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                            ● ID Ready
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          {st.id && (
                            <button
                              onClick={() => handleDeleteStudent(st.id, st.school_id)}
                              className="text-xs font-bold text-red-600 hover:text-red-800 px-2.5 py-1 rounded-lg hover:bg-red-50 transition"
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="font-bold text-slate-900 px-2">
                All Organization Events ({filteredEvents.length})
              </div>
              <input
                type="text"
                placeholder="🔍 Search events by title..."
                value={searchEvent}
                onChange={(e) => setSearchEvent(e.target.value)}
                className="w-full sm:w-72 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {filteredEvents.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 text-sm">
                Walay event nga nakit-an.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredEvents.map((ev) => {
                  const isActive = ev.status === 'active';
                  return (
                    <div
                      key={ev.id || ev.title}
                      className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span
                            className={`text-xs font-bold px-3 py-1 rounded-full ${
                              isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {isActive ? '● ACTIVE (SCANNING OPEN)' : '✖ INACTIVE (CLOSED)'}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">
                            {ev.date ? new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Date'}
                          </span>
                        </div>

                        <h3 className="text-lg font-extrabold text-slate-900 mb-1">{ev.title}</h3>
                        {ev.location && (
                          <p className="text-xs font-semibold text-orange-600 mb-1">📍 {ev.location}</p>
                        )}
                        
                        {/* DISPLAY TIME IN & TIME OUT SA EVENT CARD */}
                        {(ev.time_in || ev.time_out) && (
                          <div className="flex items-center gap-3 my-2 text-xs font-bold">
                            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg">
                              🟢 In: {ev.time_in || '--:--'}
                            </span>
                            <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg">
                              ⏱️ Out: {ev.time_out || '--:--'}
                            </span>
                          </div>
                        )}

                        <p className="text-xs text-slate-500 mb-4 line-clamp-2">{ev.description}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleToggleEventStatus(ev)}
                          className={`text-xs font-bold px-3.5 py-2 rounded-xl transition ${
                            isActive ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {isActive ? '⏸ Close Scanning' : '▶ Open Scanning'}
                        </button>

                        {ev.id && (
                          <button
                            onClick={() => handleDeleteEvent(ev.id, ev.title)}
                            className="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl transition"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
