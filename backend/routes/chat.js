const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, error: 'Message is required' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ success: false, error: 'Gemini API Key is not configured' });
        }

        // System instructions to strictly bound the bot
        const systemInstruction = "You are a friendly and professional customer support AI assistant for 'Vertical Eden Garden'. Vertical Eden Garden is a premium landscaping and gardening service provider. Your ONLY job is to answer questions related to gardening, plant care, landscaping services, our booking process, pricing, and general inquiries about our company. Under NO circumstances should you answer questions about politics, coding, history, or any other unrelated topic. If a user asks an unrelated question, politely decline and steer the conversation back to gardening and our services.";

        // Format history for Gemini API
        const formattedHistory = (history || []).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        // Append current message
        formattedHistory.push({
            role: 'user',
            parts: [{ text: message }]
        });

        // Call Gemini API via REST (No SDK required)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: systemInstruction }]
                },
                contents: formattedHistory,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 500,
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Gemini API Error:', data);
            throw new Error(data.error?.message || 'Failed to communicate with AI');
        }

        // Extract the response text
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I didn't understand that. Can you rephrase?";

        res.json({
            success: true,
            reply: replyText
        });

    } catch (error) {
        console.error('Chat API Error:', error.message);
        res.status(500).json({ success: false, error: 'Internal server error while processing your request.' });
    }
});

module.exports = router;
