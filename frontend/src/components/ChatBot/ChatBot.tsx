import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaTimes, FaRobot, FaLeaf } from 'react-icons/fa';
import './ChatBot.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
}

const ChatBot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'model',
            text: 'Hi! I am the Vertical Eden Garden AI assistant. How can I help you with your gardening or booking needs today?'
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        
        if (!message.trim() || isLoading) return;

        const userText = message.trim();
        setMessage(''); // Clear input immediately
        
        // Add user message to UI
        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: userText };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            // We pass the history (excluding the very first welcome message if we want to save tokens, 
            // but usually passing all is fine. For simplicity, we pass all previous messages).
            const history = messages.map(msg => ({ role: msg.role, text: msg.text }));

            const res = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userText, history })
            });

            const data = await res.json();

            if (data.success) {
                const botMsg: Message = { id: Date.now().toString(), role: 'model', text: data.reply };
                setMessages(prev => [...prev, botMsg]);
            } else {
                throw new Error(data.error || 'Failed to get response');
            }
        } catch (error) {
            console.error('Chat error:', error);
            const errorMsg: Message = { 
                id: Date.now().toString(), 
                role: 'model', 
                text: 'Sorry, I am having trouble connecting to my brain right now. Please try again later!' 
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to render text with basic paragraph formatting
    const renderText = (text: string) => {
        return text.split('\n').map((str, index) => {
            if (!str.trim()) return null; // Skip empty lines
            // Simple bold parsing: **text**
            const parts = str.split(/(\*\*.*?\*\*)/g);
            return (
                <p key={index}>
                    {parts.map((part, i) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={i}>{part.slice(2, -2)}</strong>;
                        }
                        return part;
                    })}
                </p>
            );
        });
    };

    return (
        <div className="chatbot-wrapper">
            {/* The Floating Bubble Button */}
            <div 
                className={`chatbot-bubble ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(true)}
            >
                <FaLeaf size={24} />
            </div>

            {/* The Chat Window */}
            <div className={`chatbot-window ${isOpen ? 'open' : ''}`}>
                <div className="chatbot-header">
                    <div className="chatbot-header-info">
                        <FaRobot size={24} />
                        <div>
                            <h3>Eden AI Assistant</h3>
                            <p>Online & ready to help</p>
                        </div>
                    </div>
                    <button className="chatbot-close" onClick={() => setIsOpen(false)}>
                        <FaTimes size={18} />
                    </button>
                </div>

                <div className="chatbot-messages">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`chat-msg ${msg.role}`}>
                            {renderText(msg.text)}
                        </div>
                    ))}
                    
                    {isLoading && (
                        <div className="chatbot-typing">
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form className="chatbot-input" onSubmit={handleSend}>
                    <input
                        type="text"
                        placeholder="Ask me anything..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={!message.trim() || isLoading}>
                        <FaPaperPlane size={16} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatBot;
