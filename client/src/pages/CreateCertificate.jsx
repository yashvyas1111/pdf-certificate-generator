import React from 'react';
import CertificateForm from '../components/CertificateForm';
import { logout } from '../utils/auth';  // adjust path if needed


const CertificatePage = () => {
  return (
    <div
      className="min-h-screen  flex flex-col items-center justify-start
                 bg-gradient-to-br from-yellow-100 via-white to-yellow-200
                 p-4 sm:p-10"
      style={{ backgroundAttachment: 'fixed' }}
    >
      <h1 className="text-4xl font-bold font-serif text-blue-900 mb-8 drop-shadow-md text-center">
        Shree Jalaram Pallets 
      </h1>


      {/* Logout button container */}
      <div className="w-full max-w-5xl mb-4 flex justify-end">
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md shadow-md"
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
