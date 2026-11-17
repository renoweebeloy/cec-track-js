import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

const P = {
  idcard: 'M6 4h12a3 3 0 013 3v10a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3zM7 9h4M7 13h4M15 9h3v4h-3z',
  hist: 'M12 8v4l3 3M3.05 11a9 9 0 11.5 4m-.5 5v-5h5',
  cal: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
  award: 'M12 15a6 6 0 100-12 6 6 0 000 12zM8.21 13.89L7 23l5-3 5 3-1.21-9.12',
  shieldx: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM12 8v4M12 16h.01',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',
  bell: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0',
  user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  users: 'M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M10 11a4 4 0 100-8 4 4 0 000 8zM21 21v-2a4 4 0 00-3-3.85M16 3.13a4 4 0 010 7.75',
  ucheck: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM16 11l2 2 4-4',
  info: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 16v-4M12 8h.01',
  out: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  dl: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
  refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
  search: 'M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z',
  cam: 'M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 17a4 4 0 100-8 4 4 0 000 8z',
  pin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z',
  check: 'M20 6L9 17l-5-5',
  x: 'M18 6L6 18M6 6l12 12',
  alert: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
  lock: 'M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4',
  globe: 'M12 22a10 10 0 100-20 10 10 0 000 20zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z',
  phone: 'M17 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2zM12 18h.01',
  menu: 'M3 12h18M3 6h18M3 18h18',
  brief: 'M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16',
  bank: 'M3 21h18M5 21V9M19 21V9M9 21V9M15 21V9M2 9l10-6 10 6',
  doc: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M8 13h8M8 17h5',
  clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
  code: 'M16 18l6-6-6-6M8 6l-6 6 6 6',
  img: 'M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21',
  cloud: 'M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z',
};

const Ic = ({ d, s = 18, w = 2.1 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true">
    <path d={P[d]} />
  </svg>
);

const NAV = [
  { id: 'my-id', label: 'My ID', icon: 'idcard' },
  { id: 'attendance', label: 'Attendance', icon: 'hist' },
  { id: 'events', label: 'Events', icon: 'cal' },
  { id: 'officers', label: 'Officers', icon: 'award' },
  { id: 'sanctions', label: 'Sanctions', icon: 'shieldx' },
  { id: 'notifications', label: 'Notifications', icon: 'bell' },
  { id: 'profile', label: 'Profile', icon: 'user' },
  { id: 'about', label: 'About', icon: 'info' },
];

const USERS = [
  { i: 'user', c: '#16a34a', t: 'Students & Members', d: 'Access personalized digital ID badges, view attendance history, explore upcoming assemblies, and verify compliance records in real time.' },
  { i: 'cam', c: '#0f766e', t: 'Attendance Officers', d: 'High-speed event check-in using mobile camera scanning, photo verification, and automated duplicate check-in prevention.' },
  { i: 'brief', c: '#65a30d', t: 'Department Heads', d: 'Manage member rosters across BSCRIM, BSBA, BSA, BEED, and BSAM programs, and monitor general assembly participation rates.' },
  { i: 'bank', c: '#15803d', t: 'Executive Officers', d: 'Publish official events with custom banners, oversee student enrollment whitelists, and export verified attendance records.' },
];

const PageHead = ({ icon, badge, title, sub, right }) => (
  <div className="sd-ph">
    <div>
      <span className="sd-badge"><Ic d={icon} s={14} /> {badge}</span>
      <h1>{title}</h1>
      {sub && <p>{sub}</p>}
    </div>
    {right}
  </div>
);

const Stat = ({ icon, label, value, tone }) => (
  <div className="sd-stat">
    {icon && <span className={`sd-si ${tone || ''}`}><Ic d={icon} s={22} /></span>}
    <div>
      <small>{label}</small>
      <b className={tone || ''}>{value}</b>
    </div>
  </div>
);

export default function StudentDashboard() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const idCardRef = useRef(null);

  // Active Tab Navigation: 'my-id' | 'attendance' | 'events' | 'officers' | 'sanctions' | 'notifications' | 'profile' | 'about'
  const [activeTab, setActiveTab] = useState('my-id');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [downloadingId, setDownloadingId] = useState(false);

  // Messenger / In-App Browser ID Save Modal State
  const [idModalData, setIdModalData] = useState({
    isOpen: false,
    url: '',
    blob: null,
    fileName: '',
  });

  // Welcome Toast Banner State
  const [showWelcomeToast, setShowWelcomeToast] = useState(true);

  // Logout Confirmation Modal State
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Password Change Modal States
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  // Default Student Profile Data
  const [profile, setProfile] = useState({
    full_name: 'Developer',
    school_id: '0000-0000',
    email: 'developer@dorsu.edu.ph',
    course: 'BSIT',
    section: 'Section A',
    year_level: '1st Year',
    avatar_url: '',
    can_scan: false,
  });

  // Events, Attendance, Officers, & Developer Notifications
  const [events, setEvents] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [officersList, setOfficersList] = useState([]);
  const [dbNotifications, setDbNotifications] = useState([]);
  const [attendanceFilter, setAttendanceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Organization Events Filters & Search
  const [eventTabFilter, setEventTabFilter] = useState('all');
  const [eventTabSearch, setEventTabSearch] = useState('');

  const [notification, setNotification] = useState({ type: '', message: '' });

  // 12-Hour AM/PM Formatter
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

  useEffect(() => {
    const welcomeTimer = setTimeout(() => {
      setShowWelcomeToast(false);
    }, 5000);
    return () => clearTimeout(welcomeTimer);
  }, []);

  // 5-Minute Inactivity Session Guard
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const FIVE_MINUTES_MS = 5 * 60 * 1000;

    const checkSessionActivity = async () => {
      let lastActive = null;
      try {
        lastActive = localStorage.getItem('cec_last_active_time');
      } catch (e) {}

      const now = Date.now();

      if (lastActive) {
        const timeElapsed = now - parseInt(lastActive, 10);
        if (timeElapsed > FIVE_MINUTES_MS) {
          try {
            sessionStorage.clear();
            localStorage.removeItem('cec_last_active_time');
            localStorage.removeItem('cec_user_email');
            localStorage.removeItem('cec_user_school_id');
            if (supabase) await supabase.auth.signOut();
          } catch (e) {}

          setProfile({
            full_name: 'Developer',
            school_id: '0000-0000',
            email: 'developer@dorsu.edu.ph',
            course: 'BSIT',
            section: 'Section A',
            year_level: '1st Year',
            avatar_url: '',
            can_scan: false,
          });

          alert('Your session has expired due to 5 minutes of inactivity. Please log in again.');
          router.replace('/');
          return;
        }
      }

      try {
        localStorage.setItem('cec_last_active_time', now.toString());
      } catch (e) {}
    };

    checkSessionActivity();

    const updateActivity = () => {
      try {
        localStorage.setItem('cec_last_active_time', Date.now().toString());
      } catch (e) {}
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

  // Read immediately from cache on refresh to prevent old profile flash
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cachedEmail = sessionStorage.getItem('cec_user_email') || localStorage.getItem('cec_user_email');
        const cachedId = sessionStorage.getItem('cec_school_id') || sessionStorage.getItem('cec_user_school_id');
        const cachedName = sessionStorage.getItem('cec_full_name');

        if (!cachedEmail && !cachedId) {
          router.replace('/');
          return;
        }

        if (cachedName || cachedId) {
          setProfile((prev) => ({
            ...prev,
            full_name: cachedName || prev.full_name,
            school_id: cachedId || prev.school_id,
            email: cachedEmail || prev.email,
          }));
        }
      } catch (e) {}
    }

    fetchStudentData();
  }, []);

  const fetchStudentData = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      if (!supabase) return;

      let userEmail = null;
      let cachedId = null;

      try {
        userEmail = sessionStorage.getItem('cec_user_email') || localStorage.getItem('cec_user_email');
        cachedId = sessionStorage.getItem('cec_school_id') || sessionStorage.getItem('cec_user_school_id') || localStorage.getItem('cec_user_school_id');
      } catch (e) {}

      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.email) userEmail = authData.user.email;

      if (!userEmail && !cachedId) {
        router.replace('/');
        return;
      }

      let currentStudentId = cachedId || profile.school_id;

      if (userEmail) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', userEmail.trim().toLowerCase())
          .maybeSingle();

        if (userProfile) {
          currentStudentId = userProfile.school_id || currentStudentId;
          const hasScanClearance =
            userProfile.can_scan === true ||
            userProfile.role === 'staff' ||
            userProfile.role === 'admin';

          setProfile({
            full_name: userProfile.full_name || 'Developer',
            school_id: userProfile.school_id || '0000-0000',
            email: userProfile.email || userEmail,
            course: userProfile.course || 'BSIT',
            year_level: userProfile.year_level || '1st Year',
            section: userProfile.section || 'Section A',
            avatar_url: userProfile.avatar_url || '',
            can_scan: hasScanClearance,
          });
        }
      }

      // 1. Events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false });

      if (eventsData) {
        setEvents(eventsData);
      }

      // 2. Attendance
      const { data: studentLogs } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', currentStudentId);

      const logsMap = {};
      if (studentLogs) {
        studentLogs.forEach((item) => {
          logsMap[item.event_id] = item;
        });
      }

      if (eventsData && eventsData.length > 0) {
        const mergedRecords = eventsData.map((ev) => {
          const matchingLog = logsMap[ev.id];
          const isPresent = Boolean(matchingLog && matchingLog.status === 'PRESENT');

          return {
            id: ev.id,
            event_id: ev.id,
            title: ev.title || 'Official Assembly',
            location: ev.location || 'FaCET Facade',
            date: ev.date || 'Scheduled',
            time_in: matchingLog && matchingLog.time_in ? formatTime12Hour(matchingLog.time_in) : '--:--',
            time_out: matchingLog && matchingLog.time_out ? formatTime12Hour(matchingLog.time_out) : '--:--',
            event_status: ev.status === 'active' ? 'ACTIVE' : 'INACTIVE (CLOSED)',
            status: isPresent ? 'PRESENT' : 'ABSENT',
            image_url: ev.image_url || null,
            description: ev.description || '',
          };
        });

        setAttendanceLogs(mergedRecords);
      } else {
        setAttendanceLogs([]);
      }

      // 3. Officers
      const { data: officersData } = await supabase
        .from('officers')
        .select('*')
        .order('id', { ascending: true });

      if (officersData) {
        setOfficersList(officersData);
      }

      // 4. Live Developer Broadcast Notifications
      const { data: devNotifs, error: notifErr } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (devNotifs && !notifErr) {
        setDbNotifications(devNotifs);
      }

      if (isManualRefresh) {
        showNotify('success', 'Records updated successfully!');
      }
    } catch (err) {
      console.error('Error fetching dashboard records:', err);
      if (isManualRefresh) {
        showNotify('error', 'Failed to refresh records. Please check your connection.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, or JPEG).');
      return;
    }

    setUploadingPhoto(true);

    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);

        setProfile((prev) => ({ ...prev, avatar_url: compressedBase64 }));

        try {
          const { error: dbError } = await supabase
            .from('profiles')
            .update({ avatar_url: compressedBase64 })
            .eq('school_id', profile.school_id);

          if (dbError) {
            alert('Failed to sync profile photo to database: ' + dbError.message);
          } else {
            showNotify('success', 'Profile photo updated & Attendance QR Code generated successfully!');
          }
        } catch (err) {
          console.warn('Avatar database sync error:', err);
        } finally {
          setUploadingPhoto(false);
        }
      };
      img.src = uploadEvent.target.result;
    };

    reader.readAsDataURL(file);
  };

  const handleDownloadIdCard = async () => {
    if (!idCardRef.current) return;
    setDownloadingId(true);

    try {
      if (!window.html2canvas) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      const canvas = await window.html2canvas(idCardRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        borderRadius: 34,
      });

      const fileName = `CEC-ID-${profile.school_id || 'Student'}.png`;
      const isMessengerApp = /FBAN|FBAV|Messenger|FB_IAB|Instagram|Line/i.test(navigator.userAgent || '');

      canvas.toBlob((blob) => {
        if (!blob) {
          setDownloadingId(false);
          return;
        }

        const blobUrl = URL.createObjectURL(blob);

        if (isMessengerApp) {
          setIdModalData({
            isOpen: true,
            url: blobUrl,
            blob: blob,
            fileName: fileName,
          });
          setDownloadingId(false);
          return;
        }

        // Direct download sa Laptop ug Android (walay Share pop-up)
        const downloadLink = document.createElement('a');
        downloadLink.style.display = 'none';
        downloadLink.download = fileName;
        downloadLink.href = blobUrl;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
        setDownloadingId(false);
        showNotify('success', 'Official ID downloaded successfully!');
      }, 'image/png');
    } catch (err) {
      console.error('Error generating ID card image:', err);
      setDownloadingId(false);
      window.print();
    }
  };

  const handleOpenInSystemBrowser = () => {
    const isAndroid = /Android/i.test(navigator.userAgent || '');
    const cleanUrl = window.location.href.replace(/^https?:\/\//, '');

    if (isAndroid) {
      window.location.href = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
    } else {
      alert("To save on iPhone: Tap the ⋯ (three dots) icon at the top right of your Messenger screen, then tap 'Open in Safari'.");
    }
  };

  const handleModalShare = async () => {
    if (!idModalData.blob) return;
    try {
      const file = new File([idModalData.blob], idModalData.fileName, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Official Student ID',
          text: `Official Student ID: ${profile.full_name} (${profile.school_id})`,
        });
      } else {
        alert('Sharing is not supported on this device. Please use the Long-Press method or open in your browser.');
      }
    } catch (err) {
      console.log('Share dismissed:', err);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPasswordLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          password: newPassword.trim(),
          must_change_password: false,
        })
        .eq('school_id', profile.school_id);

      if (error) throw new Error(error.message);

      setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
      setTimeout(() => {
        setIsChangePasswordOpen(false);
        setNewPassword('');
        setConfirmPassword('');
        setPasswordMsg({ type: '', text: '' });
      }, 1500);
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.message || 'Error updating password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleConfirmSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
    try {
      sessionStorage.clear();
      localStorage.removeItem('cec_last_active_time');
      localStorage.removeItem('cec_user_email');
      localStorage.removeItem('cec_user_school_id');
    } catch (e) {}
    router.replace('/');
  };

  // Attendance stats
  const totalEventsCount = attendanceLogs.length;
  const totalPresentCount = attendanceLogs.filter((l) => l.status === 'PRESENT').length;
  const totalAbsencesCount = attendanceLogs.filter((l) => l.status === 'ABSENT').length;
  const absentEventsList = attendanceLogs.filter((l) => l.status === 'ABSENT');
  const complianceRate = totalEventsCount > 0 ? Math.round((totalPresentCount / totalEventsCount) * 100) : 0;

  const cleanQuery = searchQuery.trim().toLowerCase();
  const filteredLogs = attendanceLogs
    .filter((log) => {
      if (attendanceFilter === 'present') return log.status === 'PRESENT';
      if (attendanceFilter === 'absent') return log.status === 'ABSENT';
      return true;
    })
    .filter((log) => {
      if (!cleanQuery) return true;
      return (
        (log.title || '').toLowerCase().includes(cleanQuery) ||
        (log.location || '').toLowerCase().includes(cleanQuery)
      );
    });

  // Organization Events stats
  const totalOrgEvents = events.length;
  const activeOrgEvents = events.filter((e) => e.status === 'active').length;
  const inactiveOrgEvents = Math.max(0, totalOrgEvents - activeOrgEvents);

  const cleanEventSearch = eventTabSearch.trim().toLowerCase();
  const filteredOrgEvents = events
    .filter((ev) => {
      if (eventTabFilter === 'active') return ev.status === 'active';
      if (eventTabFilter === 'inactive') return ev.status !== 'active';
      return true;
    })
    .filter((ev) => {
      if (!cleanEventSearch) return true;
      return (
        (ev.title || '').toLowerCase().includes(cleanEventSearch) ||
        (ev.location || '').toLowerCase().includes(cleanEventSearch)
      );
    });

  // Merge Live Developer Notifications with System Notices
  const allNotificationsList = [
    ...dbNotifications.map((n) => ({
      id: `dev-${n.id}`,
      type: n.type || 'security',
      title: n.title,
      message: n.message,
      sender: n.sender || 'Developer </ />',
      time: new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      isDev: true,
    })),
    ...(totalAbsencesCount > 0
      ? [
          {
            id: 'notif-absent-alert',
            type: 'alert',
            title: `Attendance Alert: ${totalAbsencesCount} Recorded Absences`,
            message: `You were recorded absent in ${totalAbsencesCount} required event(s). Please review your Sanctions tab.`,
            sender: 'Attendance System',
            time: 'System Alert',
            isDev: false,
          },
        ]
      : []),
    {
      id: 'notif-welcome',
      type: 'system',
      title: 'Portal Access Activated',
      message: `Welcome to CECTRACK, ${profile.full_name}! Your student credentials and digital ID badge are now live and synced.`,
      sender: 'System',
      time: 'Official',
      isDev: false,
    },
  ];

  // QR Code Payload
  const qrPayload = JSON.stringify({
    school_id: profile.school_id,
    full_name: profile.full_name,
    course: profile.course,
    campus: 'DOrSU-CEC',
    system: 'CECTRACK_AUTH_ATTENDANCE',
  });

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&ecc=H&margin=10&data=${encodeURIComponent(
    qrPayload
  )}`;

  const closeIdModal = () => setIdModalData({ isOpen: false, url: '', blob: null, fileName: '' });
  const RefreshBtn = ({ label }) => (
    <button type="button" className="sd-b neu sm" onClick={() => fetchStudentData(true)} disabled={refreshing}>
      <Ic d="refresh" s={15} /> {refreshing ? 'Updating...' : label}
    </button>
  );

  return (
    <div className="sd-root">
      <Head>
        <title>Student Portal • CECTRACK</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Figtree:wght@500;600;700;800&display=swap" rel="stylesheet" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" async />
      </Head>

      <style jsx global>{`
        :root{--g9:#04261a;--g8:#064e3b;--g7:#047857;--g6:#059669;--g5:#10b981;--g2:#a7f3d0;--g1:#d1fae5;--g0:#ecfdf5;--ink:#0b2a1e;--mut:#56705f;--line:#d6ebdf;--red:#dc2626}
        *{box-sizing:border-box}
        body{margin:0;font-family:'Figtree',system-ui,sans-serif;color:var(--ink);background:#f3faf5;overflow-x:hidden}
        button{font-family:inherit;cursor:pointer}
        h1,h2,h3{font-family:'Bricolage Grotesque','Figtree',sans-serif}
        :focus-visible{outline:3px solid var(--g5);outline-offset:2px}
        .sd-root{min-height:100vh;display:flex;flex-direction:column;overflow-x:hidden}

        .sd-b{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:44px;padding:0 18px;border-radius:999px;border:1.5px solid transparent;font-size:.9rem;font-weight:800;line-height:1;white-space:nowrap;transition:transform .2s,box-shadow .2s,background .2s;touch-action:manipulation}
        .sd-b:disabled{opacity:.55;cursor:not-allowed;transform:none!important;box-shadow:none!important}
        .sd-b.sm{height:38px;padding:0 15px;font-size:.82rem;gap:6px}
        .sd-b.full{width:100%}
        .sd-b.pri{background:linear-gradient(135deg,var(--g5),var(--g7));color:#fff;box-shadow:0 8px 20px rgba(5,150,105,.3)}
        .sd-b.pri:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 12px 26px rgba(5,150,105,.4)}
        .sd-b.out{background:var(--g0);color:var(--g7);border-color:#b7ecd3}
        .sd-b.out:hover:not(:disabled){background:var(--g1)}
        .sd-b.neu{background:#fff;color:#3f5a4b;border-color:var(--line)}
        .sd-b.neu:hover:not(:disabled){background:var(--g0)}
        .sd-b.dsol{background:linear-gradient(135deg,#f43f5e,#dc2626);color:#fff;box-shadow:0 8px 20px rgba(220,38,38,.28)}

        .sd-hd {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          z-index: 200;
          height: 64px;
          background: rgba(255,255,255,.95);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--line);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          gap: 10px;
        }
        .sd-hl{display:flex;align-items:center;gap:10px;min-width:0}
        .sd-menu{display:none;width:40px;height:40px;border-radius:12px;border:1px solid var(--line);background:#fff;color:var(--g7);align-items:center;justify-content:center}
        .sd-brand b{font:800 1.15rem 'Bricolage Grotesque',sans-serif;color:var(--g8);letter-spacing:-.02em;margin-right:6px}
        .sd-chip{background:var(--g0);border:1px solid #b7ecd3;color:var(--g7);padding:2px 9px;border-radius:999px;font-size:.7rem;font-weight:800}
        .sd-brand small{display:block;font-size:.72rem;color:var(--mut);font-weight:600}
        .sd-user{display:flex;align-items:center;gap:10px}
        .sd-un{text-align:right;min-width:0}
        .sd-un b{display:block;font-size:.84rem;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .sd-un span{font-size:.76rem;color:var(--g7);font-weight:800}
        .sd-av{width:40px;height:40px;border-radius:50%;overflow:hidden;background:var(--g1);box-shadow:0 0 0 2px #fff,0 0 0 4px var(--g5);display:flex;align-items:center;justify-content:center;font-weight:800;color:var(--g7);flex-shrink:0}
        .sd-av img{width:100%;height:100%;object-fit:cover}

        .sd-shell {
          display: flex;
          flex: 1;
          min-width: 0;
          width: 100%;
          margin-top: 64px;
        }

        .sd-side {
          width: 236px;
          flex-shrink: 0;
          background: #fff;
          border-right: 1px solid var(--line);
          padding: 22px 14px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow-y: auto;
          position: fixed;
          top: 64px;
          left: 0;
          bottom: 0;
          height: auto;
          z-index: 30;
        }
        .sd-st{padding:0 8px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center}
        .sd-st h2{margin:0;font-size:1.3rem;font-weight:800;color:var(--g8)}
        .sd-st small{font-size:.76rem;font-weight:700;color:#7a9488}
        .sd-nav{display:flex;flex-direction:column;gap:4px}
        .sd-nav button{display:flex;align-items:center;gap:12px;height:44px;padding:0 14px;border:0;border-radius:14px;background:transparent;color:#4b6558;font-size:.9rem;font-weight:700;text-align:left;transition:background .15s,color .15s}
        .sd-nav button:hover{background:var(--g0);color:var(--g7)}
        .sd-nav button.on{background:linear-gradient(135deg,var(--g5),var(--g7));color:#fff;font-weight:800;box-shadow:0 8px 18px rgba(5,150,105,.28)}
        .sd-so{display:flex;align-items:center;gap:12px;width:100%;height:44px;padding:0 14px;border:0;border-radius:14px;background:none;color:var(--red);font-size:.9rem;font-weight:800}
        .sd-so:hover{background:#fef2f2}

        .sd-main {
          flex: 1;
          min-width: 0;
          margin-left: 236px;
          padding: 30px 34px;
        }
        .sd-wrap{max-width:980px;margin:0 auto;width:100%}
        .sd-bd{position:fixed;inset:0;background:rgba(4,38,26,.5);backdrop-filter:blur(3px);z-index:90}

        .sd-wt{position:fixed;top:76px;left:50%;transform:translateX(-50%);z-index:9999;background:#fff;border:1px solid #b7ecd3;padding:9px 12px 9px 16px;border-radius:999px;display:flex;align-items:center;gap:10px;box-shadow:0 12px 30px rgba(5,150,105,.2);white-space:nowrap;font-size:.86rem;font-weight:800;color:var(--g7);animation:sd-up .4s both}
        .sd-wt i{width:22px;height:22px;border-radius:50%;background:var(--g6);color:#fff;display:flex;align-items:center;justify-content:center}
        .sd-wt button{background:none;border:0;color:#7a9488;display:flex;padding:2px}
        @keyframes sd-up{from{opacity:0;transform:translate(-50%,-8px)}to{opacity:1;transform:translate(-50%,0)}}
        .sd-toast{display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:16px;margin-bottom:18px;font-size:.88rem;font-weight:700;border:1px solid}
        .sd-toast.ok{background:var(--g0);color:var(--g7);border-color:#b7ecd3}.sd-toast.er{background:#fef2f2;color:#b91c1c;border-color:#fecaca}

        .sd-ph{display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:14px;margin-bottom:22px}
        .sd-badge{display:inline-flex;align-items:center;gap:6px;background:var(--g0);color:var(--g7);border:1px solid #b7ecd3;border-radius:999px;padding:5px 13px;font-size:.8rem;font-weight:800;margin-bottom:10px}
        .sd-ph h1{margin:0 0 4px;font-size:clamp(1.6rem,4vw,2.1rem);font-weight:800;letter-spacing:-.03em;color:var(--g8)}
        .sd-ph p{margin:0;font-size:.92rem;color:var(--mut);line-height:1.55}

        .sd-card{background:#fff;border:1px solid var(--line);border-radius:24px;box-shadow:0 8px 24px rgba(6,78,59,.06)}
        .sd-g4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px}
        .sd-g3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px}
        .sd-stat{background:#fff;border:1px solid var(--line);border-radius:20px;padding:16px 18px;display:flex;align-items:center;gap:14px;box-shadow:0 6px 18px rgba(6,78,59,.05)}
        .sd-stat small{display:block;font-size:.76rem;font-weight:700;color:#6f8b7d}
        .sd-stat b{display:block;font:800 1.9rem/1.15 'Bricolage Grotesque',sans-serif;margin-top:2px;color:var(--ink)}
        .sd-stat b.g{color:var(--g6)}.sd-stat b.r{color:var(--red)}
        .sd-si{width:46px;height:46px;border-radius:14px;background:var(--g0);color:var(--g7);display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .sd-si.r{background:#fef2f2;color:var(--red)}

        .sd-bar{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px}
        .sd-fs{display:flex;gap:8px;flex-wrap:wrap}
        .sd-f{height:38px;padding:0 15px;border-radius:999px;border:1px solid var(--line);background:#fff;color:#4b6558;font-size:.82rem;font-weight:800;display:inline-flex;align-items:center;gap:6px;text-transform:capitalize}
        .sd-f:hover{background:var(--g0)}
        .sd-f.on{background:linear-gradient(135deg,var(--g5),var(--g7));color:#fff;border-color:transparent;box-shadow:0 6px 14px rgba(5,150,105,.25)}
        .sd-sr{position:relative;width:260px;max-width:100%}
        .sd-sr svg{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#78a38c}
        .sd-sr input,.sd-in{width:100%;height:42px;padding:0 14px 0 40px;border-radius:999px;border:1.5px solid var(--line);font-size:.88rem;font-weight:600;font-family:inherit;color:var(--ink);background:#fff;outline:0;transition:border-color .2s,box-shadow .2s}
        .sd-in{padding:0 14px;border-radius:14px;height:46px;background:#fafdfb}
        .sd-sr input:focus,.sd-in:focus{border-color:var(--g5);box-shadow:0 0 0 4px rgba(16,185,129,.16)}

        .sd-tw{overflow-x:auto;background:#fff;border:1px solid var(--line);border-radius:22px;box-shadow:0 8px 24px rgba(6,78,59,.06)}
        .sd-tw table{width:100%;min-width:640px;border-collapse:collapse;text-align:left;font-size:.86rem}
        .sd-tw th{padding:14px;background:var(--g0);color:var(--g7);font-weight:800;font-size:.8rem;border-bottom:1px solid var(--line);white-space:nowrap}
        .sd-tw td{padding:14px;border-bottom:1px solid #edf6f0;color:#3f5a4b}
        .sd-tw tr:last-child td{border-bottom:0}
        .sd-tw tbody tr:hover{background:#f9fdfb}
        .sd-tw td b{display:block;color:var(--ink);font-weight:800}
        .sd-tw td small{display:inline-flex;align-items:center;gap:4px;color:var(--g6);font-weight:700;font-size:.76rem}
        .sd-pill{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:999px;font-size:.76rem;font-weight:800;background:var(--g1);color:var(--g7)}
        .sd-pill.no{background:#fee2e2;color:#b91c1c}.sd-pill.mu{background:#eef3f0;color:#6b8076}
        .sd-empty{text-align:center;padding:36px 16px;color:#7a9488;font-size:.9rem}

        .sd-idg{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:26px;align-items:start}
        .sd-idc{border-radius:34px;padding:24px 20px 22px;text-align:center;position:relative;overflow:hidden;width:100%;background:linear-gradient(180deg,#047857 0%,#10b981 36%,#a7f3d0 74%,#ffffff 96%);border:1.5px solid rgba(255,255,255,.5);box-shadow:0 18px 40px -6px rgba(5,100,70,.3)}
        .sd-idp{display:inline-block;background:#fff;color:#047857;font-size:.76rem;font-weight:800;letter-spacing:.1em;padding:5px 18px;border-radius:999px;margin-bottom:14px}
        .sd-idph{width:96px;height:116px;border-radius:26px;border:4px solid #fff;background:#fff;overflow:hidden;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 18px rgba(0,0,0,.15);cursor:pointer;color:#10b981}
        .sd-idph img{width:100%;height:100%;object-fit:cover}
        .sd-idc h2{margin:0 0 2px;font-size:1.35rem;font-weight:800;color:#064e3b}
        .sd-idl{font-size:.7rem;font-weight:800;color:#065f46;letter-spacing:.08em;margin-bottom:6px}
        .sd-ids{display:inline-block;background:#fff;color:#064e3b;padding:5px 22px;border-radius:999px;font-size:1.05rem;font-weight:800;letter-spacing:.03em;margin-bottom:16px}
        .sd-qr{background:#fff;border-radius:22px;padding:12px;max-width:190px;margin:0 auto 14px;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 24px rgba(0,0,0,.08)}
        .sd-qr img{width:100%;height:auto;display:block;border-radius:8px}
        .sd-lock{padding:16px 8px;color:#991b1b;background:#fef2f2;border-radius:14px;width:100%;font-size:.8rem}
        .sd-lock b{display:block;font-size:.84rem;margin-bottom:3px}
        .sd-idsc{font-size:.76rem;font-weight:800;color:#047857;letter-spacing:.08em;margin-bottom:10px}
        .sd-idf{border-top:1px solid rgba(6,78,59,.2);padding-top:10px;font-size:.7rem;font-weight:800;color:#3f5a4b;letter-spacing:.06em}
        .sd-info{display:flex;flex-direction:column;gap:14px}
        .sd-ic{display:flex;gap:14px;align-items:flex-start;padding:18px;border-radius:20px;border:1px solid var(--line);background:#fff}
        .sd-ic.gr{background:var(--g0);border-color:#b7ecd3}
        .sd-ic h4{margin:0 0 4px;font-size:.96rem;font-weight:800;color:var(--g8)}
        .sd-ic p,.sd-ic ul{margin:0;font-size:.86rem;color:var(--mut);line-height:1.6}
        .sd-ic ul{padding-left:18px;margin-top:4px}
        .sd-ib{width:42px;height:42px;border-radius:13px;background:linear-gradient(135deg,var(--g5),var(--g7));color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0}

        .sd-evl{display:flex;flex-direction:column;gap:18px}
        .sd-ev{background:#fff;border:1px solid var(--line);border-radius:26px;overflow:hidden;box-shadow:0 8px 24px rgba(6,78,59,.06);transition:transform .25s,box-shadow .25s,border-color .25s}
        .sd-ev:hover{transform:translateY(-4px);box-shadow:0 18px 38px rgba(5,150,105,.15);border-color:#86efac}
        .sd-evi{height:170px;background:linear-gradient(135deg,var(--g1),var(--g2));display:flex;align-items:center;justify-content:center;color:var(--g7);overflow:hidden}
        .sd-evi img{width:100%;height:100%;object-fit:cover}
        .sd-evb{padding:18px 20px}
        .sd-evt{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-size:.8rem;font-weight:700;color:#7a9488}
        .sd-evb h3{margin:0 0 6px;font-size:1.25rem;font-weight:800}
        .sd-loc{display:flex;align-items:center;gap:5px;font-size:.86rem;font-weight:700;color:var(--g6)}
        .sd-tm{font-size:.84rem;color:#456a58;font-weight:700;margin:8px 0 10px}
        .sd-evb p{margin:0;font-size:.88rem;color:var(--mut);line-height:1.6}
        .sd-cnt{display:flex;gap:6px;background:#fff;border:1px solid var(--line);border-radius:18px;padding:8px 10px;box-shadow:0 4px 12px rgba(6,78,59,.05)}
        .sd-cnt div{text-align:center;padding:2px 14px;border-right:1px solid #e8f3ec}.sd-cnt div:last-child{border-right:0}
        .sd-cnt small{display:block;font-size:.72rem;font-weight:700;color:#7a9488}
        .sd-cnt b{font:800 1.25rem 'Bricolage Grotesque',sans-serif}

        .sd-og{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:18px}
        .sd-of{background:#fff;border:1px solid var(--line);border-radius:26px;padding:24px 18px;text-align:center;display:flex;flex-direction:column;align-items:center;box-shadow:0 8px 24px rgba(6,78,59,.06);transition:transform .25s,box-shadow .25s,border-color .25s}
        .sd-of:hover{transform:translateY(-5px);box-shadow:0 18px 38px rgba(5,150,105,.16);border-color:#86efac}
        .sd-op{width:100px;height:100px;border-radius:50%;overflow:hidden;background:var(--g0);margin-bottom:14px;box-shadow:0 0 0 4px #fff,0 0 0 7px var(--g5);display:flex;align-items:center;justify-content:center;color:var(--g6)}
        .sd-op img{width:100%;height:100%;object-fit:cover}
        .sd-of h3{margin:8px 0 4px;font-size:1.15rem}.sd-of p{margin:0 0 10px;font-size:.86rem;color:var(--mut);font-weight:600}
        .sd-of small{width:100%;border-top:1px dashed #cfe9db;padding-top:10px;font-size:.78rem;color:#7a9488;font-weight:700}

        .sd-al{background:#fff1f2;border:1px solid #fecdd3;border-radius:22px;padding:18px 20px;margin-bottom:20px}
        .sd-al h4{display:flex;align-items:center;gap:8px;margin:0 0 6px;color:#be123c;font-size:.95rem;font-weight:800}
        .sd-al p{margin:0 0 12px;font-size:.86rem;color:#9f1239;line-height:1.55}
        .sd-al span{display:inline-block;background:#fff;border:1px solid #fecdd3;color:#be123c;border-radius:999px;padding:5px 14px;font-size:.78rem;font-weight:800;margin:0 8px 8px 0}
        .sd-sh{margin:0 0 12px;font-size:1rem;font-weight:800;color:var(--g8)}
        .sd-pn{padding:40px 20px;text-align:center}
        .sd-pi{width:70px;height:70px;border-radius:22px;background:linear-gradient(135deg,var(--g5),var(--g7));color:#fff;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;box-shadow:0 10px 22px rgba(5,150,105,.28)}
        .sd-pn h2{margin:10px 0 8px;font-size:1.5rem;color:var(--g8)}
        .sd-pn p{max-width:460px;margin:0 auto 12px;font-size:.92rem;color:var(--mut);line-height:1.6}

        .sd-nl{display:flex;flex-direction:column;gap:12px}
        .sd-n{display:flex;align-items:center;justify-content:space-between;gap:14px;background:#fff;border:1px solid var(--line);border-radius:22px;padding:16px 18px;transition:border-color .2s,box-shadow .2s}
        .sd-n:hover{border-color:#86efac;box-shadow:0 10px 24px rgba(5,150,105,.1)}
        .sd-n.dev{border-color:#b7ecd3;background:linear-gradient(180deg,#f6fdf9,#fff)}.sd-n.alert{border-color:#fecdd3;background:#fffafa}
        .sd-nl-l{display:flex;align-items:center;gap:14px;min-width:0;flex:1}
        .sd-ni{width:46px;height:46px;border-radius:15px;background:var(--g0);color:var(--g7);display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .sd-n.alert .sd-ni{background:#fee2e2;color:var(--red)}
        .sd-n h3{margin:0 0 3px;font-size:1rem;font-weight:800;line-height:1.3}.sd-n.alert h3{color:#be123c}
        .sd-n p{margin:0;font-size:.86rem;color:var(--mut);line-height:1.55}

        .sd-pf{text-align:center;margin-bottom:22px}
        .sd-pa{width:96px;height:96px;border-radius:50%;overflow:hidden;background:var(--g1);margin:0 auto 12px;box-shadow:0 0 0 4px #fff,0 0 0 7px var(--g5),0 12px 24px rgba(5,150,105,.25);display:flex;align-items:center;justify-content:center;color:var(--g6)}
        .sd-pa img{width:100%;height:100%;object-fit:cover}
        .sd-pf h1{margin:0 0 4px;font-size:1.7rem;font-weight:800;color:var(--g8)}.sd-pf p{margin:0;color:var(--g7);font-weight:800;font-size:.9rem}
        .sd-dc{padding:22px;margin-bottom:16px}
        .sd-dh{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;border-bottom:1px solid #e8f3ec;padding-bottom:14px;margin-bottom:6px}
        .sd-dh b{display:flex;align-items:center;gap:8px;color:var(--g8);font-size:.92rem}
        .sd-dr{display:flex;justify-content:space-between;align-items:center;gap:6px 14px;flex-wrap:wrap;padding:12px 0;border-bottom:1px dashed #e1efe6;font-size:.9rem}
        .sd-dr:last-child{border-bottom:0}.sd-dr span{color:var(--mut);font-weight:700}.sd-dr strong{color:var(--ink);font-weight:800;word-break:break-all}
        .sd-pw{padding:18px 20px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
        .sd-pw h4{margin:0 0 3px;font-size:.98rem;font-weight:800}.sd-pw p{margin:0;font-size:.82rem;color:var(--mut)}

        .sd-hero{text-align:center;margin-bottom:30px}
        .sd-hero h1{font-size:clamp(1.8rem,5vw,2.8rem);font-weight:800;letter-spacing:-.04em;line-height:1.1;margin:0 0 14px;color:var(--g8)}
        .sd-hero p{max-width:680px;margin:0 auto;color:var(--mut);line-height:1.65;font-size:.98rem}
        .sd-wh{display:flex;align-items:center;gap:14px;margin-bottom:14px}
        .sd-wh h2{margin:0;font-size:1.3rem;color:var(--g8)}.sd-wh small{font-size:.8rem;color:#7a9488;font-weight:600}
        .sd-wi{padding:24px;margin-bottom:34px}
        .sd-wi p{font-size:.92rem;color:#3f5a4b;line-height:1.7;margin:0 0 10px}.sd-wi p:last-child{margin:0}
        .sd-sec{text-align:center;margin-bottom:22px}.sd-sec h2{margin:0 0 6px;font-size:1.8rem;color:var(--g8)}.sd-sec p{margin:0;color:var(--mut);font-size:.92rem}
        .sd-ug{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px;margin-bottom:34px}
        .sd-uc{background:#fff;border:1px solid var(--line);border-radius:22px;padding:22px 20px 20px;position:relative;overflow:hidden;box-shadow:0 6px 18px rgba(6,78,59,.06)}
        .sd-uc::before{content:'';position:absolute;left:0;top:0;bottom:0;width:6px;background:var(--a)}
        .sd-ui{width:44px;height:44px;border-radius:14px;color:var(--a);background:color-mix(in srgb,var(--a) 13%,white);display:flex;align-items:center;justify-content:center;margin-bottom:12px}
        .sd-uc h3{margin:0 0 6px;font-size:1.05rem}.sd-uc p{margin:0;font-size:.86rem;color:var(--mut);line-height:1.6}
        .sd-dev{border-radius:30px;padding:30px 26px;color:#fff;position:relative;overflow:hidden;display:flex;flex-direction:column;gap:18px;background:radial-gradient(520px 260px at 0 0,rgba(52,211,153,.3),transparent 60%),linear-gradient(160deg,#075e45,#04261a);box-shadow:0 22px 46px rgba(6,78,59,.3)}
        .sd-dev>*{position:relative}
        .sd-dt{display:flex;align-items:center;gap:20px;flex-wrap:wrap}
        .sd-dp{width:104px;height:104px;border-radius:50%;overflow:hidden;background:#065f46;border:4px solid #fff;box-shadow:0 0 0 4px #34d399,0 12px 26px rgba(0,0,0,.4);flex-shrink:0}
        .sd-dp img{width:100%;height:100%;object-fit:cover;object-position:center 15%}
        .sd-dev small{color:#6ee7b7;font-weight:700;font-size:.86rem}
        .sd-dev h2{margin:2px 0 6px;font-size:clamp(1.7rem,4vw,2.1rem);letter-spacing:-.03em}
        .sd-dev p{margin:0;font-size:.9rem;color:#b4ecd0;font-weight:600;line-height:1.5}
        .sd-dbd{display:flex;flex-wrap:wrap;gap:8px}.sd-dbd span{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.26);color:#d9f7e8;padding:6px 14px;border-radius:999px;font-size:.8rem;font-weight:700}
        .sd-dev .bio{border-top:1px solid rgba(255,255,255,.18);padding-top:16px;font-size:.9rem;color:#d1fae5;line-height:1.7;font-weight:500}.sd-dev .bio strong{color:#fff}

        .sd-ov{position:fixed;inset:0;z-index:130;background:rgba(4,38,26,.55);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;animation:sd-f .25s both}
        @keyframes sd-f{from{opacity:0}to{opacity:1}}
        .sd-md{width:100%;max-width:400px;max-height:92vh;overflow-y:auto;background:#fff;border-radius:28px;padding:24px;box-shadow:0 30px 70px rgba(0,0,0,.35)}
        .sd-mh{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px}
        .sd-mh h3{margin:0;font-size:1.2rem;font-weight:800;color:var(--g8);display:flex;align-items:center;gap:10px}
        .sd-xb{width:36px;height:36px;border-radius:50%;border:1px solid var(--line);background:#fff;color:#6f8b7d;display:flex;align-items:center;justify-content:center}
        .sd-xb:hover{background:var(--g0)}
        .sd-ma{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px}
        .sd-q{text-align:center;color:#3f5a4b;font-size:.95rem;line-height:1.6;font-weight:600;margin:8px 0 22px}
        .sd-ml{display:block;font-size:.84rem;font-weight:700;color:#2f4d3e;margin-bottom:5px}
        .sd-fm{display:flex;flex-direction:column;gap:14px}
        .sd-note{background:var(--g0);border:1px solid #b7ecd3;border-radius:16px;padding:13px 15px;font-size:.84rem;color:#355a47;line-height:1.55;text-align:left;margin-bottom:14px}
        .sd-pm{font-size:.84rem;font-weight:700;padding:11px 14px;border-radius:14px;border:1px solid}
        .sd-pm.ok{color:var(--g7);background:var(--g0);border-color:#b7ecd3}.sd-pm.er{color:#b91c1c;background:#fef2f2;border-color:#fecaca}
        .touch-saveable-image{-webkit-touch-callout:default!important;-webkit-user-select:auto!important;user-select:auto!important;touch-action:manipulation!important;pointer-events:auto!important;cursor:pointer}

        @media(max-width:768px){
          .sd-menu{display:inline-flex}
          .sd-side{position:fixed;top:0;bottom:0;left:0;height:auto;width:260px;max-width:82vw;z-index:100;transform:translateX(-100%);transition:transform .28s cubic-bezier(.4,0,.2,1)}
          .sd-side.open{transform:none;box-shadow:8px 0 30px rgba(0,0,0,.2)}
          .sd-main{margin-left:0;padding:18px 14px}
          .sd-g4{grid-template-columns:repeat(2,1fr);gap:10px}
          .sd-g3{grid-template-columns:1fr}
          .sd-un b{max-width:90px}
        }
        @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
      `}</style>

      {/* TOP HEADER */}
      <header className="sd-hd">
        <div className="sd-hl">
          <button type="button" className="sd-menu" onClick={() => setIsSidebarOpen(!isSidebarOpen)} aria-label="Menu">
            <Ic d={isSidebarOpen ? 'x' : 'menu'} s={20} />
          </button>
          <div className="sd-brand">
            <div><b>CEC TRACK</b><span className="sd-chip">Student</span></div>
            <small>Student Access Portal</small>
          </div>
        </div>
        <div className="sd-user">
          <div className="sd-un">
            <b>{profile.full_name}</b>
            <span>{profile.school_id}</span>
          </div>
          <div className="sd-av">
            {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.full_name} /> : profile.full_name.charAt(0)}
          </div>
        </div>
      </header>

      {isSidebarOpen && <div className="sd-bd" onClick={() => setIsSidebarOpen(false)} />}

      {showWelcomeToast && (
        <div className="sd-wt" role="status">
          <i><Ic d="check" s={13} w={3} /></i>
          Welcome to the Student Portal!
          <button type="button" onClick={() => setShowWelcomeToast(false)} aria-label="Close"><Ic d="x" s={14} /></button>
        </div>
      )}

      <div className="sd-shell">
        {/* SIDEBAR NAVIGATION */}
        <aside className={`sd-side ${isSidebarOpen ? 'open' : ''}`}>
          <div>
            <div className="sd-st">
              <div>
                <h2>Portal</h2>
                <small>Student access</small>
              </div>
              {isSidebarOpen && (
                <button type="button" className="sd-xb" onClick={() => setIsSidebarOpen(false)} aria-label="Close menu"><Ic d="x" s={16} /></button>
              )}
            </div>
            <nav className="sd-nav">
              {NAV.map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  className={activeTab === tab.id ? 'on' : ''}
                  onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); }}
                >
                  <Ic d={tab.icon} s={19} /> <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
          <div style={{ paddingTop: 16 }}>
            <button type="button" className="sd-so" onClick={() => setIsLogoutModalOpen(true)}>
              <Ic d="out" s={19} /> <span>Sign out</span>
            </button>
          </div>
        </aside>

        {/* MAIN BODY VIEWPORT */}
        <main className="sd-main">
          {notification.message && (
            <div className={`sd-toast ${notification.type === 'error' ? 'er' : 'ok'}`} role="status">
              <Ic d={notification.type === 'error' ? 'alert' : 'check'} s={18} /> {notification.message}
            </div>
          )}

          {/* TAB 1: MY ID */}
          {activeTab === 'my-id' && (
            <div className="sd-wrap">
              <PageHead
                icon="idcard"
                badge="Digital ID"
                title="My digital ID"
                sub="Your official scannable organization credentials."
                right={profile.avatar_url && (
                  <button type="button" className="sd-b pri" onClick={handleDownloadIdCard} disabled={downloadingId}>
                    <Ic d="dl" s={17} /> {downloadingId ? 'Generating...' : 'Download official ID'}
                  </button>
                )}
              />

              <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" style={{ display: 'none' }} />

              <div className="sd-idg">
                <div style={{ maxWidth: 340, margin: '0 auto', width: '100%' }}>
                  <div ref={idCardRef} className="sd-idc">
                    <span className="sd-idp">● CEC-TRACK</span>

                    <div className="sd-idph" onClick={() => fileInputRef.current?.click()}>
                      {profile.avatar_url ? <img src={profile.avatar_url} alt="Profile" /> : <Ic d="user" s={44} w={1.8} />}
                    </div>

                    <h2>{profile.full_name}</h2>
                    <div className="sd-idl">STUDENT ID</div>
                    <div className="sd-ids">{profile.school_id}</div>

                    <div className="sd-qr">
                      {profile.avatar_url ? (
                        <img src={qrCodeUrl} crossOrigin="anonymous" alt="Student QR Code" style={{ imageRendering: 'pixelated' }} />
                      ) : (
                        <div className="sd-lock">
                          <b>QR code locked</b>
                          Upload your photo to generate your Attendance QR Code.
                        </div>
                      )}
                    </div>

                    <div className="sd-idsc">SCAN FOR ATTENDANCE</div>
                    <div className="sd-idf">CATEEL EXTENSION CAMPUS</div>
                  </div>

                  <div style={{ textAlign: 'center', marginTop: 12 }}>
                    <button type="button" className="sd-b out sm" onClick={() => fileInputRef.current?.click()}>
                      <Ic d="cam" s={15} /> {uploadingPhoto ? 'Uploading...' : 'Tap to change photo'}
                    </button>
                  </div>
                </div>

                <div className="sd-info">
                  <div className="sd-ic gr">
                    <span className="sd-ib"><Ic d="cloud" s={21} /></span>
                    <div>
                      <h4>Universal device cloud sync</h4>
                      <p>Your uploaded ID picture is saved directly to your account. Open your account on your laptop or phone anytime and your picture is immediately updated.</p>
                    </div>
                  </div>
                  <div className="sd-ic">
                    <span className="sd-ib"><Ic d="shield" s={21} /></span>
                    <div>
                      <h4>Official usage policy</h4>
                      <ul>
                        <li>Present this QR code for attendance monitoring at all official assemblies.</li>
                        <li>This code is non-transferable. Presenting another student&apos;s code is prohibited.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="sd-wrap">
              <PageHead
                icon="hist"
                badge="Official attendance history"
                title="My attendance record"
                sub="Track your attendance participation and status."
                right={<RefreshBtn label="Refresh records" />}
              />

              <div className="sd-g4">
                <Stat label="Total events" value={totalEventsCount} />
                <Stat label="Total present" value={totalPresentCount} tone="g" />
                <Stat label="Absences" value={totalAbsencesCount} tone={totalAbsencesCount > 0 ? 'r' : 'g'} />
                <Stat label="Compliance rate" value={`${complianceRate}%`} tone="g" />
              </div>

              <div className="sd-bar">
                <div className="sd-fs">
                  {['all', 'present', 'absent'].map((filterKey) => (
                    <button type="button" key={filterKey} className={`sd-f ${attendanceFilter === filterKey ? 'on' : ''}`} onClick={() => setAttendanceFilter(filterKey)}>
                      {filterKey === 'all' && `All (${attendanceLogs.length})`}
                      {filterKey === 'present' && <><Ic d="check" s={14} w={3} /> Present ({totalPresentCount})</>}
                      {filterKey === 'absent' && <><Ic d="x" s={14} w={3} /> Absent ({totalAbsencesCount})</>}
                    </button>
                  ))}
                </div>
                <div className="sd-sr">
                  <Ic d="search" s={16} />
                  <input type="text" placeholder="Search event..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
              </div>

              <div className="sd-tw">
                <table>
                  <thead>
                    <tr>
                      <th>Event &amp; location</th><th>Date</th><th>Time in</th><th>Time out</th><th>Event status</th><th style={{ textAlign: 'center' }}>Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.length === 0 ? (
                      <tr><td colSpan={6} className="sd-empty">No attendance records found.</td></tr>
                    ) : (
                      filteredLogs.map((log) => {
                        const isPresent = log.status === 'PRESENT';
                        return (
                          <tr key={log.id}>
                            <td><b>{log.title}</b><small><Ic d="pin" s={12} /> {log.location}</small></td>
                            <td>{log.date}</td>
                            <td style={{ fontWeight: 800, color: isPresent ? '#047857' : '#9db2a8' }}>{log.time_in}</td>
                            <td style={{ fontWeight: 800, color: log.time_out !== '--:--' ? '#047857' : '#9db2a8' }}>{log.time_out}</td>
                            <td style={{ fontSize: '.78rem', fontWeight: 700 }}>{log.event_status}</td>
                            <td style={{ textAlign: 'center' }}>
                              <span className={`sd-pill ${isPresent ? '' : 'no'}`}>
                                <Ic d={isPresent ? 'check' : 'x'} s={13} w={3} /> {isPresent ? 'Present' : 'Absent'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: EVENTS */}
          {activeTab === 'events' && (
            <div className="sd-wrap">
              <PageHead
                icon="cal"
                badge="Official organization activities"
                title="Organization events"
                sub="Explore upcoming assemblies, past workshops, seminars, and official activities."
                right={
                  <div className="sd-cnt">
                    <div><small>Total</small><b>{totalOrgEvents}</b></div>
                    <div><small>Active</small><b style={{ color: '#059669' }}>{activeOrgEvents}</b></div>
                    <div><small>Inactive</small><b style={{ color: '#6b8076' }}>{inactiveOrgEvents}</b></div>
                  </div>
                }
              />

              <div className="sd-bar">
                <div className="sd-fs">
                  <button type="button" className={`sd-f ${eventTabFilter === 'all' ? 'on' : ''}`} onClick={() => setEventTabFilter('all')}>All events ({totalOrgEvents})</button>
                  <button type="button" className={`sd-f ${eventTabFilter === 'active' ? 'on' : ''}`} onClick={() => setEventTabFilter('active')}>● Active ({activeOrgEvents})</button>
                  <button type="button" className={`sd-f ${eventTabFilter === 'inactive' ? 'on' : ''}`} onClick={() => setEventTabFilter('inactive')}>○ Inactive ({inactiveOrgEvents})</button>
                </div>
                <div className="sd-sr">
                  <Ic d="search" s={16} />
                  <input type="text" placeholder="Search by title or location..." value={eventTabSearch} onChange={(e) => setEventTabSearch(e.target.value)} />
                </div>
              </div>

              <div className="sd-evl">
                {filteredOrgEvents.length === 0 ? (
                  <div className="sd-card sd-empty">No events found matching your filter criteria.</div>
                ) : (
                  filteredOrgEvents.map((ev) => {
                    const isActive = ev.status === 'active';
                    return (
                      <div key={ev.id} className="sd-ev">
                        <div className="sd-evi">
                          {ev.image_url ? <img src={ev.image_url} alt={ev.title} /> : <Ic d="img" s={46} w={1.5} />}
                        </div>
                        <div className="sd-evb">
                          <div className="sd-evt">
                            <span className={`sd-pill ${isActive ? '' : 'mu'}`}>{isActive ? '● Active (open)' : 'Closed'}</span>
                            <span>{ev.date}</span>
                          </div>
                          <h3>{ev.title}</h3>
                          <div className="sd-loc"><Ic d="pin" s={15} /> {ev.location || 'FaCET Facade'}</div>
                          <div className="sd-tm">In: {formatTime12Hour(ev.time_in)} • Out: {formatTime12Hour(ev.time_out)}</div>
                          <p>{ev.description || 'Official general assembly and campus-wide attendance tracking.'}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 4: OFFICERS */}
          {activeTab === 'officers' && (
            <div className="sd-wrap">
              <PageHead icon="award" badge="Student leadership roster" title="Organization officers" sub="Meet the official campus and department student leaders." />

              {officersList.length === 0 ? (
                <div className="sd-card sd-pn">
                  <span className="sd-pi"><Ic d="award" s={30} /></span>
                  <h2>Officers roster coming soon</h2>
                  <p>No officers published yet by the administration.</p>
                </div>
              ) : (
                <div className="sd-og">
                  {officersList.map((off) => (
                    <div key={off.id} className="sd-of">
                      <div className="sd-op">{off.avatar_url ? <img src={off.avatar_url} alt={off.name} /> : <Ic d="user" s={42} w={1.6} />}</div>
                      <span className="sd-pill">{off.position}</span>
                      <h3>{off.name}</h3>
                      <p>{off.department}</p>
                      <small>Term: {off.term || '2026 - 2027'}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SANCTIONS */}
          {activeTab === 'sanctions' && (
            <div className="sd-wrap">
              <PageHead
                icon="shieldx"
                badge="Compliance"
                title="My attendance & sanctions"
                sub="Monitor your event attendance compliance, absences, and assigned disciplinary duties."
                right={<RefreshBtn label="Refresh" />}
              />

              <div className="sd-g3">
                <Stat icon="cal" label="Total events" value={totalEventsCount} />
                <Stat icon="ucheck" label="Events attended" value={totalPresentCount} tone="g" />
                <Stat icon="alert" label="Total absences" value={totalAbsencesCount} tone={totalAbsencesCount > 0 ? 'r' : 'g'} />
              </div>

              {totalAbsencesCount > 0 && (
                <div className="sd-al">
                  <h4><Ic d="alert" s={18} /> Attendance alert ({totalAbsencesCount} event absences)</h4>
                  <p>You were recorded absent from the following mandatory event(s). Please review your assigned sanction duties below.</p>
                  <div>{absentEventsList.map((item) => (<span key={item.id}>{item.title}</span>))}</div>
                </div>
              )}

              <h3 className="sd-sh">Official sanctions &amp; penalties ({totalAbsencesCount})</h3>

              <div className="sd-card sd-pn">
                <span className="sd-pi"><Ic d="clock" s={30} /></span>
                <span className="sd-pill">Policy notice</span>
                <h2>{totalAbsencesCount === 0 ? 'No active sanctions' : 'Sanctions will be coming soon'}</h2>
                <p>
                  {totalAbsencesCount === 0
                    ? 'You currently have 0 recorded absences. You are in full compliance with all institutional assemblies and activities.'
                    : `You currently have ${totalAbsencesCount} recorded absences. The specific requirements and community duties will be announced soon.`}
                </p>
                <p style={{ fontSize: '.8rem', color: '#7a9488' }}>Please stay updated with your organizational officers for upcoming guidelines.</p>
              </div>
            </div>
          )}

          {/* TAB 6: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="sd-wrap" style={{ maxWidth: 820 }}>
              <PageHead
                icon="bell"
                badge="Official alerts & updates"
                title="Notifications"
                sub="Stay informed on attendance check-ins, assembly call-times, and campus announcements."
                right={<span className="sd-pill">{allNotificationsList.length} total alerts</span>}
              />

              <div className="sd-nl">
                {allNotificationsList.map((notif) => (
                  <div key={notif.id} className={`sd-n ${notif.isDev ? 'dev' : notif.type === 'alert' ? 'alert' : ''}`}>
                    <div className="sd-nl-l">
                      <span className="sd-ni"><Ic d={notif.isDev ? 'code' : notif.type === 'alert' ? 'alert' : 'check'} s={21} /></span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h3>{notif.title}</h3>
                        <p>{notif.message}</p>
                      </div>
                    </div>
                    <span className="sd-pill" style={{ flexShrink: 0 }}>{notif.sender || 'System'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: PROFILE */}
          {activeTab === 'profile' && (
            <div className="sd-wrap" style={{ maxWidth: 640 }}>
              <div className="sd-pf">
                <div className="sd-pa">{profile.avatar_url ? <img src={profile.avatar_url} alt="Profile" /> : <Ic d="user" s={44} w={1.7} />}</div>
                <h1>{profile.full_name}</h1>
                <p>{profile.course} • {profile.section} • {profile.year_level}</p>
              </div>

              <div className="sd-card sd-dc">
                <div className="sd-dh">
                  <b><Ic d="shield" s={19} /> Verified student details</b>
                  <span className="sd-pill"><Ic d="shield" s={13} /> Official record</span>
                </div>
                <div className="sd-dr"><span>Full name</span><strong>{profile.full_name}</strong></div>
                <div className="sd-dr"><span>Student ID</span><strong style={{ color: '#047857' }}>{profile.school_id}</strong></div>
                <div className="sd-dr"><span>Email address</span><strong>{profile.email}</strong></div>
                <div className="sd-dr"><span>Student</span><span className="sd-pill">Student</span></div>
                <div className="sd-dr"><span>Course &amp; section</span><strong>{profile.course} - {profile.section}</strong></div>
              </div>

              <div className="sd-card sd-pw">
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h4>Portal account password</h4>
                  <p>Keep your account secure by maintaining a strong, confidential password.</p>
                </div>
                <button type="button" className="sd-b out" onClick={() => setIsChangePasswordOpen(true)}><Ic d="lock" s={16} /> Change password</button>
              </div>
            </div>
          )}

          {/* TAB 8: ABOUT */}
          {activeTab === 'about' && (
            <div className="sd-wrap">
              <section className="sd-hero">
                <span className="sd-badge"><Ic d="info" s={15} /> About CECTRACK</span>
                <h1>Transforming student <br />organization operations</h1>
                <p>
                  CECTRACK is an all-in-one digital ecosystem engineered specifically for the students, officers, and faculty of <strong>Davao Oriental State University – Cateel Extension Campus (DOrSU-CEC)</strong>.
                </p>
              </section>

              <section className="sd-card sd-wi">
                <div className="sd-wh">
                  <span className="sd-ib" style={{ width: 48, height: 48, borderRadius: 15 }}><Ic d="doc" s={22} /></span>
                  <div>
                    <h2>What is CECTRACK?</h2>
                    <small>Institutional governance and activity operating platform</small>
                  </div>
                </div>
                <p><strong>CECTRACK</strong> is a purpose-built web and mobile platform designed to modernize campus administration. It eliminates slow paper sign-in sheets, misplaced tally forms, and disorganized spreadsheets by providing automated, tamper-proof digital attendance and student tracking.</p>
                <p>Equipped with camera QR scanners, live duplicate check-in prevention, and instant student profile verification, CECTRACK ensures total transparency, accuracy, and operational ease for both student leaders and faculty advisers.</p>
              </section>

              <section>
                <div className="sd-sec">
                  <h2>Who uses CECTRACK?</h2>
                  <p>Tailored workspaces engineered for every member of the academic community.</p>
                </div>
                <div className="sd-ug">
                  {USERS.map((u) => (
                    <div key={u.t} className="sd-uc" style={{ '--a': u.c }}>
                      <div className="sd-ui"><Ic d={u.i} s={22} /></div>
                      <h3>{u.t}</h3>
                      <p>{u.d}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="sd-dev">
                <div className="sd-dt">
                  <div className="sd-dp">
                    <img src="/beloy.jpg" alt="Renowee Beloy" onError={(e) => { e.currentTarget.src = 'https://github.com/renoweebeloy.png'; }} />
                  </div>
                  <div>
                    <small>Developed by</small>
                    <h2>Renowee Beloy</h2>
                    <p>Lead Creator • BS Information Technology (BSIT)<br />Faculty of Computing, Engineering, and Technology (FaCET)</p>
                  </div>
                </div>
                <div className="sd-dbd">
                  <span>Developer</span>
                  <span>💻 Full-Stack Web &amp; Database Systems</span>
                  <span>📍 Davao Oriental State University Main Campus</span>
                </div>
                <p className="bio">
                  CECTRACK was conceptualized and developed by <strong>Renowee Beloy</strong> from the <strong>Faculty of Computing, Engineering, and Technology (FaCET)</strong> as a specialized institutional software initiative for Davao Oriental State University. Engineered to resolve manual attendance bottlenecks, it replaces tedious paper logs with reliable digital identification, camera-based QR scanning, and automated attendance reporting.
                </p>
              </section>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: MESSENGER IN-APP BROWSER ID PREVIEW */}
      {idModalData.isOpen && (
        <div className="sd-ov" style={{ zIndex: 140 }}>
          <div className="sd-md">
            <div className="sd-mh">
              <h3><Ic d="phone" s={20} /> Save your ID image</h3>
              <button type="button" className="sd-xb" onClick={closeIdModal} aria-label="Close"><Ic d="x" s={16} /></button>
            </div>

            <div className="sd-note">
              <strong>Messenger browser notice:</strong> direct file downloads are restricted inside the Messenger app.
              <br /><br />
              <strong>Method 1:</strong> Press and hold (<strong>long-press</strong>) the card image below, then tap <strong>&quot;Save Image&quot;</strong> or <strong>&quot;Download Image&quot;</strong>.
              <br />
              <strong>Method 2:</strong> Tap <strong>&quot;Open in Chrome / Browser&quot;</strong> below to download the PNG file automatically.
            </div>

            <div style={{ marginBottom: 14, borderRadius: 18, overflow: 'hidden', boxShadow: '0 8px 20px rgba(0,0,0,.1)' }}>
              <a href={idModalData.url} download={idModalData.fileName} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                <img src={idModalData.url} alt="My Official ID" className="touch-saveable-image" style={{ width: '100%', height: 'auto', display: 'block' }} />
              </a>
            </div>

            <div className="sd-fm" style={{ gap: 8 }}>
              <button type="button" className="sd-b pri full" onClick={handleOpenInSystemBrowser}><Ic d="globe" s={17} /> Open in Chrome / Browser</button>
              <button type="button" className="sd-b out full" onClick={handleModalShare}><Ic d="dl" s={17} /> Save to device photos</button>
              <button type="button" className="sd-b neu full" onClick={closeIdModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* SIGN OUT CONFIRMATION MODAL */}
      {isLogoutModalOpen && (
        <div className="sd-ov">
          <div className="sd-md" role="dialog" aria-modal="true" aria-label="Sign out">
            <div className="sd-mh">
              <h3>Sign out</h3>
              <button type="button" className="sd-xb" onClick={() => setIsLogoutModalOpen(false)} aria-label="Close"><Ic d="x" s={16} /></button>
            </div>
            <p className="sd-q">Are you sure you want to log out of the Student Portal?</p>
            <div className="sd-ma">
              <button type="button" className="sd-b neu" onClick={() => setIsLogoutModalOpen(false)}>Cancel</button>
              <button type="button" className="sd-b dsol" onClick={handleConfirmSignOut}><Ic d="out" s={17} /> Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {isChangePasswordOpen && (
        <div className="sd-ov" style={{ zIndex: 120 }}>
          <div className="sd-md" role="dialog" aria-modal="true" aria-label="Change password">
            <div className="sd-mh">
              <h3><span className="sd-ib"><Ic d="lock" s={19} /></span> Change password</h3>
              <button type="button" className="sd-xb" onClick={() => setIsChangePasswordOpen(false)} aria-label="Close"><Ic d="x" s={16} /></button>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: '.88rem', color: 'var(--mut)', lineHeight: 1.5 }}>Create a new secure password for your portal account.</p>

            <form className="sd-fm" onSubmit={handleChangePassword}>
              <div>
                <label className="sd-ml">New password</label>
                <input className="sd-in" type="password" placeholder="At least 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              </div>
              <div>
                <label className="sd-ml">Confirm new password</label>
                <input className="sd-in" type="password" placeholder="Re-enter new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>

              {passwordMsg.text && <div className={`sd-pm ${passwordMsg.type === 'error' ? 'er' : 'ok'}`}>{passwordMsg.text}</div>}

              <div className="sd-ma">
                <button type="button" className="sd-b neu" onClick={() => setIsChangePasswordOpen(false)}>Cancel</button>
                <button type="submit" className="sd-b pri" disabled={passwordLoading}>{passwordLoading ? 'Saving...' : 'Save password'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
