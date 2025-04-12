import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css';
import axios from 'axios';
import { IoMdSend } from 'react-icons/io';
import { BsChatDots } from 'react-icons/bs';
import { AiOutlineClose } from 'react-icons/ai';

const Chatbot = () => {
    const [isTyping, setIsTyping] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { type: 'bot', text: 'Hello! How can I help you find food today?' }
    ]);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!inputText.trim()) return;

        // Add user message
        setMessages(prev => [...prev, { type: 'user', text: inputText }]);

        try {
            const response = await axios.post('http://localhost:5000/api/chatbot/query', {
                query: inputText
            });

            const { recommendations, message } = response.data;

            // Add bot response
            setMessages(prev => [
                ...prev,
                {
                    type: 'bot',
                    text: message,
                    recommendations: recommendations
                }
            ]);
        } catch (error) {
            console.error('Error querying chatbot:', error);
            setMessages(prev => [
                ...prev,
                {
                    type: 'bot',
                    text: 'Sorry, I encountered an error. Please try again.'
                }
            ]);
        }

        setInputText('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <div className="chatbot-container">
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="chat-toggle-button"
                    aria-label="Open chat"
                >
                    <BsChatDots size={24} color="white" />
                </button>
            )}

            {isOpen && (
                <div className="chat-window">
                    {/* Header */}
                    <div className="chat-header">
                        <h3 className="font-semibold">FoodHUB Assistant</h3>
                        <button onClick={() => setIsOpen(false)}>
                            <AiOutlineClose />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="messages-container">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`message ${message.type}`}
                            >
                                <div className="message-content">
                                    <p>{message.text}</p>
                                    {message.recommendations && (
                                        <div className="mt-2">
                                            {message.recommendations.map((item, index) => (
                                                item.type === 'category' ? (
                                                    <div key={`category-${index}`} className="mt-3 mb-2">
                                                        <h3 className="text-lg font-bold text-orange-600 border-b border-orange-200 pb-1">{item.name}</h3>
                                                    </div>
                                                ) : (
                                                    <div
                                                        key={item.id}
                                                        className="bg-white py-2 px-3 rounded mt-1 text-sm border-l-2 border-orange-100 hover:border-orange-400 transition-colors"
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1">
                                                                <p className="font-semibold">{item.name}</p>
                                                                {item.description && (
                                                                    <p className="text-gray-500 text-xs mt-0.5">{item.description}</p>
                                                                )}
                                                            </div>
                                                            <p className="text-orange-600 font-medium ml-3 whitespace-nowrap">
                                                                {item.price}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="input-container">
                        <div className="flex items-center">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your message..."
                                className="message-input"
                            />
                            <button
                                onClick={handleSend}
                                className="send-button"
                            >
                                <IoMdSend size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chatbot;
