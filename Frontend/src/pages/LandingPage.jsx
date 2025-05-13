import React from 'react'
import Home from "../components/home/Home";
import Greeting from "../components/Greeting/Greeting";
import DietFood from "../components/Swipper/DietFood";
import Allergies from '../components/Allergies/Allergies';
import Preferences from "../components/Preferences/Preferences";
import Header from "../components/Header";
import Chatbot from "../components/Chatbot";

const LandingPage = () => {
  return (
    <div>
      <Header />
      <Home />
      <Greeting />
      <DietFood />
      <Chatbot />
    </div>
  )
}

export default LandingPage
