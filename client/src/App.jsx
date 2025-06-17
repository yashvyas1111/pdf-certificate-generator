// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import CreateCertificatePage from './pages/CreateCertificate';
import AllCertificatesPage from './pages/AllCertificatePages'; 
import CertificateForm from './components/CertificateForm';

// Simple helper to check if user is logged in (stored in localStorage)
const isLoggedIn = () => !!localStorage.getItem('user');

function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes */}
      <Route
        path="/"
        element={isLoggedIn() ? <CreateCertificatePage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/certificates/new"
        element={isLoggedIn() ? <CreateCertificatePage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/certificates"
        element={isLoggedIn() ? <AllCertificatesPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/certificates/edit/:id"
        element={isLoggedIn() ? <CertificateForm /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );
}

export default App;
