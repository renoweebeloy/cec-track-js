import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import styles from '../styles/Home.module.css';

export default function AdminDashboard() {
  const router = useRouter();
  const scannerRef = useRef(null);
  const eventImageInputRef = useRef(null);
  const formRef = useRef(null);

  // Scan Processing Lock para maiwasan ang loop
  const isProcessingScanRef = useRef(false);
  const lastScannedCodeRef = useRef('');

  // Authentication & Security Guard States
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [userRole, setUserRole] = useState('admin');
  const [currentUser, setCurrentUser] = useState({ name: '', email: '', school_id: '' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Navigation Tabs: 'profile' | 'add-student' | 'add-staff' | 'add-event' | 'scan-qr' | 'search-student'
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Mobile Delete Confirmation Modal States
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: '', id: null, title: '' });
  const [deletingRecord, setDeletingRecord] = useState(false);

  // 1. Student States
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
  const [editingEventId, setEditingEventId] = useState(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [timeIn, setTimeIn] = useState('08:00');
  const [timeOut, setTimeOut] = useState('17:00');
  const [eventStatus, setEventStatus] = useState('active');
  const [eventImage, setEventImage] = useState('');
  const [compressingImage, setCompressingImage] = useState(false);

  // 4. Scanner Controls & Toggle Modes
  const [scanMode, setScanMode] = useState('time_in'); // 'time_in' | 'time_out'
  const [isScannerGateOpen, setIsScannerGateOpen] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [manualStudentId, setManualStudentId] = useState('');
  const [scanLogMsg, setScanLogMsg] = useState({ type: '', text: '' });

  // Live Continuous Camera Scanner Feedback with Profile Details
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [liveScanFeedback, setLiveScanFeedback] = useState(null);
  const [recentScans, setRecentScans] = useState([]);

  // 5. Search Student Attendance History States
  const [searchHistoryId, setSearchHistoryId] = useState('');
  const [searchingHistory, setSearchingHistory] = useState(false);
  const [searchedStudent, setSearchedStudent] = useState(null);
  const [studentAttendanceRecords, setStudentAttendanceRecords] = useState([]);
  const [historySearchMessage, setHistorySearchMessage] = useState('');

  // Collections & Filters
  const [students, setStudents] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [events, setEvents] = useState([]);
  const [searchStudentQuery, setSearchStudentQuery] = useState('');
  const [searchEventQuery, setSearchEventQuery] = useState('');

  const courses = [
    { code: 'BSCRIM', name: 'Bachelor of Science in Criminology', badge: styles.bscrimBadge },
    { code: 'BSBA', name: 'Bachelor of Science in Business Administration', badge: styles.bsbaBadge },
    { code: 'BSAM', name: 'Bachelor of Science in Agribusiness Management', badge: styles.bsamBadge },
    { code: 'BEED', name: 'Bachelor of Elementary Education', badge: styles.beedBadge },
    { code: 'BSA', name: 'Bachelor of Science in Accountancy', badge: styles.bsaBadge },
  ];

  const sectionsList = [
    'Section A', 'Section B', 'Section C', 'Section D', 'Section E',
    'Section F', 'Section G', 'Section H', 'Section I', 'Section J', 'Section K',
  ];

  // Helper: Convert 24h (17:00) to 12h (5:00 PM)
  const formatTime12Hour = (time24) => {
    if (!time24 || time24 === '--:--') return '--:--';
    if (time24.includes('AM') || time24.includes('PM')) return time24;
    const parts = time24.split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1] ? parts[1].substring(0, 2) : '00';
    if (isNaN(hours)) return time24;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes.padStart(2, '0')} ${ampm}`;
  };

  const showNotify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification({ type: '', message: '' });
    }, 4500);
  };

  const playBeepSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.16);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.16);
    } catch (e) {
      console.warn('AudioContext beep warning:', e);
    }
  };

  // 5-Minute Inactivity Session Guard
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const FIVE_MINUTES_MS = 5 * 60 * 1000;

    const checkSessionActivity = async () => {
      const lastActive = localStorage.getItem('cec_last_active_time');
      const now = Date.now();

      if (lastActive) {
        const timeElapsed = now - parseInt(lastActive, 10);
        if (timeElapsed > FIVE_MINUTES_MS) {
          sessionStorage.clear();
          localStorage.removeItem('cec_last_active_time');

          if (supabase) {
            try {
              await supabase.auth.signOut();
            } catch (e) {}
          }

          alert('Your session has expired due to 5 minutes of inactivity. Please log in again.');
          router.replace('/login');
          return;
        }
      }

      localStorage.setItem('cec_last_active_time', now.toString());
    };

    checkSessionActivity();

    const updateActivity = () => {
      localStorage.setItem('cec_last_active_time', Date.now().toString());
    };

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);
    window.addEventListener('touchstart', updateActivity);

    const intervalTimer = setInterval(checkSessionActivity, 10000);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      clearInterval(intervalTimer);
    };
  }, [router]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.Html5Qrcode) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Verification Access Clearance
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
        setStaffList(profilesData.filter((p) => p.role === 'staff' || p.can_scan === true));
      }

      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false });

      if (eventsData) {
        const now = new Date();

        const validatedEvents = await Promise.all(
          eventsData.map(async (ev) => {
            try {
              if (ev.date) {
                const timeParts = (ev.time_out || '23:59').split(':');
                const hours = parseInt(timeParts[0], 10) || 0;
                const minutes = parseInt(timeParts[1], 10) || 0;

                const eventEndDateTime = new Date(ev.date);
                eventEndDateTime.setHours(hours, minutes, 0, 0);

                if (now >= eventEndDateTime && ev.status === 'active') {
                  await supabase
                    .from('events')
                    .update({ status: 'inactive' })
                    .eq('id', ev.id);

                  return { ...ev, status: 'inactive' };
                }
              }
            } catch (checkErr) {
              console.warn('Error checking event expiration:', checkErr);
            }
            return ev;
          })
        );

        setEvents(validatedEvents);
        if (validatedEvents.length > 0 && !selectedEventId) {
          setSelectedEventId(validatedEvents[0].id);
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
      localStorage.removeItem('cec_last_active_time');
    }
    router.replace('/');
  };

  const handleEventImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotify('error', 'Please select a valid image file (PNG, JPG, JPEG).');
      return;
    }

    setCompressingImage(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        setEventImage(compressedBase64);
        setCompressingImage(false);
        showNotify('success', 'Image optimized successfully!');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleStartEditEvent = (ev) => {
    setEditingEventId(ev.id);
    setEventTitle(ev.title || '');
    setEventLocation(ev.location || '');
    setEventDate(ev.date || '');
    setTimeIn(ev.time_in || '08:00');
    setTimeOut(ev.time_out || '17:00');
    setEventStatus(ev.status || 'active');
    setEventDesc(ev.description || '');
    setEventImage(ev.image_url || '');

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancelEditEvent = () => {
    setEditingEventId(null);
    setEventTitle('');
    setEventLocation('');
    setEventDate('');
    setTimeIn('08:00');
    setTimeOut('17:00');
    setEventStatus('active');
    setEventDesc('');
    setEventImage('');
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (compressingImage) {
      showNotify('error', 'Please wait for image optimization to finish.');
      return;
    }

    setLoading(true);

    try {
      const eventPayload = {
        title: eventTitle.trim(),
        location: eventLocation.trim(),
        date: eventDate,
        time_in: timeIn,
        time_out: timeOut,
        description: eventDesc.trim() || 'Official College Event',
        status: eventStatus,
        image_url: eventImage || null,
      };

      if (editingEventId) {
        const { error } = await supabase
          .from('events')
          .update(eventPayload)
          .eq('id', editingEventId);

        if (error) throw new Error(error.message);
        showNotify('success', `Event "${eventTitle}" updated successfully!`);
      } else {
        const { error } = await supabase
          .from('events')
          .insert([eventPayload]);

        if (error) throw new Error(error.message);
        showNotify('success', `Event "${eventTitle}" published successfully!`);
      }

      handleCancelEditEvent();
      fetchAllData();
    } catch (err) {
      showNotify('error', `Error saving event: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const triggerDeletePrompt = (type, id, title) => {
    if (userRole !== 'admin') {
      alert('Only administrators have permission to delete records.');
      return;
    }
    setDeleteModal({ isOpen: true, type, id, title });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.id || userRole !== 'admin') return;
    setDeletingRecord(true);

    try {
      if (deleteModal.type === 'event') {
        await supabase.from('attendance').delete().eq('event_id', deleteModal.id);
        const { error } = await supabase.from('events').delete().eq('id', deleteModal.id);
        if (error) throw new Error(error.message);

        showNotify('success', `Event "${deleteModal.title}" deleted successfully.`);
      } else if (deleteModal.type === 'student') {
        await supabase.from('attendance').delete().eq('student_id', deleteModal.title);
        const { error } = await supabase.from('profiles').delete().eq('id', deleteModal.id);
        if (error) throw new Error(error.message);

        showNotify('success', `Student record removed successfully.`);
      } else if (deleteModal.type === 'staff') {
        const { error } = await supabase.from('profiles').delete().eq('id', deleteModal.id);
        if (error) throw new Error(error.message);

        showNotify('success', `Staff authorization revoked.`);
      }

      setDeleteModal({ isOpen: false, type: '', id: null, title: '' });
      fetchAllData();
    } catch (err) {
      showNotify('error', `Delete error: ${err.message}`);
    } finally {
      setDeletingRecord(false);
    }
  };

  // ========================================================
  // CONTINUOUS LIVE SCANNER WITH PROFILE POP-UP CARD
  // ========================================================
  const startCameraScanner = async () => {
    if (!selectedEventId) {
      showNotify('error', 'Please select an Active Event Schedule before scanning.');
      return;
    }

    if (!isScannerGateOpen) {
      showNotify('error', 'Scanner is currently CLOSED. Please turn ON the Scanner Gate switch.');
      return;
    }

    if (!window.Html5Qrcode) {
      showNotify('error', 'Scanner library is loading. Please try again in a moment.');
      return;
    }

    setIsCameraModalOpen(true);
    setLiveScanFeedback(null);
    isProcessingScanRef.current = false;
    lastScannedCodeRef.current = '';

    setTimeout(async () => {
      try {
        const qrScanner = new window.Html5Qrcode('interactive-qr-reader');
        scannerRef.current = qrScanner;

        await qrScanner.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: { width: 280, height: 280 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            handleQrCodeDetected(decodedText);
          },
          () => {}
        );
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
    isProcessingScanRef.current = false;
    lastScannedCodeRef.current = '';
  };

  const closeCameraModal = async () => {
    await stopCameraScanner();
    setIsCameraModalOpen(false);
    setLiveScanFeedback(null);
  };

  // Direct Scan Logic (Nagpapakita ng Profile, ID, Course, Section, Year)
  const handleQrCodeDetected = async (decodedText) => {
    const cleanSchoolId = (decodedText || '').trim();
    if (!cleanSchoolId) return;

    if (!isScannerGateOpen) {
      setLiveScanFeedback({
        type: 'error',
        title: 'SCANNER CLOSED',
        message: 'Attendance scanning is currently turned OFF by Admin.',
      });
      return;
    }

    if (isProcessingScanRef.current) return;
    if (lastScannedCodeRef.current === cleanSchoolId) return;

    isProcessingScanRef.current = true;
    lastScannedCodeRef.current = cleanSchoolId;

    try {
      const { data: student, error } = await supabase
        .from('profiles')
        .select('school_id, full_name, course, year_level, section, avatar_url')
        .eq('school_id', cleanSchoolId)
        .maybeSingle();

      if (error || !student) {
        setLiveScanFeedback({
          type: 'error',
          title: 'ACCESS DENIED',
          message: `School ID "${cleanSchoolId}" not found in whitelist database.`,
        });

        setTimeout(() => {
          isProcessingScanRef.current = false;
          lastScannedCodeRef.current = '';
        }, 2000);
        return;
      }

      const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', student.school_id)
        .eq('event_id', selectedEventId)
        .maybeSingle();

      if (scanMode === 'time_in') {
        if (existingAttendance && existingAttendance.time_in) {
          playBeepSound();
          setLiveScanFeedback({
            type: 'warning',
            title: 'ALREADY TIMED IN',
            student,
            time: existingAttendance.time_in,
            mode: 'TIME IN',
          });
        } else if (existingAttendance) {
          await supabase
            .from('attendance')
            .update({
              time_in: currentTime,
              status: 'PRESENT',
            })
            .eq('id', existingAttendance.id);

          playBeepSound();
          setLiveScanFeedback({
            type: 'success',
            title: 'TIME IN RECORDED!',
            student,
            time: currentTime,
            mode: 'TIME IN',
          });

          setRecentScans((prev) => [
            { id: Date.now(), name: student.full_name, school_id: student.school_id, mode: 'TIME IN', time: currentTime },
            ...prev.slice(0, 4),
          ]);
        } else {
          // Strictly insert time_in lamang; walang time_out!
          await supabase.from('attendance').insert([
            {
              student_id: student.school_id,
              student_name: student.full_name || 'CEC Student',
              event_id: selectedEventId,
              status: 'PRESENT',
              time_in: currentTime,
              time_out: null,
              scanned_by: currentUser.email || userRole,
            },
          ]);

          playBeepSound();
          setLiveScanFeedback({
            type: 'success',
            title: 'TIME IN RECORDED!',
            student,
            time: currentTime,
            mode: 'TIME IN',
          });

          setRecentScans((prev) => [
            { id: Date.now(), name: student.full_name, school_id: student.school_id, mode: 'TIME IN', time: currentTime },
            ...prev.slice(0, 4),
          ]);
        }
      }

      if (scanMode === 'time_out') {
        if (existingAttendance && existingAttendance.time_out && existingAttendance.time_out !== '--:--') {
          playBeepSound();
          setLiveScanFeedback({
            type: 'warning',
            title: 'ALREADY TIMED OUT',
            student,
            time: existingAttendance.time_out,
            mode: 'TIME OUT',
          });
        } else if (existingAttendance) {
          await supabase
            .from('attendance')
            .update({
              time_out: currentTime,
            })
            .eq('id', existingAttendance.id);

          playBeepSound();
          setLiveScanFeedback({
            type: 'success',
            title: 'TIME OUT RECORDED!',
            student,
            time: currentTime,
            mode: 'TIME OUT',
          });

          setRecentScans((prev) => [
            { id: Date.now(), name: student.full_name, school_id: student.school_id, mode: 'TIME OUT', time: currentTime },
            ...prev.slice(0, 4),
          ]);
        } else {
          await supabase.from('attendance').insert([
            {
              student_id: student.school_id,
              student_name: student.full_name || 'CEC Student',
              event_id: selectedEventId,
              status: 'PRESENT',
              time_in: null,
              time_out: currentTime,
              scanned_by: currentUser.email || userRole,
            },
          ]);

          playBeepSound();
          setLiveScanFeedback({
            type: 'success',
            title: 'TIME OUT RECORDED!',
            student,
            time: currentTime,
            mode: 'TIME OUT',
          });

          setRecentScans((prev) => [
            { id: Date.now(), name: student.full_name, school_id: student.school_id, mode: 'TIME OUT', time: currentTime },
            ...prev.slice(0, 4),
          ]);
        }
      }

      setTimeout(() => {
        isProcessingScanRef.current = false;
        lastScannedCodeRef.current = '';
      }, 2200);
    } catch (err) {
      console.error('Scan lookup error:', err);
      setTimeout(() => {
        isProcessingScanRef.current = false;
        lastScannedCodeRef.current = '';
      }, 1500);
    }
  };

  const handleSearchStudentHistory = async (e) => {
    e.preventDefault();
    const cleanId = searchHistoryId.trim();

    if (!cleanId) {
      setHistorySearchMessage('Please enter the student\'s School ID.');
      return;
    }

    setSearchingHistory(true);
    setHistorySearchMessage('');
    setSearchedStudent(null);
    setStudentAttendanceRecords([]);

    try {
      const { data: student, error: studentErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('school_id', cleanId)
        .maybeSingle();

      if (studentErr || !student) {
        setHistorySearchMessage(`No student found with School ID: "${cleanId}"`);
        setSearchingHistory(false);
        return;
      }

      setSearchedStudent(student);

      const { data: allEvents } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false });

      const { data: attLogs } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', cleanId);

      const logsMap = {};
      if (attLogs) {
        attLogs.forEach((log) => {
          logsMap[log.event_id] = log;
        });
      }

      const combinedRecords = (allEvents || []).map((ev) => {
        const matchingLog = logsMap[ev.id];
        const isPresent = Boolean(matchingLog && matchingLog.status === 'PRESENT');

        return {
          eventId: ev.id,
          eventTitle: ev.title,
          eventDate: ev.date,
          eventLocation: ev.location,
          scheduledTimeIn: ev.time_in,
          scheduledTimeOut: ev.time_out,
          status: isPresent ? 'PRESENT' : 'ABSENT',
          actualTimeIn: matchingLog && matchingLog.time_in ? formatTime12Hour(matchingLog.time_in) : '--:--',
          actualTimeOut: matchingLog && matchingLog.time_out ? formatTime12Hour(matchingLog.time_out) : '--:--',
          scannedBy: matchingLog ? matchingLog.scanned_by : 'N/A',
        };
      });

      setStudentAttendanceRecords(combinedRecords);
    } catch (err) {
      console.error('Error searching student history:', err);
      setHistorySearchMessage('An error occurred while retrieving attendance records.');
    } finally {
      setSearchingHistory(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();

    const idRegex = /^\d{4}-\d{4,5}$/;
    if (!idRegex.test(studentId.trim())) {
      showNotify('error', 'Invalid School ID format. Please use format: 2024-0616.');
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
        `Successfully added ${studentName.trim()} (${studentSection})! Default password: ${defaultPassword}`
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

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (userRole !== 'admin') {
      showNotify('error', 'Only administrators can register or authorize staff.');
      return;
    }

    setLoading(true);
    const cleanEmail = staffEmail.trim().toLowerCase();

    try {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, can_scan')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingUser) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            can_scan: true,
            role: 'staff',
          })
          .eq('email', cleanEmail);

        if (updateError) {
          throw new Error(updateError.message);
        }

        showNotify(
          'success',
          `Account upgraded. Scanner clearance granted to ${existingUser.full_name}.`
        );
      } else {
        const generatedStaffId = `STAFF-${Math.floor(1000 + Math.random() * 9000)}`;
        const { error: insertError } = await supabase.from('profiles').insert([
          {
            school_id: generatedStaffId,
            full_name: staffName.trim(),
            email: cleanEmail,
            password: generatedStaffId,
            role: 'staff',
            can_scan: true,
            status: 'Active',
            must_change_password: true,
          },
        ]);

        if (insertError) {
          throw new Error(insertError.message);
        }

        showNotify(
          'success',
          `Staff member ${staffName} successfully registered! Default password: ${generatedStaffId}`
        );
      }

      setStaffName('');
      setStaffEmail('');
      fetchAllData();
    } catch (err) {
      showNotify('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualScanSubmit = async (e) => {
    e.preventDefault();
    if (!manualStudentId) return;

    if (!isScannerGateOpen) {
      setScanLogMsg({ type: 'error', text: 'Scanner Gate is currently CLOSED by Admin.' });
      return;
    }

    setScanLogMsg({ type: 'info', text: 'Validating School ID with database...' });

    const studentMatch = students.find(
      (s) => s.school_id?.toLowerCase() === manualStudentId.trim().toLowerCase()
    );

    if (!studentMatch) {
      setScanLogMsg({
        type: 'error',
        text: 'Access Denied: School ID is not registered in the whitelist database.',
      });
      return;
    }

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentMatch.school_id)
      .eq('event_id', selectedEventId)
      .maybeSingle();

    if (scanMode === 'time_in') {
      if (existing && existing.time_in) {
        setScanLogMsg({
          type: 'warning',
          text: `ALREADY TIMED IN: Recorded at ${existing.time_in} for ${studentMatch.full_name} (${studentMatch.school_id}).`,
        });
        return;
      }

      const { error } = await supabase.from('attendance').insert([
        {
          student_id: studentMatch.school_id,
          student_name: studentMatch.full_name || 'CEC Student',
          event_id: selectedEventId,
          status: 'PRESENT',
          time_in: currentTime,
          time_out: null,
          scanned_by: currentUser.email || userRole,
        },
      ]);

      if (error) {
        setScanLogMsg({ type: 'error', text: `Error: ${error.message}` });
      } else {
        playBeepSound();
        setScanLogMsg({
          type: 'success',
          text: `Time In confirmed: ${studentMatch.full_name} (${studentMatch.school_id}) at ${currentTime}.`,
        });
        setManualStudentId('');
      }
    } else {
      if (existing && existing.time_out && existing.time_out !== '--:--') {
        setScanLogMsg({
          type: 'warning',
          text: `ALREADY TIMED OUT: Recorded at ${existing.time_out} for ${studentMatch.full_name} (${studentMatch.school_id}).`,
        });
        return;
      }

      if (existing) {
        await supabase
          .from('attendance')
          .update({ time_out: currentTime })
          .eq('id', existing.id);
      } else {
        await supabase.from('attendance').insert([
          {
            student_id: studentMatch.school_id,
            student_name: studentMatch.full_name || 'CEC Student',
            event_id: selectedEventId,
            status: 'PRESENT',
            time_in: null,
            time_out: currentTime,
            scanned_by: currentUser.email || userRole,
          },
        ]);
      }

      playBeepSound();
      setScanLogMsg({
        type: 'success',
        text: `Time Out confirmed: ${studentMatch.full_name} (${studentMatch.school_id}) at ${currentTime}.`,
      });
      setManualStudentId('');
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

  const historyPresentCount = studentAttendanceRecords.filter((r) => r.status === 'PRESENT').length;
  const historyAbsentCount = studentAttendanceRecords.filter((r) => r.status === 'ABSENT').length;
  const historyTotalEvents = studentAttendanceRecords.length;
  const historyComplianceRate = historyTotalEvents > 0 ? Math.round((historyPresentCount / historyTotalEvents) * 100) : 0;

  const activeEventObj = events.find((e) => e.id === selectedEventId);

  return (
    <div className={styles.container} style={{ paddingBottom: 0, overflowX: 'hidden', maxWidth: '100vw' }}>
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
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '8px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '6px',
            boxSizing: 'border-box',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexShrink: 1 }}>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label="Toggle Navigation Menu"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #e2e8f0',
                fontSize: '1.2rem',
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

            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 900,
                    color: '#15803d',
                    letterSpacing: '-0.025em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  CEC TRACK
                </span>
                <span
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 900,
                    padding: '2px 6px',
                    borderRadius: '9999px',
                    backgroundColor: isAdmin ? '#dcfce7' : '#eff6ff',
                    color: isAdmin ? '#15803d' : '#1d4ed8',
                    border: `1px solid ${isAdmin ? '#bbf7d0' : '#bfdbfe'}`,
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isAdmin ? 'Admin' : 'Staff'}
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              padding: '6px 10px',
              boxShadow: '0 1px 2px rgba(21, 128, 61, 0.06)',
              flexShrink: 0,
              maxWidth: '145px',
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#15803d',
                letterSpacing: '-0.01em',
                lineHeight: 1.15,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Cateel Campus
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
            width: '280px',
            maxWidth: '82vw',
            backgroundColor: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '20px 16px',
            boxShadow: isSidebarOpen ? '6px 0 25px rgba(0,0,0,0.15)' : 'none',
            transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflowY: 'auto',
            boxSizing: 'border-box',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#15803d', margin: 0 }}>Portal Menu</h2>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {isAdmin ? 'Administrator Access' : 'Staff Officer Access'}
                </span>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.2rem',
                  fontWeight: 900,
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }}
                className={activeTab === 'profile' ? `${styles.portalNavLink} ${styles.portalNavLinkActive}` : styles.portalNavLink}
                style={{ fontSize: '0.92rem', padding: '12px 14px', justifyContent: 'flex-start' }}
              >
                <span>System Overview</span>
              </button>

              <button
                onClick={() => { setActiveTab('add-student'); setIsSidebarOpen(false); }}
                className={activeTab === 'add-student' ? `${styles.portalNavLink} ${styles.portalNavLinkActive}` : styles.portalNavLink}
                style={{ fontSize: '0.92rem', padding: '12px 14px', justifyContent: 'flex-start' }}
              >
                <span>Add Student</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => { setActiveTab('add-staff'); setIsSidebarOpen(false); }}
                  className={activeTab === 'add-staff' ? `${styles.portalNavLink} ${styles.portalNavLinkActive}` : styles.portalNavLink}
                  style={{ fontSize: '0.92rem', padding: '12px 14px', justifyContent: 'flex-start' }}
                >
                  <span>Manage Staff &amp; Scanners</span>
                </button>
              )}

              <button
                onClick={() => { setActiveTab('add-event'); setIsSidebarOpen(false); }}
                className={activeTab === 'add-event' ? `${styles.portalNavLink} ${styles.portalNavLinkActive}` : styles.portalNavLink}
                style={{ fontSize: '0.92rem', padding: '12px 14px', justifyContent: 'flex-start' }}
              >
                <span>Manage Events</span>
              </button>

              <button
                onClick={() => { setActiveTab('scan-qr'); setIsSidebarOpen(false); }}
                className={activeTab === 'scan-qr' ? `${styles.portalNavLink} ${styles.portalNavLinkActive}` : styles.portalNavLink}
                style={{ fontSize: '0.92rem', padding: '12px 14px', justifyContent: 'flex-start' }}
              >
                <span>Scan QR &amp; Quick Log</span>
              </button>

              <button
                onClick={() => { setActiveTab('search-student'); setIsSidebarOpen(false); }}
                className={activeTab === 'search-student' ? `${styles.portalNavLink} ${styles.portalNavLinkActive}` : styles.portalNavLink}
                style={{
                  fontSize: '0.92rem',
                  padding: '12px 14px',
                  backgroundColor: activeTab === 'search-student' ? '#dcfce7' : '#f0fdf4',
                  color: '#15803d',
                  border: '1px solid #bbf7d0',
                  fontWeight: 900,
                  justifyContent: 'flex-start',
                }}
              >
                <span>Student Records &amp; Logs</span>
              </button>
            </nav>
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginTop: '16px' }}>
            <button
              onClick={handleSignOut}
              className={styles.portalNavLink}
              style={{ color: '#b91c1c', fontWeight: 900, fontSize: '0.92rem', padding: '12px 14px', justifyContent: 'flex-start' }}
            >
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* MAIN BODY VIEWPORT */}
        <main className={styles.portalContentArea} style={{ padding: '16px 12px', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ marginBottom: '18px' }}>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>
              Command Center
            </h1>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, fontWeight: 600 }}>
              {isAdmin ? 'Official Administration & Attendance Hub' : 'Staff QR Attendance Verification Hub'}
            </p>
          </div>

          {notification.message && (
            <div
              className={styles.alertMessage}
              style={{
                marginBottom: '1rem',
                fontSize: '0.85rem',
                color: notification.type === 'error' ? '#b91c1c' : '#15803d',
                backgroundColor: notification.type === 'error' ? '#fef2f2' : '#f0fdf4',
                borderColor: notification.type === 'error' ? '#fee2e2' : '#bbf7d0',
                padding: '10px 14px',
              }}
            >
              {notification.message}
            </div>
          )}

          {/* TAB 1: SYSTEM OVERVIEW */}
          {activeTab === 'profile' && (
            <div>
              <div className={styles.attendanceStatsGrid}>
                <div className={styles.attStatCard} style={{ padding: '16px' }}>
                  <span className={styles.attStatLabel} style={{ fontSize: '0.75rem' }}>Enrolled Students</span>
                  <div className={styles.attStatValue} style={{ fontSize: '1.8rem' }}>{students.length}</div>
                </div>

                <div className={styles.attStatCard} style={{ padding: '16px' }}>
                  <span className={styles.attStatLabel} style={{ fontSize: '0.75rem' }}>Authorized Staff</span>
                  <div className={`${styles.attStatValue} ${styles.attGreenText}`} style={{ fontSize: '1.8rem' }}>
                    {staffList.length}
                  </div>
                </div>

                <div className={styles.attStatCard} style={{ padding: '16px' }}>
                  <span className={styles.attStatLabel} style={{ fontSize: '0.75rem' }}>Active Events</span>
                  <div className={`${styles.attStatValue} ${styles.attGreenText}`} style={{ fontSize: '1.8rem' }}>
                    {events.filter((e) => e.status === 'active').length}
                  </div>
                </div>

                <div className={styles.attStatCard} style={{ padding: '16px' }}>
                  <span className={styles.attStatLabel} style={{ fontSize: '0.75rem' }}>Total Events</span>
                  <div className={styles.attStatValue} style={{ fontSize: '1.8rem' }}>{events.length}</div>
                </div>
              </div>

              <div className={styles.adminFormCard}>
                <h3 className={styles.analyticsTitle} style={{ fontSize: '0.85rem', marginBottom: '14px' }}>
                  Students Distribution by Course
                </h3>
                <div className={styles.courseGrid}>
                  {courses.map((c) => {
                    const count = students.filter((s) => s.course === c.code).length;
                    return (
                      <div key={c.code} className={styles.courseCard} style={{ minHeight: '130px' }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '20px' }}>
              {isAdmin && (
                <div className={styles.adminFormCard}>
                  <h3 className={styles.analyticsTitle} style={{ fontSize: '0.9rem', marginBottom: '14px' }}>
                    Add Student
                  </h3>

                  <form onSubmit={handleAddStudent} className={styles.loginForm}>
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel} style={{ fontSize: '0.75rem' }}>School ID (Format: 2024-0616) *</label>
                      <input
                        type="text"
                        placeholder="e.g. 2024-0616"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        pattern="\d{4}-\d{4,5}"
                        className={styles.loginInput}
                        style={{ padding: '10px 12px', fontSize: '0.9rem' }}
                        required
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel} style={{ fontSize: '0.75rem' }}>Full Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Juan Dela Cruz"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className={styles.loginInput}
                        style={{ padding: '10px 12px', fontSize: '0.9rem' }}
                        required
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel} style={{ fontSize: '0.75rem' }}>Student Email Address *</label>
                      <input
                        type="email"
                        placeholder="e.g. student@dorsu.edu.ph"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        className={styles.loginInput}
                        style={{ padding: '10px 12px', fontSize: '0.9rem' }}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel} style={{ fontSize: '0.75rem' }}>Course</label>
                        <select
                          value={studentCourse}
                          onChange={(e) => setStudentCourse(e.target.value)}
                          className={styles.loginInput}
                          style={{ padding: '10px 12px', fontSize: '0.9rem' }}
                        >
                          {courses.map((c) => (
                            <option key={c.code} value={c.code}>{c.code}</option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel} style={{ fontSize: '0.75rem' }}>Year Level</label>
                        <select
                          value={studentYear}
                          onChange={(e) => setStudentYear(e.target.value)}
                          className={styles.loginInput}
                          style={{ padding: '10px 12px', fontSize: '0.9rem' }}
                        >
                          <option value="1st Year">1st Year</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                          <option value="4th Year">4th Year</option>
                        </select>
                      </div>
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel} style={{ fontSize: '0.75rem' }}>Section (A - K) *</label>
                      <select
                        value={studentSection}
                        onChange={(e) => setStudentSection(e.target.value)}
                        className={styles.loginInput}
                        style={{ padding: '10px 12px', fontSize: '0.9rem' }}
                      >
                        {sectionsList.map((sec) => (
                          <option key={sec} value={sec}>{sec}</option>
                        ))}
                      </select>
                    </div>

                    <button type="submit" disabled={loading} className={styles.adminPrimaryBtn} style={{ minHeight: '44px', fontSize: '0.9rem' }}>
                      {loading ? 'Saving...' : 'Add Student ➔'}
                    </button>
                  </form>
                </div>
              )}

              <div className={styles.adminFormCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h3 className={styles.analyticsTitle} style={{ fontSize: '0.9rem', margin: 0 }}>
                      Enrolled Students ({filteredStudents.length})
                    </h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchStudentQuery}
                      onChange={(e) => setSearchStudentQuery(e.target.value)}
                      className={styles.loginInput}
                      style={{ width: '130px', padding: '6px 10px', fontSize: '0.8rem' }}
                    />
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
                          <td colSpan={isAdmin ? 4 : 3} style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                            No student records found.
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((st) => (
                          <tr key={st.id}>
                            <td style={{ fontWeight: 800 }}>{st.school_id}</td>
                            <td>
                              <div style={{ fontWeight: 700 }}>{st.full_name}</div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{st.email}</div>
                            </td>
                            <td>
                              <span className={styles.idBadge}>{st.course}</span>
                              <div style={{ fontSize: '0.7rem', color: '#15803d', fontWeight: 800, marginTop: '2px' }}>
                                {st.section || 'Section A'} • {st.year_level || '1st Year'}
                              </div>
                            </td>
                            {isAdmin && (
                              <td style={{ textAlign: 'right' }}>
                                <button
                                  type="button"
                                  onClick={() => triggerDeletePrompt('student', st.id, st.school_id)}
                                  style={{
                                    border: '1px solid #fecaca',
                                    backgroundColor: '#fef2f2',
                                    color: '#b91c1c',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    padding: '5px 10px',
                                    borderRadius: '8px',
                                    fontSize: '0.75rem',
                                    touchAction: 'manipulation',
                                  }}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '20px' }}>
              <div className={styles.adminFormCard}>
                <h3 className={styles.analyticsTitle} style={{ fontSize: '0.9rem', marginBottom: '14px' }}>
                  Authorize Staff / Student Scanner
                </h3>

                <form onSubmit={handleAddStaff} className={styles.loginForm}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel} style={{ fontSize: '0.75rem' }}>Staff / Student Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Maria Santos"
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      className={styles.loginInput}
                      style={{ padding: '10px 12px', fontSize: '0.9rem' }}
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel} style={{ fontSize: '0.75rem' }}>Registered Email Address *</label>
                    <input
                      type="email"
                      placeholder="e.g. maria@dorsu.edu.ph"
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      className={styles.loginInput}
                      style={{ padding: '10px 12px', fontSize: '0.9rem' }}
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel} style={{ fontSize: '0.75rem' }}>Designation / Title</label>
                    <input
                      type="text"
                      value={staffRole}
                      onChange={(e) => setStaffRole(e.target.value)}
                      className={styles.loginInput}
                      style={{ padding: '10px 12px', fontSize: '0.9rem' }}
                    />
                  </div>

                  <button type="submit" disabled={loading} className={styles.adminPrimaryBtn} style={{ minHeight: '44px', fontSize: '0.9rem' }}>
                    {loading ? 'Authorizing...' : 'Authorize Scanner Privilege ➔'}
                  </button>
                </form>
              </div>

              <div className={styles.adminFormCard}>
                <h3 className={styles.analyticsTitle} style={{ fontSize: '0.9rem', marginBottom: '14px' }}>
                  Authorized Scanners ({staffList.length})
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
                              type="button"
                              onClick={() => triggerDeletePrompt('staff', st.id, st.full_name)}
                              style={{
                                border: '1px solid #fecaca',
                                backgroundColor: '#fef2f2',
                                color: '#b91c1c',
                                fontWeight: 800,
                                cursor: 'pointer',
                                padding: '5px 10px',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                touchAction: 'manipulation',
                              }}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', width: '100%' }}>
              <div className={styles.adminFormCard} ref={formRef} style={{ width: '100%', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 className={styles.analyticsTitle} style={{ fontSize: '0.9rem', margin: 0 }}>
                    {editingEventId ? 'Edit Event' : 'Publish New Event'}
                  </h3>
                  {editingEventId && (
                    <button
                      type="button"
                      onClick={handleCancelEditEvent}
                      style={{
                        background: 'none',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        color: '#64748b',
                        cursor: 'pointer',
                      }}
                    >
                      ✕ Cancel
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveEvent} className={styles.loginForm}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel} style={{ fontSize: '0.75rem' }}>Event Poster</label>
                    <input
                      type="file"
                      ref={eventImageInputRef}
                      onChange={handleEventImageUpload}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                    <div
                      onClick={() => eventImageInputRef.current?.click()}
                      style={{
                        border: '2px dashed #cbd5e1',
                        borderRadius: '14px',
                        padding: '12px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        backgroundColor: '#f8fafc',
                        position: 'relative',
                      }}
                    >
                      {compressingImage ? (
                        <div style={{ padding: '14px 0', color: '#15803d', fontWeight: 800, fontSize: '0.8rem' }}>
                          Optimizing image...
                        </div>
                      ) : eventImage ? (
                        <div style={{ position: 'relative' }}>
                          <img
                            src={eventImage}
                            alt="Event Preview"
                            style={{ maxHeight: '120px', width: 'auto', borderRadius: '10px', margin: '0 auto', display: 'block' }}
                          />
                          <span style={{ fontSize: '0.68rem', color: '#15803d', fontWeight: 800, display: 'block', marginTop: '4px' }}>
                            Click to change picture
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#15803d', display: 'block' }}>
                            + Upload Event Picture
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel} style={{ fontSize: '0.75rem' }}>Event Title *</label>
                    <input
                      type="text"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      className={styles.loginInput}
                      style={{ padding: '10px 12px', fontSize: '0.9rem' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel} style={{ fontSize: '0.75rem' }}>Location *</label>
                      <input
                        type="text"
                        value={eventLocation}
                        onChange={(e) => setEventLocation(e.target.value)}
                        className={styles.loginInput}
                        style={{ padding: '10px 12px', fontSize: '0.9rem' }}
                        required
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel} style={{ fontSize: '0.75rem' }}>Mode</label>
                      <select
                        value={eventStatus}
                        onChange={(e) => setEventStatus(e.target.value)}
                        className={styles.loginInput}
                        style={{ padding: '10px 12px', fontSize: '0.9rem' }}
                      >
                        <option value="active">Active (Open)</option>
                        <option value="inactive">Inactive (Closed)</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel} style={{ fontSize: '0.75rem' }}>Event Date *</label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className={styles.loginInput}
                      style={{ padding: '10px 12px', fontSize: '0.9rem' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel} style={{ fontSize: '0.75rem' }}>Time In *</label>
                      <input
                        type="time"
                        value={timeIn}
                        onChange={(e) => setTimeIn(e.target.value)}
                        className={styles.loginInput}
                        style={{ padding: '10px 12px', fontSize: '0.9rem' }}
                        required
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel} style={{ fontSize: '0.75rem' }}>Time Out *</label>
                      <input
                        type="time"
                        value={timeOut}
                        onChange={(e) => setTimeOut(e.target.value)}
                        className={styles.loginInput}
                        style={{ padding: '10px 12px', fontSize: '0.9rem' }}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel} style={{ fontSize: '0.75rem' }}>Description</label>
                    <textarea
                      rows="2"
                      value={eventDesc}
                      onChange={(e) => setEventDesc(e.target.value)}
                      className={styles.loginInput}
                      style={{ padding: '10px 12px', fontSize: '0.9rem' }}
                      placeholder="Brief details..."
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="submit"
                      disabled={loading || compressingImage}
                      className={styles.adminPrimaryBtn}
                      style={{ flex: 1, minHeight: '44px', fontSize: '0.9rem' }}
                    >
                      {loading
                        ? 'Saving...'
                        : editingEventId
                        ? 'Save Changes ➔'
                        : 'Publish Event ➔'}
                    </button>
                    {editingEventId && (
                      <button
                        type="button"
                        onClick={handleCancelEditEvent}
                        style={{
                          backgroundColor: '#f1f5f9',
                          color: '#475569',
                          border: '1px solid #cbd5e1',
                          borderRadius: '12px',
                          padding: '0 14px',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* PUBLISHED EVENTS (WITH 12-HOUR 5:00 PM FORMAT) */}
              <div className={styles.adminFormCard} style={{ width: '100%', boxSizing: 'border-box', padding: '16px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <h3 className={styles.analyticsTitle} style={{ fontSize: '0.95rem', margin: 0 }}>
                    Published Events ({filteredEvents.length})
                  </h3>
                  <input
                    type="text"
                    placeholder="Search event..."
                    value={searchEventQuery}
                    onChange={(e) => setSearchEventQuery(e.target.value)}
                    className={styles.loginInput}
                    style={{ width: '130px', padding: '6px 10px', fontSize: '0.8rem' }}
                  />
                </div>

                {filteredEvents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '0.85rem' }}>
                    No events found.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                    {filteredEvents.map((ev) => {
                      const isActive = ev.status === 'active';
                      return (
                        <div
                          key={ev.id}
                          style={{
                            backgroundColor: editingEventId === ev.id ? '#f0fdf4' : '#ffffff',
                            border: `1px solid ${editingEventId === ev.id ? '#86efac' : '#e2e8f0'}`,
                            borderRadius: '14px',
                            padding: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px',
                            width: '100%',
                            boxSizing: 'border-box',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                            {ev.image_url ? (
                              <img
                                src={ev.image_url}
                                alt="Event"
                                style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '48px',
                                  height: '48px',
                                  borderRadius: '10px',
                                  backgroundColor: '#f1f5f9',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.8rem',
                                  fontWeight: 800,
                                  color: '#64748b',
                                  flexShrink: 0,
                                }}
                              >
                                EVENT
                              </div>
                            )}

                            <div style={{ minWidth: 0, flex: 1 }}>
                              <h4 style={{ margin: '0 0 2px 0', fontSize: '0.88rem', fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {ev.title}
                              </h4>
                              <div style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                Location: {ev.location || 'FaCET Facade'}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, marginTop: '2px' }}>
                                {ev.date} • {formatTime12Hour(ev.time_in)} - {formatTime12Hour(ev.time_out)}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                            <span
                              className={styles.idBadge}
                              style={{
                                backgroundColor: isActive ? '#dcfce7' : '#f1f5f9',
                                color: isActive ? '#15803d' : '#64748b',
                                fontSize: '0.62rem',
                                padding: '2px 8px',
                              }}
                            >
                              {isActive ? 'ACTIVE' : 'CLOSED'}
                            </span>

                            {isAdmin && (
                              <div style={{ display: 'inline-flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleStartEditEvent(ev)}
                                  style={{
                                    border: '1px solid #bbf7d0',
                                    backgroundColor: '#f0fdf4',
                                    color: '#15803d',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    padding: '5px 10px',
                                    borderRadius: '8px',
                                    fontSize: '0.72rem',
                                    touchAction: 'manipulation',
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => triggerDeletePrompt('event', ev.id, ev.title)}
                                  style={{
                                    border: '1px solid #fecaca',
                                    backgroundColor: '#fef2f2',
                                    color: '#b91c1c',
                                    fontWeight: 900,
                                    cursor: 'pointer',
                                    padding: '5px 10px',
                                    borderRadius: '8px',
                                    fontSize: '0.72rem',
                                    touchAction: 'manipulation',
                                  }}
                                >
                                  Del
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: SCAN QR & QUICK LOG */}
          {activeTab === 'scan-qr' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '20px' }}>
              <div className={styles.adminFormCard} style={{ padding: '24px 18px', textAlign: 'center' }}>
                <h3 className={styles.analyticsTitle} style={{ justifyContent: 'center', fontSize: '1.15rem', marginBottom: '6px' }}>
                  Live Attendance QR Scanner
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '18px', lineHeight: 1.45 }}>
                  Configure the scanning mode and schedule below, then launch the continuous camera scanner.
                </p>

                {/* SCANNER ON / OFF GATE TOGGLE */}
                <div
                  style={{
                    backgroundColor: isScannerGateOpen ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${isScannerGateOpen ? '#bbf7d0' : '#fecaca'}`,
                    borderRadius: '16px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 900, color: isScannerGateOpen ? '#15803d' : '#b91c1c' }}>
                      Scanner Gate: {isScannerGateOpen ? 'OPEN (ACCEPTING SCANS)' : 'CLOSED (PAUSED)'}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>
                      {isScannerGateOpen ? 'Students can scan right now' : 'Attendance logging is stopped'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsScannerGateOpen(!isScannerGateOpen)}
                    style={{
                      backgroundColor: isScannerGateOpen ? '#15803d' : '#ef4444',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '8px 14px',
                      fontSize: '0.78rem',
                      fontWeight: 900,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                      touchAction: 'manipulation',
                    }}
                  >
                    {isScannerGateOpen ? 'Turn OFF' : 'Turn ON'}
                  </button>
                </div>

                {/* TIME IN vs TIME OUT TOGGLE BUTTONS */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 900, color: '#0f172a', marginBottom: '8px', textAlign: 'left' }}>
                    SELECT SCANNER MODE:
                  </label>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      backgroundColor: '#f1f5f9',
                      padding: '6px',
                      borderRadius: '14px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setScanMode('time_in')}
                      style={{
                        padding: '10px',
                        borderRadius: '10px',
                        border: 'none',
                        fontWeight: 900,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: scanMode === 'time_in' ? '#15803d' : 'transparent',
                        color: scanMode === 'time_in' ? '#ffffff' : '#64748b',
                        boxShadow: scanMode === 'time_in' ? '0 2px 8px rgba(21, 128, 61, 0.25)' : 'none',
                        touchAction: 'manipulation',
                      }}
                    >
                      TIME IN SCANNER
                    </button>

                    <button
                      type="button"
                      onClick={() => setScanMode('time_out')}
                      style={{
                        padding: '10px',
                        borderRadius: '10px',
                        border: 'none',
                        fontWeight: 900,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: scanMode === 'time_out' ? '#2563eb' : 'transparent',
                        color: scanMode === 'time_out' ? '#ffffff' : '#64748b',
                        boxShadow: scanMode === 'time_out' ? '0 2px 8px rgba(37, 99, 235, 0.25)' : 'none',
                        touchAction: 'manipulation',
                      }}
                    >
                      TIME OUT SCANNER
                    </button>
                  </div>
                </div>

                {/* TARGET EVENT SCHEDULE */}
                <div style={{ marginBottom: '18px', textAlign: 'left' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                    Target Event Schedule:
                  </label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className={styles.loginInput}
                    style={{ padding: '10px 12px', fontSize: '0.88rem' }}
                  >
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title} ({ev.date}) - In: {formatTime12Hour(ev.time_in)} / Out: {formatTime12Hour(ev.time_out)}
                      </option>
                    ))}
                  </select>

                  {activeEventObj && (
                    <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#64748b', backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontWeight: 800, color: '#0f172a' }}>Scheduled Hours: </span>
                      Time In Starts: <strong style={{ color: '#15803d' }}>{formatTime12Hour(activeEventObj.time_in)}</strong> • Time Out: <strong style={{ color: '#2563eb' }}>{formatTime12Hour(activeEventObj.time_out)}</strong>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={startCameraScanner}
                  disabled={!isScannerGateOpen}
                  className={styles.submitBtn}
                  style={{
                    minHeight: '48px',
                    fontSize: '0.95rem',
                    fontWeight: 900,
                    backgroundColor: !isScannerGateOpen ? '#94a3b8' : scanMode === 'time_in' ? '#15803d' : '#2563eb',
                    touchAction: 'manipulation',
                  }}
                >
                  Launch {scanMode === 'time_in' ? 'Time In' : 'Time Out'} Scanner ➔
                </button>
              </div>

              {/* MANUAL CHECK-IN */}
              <div className={styles.adminFormCard}>
                <h3 className={styles.analyticsTitle} style={{ fontSize: '0.95rem', marginBottom: '8px' }}>
                  Manual School ID Check-in
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '14px' }}>
                  Mode: <strong style={{ color: scanMode === 'time_in' ? '#15803d' : '#2563eb' }}>{scanMode.toUpperCase()}</strong>. For students without smartphones or camera issues.
                </p>

                <form onSubmit={handleManualScanSubmit} className={styles.loginForm}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel} style={{ fontSize: '0.75rem' }}>School ID (e.g. 2024-0616) *</label>
                    <input
                      type="text"
                      placeholder="e.g. 2024-0616"
                      value={manualStudentId}
                      onChange={(e) => setManualStudentId(e.target.value)}
                      className={styles.loginInput}
                      style={{ padding: '10px 12px', fontSize: '0.9rem' }}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className={styles.adminPrimaryBtn}
                    style={{
                      minHeight: '44px',
                      fontSize: '0.9rem',
                      backgroundColor: scanMode === 'time_in' ? '#15803d' : '#2563eb',
                      touchAction: 'manipulation',
                    }}
                  >
                    Mark {scanMode === 'time_in' ? 'Time In' : 'Time Out'}
                  </button>
                </form>

                {scanLogMsg.text && (
                  <div
                    className={styles.alertMessage}
                    style={{
                      marginTop: '12px',
                      fontSize: '0.85rem',
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

          {/* TAB 6: SEARCH STUDENT ATTENDANCE HISTORY */}
          {activeTab === 'search-student' && (
            <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
              <div className={styles.adminFormCard} style={{ padding: '20px', marginBottom: '20px' }}>
                <h3 className={styles.analyticsTitle} style={{ fontSize: '1.1rem', marginBottom: '6px' }}>
                  Search Student Attendance Records
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 16px 0', lineHeight: 1.45 }}>
                  Enter the student&apos;s School ID to view total Present, Absent, and complete Time In / Time Out logs across all events.
                </p>

                <form onSubmit={handleSearchStudentHistory} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="e.g. 2024-0616"
                    value={searchHistoryId}
                    onChange={(e) => setSearchHistoryId(e.target.value)}
                    className={styles.loginInput}
                    style={{ flex: 1, minWidth: '180px', padding: '10px 14px', fontSize: '0.95rem' }}
                    required
                  />
                  <button
                    type="submit"
                    disabled={searchingHistory}
                    className={styles.adminPrimaryBtn}
                    style={{ minHeight: '44px', padding: '10px 20px', fontSize: '0.92rem', flexShrink: 0, touchAction: 'manipulation' }}
                  >
                    {searchingHistory ? 'Searching...' : 'Search Student'}
                  </button>
                </form>

                {historySearchMessage && (
                  <div
                    className={styles.alertMessage}
                    style={{ marginTop: '14px', backgroundColor: '#fef2f2', color: '#b91c1c', borderColor: '#fecaca', fontSize: '0.85rem' }}
                  >
                    {historySearchMessage}
                  </div>
                )}
              </div>

              {searchedStudent && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '100%' }}>
                  <div
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #bbf7d0',
                      borderRadius: '20px',
                      padding: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      boxShadow: '0 4px 12px rgba(21, 128, 61, 0.08)',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '16px',
                        backgroundColor: '#dcfce7',
                        border: '2px solid #15803d',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 900,
                        color: '#15803d',
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}
                    >
                      {searchedStudent.avatar_url ? (
                        <img src={searchedStudent.avatar_url} alt={searchedStudent.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        'USER'
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: '180px' }}>
                      <span className={styles.idBadge} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                        VERIFIED STUDENT
                      </span>
                      <h2 style={{ margin: '4px 0 2px 0', fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                        {searchedStudent.full_name}
                      </h2>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#15803d' }}>
                        ID: {searchedStudent.school_id} • {searchedStudent.course} ({searchedStudent.section || 'Section A'})
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                        {searchedStudent.email}
                      </div>
                    </div>
                  </div>

                  <div className={styles.attendanceStatsGrid}>
                    <div className={styles.attStatCard} style={{ padding: '16px' }}>
                      <span className={styles.attStatLabel} style={{ fontSize: '0.75rem' }}>Total Events</span>
                      <div className={styles.attStatValue} style={{ fontSize: '1.8rem' }}>{historyTotalEvents}</div>
                    </div>

                    <div className={styles.attStatCard} style={{ padding: '16px' }}>
                      <span className={styles.attStatLabel} style={{ fontSize: '0.75rem' }}>Total Present</span>
                      <div className={`${styles.attStatValue} ${styles.attGreenText}`} style={{ fontSize: '1.8rem' }}>
                        {historyPresentCount}
                      </div>
                    </div>

                    <div className={styles.attStatCard} style={{ padding: '16px' }}>
                      <span className={styles.attStatLabel} style={{ fontSize: '0.75rem' }}>Total Absences</span>
                      <div className={styles.attStatValue} style={{ color: '#b91c1c', fontSize: '1.8rem' }}>
                        {historyAbsentCount}
                      </div>
                    </div>

                    <div className={styles.attStatCard} style={{ padding: '16px' }}>
                      <span className={styles.attStatLabel} style={{ fontSize: '0.75rem' }}>Compliance Rate</span>
                      <div className={`${styles.attStatValue} ${styles.attGreenText}`} style={{ fontSize: '1.8rem' }}>
                        {historyComplianceRate}%
                      </div>
                    </div>
                  </div>

                  {/* RESPONSIVE ATTENDANCE CARDS VIEW */}
                  <div className={styles.adminFormCard} style={{ padding: '16px 14px', width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                      <h3 className={styles.analyticsTitle} style={{ fontSize: '0.95rem', margin: 0 }}>
                        Detailed Event Attendance Logs ({studentAttendanceRecords.length})
                      </h3>
                    </div>

                    {studentAttendanceRecords.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '0.85rem' }}>
                        No events recorded.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                        {studentAttendanceRecords.map((record) => {
                          const isPresent = record.status === 'PRESENT';
                          return (
                            <div
                              key={record.eventId}
                              style={{
                                backgroundColor: '#ffffff',
                                border: `1px solid ${isPresent ? '#bbf7d0' : '#fee2e2'}`,
                                borderRadius: '14px',
                                padding: '12px 14px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                width: '100%',
                                boxSizing: 'border-box',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <h4 style={{ margin: '0 0 2px 0', fontSize: '0.92rem', fontWeight: 900, color: '#0f172a', wordBreak: 'break-word' }}>
                                    {record.eventTitle}
                                  </h4>
                                  <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 800 }}>
                                    Location: {record.eventLocation || 'FaCET Facade'}
                                  </div>
                                </div>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    backgroundColor: isPresent ? '#dcfce7' : '#fef2f2',
                                    color: isPresent ? '#15803d' : '#b91c1c',
                                    border: `1px solid ${isPresent ? '#86efac' : '#fecaca'}`,
                                    borderRadius: '9999px',
                                    padding: '3px 10px',
                                    fontSize: '0.72rem',
                                    fontWeight: 900,
                                    flexShrink: 0,
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  {isPresent ? 'PRESENT' : 'ABSENT'}
                                </span>
                              </div>

                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(85px, 1fr))',
                                  gap: '8px',
                                  backgroundColor: '#f8fafc',
                                  borderRadius: '10px',
                                  padding: '8px 10px',
                                  fontSize: '0.75rem',
                                }}
                              >
                                <div>
                                  <span style={{ color: '#64748b', display: 'block', fontWeight: 700, fontSize: '0.68rem' }}>DATE</span>
                                  <span style={{ fontWeight: 800, color: '#0f172a' }}>{record.eventDate}</span>
                                </div>
                                <div>
                                  <span style={{ color: '#64748b', display: 'block', fontWeight: 700, fontSize: '0.68rem' }}>TIME IN</span>
                                  <span style={{ fontWeight: 800, color: isPresent ? '#15803d' : '#94a3b8' }}>{record.actualTimeIn}</span>
                                </div>
                                <div>
                                  <span style={{ color: '#64748b', display: 'block', fontWeight: 700, fontSize: '0.68rem' }}>TIME OUT</span>
                                  <span style={{ fontWeight: 800, color: isPresent ? '#15803d' : '#94a3b8' }}>{record.actualTimeOut}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* CONTINUOUS CAMERA SCANNER MODAL WITH FULL STUDENT PROFILE CARD */}
      {isCameraModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              width: '100%',
              maxWidth: '440px',
              borderRadius: '24px',
              padding: '18px 16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              textAlign: 'center',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span
                style={{
                  backgroundColor: scanMode === 'time_in' ? '#dcfce7' : '#dbeafe',
                  color: scanMode === 'time_in' ? '#15803d' : '#1d4ed8',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                }}
              >
                ● {scanMode === 'time_in' ? 'Time In Mode' : 'Time Out Mode'}
              </span>

              <button
                type="button"
                onClick={closeCameraModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.2rem',
                  fontWeight: 900,
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                  touchAction: 'manipulation',
                }}
              >
                ✕
              </button>
            </div>

            {/* VIEWFINDER CONTAINER */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '260px',
                margin: '0 auto',
                backgroundColor: '#0f172a',
                borderRadius: '18px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div id="interactive-qr-reader" style={{ width: '100%', height: '100%' }} />
            </div>

            {/* LIVE DETAILED STUDENT PROFILE SCAN CARD */}
            {liveScanFeedback && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '12px 14px',
                  borderRadius: '16px',
                  backgroundColor:
                    liveScanFeedback.type === 'success'
                      ? '#f0fdf4'
                      : liveScanFeedback.type === 'warning'
                      ? '#fefce8'
                      : '#fef2f2',
                  border: `1px solid ${
                    liveScanFeedback.type === 'success'
                      ? '#86efac'
                      : liveScanFeedback.type === 'warning'
                      ? '#fde047'
                      : '#fca5a5'
                  }`,
                  textAlign: 'left',
                }}
              >
                {liveScanFeedback.student ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* PHOTO */}
                    <div
                      style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '14px',
                        backgroundColor: '#ffffff',
                        border: '2px solid #15803d',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}
                    >
                      {liveScanFeedback.student.avatar_url ? (
                        <img
                          src={liveScanFeedback.student.avatar_url}
                          alt="Student Avatar"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ fontSize: '1.5rem' }}>👤</span>
                      )}
                    </div>

                    {/* DETAILS: NAME, SCHOOL ID, COURSE, YEAR, SECTION */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 900,
                            color: liveScanFeedback.type === 'success' ? '#15803d' : '#a16207',
                            textTransform: 'uppercase',
                          }}
                        >
                          {liveScanFeedback.title}
                        </span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0f172a' }}>
                          {formatTime12Hour(liveScanFeedback.time)}
                        </span>
                      </div>
                      <h4 style={{ margin: '2px 0', fontSize: '0.95rem', fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {liveScanFeedback.student.full_name}
                      </h4>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#15803d' }}>
                        ID: {liveScanFeedback.student.school_id}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, marginTop: '2px' }}>
                        {liveScanFeedback.student.course} • {liveScanFeedback.student.year_level || '1st Year'} • {liveScanFeedback.student.section || 'Section A'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#b91c1c' }}>
                      {liveScanFeedback.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#334155', fontWeight: 700, marginTop: '2px' }}>
                      {liveScanFeedback.message}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* RECENT SCANS LOGS */}
            {recentScans.length > 0 && (
              <div style={{ marginTop: '10px', textAlign: 'left' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>
                  Recent Scans:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', maxHeight: '65px', overflowY: 'auto' }}>
                  {recentScans.map((scan) => (
                    <div
                      key={scan.id}
                      style={{
                        fontSize: '0.72rem',
                        backgroundColor: '#f8fafc',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ fontWeight: 800, color: '#0f172a' }}>{scan.name}</span>
                      <span style={{ fontWeight: 700, color: scan.mode === 'TIME IN' ? '#15803d' : '#2563eb' }}>
                        {scan.mode} ({formatTime12Hour(scan.time)})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: '12px' }}>
              <button
                type="button"
                onClick={closeCameraModal}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '0.9rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                }}
              >
                Close Camera
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE IN-APP DELETE CONFIRMATION MODAL */}
      {deleteModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 150,
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
              maxWidth: '380px',
              borderRadius: '24px',
              padding: '22px 18px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
              textAlign: 'center',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '16px',
                backgroundColor: '#fee2e2',
                color: '#b91c1c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                margin: '0 auto 12px auto',
              }}
            >
              🗑️
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0' }}>
              Confirm Delete
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 18px 0', lineHeight: 1.45 }}>
              Are you sure you want to permanently delete{' '}
              <strong style={{ color: '#b91c1c' }}>&quot;{deleteModal.title}&quot;</strong>? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletingRecord}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#b91c1c',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '0.9rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                }}
              >
                {deletingRecord ? 'Deleting...' : 'Yes, Delete Record'}
              </button>

              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, type: '', id: null, title: '' })}
                disabled={deletingRecord}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                }}
              >
                Cancel
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
