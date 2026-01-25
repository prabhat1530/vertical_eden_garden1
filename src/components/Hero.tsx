import React from 'react';
import { Link } from 'react-router-dom';

interface HeroProps {
    title?: string;
    subtitle?: string;
    backgroundImage?: string;
    showButton?: boolean;
}

const Hero: React.FC<HeroProps> = ({
    title = "Welcome to Vertical Eden Garden",
    subtitle = "Your one-stop solution for beautiful vertical gardens.",
    backgroundImage,
    showButton = true
}) => {
    const heroStyle = backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : {};

    return (
        <div className="hero" style={heroStyle}>
            <div className="hero-content">
                <h1>{title}</h1>
                <p>{subtitle}</p>
                {showButton && <Link to="/services" className="hero-btn">Explore Our Services</Link>}
            </div>
        </div>
    );
};

export default Hero;