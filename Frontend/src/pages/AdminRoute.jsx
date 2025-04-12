import { Navigate, Outlet } from "react-router-dom";

const AdminRoute = () => {
  const token = sessionStorage.getItem("authToken");
  const userRole = sessionStorage.getItem("userRole");
  
  // Check if user is not authenticated
  if (!token) {
    console.log('No token found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Check if user is not an admin
  if (userRole !== "admin") {
    console.log('User is not admin, redirecting to home');
    return <Navigate to="/home" replace />;
  }

  // If user is authenticated and is an admin, render the protected route
  console.log('User is admin, rendering protected route');
  return <Outlet />;
};

export default AdminRoute;