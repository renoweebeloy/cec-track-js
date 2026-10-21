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
    { code: 'BSCRIM', name: 'Bachelor of Science in Criminology', badge: styles.bscrimBadge },
    { code: 'BSBA', name: 'Bachelor of Science in Business Administration', badge: styles.bsbaBadge },
    { code: 'BSAM', name: 'Bachelor of Science in Agribusiness Management', badge: styles.bsamBadge },
    { code: 'BEED', name: 'Bachelor of Elementary Education', badge: styles.beedBadge },
    { code: 'BSA', name: 'Bachelor of Science in Accountancy', badge: styles.bsaBadge },
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

  // ADD STUDENT (Regex Format Check)
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

  // ADD STAFF
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
      showNotify('success', `🎉 Si ${staffName} narehistro na isip Staff! Active na ang iyang Scanner.`);
      setStaffName('');
      setStaffEmail('');
      fetchAllData();
    }
  };

  // ADD EVENT
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

  // QUICK ATTENDANCE LOGGER
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
      <div className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontWeight: 800, color: '#15803d' }}>Ginasusi ang imong Portal Clearance...</p>
      </div>
    );
  }

  if (!isAuthorized) return null;

  const isAdmin = userRole === 'admin';

  return (
    <div className={styles.container}>
      <Head>
        <title>CEC TRACK 3.0 • {isAdmin ? 'Admin Portal' : 'Staff Portal'}</title>
      </Head>

      {/* HEADER NAVBAR */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className={styles.logoText}>CECTRACK 3.0</span>
            <span
              className={styles.idBadge}
              style={{
                fontSize: '0.65rem',
                backgroundColor: isAdmin ? '#dcfce7' : '#eff6ff',
                color: isAdmin ? '#15803d' : '#1d4ed8',
                borderColor: isAdmin ? '#bbf7d0' : '#bfdbfe',
              }}
            >
              {isAdmin ? 'ADMIN COMMAND' : 'STAFF ACCESS'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link href="/scanner" style={{ textDecoration: 'none' }}>
              <button className={styles.loginBtn} style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                📷 Camera Scanner
              </button>
            </Link>
            <button
              onClick={handleSignOut}
              className={styles.eventsBtn}
              style={{ padding: '8px 14px', fontSize: '0.8rem', color: '#b91c1c' }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className={styles.adminContainer}>
        {/* BANNER GREETING */}
        <div className={styles.adminHeaderCard}>
          <div>
            <h1 className={styles.adminTitle}>Welcome back, {currentUser.name}</h1>
            <p className={styles.adminSubtitle}>
              {isAdmin
                ? 'Whitelist enrollment, staff delegation, event scheduling, ug live attendance.'
                : 'Staff Attendance Monitoring Portal & QR Code Verification.'}
            </p>
          </div>

          <button
            onClick={fetchAllData}
            disabled={loading}
            className={styles.eventsBtn}
            style={{ padding: '8px 16px', fontSize: '0.8rem' }}
          >
            {loading ? 'Syncing...' : '🔄 Sync Database'}
          </button>
        </div>

        {/* NOTIFICATION */}
        {notification.message && (
          <div
            className={styles.alertMessage}
            style={{
              marginBottom: '1rem',
              color: notification.type === 'error' ? '#b91c1c' : '#15803d',
              backgroundColor: notification.type === 'error' ? '#fef2f2' : '#f0fdf4',
              borderColor: notification.type === 'error' ? '#fee2e2' : '#bbf7d0',
            }}
          >
            {notification.message}
          </div>
        )}

        {/* 5 NAVIGATION TABS */}
        <div className={styles.adminTabNav}>
          <button
            onClick={() => setActiveTab('profile')}
            className={activeTab === 'profile' ? `${styles.adminTabBtn} ${styles.adminTabBtnActive}` : styles.adminTabBtn}
          >
            👤 1. System Overview
          </button>

          <button
            onClick={() => setActiveTab('add-student')}
            className={activeTab === 'add-student' ? `${styles.adminTabBtn} ${styles.adminTabBtnActive}` : styles.adminTabBtn}
          >
            🎓 2. Whitelist Students
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('add-staff')}
              className={activeTab === 'add-staff' ? `${styles.adminTabBtn} ${styles.adminTabBtnActive}` : styles.adminTabBtn}
            >
              🛡️ 3. Manage Staff
            </button>
          )}

          <button
            onClick={() => setActiveTab('add-event')}
            className={activeTab === 'add-event' ? `${styles.adminTabBtn} ${styles.adminTabBtnActive}` : styles.adminTabBtn}
          >
            📅 4. Manage Events
          </button>

          <button
            onClick={() => setActiveTab('scan-qr')}
            className={activeTab === 'scan-qr' ? `${styles.adminTabBtn} ${styles.adminTabBtnActive}` : styles.adminTabBtn}
          >
            📷 5. Scan QR & Quick Log
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: SYSTEM OVERVIEW */}
        {/* ========================================================= */}
        {activeTab === 'profile' && (
          <div>
            <div className={styles.attendanceStatsGrid}>
              <div className={styles.attStatCard}>
                <span className={styles.attStatLabel}>Whitelisted Students</span>
                <div className={styles.attStatValue}>{students.length}</div>
              </div>

              <div className={styles.attStatCard}>
                <span className={styles.attStatLabel}>Authorized Staff</span>
                <div className={`${styles.attStatValue} ${styles.attGreenText}`}>{staffList.length}</div>
              </div>

              <div className={styles.attStatCard}>
                <span className={styles.attStatLabel}>Active Events</span>
                <div className={`${styles.attStatValue} ${styles.attGreenText}`}>
                  {events.filter((e) => e.status === 'active').length}
                </div>
              </div>

              <div className={styles.attStatCard}>
                <span className={styles.attStatLabel}>Total Events</span>
                <div className={styles.attStatValue}>{events.length}</div>
              </div>
            </div>

            {/* Department Breakdown */}
            <div className={styles.adminFormCard}>
              <h3 className={styles.analyticsTitle} style={{ marginBottom: '16px' }}>
                Students Distribution by Course
              </h3>
              <div className={styles.courseGrid}>
                {courses.map((c) => {
                  const count = students.filter((s) => s.course === c.code).length;
                  return (
                    <div key={c.code} className={styles.courseCard}>
                      <div className={styles.cardTop}>
                        <span className={`${styles.badge} ${c.badge}`}>{c.code}</span>
                      </div>
                      <div className={styles.countValue}>{count}</div>
                      <div className={styles.courseName}>{c.name}</div>
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
          <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr 1.4fr' : '1fr', gap: '24px' }}>
            {isAdmin && (
              <div className={styles.adminFormCard}>
                <h3 className={styles.analyticsTitle} style={{ marginBottom: '16px' }}>
                  Enroll Student (Whitelist)
                </h3>

                <form onSubmit={handleAddStudent} className={styles.loginForm}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>School ID (Format: 2024-0616) *</label>
                    <input
                      type="text"
                      placeholder="e.g. 2024-0616"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      pattern="\d{4}-\d{4,5}"
                      className={styles.loginInput}
                      style={{ paddingLeft: '1rem' }}
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Renowee Beloy"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className={styles.loginInput}
                      style={{ paddingLeft: '1rem' }}
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Student Email Address *</label>
                    <input
                      type="email"
                      placeholder="e.g. student@dorsu.edu.ph"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      className={styles.loginInput}
                      style={{ paddingLeft: '1rem' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>Course</label>
                      <select
                        value={studentCourse}
                        onChange={(e) => setStudentCourse(e.target.value)}
                        className={styles.loginInput}
                        style={{ paddingLeft: '1rem' }}
                      >
                        {courses.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.code}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>Year Level</label>
                      <select
                        value={studentYear}
                        onChange={(e) => setStudentYear(e.target.value)}
                        className={styles.loginInput}
                        style={{ paddingLeft: '1rem' }}
                      >
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className={styles.adminPrimaryBtn}>
                    {loading ? 'Saving Record...' : 'Enroll to Whitelist ➔'}
                  </button>
                </form>
              </div>
            )}

            {/* Students Table */}
            <div className={styles.adminFormCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 className={styles.analyticsTitle}>Enrolled Students ({filteredStudents.length})</h3>
                <input
                  type="text"
                  placeholder="🔍 Search ID, Name..."
                  value={searchStudentQuery}
                  onChange={(e) => setSearchStudentQuery(e.target.value)}
                  className={styles.loginInput}
                  style={{ width: '200px', padding: '6px 12px' }}
                />
              </div>

              <div className={styles.adminTableWrapper}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th>School ID</th>
                      <th>Student Name</th>
                      <th>Course</th>
                      {isAdmin && <th style={{ textAlign: 'right' }}>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((st) => (
                      <tr key={st.id}>
                        <td style={{ fontWeight: 800 }}>{st.school_id}</td>
                        <td>
                          <div>{st.full_name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{st.email}</div>
                        </td>
                        <td>
                          <span className={styles.idBadge}>{st.course}</span>
                        </td>
                        {isAdmin && (
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => handleDeleteUser(st.id, st.school_id)}
                              style={{ background: 'none', border: 'none', color: '#b91c1c', fontWeight: 800, cursor: 'pointer' }}
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
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: MANAGE STAFF (Admin Only) */}
        {/* ========================================================= */}
        {activeTab === 'add-staff' && isAdmin && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '24px' }}>
            <div className={styles.adminFormCard}>
              <h3 className={styles.analyticsTitle} style={{ marginBottom: '16px' }}>Add Staff Officer</h3>

              <form onSubmit={handleAddStaff} className={styles.loginForm}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Staff Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Officer Maria Santos"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    className={styles.loginInput}
                    style={{ paddingLeft: '1rem' }}
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Staff Email Address *</label>
                  <input
                    type="email"
                    placeholder="e.g. staff.maria@dorsu.edu.ph"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    className={styles.loginInput}
                    style={{ paddingLeft: '1rem' }}
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Designation / Title</label>
                  <input
                    type="text"
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value)}
                    className={styles.loginInput}
                    style={{ paddingLeft: '1rem' }}
                  />
                </div>

                <button type="submit" disabled={loading} className={styles.adminPrimaryBtn}>
                  {loading ? 'Saving...' : 'Authorize Staff Scanner ➔'}
                </button>
              </form>
            </div>

            <div className={styles.adminFormCard}>
              <h3 className={styles.analyticsTitle} style={{ marginBottom: '16px' }}>
                Authorized Staff Members ({staffList.length})
              </h3>
              <div className={styles.adminTableWrapper}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffList.map((st) => (
                      <tr key={st.id}>
                        <td style={{ fontWeight: 800 }}>{st.full_name}</td>
                        <td>{st.email}</td>
                        <td>
                          <button
                            onClick={() => handleDeleteUser(st.id, st.full_name)}
                            style={{ background: 'none', border: 'none', color: '#b91c1c', fontWeight: 800, cursor: 'pointer' }}
                          >
                            Revoke
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: MANAGE EVENTS */}
        {/* ========================================================= */}
        {activeTab === 'add-event' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '24px' }}>
            <div className={styles.adminFormCard}>
              <h3 className={styles.analyticsTitle} style={{ marginBottom: '16px' }}>Publish New Event</h3>

              <form onSubmit={handleAddEvent} className={styles.loginForm}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Event Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Siglakas 2026 (Day 2)"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className={styles.loginInput}
                    style={{ paddingLeft: '1rem' }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Venue / Location</label>
                    <input
                      type="text"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      className={styles.loginInput}
                      style={{ paddingLeft: '1rem' }}
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Scanning Mode</label>
                    <select
                      value={eventStatus}
                      onChange={(e) => setEventStatus(e.target.value)}
                      className={styles.loginInput}
                      style={{ paddingLeft: '1rem' }}
                    >
                      <option value="active">Active (Open)</option>
                      <option value="inactive">Inactive (Closed)</option>
                    </select>
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Event Date *</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className={styles.loginInput}
                    style={{ paddingLeft: '1rem' }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Time In *</label>
                    <input
                      type="time"
                      value={timeIn}
                      onChange={(e) => setTimeIn(e.target.value)}
                      className={styles.loginInput}
                      style={{ paddingLeft: '1rem' }}
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Time Out *</label>
                    <input
                      type="time"
                      value={timeOut}
                      onChange={(e) => setTimeOut(e.target.value)}
                      className={styles.loginInput}
                      style={{ paddingLeft: '1rem' }}
                      required
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Description *</label>
                  <textarea
                    rows="2"
                    value={eventDesc}
                    onChange={(e) => setEventDesc(e.target.value)}
                    className={styles.loginInput}
                    style={{ padding: '0.85rem' }}
                    required
                  />
                </div>

                <button type="submit" disabled={loading} className={styles.adminPrimaryBtn}>
                  {loading ? 'Publishing...' : 'Publish Official Event ➔'}
                </button>
              </form>
            </div>

            <div className={styles.adminFormCard}>
              <h3 className={styles.analyticsTitle} style={{ marginBottom: '16px' }}>
                Published Events ({filteredEvents.length})
              </h3>
              <div className={styles.adminTableWrapper}>
                <table className={styles.adminTable}>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Date & Schedule</th>
                      <th>Status</th>
                      {isAdmin && <th>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map((ev) => (
                      <tr key={ev.id}>
                        <td style={{ fontWeight: 800 }}>{ev.title}</td>
                        <td>
                          <div>{ev.date}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            {ev.time_in} - {ev.time_out}
                          </div>
                        </td>
                        <td>
                          <span
                            className={styles.idBadge}
                            style={{
                              backgroundColor: ev.status === 'active' ? '#dcfce7' : '#f1f5f9',
                              color: ev.status === 'active' ? '#15803d' : '#64748b',
                            }}
                          >
                            {ev.status.toUpperCase()}
                          </span>
                        </td>
                        {isAdmin && (
                          <td>
                            <button
                              onClick={() => handleDeleteEvent(ev.id, ev.title)}
                              style={{ background: 'none', border: 'none', color: '#b91c1c', fontWeight: 800, cursor: 'pointer' }}
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: SCAN QR & QUICK LOG */}
        {/* ========================================================= */}
        {activeTab === 'scan-qr' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div className={styles.adminFormCard} style={{ textAlign: 'center' }}>
              <h3 className={styles.analyticsTitle} style={{ justifyContent: 'center', marginBottom: '12px' }}>
                Live Camera Scanner
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '20px' }}>
                Ablihi ang full camera scanner window aron paspas nga ma-scan ang mga Digital ID QR codes.
              </p>
              <Link href="/scanner" style={{ textDecoration: 'none' }}>
                <button className={styles.submitBtn}>Ablihi ang Camera Scanner ➔</button>
              </Link>
            </div>

            <div className={styles.adminFormCard}>
              <h3 className={styles.analyticsTitle} style={{ marginBottom: '12px' }}>
                Manual School ID Fallback
              </h3>
              <form onSubmit={handleManualScanSubmit} className={styles.loginForm}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Select Event</label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className={styles.loginInput}
                    style={{ paddingLeft: '1rem' }}
                  >
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title} ({ev.date})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>School ID (e.g. 2024-0616) *</label>
                  <input
                    type="text"
                    placeholder="2024-0616"
                    value={manualStudentId}
                    onChange={(e) => setManualStudentId(e.target.value)}
                    className={styles.loginInput}
                    style={{ paddingLeft: '1rem' }}
                    required
                  />
                </div>

                <button type="submit" className={styles.adminPrimaryBtn}>
                  ✓ Mark as Present
                </button>
              </form>

              {scanLogMsg.text && (
                <div
                  className={styles.alertMessage}
                  style={{
                    marginTop: '12px',
                    color: scanLogMsg.type === 'error' ? '#b91c1c' : '#15803d',
                    backgroundColor: scanLogMsg.type === 'error' ? '#fef2f2' : '#f0fdf4',
                  }}
                >
                  {scanLogMsg.text}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
