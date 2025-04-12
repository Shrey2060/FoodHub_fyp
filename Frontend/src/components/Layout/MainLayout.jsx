import React from 'react';
import Footer from '../Footer/Footer';

const MainLayout = ({ children }) => {
  return (
    <>
      {children}
      <Footer />
    </>
  );
};

export default MainLayout;
