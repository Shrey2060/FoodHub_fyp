import React from 'react'
import "./About.css"
import dish from "../../assets/images/dish.jpg";
import Header from '../Header';

const About = () => {
    return (
        <>
        <Header />
        <div className='about-container'>
            <div className='about-div'>
                <img src={dish} alt="Dishes" />
            </div>

            <div className='info-div'>
                <h2>
                    We provide healthy food for your family.
                </h2>

                <p>
                    Our story began with a vision to create a unique dining experience that
                    merges fine dining, exceptional service, and a vibrant ambiance. Rooted
                    in city's rich culinary culture, we aim to honor our local roots while infusing
                    a global palate.
                </p>

                <p>
                    At place, we believe that dining is not just about food, but also about the overall
                    experience. Our staff, renowned for their warmth and dedication, strives to make every
                    visit an unforgettable event.
                </p>
            </div>
        </div>
        </>
    )
}

export default About
