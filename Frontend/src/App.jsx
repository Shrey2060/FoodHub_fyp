import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import { Toaster } from 'react-hot-toast';
import Footer from './components/Footer/Footer';
import LandingPage from './pages/LandingPage';
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
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
import AdminDashboard from "./pages/AdminDashboard";
import AdminOrders from "./pages/AdminOrders";
import ProtectedRoute from "./pages/ProtectedRoute";
import AdminRoute from "./pages/AdminRoute";
import NotFound from "./pages/NotFound";
import SubscriptionPage from "./components/SubscriptionPage/SubscriptionPage";
import Invoice from "./components/Invoice/Invoice";
import Chatbot from "./components/Chatbot";
import AdminProtectedRoute from './components/AdminProtectedRoute/AdminProtectedRoute';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="app">
        <Toaster
          position="top-center"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              style: {
                background: '#22c55e',
                color: '#fff',
              },
            },
            error: {
              duration: 3000,
              style: {
                background: '#ef4444',
                color: '#fff',
              },
            },
            loading: {
              duration: Infinity,
              style: {
                background: '#363636',
                color: '#fff',
              },
            },
          }}
        />
        <main className="main-content">
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
            <Route path="/invoice" element={<Invoice />} />

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
            <Route element={<AdminProtectedRoute />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
            </Route>

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Chatbot />
        <Footer />
      </div>
    </Router>
  );
}

export default App;