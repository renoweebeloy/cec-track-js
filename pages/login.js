import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';
import Link from 'next/link';

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#fafafa] font-sans">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-sm">
        
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">
            Welcome to <br />
            <span className="text-green-700">CECTRACK</span>
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Enter your CECTRACK credentials to login.
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleLogin} className="space-y-5">
          
          {/* Email Input */}
          <div>
            <label className="block mb-1 text-xs font-bold text-gray-500 uppercase tracking-wider">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                {/* Envelope Icon */}
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
              </div>
              <input 
                type="email" 
                placeholder="juandelacruz@gmail.com" 
                className="w-full py-3 pl-10 pr-3 text-sm bg-blue-50 border border-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block mb-1 text-xs font-bold text-gray-500 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                {/* Lock Icon */}
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.078 2.027-.231 3.023m-1.64 3.322c.28.326.549.664.805 1.016m-1.037-1.016a14.04 14.04 0 001.037 1.016m-1.037-1.016A14.013 14.013 0 0016 11"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </div>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                className="w-full py-3 pl-10 pr-10 text-sm bg-blue-50 border border-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {/* Show/Hide Password Toggle */}
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="flex justify-end">
            <button 
              type="button"
              onClick={handleForgotPassword} 
              className="text-xs font-semibold text-green-700 hover:underline">
              Forgot Password?
            </button>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="w-full py-3 mt-4 text-sm font-bold text-white bg-green-700 rounded-lg shadow-md hover:bg-green-800 transition-colors">
            Log In
          </button>
        </form>

        {/* Message Alert */}
        {message && (
          <div className="mt-4 p-3 text-sm text-center text-red-600 bg-red-50 border border-red-100 rounded">
            {message}
          </div>
        )}

        {/* Back to Home Link */}
        <div className="mt-8">
          <Link href="/" className="flex items-center text-sm font-semibold text-gray-500 hover:text-gray-800">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
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
