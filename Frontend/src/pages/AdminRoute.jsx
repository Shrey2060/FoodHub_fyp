import { Navigate, Outlet } from "react-router-dom";

const AdminRoute = () => {
  const token = sessionStorage.getItem("authToken");
  const userRole = sessionStorage.getItem("userRole");
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (userRole !== "admin") {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;