// src/App.js
// Root component. Sets up React Router with all pages.

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BookingPage      from './pages/BookingPage';
import ConfirmationPage from './pages/ConfirmationPage';
import AdminPage        from './pages/AdminPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Client-facing booking flow */}
        <Route path="/"            element={<BookingPage />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />

        {/* Admin dashboard */}
        <Route path="/admin"       element={<AdminPage />} />
      </Routes>
    </Router>
  );
}

export default App;
