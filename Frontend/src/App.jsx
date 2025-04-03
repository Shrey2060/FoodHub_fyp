import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

// User Components
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import LandingPage from "../src/pages/LandingPage";
import FoodDetails from "./pages/FoodDetails";
import Cart from "./pages/Cart";
import ProductPage from "./pages/ProductPage";
import AllergyFilter from "./pages/AllergyFilter";
import RewardPoints from "./pages/RewardPoints";
import LocalPartnerships from "./pages/LocalPartnerships";
import PreOrder from "./pages/PreOrder";
import FoodBundles from "./components/FoodBundles/FoodBundles";
import OrderHistory from "./pages/OrderHistory";
import About from "./components/About/About";
import Contact from "./components/Contact/Contact";
// Admin Component
import AdminDashboard from "./pages/AdminDashboard";
import AdminOrders from "./pages/AdminOrders";
// Route Protection
import ProtectedRoute from "./pages/ProtectedRoute";
import AdminRoute from "./pages/AdminRoute";
// Error Component
import NotFound from "./pages/NotFound";
import SubscriptionPage from "./components/SubscriptionPage/SubscriptionPage";
import Invoice from "./components/Invoice/Invoice";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/food-details/:id" element={<FoodDetails />} />
        <Route path="/products" element={<ProductPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/subscriptionPage" element={<SubscriptionPage />} />
        <Route path="/invoice" element={<Invoice/>}/>


        {/* Protected User Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/local-partners" element={<LocalPartnerships />} />
          <Route path="/pre-order" element={<PreOrder />} />
          <Route path="/bundles" element={<FoodBundles />} />
          <Route path="/allergies" element={<AllergyFilter />} />
          <Route path="/rewards" element={<RewardPoints />} />
        </Route>

        {/* Protected Admin Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
        </Route>

        {/* Fallback Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;