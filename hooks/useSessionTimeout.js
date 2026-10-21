import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

const FIVE_MINUTES_MS = 5 * 60 * 1000; // 5 minutos (300,000 milliseconds)

export function useSessionTimeout() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Pagsusi kon na-expire na ba ang session
    const checkTimeout = async () => {
      const lastActive = localStorage.getItem('cec_last_active_time');
      const now = Date.now();

      if (lastActive) {
        const timeElapsed = now - parseInt(lastActive, 10);

        if (timeElapsed > FIVE_MINUTES_MS) {
          // Milapas na og 5 minutos: I-clear ang credentials ug i-logout
          sessionStorage.clear();
          localStorage.removeItem('cec_last_active_time');

          if (supabase) {
            try {
              await supabase.auth.signOut();
            } catch (e) {}
          }

          alert('Your session has expired due to 5 minutes of inactivity or browser closure. Please log in again.');
          router.replace('/login');
          return;
        }
      }

      // Kon balido pa o bag-ong lihok, i-update ang oras
      localStorage.setItem('cec_last_active_time', now.toString());
    };

    // Susiha dayon sa pag-load sa panid
    checkTimeout();

    // 2. I-update ang timestamp matag lihok sa mouse, pindot sa keyboard, o scroll
    const resetTimer = () => {
      localStorage.setItem('cec_last_active_time', Date.now().toString());
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('scroll', resetTimer);
    window.addEventListener('touchstart', resetTimer);

    // 3. Magdagan og background check matag 10 segundos
    const intervalCheck = setInterval(() => {
      checkTimeout();
    }, 10000);

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('scroll', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      clearInterval(intervalCheck);
    };
  }, [router]);
}
