import React, { useState } from 'react';
import './Portfolio.css';
import imageList from '../data/images.json';
import { FaTimes, FaSearchPlus, FaPlay, FaVideo, FaImage, FaThLarge } from 'react-icons/fa';

const Portfolio: React.FC = () => {
    const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'photos' | 'videos'>('all');
    const [visibleCount, setVisibleCount] = useState<number>(12);

    const openLightbox = (media: string) => {
        setSelectedMedia(media);
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    };

    const closeLightbox = () => {
        setSelectedMedia(null);
        document.body.style.overflow = 'auto';
    };

    // Filter media files based on tab selection
    const filteredMedia = imageList.filter((name) => {
        const isVideo = name.toLowerCase().endsWith('.mp4');
        if (activeTab === 'photos') return !isVideo;
        if (activeTab === 'videos') return isVideo;
        return true; // 'all'
    });

    const hasMore = visibleCount < filteredMedia.length;
    const currentMedia = filteredMedia.slice(0, visibleCount);

    const handleLoadMore = () => {
        setVisibleCount((prev) => prev + 12);
    };

    const handleTabChange = (tab: 'all' | 'photos' | 'videos') => {
        setActiveTab(tab);
        setVisibleCount(12); // Reset page count on tab switch
    };

    return (
        <div className="portfolio-container">
            <div className="portfolio-header">
                <span className="portfolio-subtitle">Our Masterpieces</span>
                <h1>Green Gallery</h1>
                <p>Immerse yourself in our collection of bespoke vertical gardens and sustainable landscapes.</p>
            </div>

            {/* Filter Tabs */}
            <div className="portfolio-filters">
                <button
                    className={`filter-btn ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => handleTabChange('all')}
                >
                    <FaThLarge /> All
                </button>
                <button
                    className={`filter-btn ${activeTab === 'photos' ? 'active' : ''}`}
                    onClick={() => handleTabChange('photos')}
                >
                    <FaImage /> Photos
                </button>
                <button
                    className={`filter-btn ${activeTab === 'videos' ? 'active' : ''}`}
                    onClick={() => handleTabChange('videos')}
                >
                    <FaVideo /> Videos
                </button>
            </div>

            {/* Gallery Grid */}
            <div className="gallery-masonry">
                {currentMedia.map((name, index) => {
                    const isVideo = name.toLowerCase().endsWith('.mp4');
                    return (
                        <div key={index} className="gallery-item" onClick={() => openLightbox(name)}>
                            <div className="gallery-img-wrapper">
                                {isVideo ? (
                                    <video
                                        src={`/images/${name}`}
                                        className="gallery-img"
                                        muted
                                        playsInline
                                        preload="metadata"
                                    />
                                ) : (
                                    <img
                                        src={`/images/${name}`}
                                        alt={`Vertical Garden Project ${index + 1}`}
                                        className="gallery-img"
                                        loading="lazy"
                                    />
                                )}
                                <div className="gallery-overlay">
                                    {isVideo ? (
                                        <FaPlay className="overlay-icon video-play-icon" />
                                    ) : (
                                        <FaSearchPlus className="overlay-icon" />
                                    )}
                                    <span>{isVideo ? 'Play Video' : 'View Project'}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Load More Button */}
            {hasMore && (
                <div className="load-more-container">
                    <button className="load-more-btn" onClick={handleLoadMore}>
                        Load More Projects
                    </button>
                </div>
            )}

            {/* Lightbox Modal */}
            {selectedMedia && (
                <div className="lightbox-overlay" onClick={closeLightbox}>
                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <button className="lightbox-close" onClick={closeLightbox}>
                            <FaTimes />
                        </button>
                        {selectedMedia.toLowerCase().endsWith('.mp4') ? (
                            <video
                                src={`/images/${selectedMedia}`}
                                controls
                                autoPlay
                                className="lightbox-video"
                            />
                        ) : (
                            <img src={`/images/${selectedMedia}`} alt="Enlarged View" className="lightbox-img" />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Portfolio;