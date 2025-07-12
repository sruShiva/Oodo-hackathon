import React from 'react';
import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const isLoggedIn = token && (role === 'user' || role === 'admin');

  return isLoggedIn ? children : <Navigate to="/login" replace />;
}
