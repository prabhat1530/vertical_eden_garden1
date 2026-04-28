import React from "react";
import "./Blog.css";

const blogPosts = [
    {
        id: 1,
        title: "5 Tips for a Thriving Balcony Garden",
        excerpt: "Transform your urban balcony into a lush paradise with our expert tips on pot selection, watering schedules, and the best flowering plants for the Indian climate.",
        date: "Oct 12, 2025",
        image: "/images/blog/blog_urban_jungle.webp",
        category: "Urban Gardening"
    },
    {
        id: 2,
        title: "Vertical Walls: The Indoor Air Purifier",
        excerpt: "Discover how a vertical garden not only enhances your living room aesthetics but also acts as a natural air purifier, removing toxins and boosting oxygen levels.",
        date: "Sep 28, 2025",
        image: "/images/blog/blog_indoor_oases.webp",
        category: "Interior Design"
    },
    {
        id: 3,
        title: "Sustainable Living: Rooftop Farming",
        excerpt: "Grow your own organic vegetables! Learn the basics of setting up a productive rooftop farm, from soil preparation to seasonal crop rotation.",
        date: "Sep 15, 2025",
        image: "/images/blog/blog_sustainable_living.webp",
        category: "Sustainability"
    }
];

const Blog: React.FC = () => {
    return (
        <div className="blog-container">
            <div className="blog-header">
                <span className="blog-subtitle">Green Living</span>
                <h1 className="blog-title">Our Latest Stories</h1>
                <p className="blog-description">
                    Insights, tips, and inspiration for your gardening journey.
                </p>
            </div>

            <div className="blog-grid">
                {blogPosts.map((post) => (
                    <div key={post.id} className="blog-card">
                        <div className="blog-img-wrapper">
                            <img src={post.image} alt={post.title} loading="lazy" />
                            <span className="blog-category">{post.category}</span>
                        </div>
                        <div className="blog-content">
                            <span className="blog-date">{post.date}</span>
                            <h2>{post.title}</h2>
                            <p>{post.excerpt}</p>
                            <button className="read-more-btn-text">Read Article →</button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="newsletter-section">
                <h3>Join Our Community</h3>
                <p>Get the latest gardening updates delivered to your inbox.</p>
                <div className="newsletter-form">
                    <input type="email" placeholder="Enter your email address" />
                    <button>Subscribe</button>
                </div>
            </div>
        </div>
    );
};

export default Blog;
