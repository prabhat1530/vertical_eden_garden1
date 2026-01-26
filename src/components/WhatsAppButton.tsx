import React from 'react';
import './WhatsAppButton.css';

const WhatsAppButton: React.FC = () => {
    return (
        <div className="whatsapp-container">
            <a
                href="https://wa.me/917827949218"
                target="_blank"
                rel="noopener noreferrer"
                className="whatsapp-text-bubble-link"
                style={{ textDecoration: 'none' }}
            >
                <div className="whatsapp-text-bubble">
                    Chat with us <span className="waving-hand">👋</span>
                </div>
            </a>
            <a
                href="https://wa.me/917827949218"
                className="whatsapp-float"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat on WhatsApp"
            >
                <svg viewBox="0 0 32 32" className="whatsapp-icon" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 2C8.268 2 2 8.268 2 16c0 2.47.64 4.8 1.76 6.84L2.5 29.5l6.83-1.24C11.27 29.32 13.58 30 16 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.5c-2.13 0-4.16-.58-5.96-1.6l-.43-.25-4.42.8.8-4.32-.26-.44C4.69 20.02 4.1 18.06 4.1 16c0-6.56 5.34-11.9 11.9-11.9S27.9 9.44 27.9 16 22.56 27.5 16 27.5zM22.61 20.4c-.28-.14-1.65-.82-1.9-.91-.25-.09-.43-.14-.61.14-.18.27-.7 .91-.86 1.1-.16.18-.32.2-.6.07-.28-.14-1.18-.44-2.25-1.39-.83-.74-1.39-1.65-1.55-1.93-.16-.27-.02-.42.12-.56.13-.12.28-.32.42-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.08-.14-.61-1.48-.84-2.02-.22-.53-.44-.45-.61-.46-.16 0-.34-.01-.52-.01-.18 0-.48.07-.73.34-.25.27-.97.94-.97 2.3 0 1.35.98 2.66 1.12 2.85.14.18 1.94 3.01 4.71 4.2 1.9.82 2.64.88 3.6.82.96-.06 2.08-.85 2.37-1.67.29-.82.29-1.52.2-1.67-.08-.14-.3-.23-.58-.37z" fill="#FFF" />
                </svg>
            </a>
        </div>
    );
};

export default WhatsAppButton;
