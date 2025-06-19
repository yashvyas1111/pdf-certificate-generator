import React, { useState } from 'react';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5004'}/api/auth/login`,
        { email, password }
      );

      if (res.data.success) {
        setMessage('Login successful');
        localStorage.setItem('user', JSON.stringify(res.data.user));
        window.location.href = '/'; // redirect to homepage
      } else {
        setMessage('Login failed');
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Server error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-200 via-white to-indigo-300 p-6">
      
      {/* Company name */}
      <h1 className="mb-12 text-2xl font-extrabold text-yellow-900 drop-shadow-lg font-serif select-none">
        Shree Jalaram Pallets
      </h1>

      <form
        onSubmit={handleLogin}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl p-10 sm:p-12 border border-indigo-400"
      >
        <h2 className="text-2xl font-semibold text-yellow-900 mb-8 text-center tracking-wide">
          Login with Email
        </h2>

        <input
          type="email"
          placeholder="Enter your email"
          className="w-full p-4 mb-6 rounded-xl border border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition duration-300"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />

        <input
          type="password"
          placeholder="Enter your password"
          className="w-full p-4 mb-6 rounded-xl border border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition duration-300"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-900 text-white font-semibold py-3 rounded-xl shadow-lg transition duration-300"
        >
          Login
        </button>

        {message && (
          <p
            className={`mt-6 text-center text-sm ${
              message.toLowerCase().includes('success') ? 'text-green-600' : 'text-red-600'
            } font-medium select-none`}
          >
            {message}
          </p>
        )}
      </form>

      {/* Footer */}
      <p className="mt-12 text-yellow-800 italic select-none text-sm">
        Powered by Shree Jalaram Pallets &copy; {new Date().getFullYear()}
      </p>
    </div>
  );
};

export default Login;
