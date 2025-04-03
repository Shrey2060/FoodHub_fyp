import React from 'react'
import Home from "../components/Home/Home";
import Greeting from "../components/Greeting/Greeting";
import DietFood from "../components/Swipper/DietFood";
import Allergies from '../components/Allergies/Allergies';
import Preferences from "../components/Preferences/Preferences";
import Header from "../components/Header";
import Footer from "../components/Footer/Footer";

const LandingPage = () => {
  return (
    <div>
      <Header />
      <Home />
      <Greeting />
      <DietFood />
      <Allergies />
      <Preferences />
      <Footer />
    </div>
  )
}

export default LandingPage
