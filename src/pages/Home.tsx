import React from 'react';
import Hero from '../components/Hero';
import ServicesList from '../components/ServicesList';
import Footer from '../components/Footer';
import Carousel from '../components/Carousel';
import './Home.css';

// Importing a few key images for the homepage
// In a real app we might import these or use public URL
// We will use public URLs assuming the move structure from previous step
const HOME_BG_IMAGE = '/images/img_20250802_wa0024.webp'; // Main hero
const FEATURE_1 = '/images/artifical_pic_for_balcony_3.webp';
const FEATURE_2 = '/images/e38256b0e0114ed0b0dad1178e26c65a.webp'; // Assuming these exist, matching pattern
const FEATURE_3 = '/images/153ad2cd683f484385d4a9fb38f58182.webp'; // Assuming these exist, matching pattern

interface ShowcaseSlide {
    id: number;
    subHeading: string;
    heading: string;
    description: string;
    img: string;
    features: { title: string; text: string }[];
}

const slides: ShowcaseSlide[] = [
    {
        id: 1,
        subHeading: "Our Philosophy",
        heading: "Redefining Urban Spaces",
        description: "Transforming concrete into living, breathing ecosystems.",
        img: "/images/project-showcase.webp",
        features: [
            { title: "Sustainable Living", text: "We integrate nature into modern architecture, reducing carbon footprints." },
            { title: "Custom Aesthetics", text: "Every wall is a canvas. Our designers curate bespoke plant palettes." },
            { title: "Zero Hassle Maintenance", text: "Smart irrigation ensuring your vertical garden stays lush." }
        ]
    },
    {
        id: 2,
        subHeading: "Luxury Outdoors",
        heading: "Sunset Balcony Retreats",
        description: "Experience the magic of twilight in your private green sanctuary.",
        img: "/images/showcase-slide-2.webp",
        features: [
            { title: "Panoramic Views", text: "Designed to frame your view while adding lush privacy." },
            { title: "Ambient Lighting", text: "Integrated warm lighting for magical evening atmospheres." },
            { title: "Aromatic Herbs", text: "Vertical pockets for fresh herbs right at your fingertips." }
        ]
    },
    {
        id: 3,
        subHeading: "Corporate Biophilia",
        heading: "Green Office Excellence",
        description: "Boost productivity and wellness with world-class interior landscapes.",
        img: "/images/showcase-slide-3.webp",
        features: [
            { title: "Air Purification", text: "Moss walls that naturally filter office air and reduce noise." },
            { title: "Brand Identity", text: "Sustainable design that speaks volumes about your company values." },
            { title: "Stress Reduction", text: "Biophilic elements proven to lower employee stress levels." }
        ]
    }
];

const ShowcaseCarousel: React.FC = () => {
    const [current, setCurrent] = React.useState(0);
    const [animating, setAnimating] = React.useState(false);

    React.useEffect(() => {
        const timer = setInterval(() => {
            setAnimating(true);
            setTimeout(() => {
                setCurrent(prev => (prev + 1) % slides.length);
                setAnimating(false);
            }, 500); // Wait for fade out
        }, 6000); // Change every 6 seconds

        return () => clearInterval(timer);
    }, []);

    const slide = slides[current];

    return (
        <div className={`showcase-container ${animating ? 'fade-out' : 'fade-in'}`}>
            <div className="showcase-content">
                <h5 className="sub-heading-animate">{slide.subHeading}</h5>
                <h2 className="heading-animate">{slide.heading}</h2>
                <div className="separator-animate"></div>

                <div className="showcase-features">
                    {slide.features.map((feat, index) => (
                        <div key={index} className={`feature-item animate-delay-${index + 1}`} style={{ animationDelay: `${index * 0.2}s` }}>
                            <h3>{feat.title}</h3>
                            <p>{feat.text}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className="showcase-image-wrapper">
                <img src={slide.img} alt={slide.heading} className="showcase-img" loading="lazy" />
                <div className="showcase-overlay-gradient"></div>
            </div>
        </div>
    );
};

const Home: React.FC = () => {
    return (
        <div className="home-container">
            <Hero />

            {/* Project Showcase Section */}
            {/* Project Showcase Section */}
            <section className="project-showcase">
                <ShowcaseCarousel />
            </section>

            {/* Our Reach Section */}
            {/* Premium Our Reach Section */}
            {/* Premium Our Reach Section */}
            <section className="our-reach-premium" style={{ backgroundImage: `url('/images/reach-premium-bg-bright.webp')` }}>
                <div className="reach-premium-overlay"></div>
                <div className="reach-premium-container">
                    <div className="reach-premium-content">
                        <h5 className="sub-heading">Global Impact</h5>
                        <h2>Creating Green Sanctuaries</h2>
                        <div className="separator"></div>
                        <p className="reach-desc">
                            Vertical Eden Garden has revitalized over 150+ spaces across Delhi NCR.
                            From corporate towers to private residences, we don't just plant gardens;
                            we engineer sustainable ecosystems that breathe life into concrete jungles.
                        </p>

                        <div className="reach-stats-grid">
                            <div className="stat-card">
                                <div className="icon-wrapper">🌱</div>
                                <h3><Counter target={1254} />+</h3>
                                <p>Trees Planted</p>
                            </div>
                            <div className="stat-card">
                                <div className="icon-wrapper">🤝</div>
                                <h3><Counter target={454} />+</h3>
                                <p>Happy Clients</p>
                            </div>
                            <div className="stat-card">
                                <div className="icon-wrapper">🏆</div>
                                <h3><Counter target={10} />+</h3>
                                <p>Awards Won</p>
                            </div>
                        </div>
                    </div>

                    <div className="reach-premium-visual">
                        <div className="visual-frame">
                            <img src="/images/reach-featured-bright.webp" alt="Featured Vertical Garden" loading="lazy" />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

// Hook for scroll animations
const useIntersectionObserver = (options: IntersectionObserverInit) => {
    const [element, setElement] = React.useState<Element | null>(null);
    const [isVisible, setIsVisible] = React.useState(false);

    React.useEffect(() => {
        if (!element) return;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.disconnect(); // Trigger once
            }
        }, options);

        observer.observe(element);

        return () => observer.disconnect();
    }, [element, options]);

    return [setElement, isVisible] as const;
};

// Premium Counter Component
const Counter: React.FC<{ target: number }> = ({ target }) => {
    const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
    const [count, setCount] = React.useState(0);

    React.useEffect(() => {
        if (!isVisible) return;

        let start = 0;
        const duration = 2500; // Slower, more elegant
        const increment = target / (duration / 16);

        const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
                setCount(target);
                clearInterval(timer);
            } else {
                setCount(Math.ceil(start));
            }
        }, 16);

        return () => clearInterval(timer);
    }, [isVisible, target]);

    return <span ref={ref as any}>{count.toLocaleString()}</span>;
};


export default Home;