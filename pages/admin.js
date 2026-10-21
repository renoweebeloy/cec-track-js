import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Home.module.css';

export default function AdminDashboard() {
  const router = useRouter();
  const scannerRef = useRef(null);

  // Authentication & Security Guard States
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [userRole, setUserRole] = useState('admin'); // 'admin' | 'staff'
  const [currentUser, setCurrentUser] = useState({ name: '', email: '', school_id: '' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Navigation Tabs: 'profile' | 'add-student' | 'add-staff' | 'add-event' | 'scan-qr'
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // 1. Student States (Section A to K and Juan Dela Cruz placeholder)
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentCourse, setStudentCourse] = useState('BSCRIM');
  const [studentYear, setStudentYear] = useState('1st Year');
  const [studentSection, setStudentSection] = useState('Section A');

  // 2. Staff States
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState('Staff Officer');

  // 3. Event States
  const [eventTitle, setEventTitle] = useState('');
  const [eventLocation, setEventLocation] = useState('FaCET Facade');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [timeIn, setTimeIn] = useState('08:00');
  const [timeOut, setTimeOut] = useState('17:00');
  const [eventStatus, setEventStatus] = useState('active');

  // 4. Manual Attendance Logger States
  const [manualStudentId, setManualStudentId] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [scanLogMsg, setScanLogMsg] = useState({ type: '', text: '' });

  // 5. Live Camera Scanner & Scanned Student Verification Modal States
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isScannerRunning, setIsScannerRunning] = useState(false);
  const [scannedStudentData, setScannedStudentData] = useState(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [confirmingAttendance, setConfirmingAttendance] = useState(false);

  // Collections & Filters
  const [students, setStudents] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [events, setEvents] = useState([]);
  const [searchStudentQuery, setSearchStudentQuery] = useState('');
  const [searchEventQuery, setSearchEventQuery] = useState('');

  // 5 Official College Courses
  const courses = [
    { code: 'BSCRIM', name: 'Bachelor of Science in Criminology', badge: styles.bscrimBadge },
    { code: 'BSBA', name: 'Bachelor of Science in Business Administration', badge: styles.bsbaBadge },
    { code: 'BSAM', name: 'Bachelor of Science in Agribusiness Management', badge: styles.bsamBadge },
    { code: 'BEED', name: 'Bachelor of Elementary Education', badge: styles.beedBadge },
    { code: 'BSA', name: 'Bachelor of Science in Accountancy', badge: styles.bsaBadge },
  ];

  // List of Sections from Section A to Section K
  const sectionsList = [
    'Section A',
    'Section B',
    'Section C',
    'Section D',
    'Section E',
    'Section F',
    'Section G',
    'Section H',
    'Section I',
    'Section J',
    'Section K',
  ];

  const showNotify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification({ type: '', message: '' });
    }, 4500);
  };

  // Dynamic loading of Html5Qrcode Library via CDN
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.Html5Qrcode) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Route Guard
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
          .eq('email', userEmail.trim().toLowerCase())
          .single();

        if (error || !profile) {
          router.replace('/login');
          return;
        }

        if (profile.role !== 'admin' && profile.role !== 'staff') {
          alert('Access Denied: Redirecting to Student Dashboard.');
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
        console.error('Portal authorization error:', err);
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
      console.error('Error fetching database records:', err);
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

  // ========================================================
  // CAMERA SCANNER FUNCTIONS
  // ========================================================
  const startCameraScanner = async () => {
    if (!selectedEventId) {
      showNotify('error', 'Please select an Active Event Schedule below before scanning.');
      return;
    }

    if (!window.Html5Qrcode) {
      showNotify('error', 'Scanner library is loading. Please try again shortly.');
      return;
    }

    setIsCameraModalOpen(true);

    setTimeout(async () => {
      try {
        const qrScanner = new window.Html5Qrcode('interactive-qr-reader');
        scannerRef.current = qrScanner;

        await qrScanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            handleQrCodeDetected(decodedText);
          },
          () => {}
        );
        setIsScannerRunning(true);
      } catch (err) {
        console.error('Error starting camera scanner:', err);
        showNotify('error', 'Unable to access camera. Please ensure camera permissions are granted.');
        setIsCameraModalOpen(false);
      }
    }, 400);
  };

  const stopCameraScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Scanner stop warning:', err);
      }
      scannerRef.current = null;
    }
    setIsScannerRunning(false);
  };

  const closeCameraModal = async () => {
    await stopCameraScanner();
    setIsCameraModalOpen(false);
    setShowVerifyModal(false);
    setScannedStudentData(null);
  };

  // QR CODE DETECTION WITH STRICT DUPLICATE DENIAL
  const handleQrCodeDetected = async (decodedText) => {
    if (!decodedText || showVerifyModal) return;

    if (scannerRef.current) {
      try {
        await scannerRef.current.pause();
      } catch (e) {}
    }

    const cleanSchoolId = decodedText.trim();

    try {
      // 1. Look up student in profiles table
      const { data: student, error } = await supabase
        .from('profiles')
        .select('school_id, full_name, course, year_level, section, avatar_url')
        .eq('school_id', cleanSchoolId)
        .single();

      if (error || !student) {
        alert(`❌ ACCESS DENIED:\nSchool ID "${cleanSchoolId}" is not registered in the whitelist database!`);
        if (scannerRef.current) {
          try {
            await scannerRef.current.resume();
          } catch (e) {}
        }
        return;
      }

      // 2. DUPLICATE CHECK: Verify if student already checked in for this event
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('id, time_in')
        .eq('student_id', student.school_id)
        .eq('event_id', selectedEventId)
        .maybeSingle();

      if (existingAttendance) {
        alert(
          `🚫 SCAN DENIED / ALREADY SCANNED!\n\n` +
          `Student Name: ${student.full_name}\n` +
          `School ID: ${student.school_id}\n` +
          `Recorded Time In: ${existingAttendance.time_in}\n\n` +
          `Attendance has already been recorded for this student in this event schedule.`
        );

        if (scannerRef.current) {
          try {
            await scannerRef.current.resume();
          } catch (e) {}
        }
        return;
      }

      // 3. Display verification modal (School ID only, no email)
      setScannedStudentData(student);
      setShowVerifyModal(true);
    } catch (err) {
      console.error('Scan lookup error:', err);
    }
  };

  // CONFIRM ATTENDANCE ACTION
  const handleConfirmAttendance = async () => {
    if (!scannedStudentData || !selectedEventId) return;

    setConfirmingAttendance(true);

    try {
      const { error } = await supabase.from('attendance').insert([
        {
          student_id: scannedStudentData.school_id,
          student_name: scannedStudentData.full_name || 'CEC Student',
          event_id: selectedEventId,
          status: 'PRESENT',
          time_in: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          scanned_by: currentUser.email || userRole,
        },
      ]);

      if (error) {
        if (error.code === '23505') {
          showNotify(
            'error',
            `⚠️ Already scanned: ${scannedStudentData.full_name} (${scannedStudentData.school_id}) is already recorded!`
          );
        } else {
          showNotify('error', `Attendance error: ${error.message}`);
        }
      } else {
        showNotify(
          'success',
          `✅ DONE SCANNING: Attendance recorded for ${scannedStudentData.full_name} (School ID: ${scannedStudentData.school_id})!`
        );
      }

      setShowVerifyModal(false);
      setScannedStudentData(null);

      if (scannerRef.current) {
        try {
          await scannerRef.current.resume();
        } catch (e) {}
      }
    } catch (err) {
      console.error('Error recording attendance:', err);
    } finally {
      setConfirmingAttendance(false);
    }
  };

  // ========================================================
  // ADD STUDENT (Section A-K & School ID as Password)
  // ========================================================
  const handleAddStudent = async (e) => {
    e.preventDefault();

    const idRegex = /^\d{4}-\d{4,5}$/;
    if (!idRegex.test(studentId.trim())) {
      showNotify('error', 'Invalid Student ID format. Please follow format: 2024-0616.');
      return;
    }

    setLoading(true);

    try {
      const cleanEmail = studentEmail.trim().toLowerCase();
      const defaultPassword = studentId.trim();

      const { error: profileError } = await supabase.from('profiles').insert([
        {
          school_id: studentId.trim(),
          full_name: studentName.trim(),
          email: cleanEmail,
          password: defaultPassword,
          course: studentCourse,
          year_level: studentYear,
          section: studentSection,
          role: 'student',
          can_scan: false,
          status: 'Active',
          must_change_password: true,
        },
      ]);

      if (profileError) {
        throw new Error(`Database Error: ${profileError.message}`);
      }

      showNotify(
        'success',
        `Student ${studentName.trim()} (${studentSection}) added successfully! Default password: ${defaultPassword}`
      );
      setStudentId('');
      setStudentName('');
      setStudentEmail('');
      fetchAllData();
    } catch (err) {
      showNotify('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ========================================================
  // REMOVE ALL STUDENTS (With Confirmation Dialog)
  // ========================================================
  const handleRemoveAllStudents = async () => {
    if (userRole !== 'admin') {
      alert('Only administrators are authorized to remove student records.');
      return;
    }

    if (students.length === 0) {
      alert('No enrolled student records found to remove.');
      return;
    }

    const isConfirmed = window.confirm(
      'Are you sure you want to remove all students?\n\n' +
      'Warning: This action will permanently delete all enrolled student records from the database. This action cannot be undone. Click OK to confirm or Cancel to abort.'
    );

    if (!isConfirmed) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('role', 'student');

      if (error) {
        throw new Error(error.message);
      }

      showNotify('success', 'All student records have been permanently removed.');
      fetchAllData();
    } catch (err) {
      showNotify('error', `Error removing records: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ADD STAFF
  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (userRole !== 'admin') {
      showNotify('error', 'Only administrators can register staff members.');
      return;
    }

    setLoading(true);
    const generatedStaffId = `STAFF-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const cleanEmail = staffEmail.trim().toLowerCase();
      const defaultPassword = generatedStaffId;

      const { error: profileError } = await supabase.from('profiles').insert([
        {
          school_id: generatedStaffId,
          full_name: staffName.trim(),
          email: cleanEmail,
          password: defaultPassword,
          role: 'staff',
          can_scan: true,
          status: 'Active',
          must_change_password: true,
        },
      ]);

      if (profileError) {
        throw new Error(`Database Error: ${profileError.message}`);
      }

      showNotify(
        'success',
        `Staff officer ${staffName} registered successfully! Default password: ${defaultPassword}`
      );
      setStaffName('');
      setStaffEmail('');
      fetchAllData();
    } catch (err) {
      showNotify('error', err.message);
    } finally {
      setLoading(false);
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
      showNotify('error', `Error publishing event: ${error.message}`);
    } else {
      showNotify('success', `Official event "${eventTitle}" published successfully.`);
      setEventTitle('');
      setEventDesc('');
      setEventDate('');
      setTimeIn('08:00');
      setTimeOut('17:00');
      fetchAllData();
    }
  };

  // MANUAL ATTENDANCE LOG CHECK-IN WITH DUPLICATE CHECK
  const handleManualScanSubmit = async (e) => {
    e.preventDefault();
    if (!manualStudentId) return;

    setScanLogMsg({ type: 'info', text: 'Validating School ID against Whitelist database...' });

    const studentMatch = students.find(
      (s) => s.school_id?.toLowerCase() === manualStudentId.trim().toLowerCase()
    );

    if (!studentMatch) {
      setScanLogMsg({
        type: 'error',
        text: 'Access Denied: Student ID is not registered in the whitelist database.',
      });
      return;
    }

    const { data: existing } = await supabase
      .from('attendance')
      .select('id, time_in')
      .eq('student_id', studentMatch.school_id)
      .eq('event_id', selectedEventId)
      .maybeSingle();

    if (existing) {
      setScanLogMsg({
        type: 'warning',
        text: `🚫 DENIED / ALREADY SCANNED: Attendance was already recorded at ${existing.time_in} for ${studentMatch.full_name} (${studentMatch.school_id})!`,
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
      setScanLogMsg({ type: 'error', text: `Error: ${error.message}` });
    } else {
      setScanLogMsg({
        type: 'success',
        text: `Done scanning! Attendance confirmed for ${studentMatch.full_name} (${studentMatch.school_id}).`,
      });
      setManualStudentId('');
    }
  };

  const handleDeleteUser = async (id, identifier) => {
    if (userRole !== 'admin') {
      alert('Only administrators are authorized to remove accounts.');
      return;
    }
    if (!confirm(`Are you sure you want to remove ${identifier}?`)) return;
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) showNotify('error', error.message);
    else {
      showNotify('success', 'Record removed successfully.');
      fetchAllData();
    }
  };

  const handleDeleteEvent = async (id, title) => {
    if (userRole !== 'admin') {
      alert('Only administrators are authorized to delete events.');
      return;
    }
    if (!confirm(`Are you sure you want to delete event "${title}"?`)) return;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) showNotify('error', error.message);
    else {
      showNotify('success', 'Event deleted successfully.');
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
        <p style={{ fontWeight: 800, fontSize: '1.1rem', color: '#15803d' }}>
          Verifying Portal Clearance...
        </p>
      </div>
    );
  }

  if (!isAuthorized) return null;

  const isAdmin = userRole === 'admin';

  return (
    <div className={styles.container} style={{ paddingBottom: 0 }}>
      <Head>
        <title>CEC TRACK • {isAdmin ? 'Admin Portal' : 'Staff Portal'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js" async />
      </Head>

      {/* TOP HEADER */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          width: '100%',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxSizing: 'border-box',
          }}
        >
          {/* Left: Hamburger Button and Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label="Toggle Navigation Menu"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #e2e8f0',
                fontSize: '1.35rem',
                fontWeight: 900,
                color: '#0f172a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {isSidebarOpen ? '✕' : '☰'}
            </button>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#15803d', letterSpacing: '-0.025em' }}>
                  CEC TRACK
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: isAdmin ? '#dcfce7' : '#eff6ff',
                    color: isAdmin ? '#15803d' : '#1d4ed8',
                    border: `1px solid ${isAdmin ? '#bbf7d0' : '#bfdbfe'}`,
                    textTransform: 'uppercase',
                  }}
                >
                  {isAdmin ? 'Admin' : 'Staff'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Cateel Extension Campus Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '14px',
              padding: '8px 14px',
              boxShadow: '0 1px 2px rgba(21, 128, 61, 0.06)',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: '1rem' }}>📍</span>
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 800,
                color: '#15803d',
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
              }}
            >
              Cateel Extension Campus
            </span>
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER OVERLAY */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(3px)',
            zIndex: 90,
          }}
        />
      )}

      <div className={styles.portalWrapper}>
        {/* SIDEBAR NAVIGATION */}
        <aside
          style={{
            position: 'fixed',
            top: 0,
            bottom: 0,
            left: 0,
            width: '290px',
            maxWidth: '85vw',
            backgroundColor: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '24px 18px',
            boxShadow: isSidebarOpen ? '6px 0 25px rgba(0,0,0,0.15)' : 'none',
            transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflowY: 'auto',
            boxSizing: 'border-box',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#15803d', margin: 0 }}>
                  Portal Menu
                </h2>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {isAdmin ? 'Administrator Access' : 'Staff Officer Access'}
                </span>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.25rem',
                  fontWeight: 900,
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '6px',
                }}
              >
                ✕
              </button>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }}
                className={activeTab === 'profile' ? `${styles.portalNavLink} ${styles.portalNavLinkActive}` : styles.portalNavLink}
                style={{ fontSize: '0.95rem', padding: '14px 16px' }}
              >
                <span>👤</span>
                <span>System Overview</span>
              </button>

              <button
                onClick={() => { setActiveTab('add-student'); setIsSidebarOpen(false); }}
                className={activeTab === 'add-student' ? `${styles.portalNavLink} ${styles.portalNavLinkActive}` : styles.portalNavLink}
                style={{ fontSize: '0.95rem', padding: '14px 16px' }}
              >
                <span>🎓</span>
                <span>Add Student</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => { setActiveTab('add-staff'); setIsSidebarOpen(false); }}
                  className={activeTab === 'add-staff' ? `${styles.portalNavLink} ${styles.portalNavLinkActive}` : styles.portalNavLink}
                  style={{ fontSize: '0.95rem', padding: '14px 16px' }}
                >
                  <span>🛡️</span>
                  <span>Manage Staff</span>
                </button>
              )}

              <button
                onClick={() => { setActiveTab('add-event'); setIsSidebarOpen(false); }}
                className={activeTab === 'add-event' ? `${styles.portalNavLink} ${styles.portalNavLinkActive}` : styles.portalNavLink}
                style={{ fontSize: '0.95rem', padding: '14px 16px' }}
              >
                <span>📅</span>
                <span>Manage Events</span>
              </button>

              <button
                onClick={() => { setActiveTab('scan-qr'); setIsSidebarOpen(false); }}
                className={activeTab === 'scan-qr' ? `${styles.portalNavLink} ${styles.portalNavLinkActive}` : styles.portalNavLink}
                style={{ fontSize: '0.95rem', padding: '14px 16px' }}
              >
                <span>📷</span>
                <span>Scan QR &amp; Quick Log</span>
              </button>
            </nav>
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '18px', marginTop: '20px' }}>
            <button
              onClick={handleSignOut}
              className={styles.portalNavLink}
              style={{ color: '#b91c1c', fontWeight: 900, fontSize: '0.95rem', padding: '14px 16px' }}
            >
              <span>➔</span>
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* MAIN BODY VIEWPORT */}
        <main className={styles.portalContentArea} style={{ padding: '20px 16px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>
              Command Center
            </h1>
            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0, fontWeight: 600 }}>
              {isAdmin ? 'Official Administration & Attendance Hub' : 'Staff QR Attendance Verification Hub'}
            </p>
          </div>

          {notification.message && (
            <div
              className={styles.alertMessage}
              style={{
                marginBottom: '1.25rem',
                fontSize: '0.9rem',
                color: notification.type === 'error' ? '#b91c1c' : '#15803d',
                backgroundColor: notification.type === 'error' ? '#fef2f2' : '#f0fdf4',
                borderColor: notification.type === 'error' ? '#fee2e2' : '#bbf7d0',
                padding: '12px 16px',
              }}
            >
              {notification.message}
            </div>
          )}

          {/* TAB 1: SYSTEM OVERVIEW */}
          {activeTab === 'profile' && (
            <div>
              <div className={styles.attendanceStatsGrid}>
                <div className={styles.attStatCard} style={{ padding: '20px' }}>
                  <span className={styles.attStatLabel} style={{ fontSize: '0.8rem' }}>Enrolled Students</span>
                  <div className={styles.attStatValue} style={{ fontSize: '2.2rem' }}>{students.length}</div>
                </div>

                <div className={styles.attStatCard} style={{ padding: '20px' }}>
                  <span className={styles.attStatLabel} style={{ fontSize: '0.8rem' }}>Authorized Staff</span>
                  <div className={`${styles.attStatValue} ${styles.attGreenText}`} style={{ fontSize: '2.2rem' }}>
                    {staffList.length}
                  </div>
                </div>

                <div className={styles.attStatCard} style={{ padding: '20px' }}>
                  <span className={styles.attStatLabel} style={{ fontSize: '0.8rem' }}>Active Events</span>
                  <div className={`${styles.attStatValue} ${styles.attGreenText}`} style={{ fontSize: '2.2rem' }}>
                    {events.filter((e) => e.status === 'active').length}
                  </div>
                </div>

                <div className={styles.attStatCard} style={{ padding: '20px' }}>
                  <span className={styles.attStatLabel} style={{ fontSize: '0.8rem' }}>Total Events</span>
                  <div className={styles.attStatValue} style={{ fontSize: '2.2rem' }}>{events.length}</div>
                </div>
              </div>

              <div className={styles.adminFormCard}>
                <h3 className={styles.analyticsTitle} style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
                  Students Distribution by Course
                </h3>
                <div className={styles.courseGrid}>
                  {courses.map((c) => {
                    const count = students.filter((s) => s.course === c.code).length;
                    return (
                      <div key={c.code} className={styles.courseCard} style={{ minHeight: '140px' }}>
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

          {/* TAB 2: ADD STUDENT */}
          {activeTab === 'add-student' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              {isAdmin && (
                <div className={styles.adminFormCard}>
                  <h3 className={styles.analyticsTitle} style={{ fontSize: '0.9rem', marginBottom: '16px' }}>
                    Add Student
                  </h3>

                  <form onSubmit={handleAddStudent} className={styles.loginForm}>
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel} style={{ fontSize: '0.78rem' }}>School ID (Format: 2024-0616) *</label>
                      <input
                        type="text"
                        placeholder="e.g. 2024-0616"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        pattern="\d{4}-\d{4,5}"
                        className={styles.loginInput}
                        style={{ padding: '12px 14px', fontSize: '0.95rem' }}
                        required
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel} style={{ fontSize: '0.78rem' }}>Full Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Juan Dela Cruz"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className={styles.loginInput}
                        style={{ padding: '12px 14px', fontSize: '0.95rem' }}
                        required
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel} style={{ fontSize: '0.78rem' }}>Student Email Address *</label>
                      <input
                        type="email"
                        placeholder="e.g. student@dorsu.edu.ph"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        className={styles.loginInput}
                        style={{ padding: '12px 14px', fontSize: '0.95rem' }}
                        required
                      />
                    </div>

                    {/* Course & Year Level */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel} style={{ fontSize: '0.78rem' }}>Course</label>
                        <select
                          value={studentCourse}
                          onChange={(e) => setStudentCourse(e.target.value)}
                          className={styles.loginInput}
                          style={{ padding: '12px 14px', fontSize: '0.95rem' }}
                        >
                          {courses.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.code}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel} style={{ fontSize: '0.78rem' }}>Year Level</label>
                        <select
                          value={studentYear}
                          onChange={(e) => setStudentYear(e.target.value)}
                          className={styles.loginInput}
                          style={{ padding: '12px 14px', fontSize: '0.95rem' }}
                        >
                          <option value="1st Year">1st Year</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                          <option value="4th Year">4th Year</option>
                        </select>
                      </div>
                    </div>

                    {/* Section A to Section K */}
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel} style={{ fontSize: '0.78rem' }}>Section (A - K) *</label>
                      <select
                        value={studentSection}
                        onChange={(e) => setStudentSection(e.target.value)}
                        className={styles.loginInput}
                        style={{ padding: '12px 14px', fontSize: '0.95rem' }}
                      >
                        {sectionsList.map((sec) => (
                          <option key={sec} value={sec}>
                            {sec}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button type="submit" disabled={loading} className={styles.adminPrimaryBtn} style={{ minHeight: '48px', fontSize: '0.95rem' }}>
                      {loading ? 'Saving Record...' : 'Add Student ➔'}
                    </button>
                  </form>
                </div>
              )}

              {/* Enrolled Students Table with Search & Remove All */}
              <div className={styles.adminFormCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h3 className={styles.analyticsTitle} style={{ fontSize: '0.9rem', margin: 0 }}>
                      Enrolled Students ({filteredStudents.length})
                    </h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="🔍 Search student..."
                      value={searchStudentQuery}
                      onChange={(e) => setSearchStudentQuery(e.target.value)}
                      className={styles.loginInput}
                      style={{ width: '150px', padding: '8px 12px', fontSize: '0.85rem' }}
                    />

                    {isAdmin && students.length > 0 && (
                      <button
                        type="button"
                        onClick={handleRemoveAllStudents}
                        disabled={loading}
                        style={{
                          backgroundColor: '#fee2e2',
                          color: '#b91c1c',
                          border: '1px solid #fecaca',
                          borderRadius: '10px',
                          padding: '8px 12px',
                          fontSize: '0.8rem',
                          fontWeight: 900,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s ease',
                        }}
                        title="Delete all enrolled student records"
                      >
                        <span>🗑️</span> Remove All
                      </button>
                    )}
                  </div>
                </div>

                <div className={styles.adminTableWrapper}>
                  <table className={styles.adminTable}>
                    <thead>
                      <tr>
                        <th>School ID</th>
                        <th>Student Details</th>
                        <th>Course &amp; Section</th>
                        {isAdmin && <th style={{ textAlign: 'right' }}>Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={isAdmin ? 4 : 3} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                            No student records found.
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((st) => (
                          <tr key={st.id}>
                            <td style={{ fontWeight: 800 }}>{st.school_id}</td>
                            <td>
                              <div style={{ fontWeight: 700 }}>{st.full_name}</div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{st.email}</div>
                            </td>
                            <td>
                              <span className={styles.idBadge}>{st.course}</span>
                              <div style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 800, marginTop: '2px' }}>
                                {st.section || 'Section A'} • {st.year_level || '1st Year'}
                              </div>
                            </td>
                            {isAdmin && (
                              <td style={{ textAlign: 'right' }}>
                                <button
                                  onClick={() => handleDeleteUser(st.id, st.school_id)}
                                  style={{ background: 'none', border: 'none', color: '#b91c1c', fontWeight: 800, cursor: 'pointer', padding: '6px' }}
                                >
                                  Remove
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MANAGE STAFF */}
          {activeTab === 'add-staff' && isAdmin && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              <div className={styles.adminFormCard}>
                <h3 className={styles.analyticsTitle} style={{ fontSize: '0.9rem', marginBottom: '16px' }}>
                  Add Staff Officer
                </h3>

                <form onSubmit={handleAddStaff} className={styles.loginForm}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel} style={{ fontSize: '0.78rem' }}>Staff Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Officer Maria Santos"
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      className={styles.loginInput}
                      style={{ padding: '12px 14px', fontSize: '0.95rem' }}
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel} style={{ fontSize: '0.78rem' }}>Staff Email Address *</label>
                    <input
                      type="email"
                      placeholder="e.g. staff.maria@dorsu.edu.ph"
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      className={styles.loginInput}
                      style={{ padding: '12px 14px', fontSize: '0.95rem' }}
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel} style={{ fontSize: '0.78rem' }}>Designation / Title</label>
                    <input
                      type="text"
                      value={staffRole}
                      onChange={(e) => setStaffRole(e.target.value)}
                      className={styles.loginInput}
                      style={{ padding: '12px 14px', fontSize: '0.95rem' }}
                    />
                  </div>

                  <button type="submit" disabled={loading} className={styles.adminPrimaryBtn} style={{ minHeight: '48px', fontSize: '0.95rem' }}>
                    {loading ? 'Saving...' : 'Authorize Staff Scanner ➔'}
                  </button>
                </form>
              </div>

              <div className={styles.adminFormCard}>
                <h3 className={styles.analyticsTitle} style={{ fontSize: '0.9rem', marginBottom: '16px' }}>
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
                              style={{ background: 'none', border: 'none', color: '#b91c1c', fontWeight: 800, cursor: 'pointer', padding: '6px' }}
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

          {/* TAB 4: MANAGE EVENTS */}
          {activeTab === 'add-event' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              <div className={styles.adminFormCard}>
                <h3 className={styles.analyticsTitle} style={{ fontSize: '0.9rem', marginBottom: '16px' }}>
                  Publish New Event
                </h3>

                <form onSubmit={handleAddEvent} className={styles.loginForm}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel} style={{ fontSize: '0.78rem' }}>Event Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Siglakas (Day 2)"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      className={styles.loginInput}
                      style={{ padding: '12px 14px', fontSize: '0.95rem' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel} style={{ fontSize: '0.78rem' }}>Location</label>
                      <input
                        type="text"
                        value={eventLocation}
                        onChange={(e) => setEventLocation(e.target.value)}
                        className={styles.loginInput}
                        style={{ padding: '12px 14px', fontSize: '0.95rem' }}
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel} style={{ fontSize: '0.78rem' }}>Mode</label>
                      <select
                        value={eventStatus}
                        onChange={(e) => setEventStatus(e.target.value)}
                        className={styles.loginInput}
                        style={{ padding: '12px 14px', fontSize: '0.95rem' }}
                      >
                        <option value="active">Active (Open)</option>
                        <option value="inactive">Inactive (Closed)</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel} style={{ fontSize: '0.78rem' }}>Event Date *</label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className={styles.loginInput}
                      style={{ padding: '12px 14px', fontSize: '0.95rem' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel} style={{ fontSize: '0.78rem' }}>Time In *</label>
                      <input
                        type="time"
                        value={timeIn}
                        onChange={(e) => setTimeIn(e.target.value)}
                        className={styles.loginInput}
                        style={{ padding: '12px 14px', fontSize: '0.95rem' }}
                        required
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel} style={{ fontSize: '0.78rem' }}>Time Out *</label>
                      <input
                        type="time"
                        value={timeOut}
                        onChange={(e) => setTimeOut(e.target.value)}
                        className={styles.loginInput}
                        style={{ padding: '12px 14px', fontSize: '0.95rem' }}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel} style={{ fontSize: '0.78rem' }}>Description *</label>
                    <textarea
                      rows="2"
                      value={eventDesc}
                      onChange={(e) => setEventDesc(e.target.value)}
                      className={styles.loginInput}
                      style={{ padding: '12px 14px', fontSize: '0.95rem' }}
                      required
                    />
                  </div>

                  <button type="submit" disabled={loading} className={styles.adminPrimaryBtn} style={{ minHeight: '48px', fontSize: '0.95rem' }}>
                    {loading ? 'Publishing...' : 'Publish Official Event ➔'}
                  </button>
                </form>
              </div>

              <div className={styles.adminFormCard}>
                <h3 className={styles.analyticsTitle} style={{ fontSize: '0.9rem', marginBottom: '16px' }}>
                  Published Events ({filteredEvents.length})
                </h3>
                <div className={styles.adminTableWrapper}>
                  <table className={styles.adminTable}>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Schedule</th>
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
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
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
                                style={{ background: 'none', border: 'none', color: '#b91c1c', fontWeight: 800, cursor: 'pointer', padding: '6px' }}
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

          {/* TAB 5: SCAN QR & QUICK LOG */}
          {activeTab === 'scan-qr' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              <div className={styles.adminFormCard} style={{ textAlign: 'center', padding: '36px 20px' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '20px',
                    backgroundColor: '#dcfce7',
                    color: '#15803d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    margin: '0 auto 16px auto',
                    border: '1px solid #bbf7d0',
                  }}
                >
                  📷
                </div>
                <h3 className={styles.analyticsTitle} style={{ justifyContent: 'center', fontSize: '1.2rem', marginBottom: '8px' }}>
                  Live Camera QR Scanner
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '24px', lineHeight: 1.5 }}>
                  Scan student QR codes to verify profiles and record official attendance.
                </p>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                    Active Event Schedule Target:
                  </label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className={styles.loginInput}
                    style={{ padding: '10px 14px', fontSize: '0.9rem' }}
                  >
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title} ({ev.date})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={startCameraScanner}
                  className={styles.submitBtn}
                  style={{ minHeight: '50px', fontSize: '1rem', fontWeight: 900 }}
                >
                  📷 Launch Camera Scanner ➔
                </button>
              </div>

              {/* MANUAL CHECK-IN */}
              <div className={styles.adminFormCard}>
                <h3 className={styles.analyticsTitle} style={{ fontSize: '1rem', marginBottom: '12px' }}>
                  Manual School ID Check-in
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '16px' }}>
                  For students without smartphones or during low camera lighting conditions.
                </p>

                <form onSubmit={handleManualScanSubmit} className={styles.loginForm}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel} style={{ fontSize: '0.78rem' }}>School ID (e.g. 2024-0616) *</label>
                    <input
                      type="text"
                      placeholder="e.g. 2024-0616"
                      value={manualStudentId}
                      onChange={(e) => setManualStudentId(e.target.value)}
                      className={styles.loginInput}
                      style={{ padding: '12px 14px', fontSize: '0.95rem' }}
                      required
                    />
                  </div>

                  <button type="submit" className={styles.adminPrimaryBtn} style={{ minHeight: '48px', fontSize: '0.95rem' }}>
                    ✓ Mark as Present
                  </button>
                </form>

                {scanLogMsg.text && (
                  <div
                    className={styles.alertMessage}
                    style={{
                      marginTop: '14px',
                      fontSize: '0.9rem',
                      color: scanLogMsg.type === 'error' ? '#b91c1c' : scanLogMsg.type === 'warning' ? '#b45309' : '#15803d',
                      backgroundColor: scanLogMsg.type === 'error' ? '#fef2f2' : scanLogMsg.type === 'warning' ? '#fefce8' : '#f0fdf4',
                    }}
                  >
                    {scanLogMsg.text}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================= */}
      {/* 1. CAMERA SCANNER MODAL POPUP */}
      {/* ========================================================= */}
      {isCameraModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              width: '100%',
              maxWidth: '460px',
              borderRadius: '28px',
              padding: '24px 20px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '1.25rem' }}>📷</span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#15803d', margin: 0 }}>
                Scan Student QR Code
              </h3>
            </div>

            <div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '380px',
                height: '320px',
                margin: '0 auto',
                backgroundColor: '#0f172a',
                borderRadius: '20px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div id="interactive-qr-reader" style={{ width: '100%', height: '100%' }} />

              {/* White Viewfinder Corners Overlay [ ] */}
              <div
                style={{
                  position: 'absolute',
                  width: '210px',
                  height: '210px',
                  pointerEvents: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, width: '32px', height: '32px', borderTop: '4px solid #ffffff', borderLeft: '4px solid #ffffff', borderTopLeftRadius: '8px' }} />
                <div style={{ position: 'absolute', top: 0, right: 0, width: '32px', height: '32px', borderTop: '4px solid #ffffff', borderRight: '4px solid #ffffff', borderTopRightRadius: '8px' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '32px', height: '32px', borderBottom: '4px solid #ffffff', borderLeft: '4px solid #ffffff', borderBottomLeftRadius: '8px' }} />
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: '32px', height: '32px', borderBottom: '4px solid #ffffff', borderRight: '4px solid #ffffff', borderBottomRightRadius: '8px' }} />
              </div>
            </div>

            <div style={{ marginTop: '12px', marginBottom: '14px' }}>
              <button
                type="button"
                onClick={async () => {
                  if (scannerRef.current) {
                    if (isScannerRunning) {
                      await scannerRef.current.pause();
                      setIsScannerRunning(false);
                    } else {
                      await scannerRef.current.resume();
                      setIsScannerRunning(true);
                    }
                  }
                }}
                style={{
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                {isScannerRunning ? 'Stop Scanning' : 'Resume Scanning'}
              </button>
            </div>

            <button
              type="button"
              onClick={closeCameraModal}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '16px',
                fontSize: '0.95rem',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
              }}
            >
              Close Camera
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. SCANNED VERIFICATION MODAL (SCHOOL ID ONLY - NO EMAIL) */}
      {/* ========================================================= */}
      {showVerifyModal && scannedStudentData && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              width: '100%',
              maxWidth: '400px',
              borderRadius: '28px',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
              textAlign: 'center',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                fontSize: '0.72rem',
                fontWeight: 900,
                padding: '4px 14px',
                borderRadius: '9999px',
                border: '1px solid #bbf7d0',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '16px',
              }}
            >
              ✓ QR Code Verified
            </span>

            {/* Student Photo */}
            <div
              style={{
                width: '94px',
                height: '94px',
                borderRadius: '24px',
                backgroundColor: '#f1f5f9',
                border: '3px solid #15803d',
                margin: '0 auto 12px auto',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
              }}
            >
              {scannedStudentData.avatar_url ? (
                <img
                  src={scannedStudentData.avatar_url}
                  alt={scannedStudentData.full_name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: '2.5rem' }}>👤</span>
              )}
            </div>

            {/* Student Full Name */}
            <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>
              {scannedStudentData.full_name}
            </h2>

            {/* School ID Display (No Email) */}
            <div
              style={{
                fontSize: '1.1rem',
                fontWeight: 900,
                color: '#15803d',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '12px',
                padding: '6px 14px',
                display: 'inline-block',
                margin: '8px auto 16px auto',
                letterSpacing: '0.04em',
              }}
            >
              ID: {scannedStudentData.school_id}
            </div>

            {/* Course, Year Level & Section */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '18px',
                padding: '14px 16px',
                marginBottom: '20px',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontWeight: 700 }}>Course:</span>
                <span className={styles.idBadge} style={{ fontSize: '0.75rem' }}>
                  {scannedStudentData.course}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontWeight: 700 }}>Year &amp; Section:</span>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>
                  {scannedStudentData.year_level || '1st Year'} • {scannedStudentData.section || 'Section A'}
                </span>
              </div>
            </div>

            {/* Actions: OK & Cancel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={handleConfirmAttendance}
                disabled={confirmingAttendance}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#15803d',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '16px',
                  fontSize: '0.95rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(21, 128, 61, 0.25)',
                }}
              >
                {confirmingAttendance ? 'Recording...' : '✓ OK • Confirm Attendance'}
              </button>

              <button
                type="button"
                onClick={async () => {
                  setShowVerifyModal(false);
                  setScannedStudentData(null);
                  if (scannerRef.current) {
                    try {
                      await scannerRef.current.resume();
                    } catch (e) {}
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Cancel &amp; Continue Scanning
              </button>
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
