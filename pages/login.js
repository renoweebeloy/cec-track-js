import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
    } else {
      router.push('/dashboard');
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setMessage("Palihug ibutang ang imong Gmail sa ibabaw aron ma-send ang reset link.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://imong-website.vercel.app/reset-password',
    });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Na-send na ang reset link sa imong email!");
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        
        {/* Header Section */}
        <div className={styles.loginHeader}>
          <h1 className={styles.loginTitle}>
            Welcome to <br />
            <span className={styles.loginTitleHighlight}>CECTRACK</span>
          </h1>
          <p className={styles.loginSubtitle}>
            Enter your CECTRACK credentials to login.
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleLogin} className={styles.loginForm}>
          
          {/* Email Input */}
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Email
            </label>
            <div className={styles.inputWrapper}>
              <div className={styles.inputIconLeft}>
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
              </div>
              <input 
                type="email" 
                placeholder="juandelacruz@gmail.com" 
                className={styles.loginInput}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Password
            </label>
            <div className={styles.inputWrapper}>
              <div className={styles.inputIconLeft}>
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.078 2.027-.231 3.023m-1.64 3.322c.28.326.549.664.805 1.016m-1.037-1.016a14.04 14.04 0 001.037 1.016m-1.037-1.016A14.013 14.013 0 0016 11"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </div>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                className={styles.loginInput}
                style={{ paddingRight: '2.5rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className={styles.passwordToggle}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className={styles.forgotPasswordWrapper}>
            <button 
              type="button"
              onClick={handleForgotPassword} 
              className={styles.forgotPasswordBtn}>
              Forgot Password?
            </button>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className={styles.submitBtn}>
            Log In
          </button>
        </form>

        {/* Message Alert */}
        {message && (
          <div className={styles.alertMessage}>
            {message}
          </div>
        )}

        {/* Back to Home Link */}
        <div className={styles.backLinkWrapper}>
          <Link href="/" className={styles.backLink}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.backIcon}>
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back to Home
          </Link>
        </div>
        
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  return {
    props: {},
  };
}
