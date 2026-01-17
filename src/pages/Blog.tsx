import React from "react";

const Blog: React.FC = () => {
    return (
        <div
            style={{
                height: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "linear-gradient(to bottom, rgba(46, 204, 113, 0.2), rgba(0, 0, 0, 0.4))", /* Green Theme */
                padding: "20px",
            }}
        >
            <div
                style={{
                    textAlign: "center",
                    padding: "40px 50px",
                    borderRadius: "18px",
                    background: "rgba(255, 255, 255, 0.1)", /* Slightly clearer glass */
                    backdropFilter: "blur(12px)",
                    boxShadow: "0px 10px 30px rgba(0,0,0,0.2)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    maxWidth: "500px",
                    width: "100%",
                }}
            >
                <h1
                    style={{
                        fontSize: "42px",
                        fontWeight: 800,
                        marginBottom: "12px",
                        color: "green",
                        letterSpacing: "1px",
                    }}
                >
                    Blogs Coming Soon 🌿
                </h1>

                <p
                    style={{
                        fontSize: "16px",
                        color: "green",
                        lineHeight: "1.6",
                    }}
                >
                    We’re cultivating something amazing. Stay tuned for expert gardening tips and updates!
                </p>

                <button
                    style={{
                        marginTop: "22px",
                        padding: "12px 22px",
                        borderRadius: "12px",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "#1b5e20", /* Dark Green Text */
                        background: "#ffffff",
                        transition: "0.3s",
                    }}
                    onMouseOver={(e) =>
                        (e.currentTarget.style.transform = "scale(1.05)")
                    }
                    onMouseOut={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")
                    }
                >
                    Notify Me
                </button>
            </div>
        </div>
    );
};

export default Blog;
