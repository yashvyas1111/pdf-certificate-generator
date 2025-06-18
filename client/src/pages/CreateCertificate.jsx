import React from 'react';
import CertificateForm from '../components/CertificateForm';
import { logout } from '../utils/auth';
import logo from '../assets/Logo.png';

const CertificatePage = () => {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start
                 bg-gradient-to-br from-yellow-100 via-white to-yellow-200
                 p-4 sm:p-10"
      style={{ backgroundAttachment: 'fixed' }}
    >
        {/* Header with logo left, title center, logout right */}
    <div className="w-full max-w-5xl flex items-center justify-between mb-8">
      {/* Left: Logo */}
      <img
        src={logo}
        alt="Logo"
        className="h-12 sm:h-48 w-auto"
      />

  {/* Center: Title */}
  <h1 className="text-xl sm:text-4xl font-bold font-serif text-blue-900 drop-shadow-md text-center flex-grow">
    Shree Jalaram Pallets
  </h1>

  {/* Right: Logout Button */}
  <button
  onClick={logout}
  className="px-3 py-1 sm:px-4 sm:py-2 text-white rounded-md shadow-md text-sm sm:text-base"
  style={{
    backgroundColor: '#dc2626',
    transition: 'background-color 0.2s ease'
  }}
  onMouseEnter={(e) => e.target.style.backgroundColor = '#b91c1c'}
  onMouseLeave={(e) => e.target.style.backgroundColor = '#dc2626'}
>
  Logout
</button>
</div>

      <div
        className="w-full max-w-5xl bg-blue-900 bg-opacity-90 backdrop-blur-md rounded-3xl shadow-xl p-6 sm:p-10"
      >
        <CertificateForm />
      </div>
    </div>
  );
};

export default CertificatePage;
