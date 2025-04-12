import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import { Toaster } from 'react-hot-toast';
import MainLayout from './components/Layout/MainLayout';
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
            <Route path="/" element={<MainLayout><LandingPage /></MainLayout>} />
            <Route path="/home" element={<MainLayout><LandingPage /></MainLayout>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/food-details/:id" element={<MainLayout><FoodDetails /></MainLayout>} />
            <Route path="/products" element={<MainLayout><ProductPage /></MainLayout>} />
            <Route path="/about" element={<MainLayout><About /></MainLayout>} />
            <Route path="/contact" element={<MainLayout><Contact /></MainLayout>} />
            <Route path="/subscriptionPage" element={<MainLayout><SubscriptionPage /></MainLayout>} />
            <Route path="/invoice" element={<MainLayout><Invoice /></MainLayout>} />

            {/* Protected User Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/cart" element={<MainLayout><Cart /></MainLayout>} />
              <Route path="/orders" element={<MainLayout><OrderHistory /></MainLayout>} />
              <Route path="/local-partners" element={<MainLayout><LocalPartnerships /></MainLayout>} />
              <Route path="/pre-order" element={<MainLayout><PreOrder /></MainLayout>} />
              <Route path="/bundles" element={<MainLayout><FoodBundles /></MainLayout>} />
              <Route path="/allergies" element={<MainLayout><AllergyFilter /></MainLayout>} />
              <Route path="/rewards" element={<MainLayout><RewardPoints /></MainLayout>} />
            </Route>

            {/* Protected Admin Routes */}
            <Route element={<AdminProtectedRoute />}>
              <Route path="/admin" element={<MainLayout><AdminDashboard /></MainLayout>} />
              <Route path="/admin/orders" element={<MainLayout><AdminOrders /></MainLayout>} />
            </Route>

            {/* 404 Route */}
            <Route path="*" element={<MainLayout><NotFound /></MainLayout>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;