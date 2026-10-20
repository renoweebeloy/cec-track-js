import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
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
      setMessage("Palihug ibutang ang imong Gmail aron ma-send ang reset link.");
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white rounded shadow-md w-96">
        {/* Ibutang ang imong Custom Logo dinhi */}
        <h1 className="text-2xl font-bold text-center text-orange-600 mb-6">System Login</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email" 
            placeholder="e.g. juandelacruz@gmail.com" 
            className="w-full p-3 border rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full p-3 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="w-full p-3 text-white bg-orange-600 rounded hover:bg-orange-700">
            Log In
          </button>
        </form>

        <button 
          onClick={handleForgotPassword} 
          className="w-full mt-4 text-sm text-blue-500 hover:underline">
          Forgot Password?
        </button>
        
        {message && <p className="mt-4 text-sm text-center text-red-500">{message}</p>}
      </div>
    </div>
  );
}
