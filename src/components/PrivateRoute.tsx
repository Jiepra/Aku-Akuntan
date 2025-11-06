import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const currentUser = localStorage.getItem("current_user");
  
  if (!currentUser) {
    console.log("🔒 PrivateRoute: user belum login, redirect ke /auth");
    return <Navigate to="/auth" />;
  }

  return children;
};

export default PrivateRoute;
