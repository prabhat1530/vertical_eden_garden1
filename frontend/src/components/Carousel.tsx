import React, { useState, useEffect, useCallback } from 'react';
import './Carousel.css';

interface CarouselProps {
    images: string[];
    interval?: number;
    captions?: string[];
}

const Carousel: React.FC<CarouselProps> = ({ images, interval = 5000, captions = [] }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    const nextSlide = useCallback(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, [images.length]);

    const prevSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    };

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    useEffect(() => {
        if (isHovered) return;

        const timer = setInterval(() => {
            nextSlide();
        }, interval);

        return () => clearInterval(timer);
    }, [nextSlide, interval, isHovered]);

    if (!images || images.length === 0) return null;

    return (
        <div
            className="carousel-container"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className="carousel-slides"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {images.map((img, index) => (
                    <div key={index} className="carousel-slide">
                        <img src={img} alt={`Slide ${index + 1}`} className="carousel-image" />
                        {captions[index] && (
                            <div className="carousel-caption">
                                <h3>{captions[index]}</h3>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <button className="carousel-button prev" onClick={prevSlide} aria-label="Previous slide">
                &#10094;
            </button>
            <button className="carousel-button next" onClick={nextSlide} aria-label="Next slide">
                &#10095;
            </button>

            <div className="carousel-indicators">
                {images.map((_, index) => (
                    <button
                        key={index}
                        className={`carousel-indicator ${index === currentIndex ? 'active' : ''}`}
                        onClick={() => goToSlide(index)}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default Carousel;
