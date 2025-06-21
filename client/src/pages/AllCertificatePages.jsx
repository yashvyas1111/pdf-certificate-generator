import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getAllCertificates,
  deleteCertificate,
  updateCertificate,
  sendCertificateEmail,
  searchCertificates,
} from '../api/certificateApi';
import { Search } from 'lucide-react';
import { logout } from '../utils/auth';  // adjust path if needed
import { BASE_URL } from '../api/axios';




const AllCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);   // <‑‑ add this

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [emailToSend, setEmailToSend] = useState('');
  const [searchTerm, setSearchTerm] = useState('');


  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const data = await getAllCertificates();
    if (Array.isArray(data)) {
       setCertificates(data);
    } else {
  console.error('Expected an array but got:', data);
  setCertificates([]); // fallback to empty array
}
    } catch (err) {
      console.error('Error fetching certificates:', err);
      setError('Failed to load certificates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      if (searchTerm.trim()) {
        searchCertificates(searchTerm).then(setCertificates).catch(err => {
          console.error('Search error:', err);
          setError('Failed to search certificates.');
        });
      } else {
        fetchCertificates();
      }
    }, 400); // debounce 400ms
  
    return () => clearTimeout(delay);
  }, [searchTerm]);
  

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this certificate?')) return;

    try {
      await deleteCertificate(id);
      setCertificates(prev => prev.filter(cert => cert._id !== id));
      alert('Certificate deleted successfully!');
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete certificate');
    }
  };

  const openEmailModal = (certificate) => {
    setSelectedCertificate(certificate);
    setEmailToSend('');
    setIsEmailModalOpen(true);
  };

  const closeEmailModal = () => {
    setIsEmailModalOpen(false);
    setSelectedCertificate(null);
    setEmailToSend('');
  };

 const handleSendEmail = async () => {
  if (!emailToSend) {
    alert('Please enter an email address');
    return;
  }

  setIsSending(true);                 // <‑‑ start spinner / disable buttons
  try {
    await sendCertificateEmail(selectedCertificate._id, emailToSend,true);
    alert(`Email sent to ${emailToSend}`);
    closeEmailModal();
  } catch (err) {
    console.error('Send email error:', err);
    alert('Failed to send email. Try again.');
  } finally {
    setIsSending(false);              // <‑‑ re‑enable UI
  }
};


const handleViewPdf = (id, includeHeader = true) => {
  const url = `${BASE_URL}/api/certificates/${id}/pdf?header=${includeHeader}`;
  window.open(url, '_blank');
};


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-rose-600 text-center">
        <p>{error}</p>
        <button
          onClick={fetchCertificates}
          className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">


       {/* Logout button */}
    <div className="flex justify-end mb-4">
      <button
        onClick={logout}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md shadow-md"
      >
        Logout
      </button>


    </div>
     {/* Search Bar */}
     <div className="flex justify-center">
  <div className="relative w-full max-w-md">
    <input
      type="text"
      placeholder="Search..."
      className="w-full pl-10 pr-5 py-3 rounded-xl bg-white border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 placeholder-gray-500 text-sm"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
      <Search className="w-4 h-4 text-gray-400" />
    </div>
  </div>
</div>




  {/* Title & New Button */}
  <div className="flex justify-between items-center">
  <h1 className="text-2xl font-semibold font-serif text-gray-900 mb-4 mt-4">
  All Certificates
</h1>


    <Link
      to="/"
      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition"
    >
      + New Certificate
    </Link>
  </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-indigo-600 ">
            <tr>
              {[
                'Sr No',
                'Certificate No',
                'Company & Address',
                'Batch No',
                'SO Number',
                'Vehicle No',
                'Item Code',
                'Material & Size',
                'Action',
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-white uppercase"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y  divide-slate-200">
            {Array.isArray(certificates) && certificates.length > 0 ?  (
              certificates.map((cert, index) => (
                <tr
                  key={cert._id}
                  className="odd:bg-slate-50 even:bg-white hover:bg-indigo-100"
                >
                  <td className="px-6 py-4  whitespace-nowrap text-sm font-medium text-slate-900">
                    {index + 1}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {`${cert.certificateNoPrefix}/${cert.year}/${cert.certificateNoSuffix}`}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {typeof cert.customerName === 'object' && cert.customerName?.buffer
                          ? String.fromCharCode(...cert.customerName.buffer.data)
                          : cert.customerName}
                      </div>
                      <div className="text-slate-500 text-xs">
                        {cert.customerAddress}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {cert.batchNumber}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {cert.soNumber}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {cert.truckNo}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {cert.items?.map((item, idx) => (
                      <div key={idx}>
                        <strong className="text-slate-900"></strong>{' '}
                        {item.code || item.item?.code}
                        {idx < cert.items.length - 1 && <hr className="my-1 border-slate-200" />}
                      </div>
                    ))}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {cert.items?.map((item, idx) => (
                      <div key={idx}>
                        {(item.materialOverride || item.item?.material || '')}{' '}
                        / {(item.sizeOverride || item.item?.size || '')}
                        {idx < cert.items.length - 1 && <hr className="my-1 border-slate-200" />}
                      </div>
                    ))}
                  </td>



                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                    <a
                href={`${BASE_URL}/api/certificates/${cert._id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 hover:text-indigo-900 shadow-sm transition"
              >
                PDF
            </a>

                      <button
                        onClick={() => openEmailModal(cert)}
                        className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 hover:text-blue-900 shadow-sm transition"
                      >
                        Email
                      </button>

                      <div className="flex gap-2">
                
                <button
                  onClick={() => handleViewPdf(cert._id, false)}
                  className="inline-block px-3 py-1 bg-rose-100 text-indigo-600 rounded-full hover:bg-rose-200 hover:text-indigo-900 shadow-sm transition"
                >
                  With No Header
                </button>
              </div>
                     
                      
                      <Link
                        to={`/certificates/edit/${cert._id}`}
                        className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200 hover:text-emerald-900 shadow-sm transition"
                      >
                        Edit
                      </Link>

                      <button
                        onClick={() => handleDelete(cert._id)}
                        className="inline-block px-3 py-1 bg-rose-100 text-rose-700 rounded-full hover:bg-rose-200 hover:text-rose-900 shadow-sm transition"
                      >
                        Delete
                      </button>
            
                    
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="9"
                  className="px-6 py-6 text-center text-sm text-slate-500"
                >
                  No certificates found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      
      {isEmailModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
    <div className="w-full max-w-md rounded-xl border border-gray-300 bg-white p-6 shadow-lg md:rounded-2xl md:border-gray-700 md:bg-white/90 md:p-8 md:backdrop-blur-md">
      <h2 className="mb-3 text-lg font-bold text-indigo-900 md:mb-4 md:text-center md:text-xl">
        Send Certificate Email
      </h2>

      <p className="mb-3 text-sm text-gray-700 md:mb-4 md:text-center">
        Sending certificate:{" "}
        <span className="font-semibold text-gray-900">
          {selectedCertificate?.certificateNoPrefix}/
          {selectedCertificate?.year}/
          {selectedCertificate?.certificateNoSuffix}
        </span>
      </p>

      <input
        type="email"
        placeholder="Enter recipient email"
        className="mb-4 w-full rounded-lg border border-gray-300 p-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 md:p-3"
        value={emailToSend}
        onChange={(e) => setEmailToSend(e.target.value)}
        disabled={isSending}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
        <button
          onClick={closeEmailModal}
          disabled={isSending}
          className="rounded-lg bg-gray-200 px-4 py-2 text-gray-800 shadow-sm transition hover:bg-gray-300 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          onClick={handleSendEmail}
          disabled={isSending}
          className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSending ? 'Sending…' : 'Send'}
        </button>
      </div>

      {isSending && (
        <p className="mt-3 text-center text-sm text-yellow-600 animate-pulse md:mt-4">
          Please wait, email is being sent…
        </p>
      )}
    </div>
  </div>
)}


    </div>
  );
};

export default AllCertificates;
