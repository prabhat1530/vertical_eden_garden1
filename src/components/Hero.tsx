import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Hero.css';
import slide1 from '../images/images/hero-slide-1.webp';
import slide2 from '../images/images/hero-slide-2.webp';
import slide3 from '../images/images/hero-slide-3.webp';

const slides = [
    {
        id: 1,
        image: slide1,
        title: "Make Your Space Look Lively",
        subtitle: "The area around your house is more than a yard; it's a reflection of who you are."
    },
    {
        id: 2,
        image: slide2,
        title: "Create Your Private Oasis",
        subtitle: "Transform your terrace into a luxurious extension of your home."
    },
    {
        id: 3,
        image: slide3,
        title: "Greenery in Every Corner",
        subtitle: "From balconies to backyards, we bring nature closer to you."
    }
];

const Hero: React.FC = () => {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000); // Change slide every 5 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <section className="hero-carousel">
            {slides.map((slide, index) => (
                <div
                    key={slide.id}
                    className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
                    style={{ backgroundImage: `url(${slide.image})` }}
                >
                    <div className="hero-overlay"></div>
                    <div className="hero-content">
                        <h1 className={index === currentSlide ? 'animate-text' : ''}>{slide.title}</h1>
                        <p className={index === currentSlide ? 'animate-sub' : ''}>{slide.subtitle}</p>
                        <Link
                            to="/contact"
                            className={`hero-btn ${index === currentSlide ? 'animate-btn' : ''}`}
                        >
                            Contact Us
                        </Link>
                    </div>
                </div>
            ))}

            <div className="carousel-indicators">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        className={`indicator ${index === currentSlide ? 'active' : ''}`}
                        onClick={() => setCurrentSlide(index)}
                        aria-label={`Go to slide ${index + 1}`}
                    ></button>
                ))}
            </div>
        </section>
    );
};

export default Hero;