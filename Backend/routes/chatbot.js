const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Helper function to format currency in Nepali Rupees
const formatCurrency = (amount) => {
    // Convert to number and handle invalid values
    const price = Number(amount);
    if (isNaN(price)) return 'Price not available';
    return `Rs. ${price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

// Keywords for better intent matching
const INTENT_KEYWORDS = {
    price_inquiry: ['price', 'cost', 'how much', 'cheap', 'expensive', 'affordable', 'premium'],
    menu_inquiry: ['menu', 'what do you have', 'show me', 'available', 'list', 'what\'s there'],
    greeting: ['hi', 'hello', 'hey', 'greetings', 'good'],
    recommendation: ['recommend', 'best', 'popular', 'special', 'favorite', 'suggest']
};

// Helper function to classify user intent
const classifyIntent = (query) => {
    if (!query) return 'greeting';
    
    query = query.toLowerCase().trim();
    
    // Check each intent's keywords
    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
        if (keywords.some(keyword => query.includes(keyword))) {
            return intent;
        }
    }

    // If no intent matches, check if it's a specific product search
    return 'product_search';
};

// Helper function to generate response message
const generateResponse = (intent, results, query = '') => {
    // Format prices in results to Nepali Rupees
    const formattedResults = results.map(item => ({
        ...item,
        price: formatCurrency(item.price)
    }));

    if (results.length === 0) {
        const suggestions = 'You can ask about our menu, prices, or specific dishes like "Momo" or "Pizza".';
        
        switch (intent) {
            case 'price_inquiry':
                if (query.includes('cheap') || query.includes('affordable')) {
                    return {
                        message: `I couldn't find any items under Rs. 500. ${suggestions}`,
                        recommendations: []
                    };
                } else if (query.includes('expensive') || query.includes('premium')) {
                    return {
                        message: `I couldn't find any premium items over Rs. 1,000. ${suggestions}`,
                        recommendations: []
                    };
                } else {
                    return {
                        message: `I couldn't find the price for '${query}'. ${suggestions}`,
                        recommendations: []
                    };
                }
            
            case 'product_search':
                return {
                    message: `I couldn't find any items matching '${query}'. Try asking for specific items like "Momo", "Pizza", or ask "What's on the menu?"`,
                    recommendations: []
                };
                
            default:
                return {
                    message: `I couldn't find what you're looking for. ${suggestions}`,
                    recommendations: []
                };
        }
    }

    switch (intent) {
        case 'price_inquiry':
            if (query.includes('cheap') || query.includes('affordable')) {
                return {
                    message: `Here are our budget-friendly options under Rs. 500:`,
                    recommendations: formattedResults
                };
            } else if (query.includes('expensive') || query.includes('premium')) {
                return {
                    message: `Here are our premium dishes over Rs. 1,000:`,
                    recommendations: formattedResults
                };
            } else {
                // If asking about specific item's price
                const searchTerm = query.replace(/price|cost|how much|is the|are the/gi, '').trim();
                return {
                    message: `Here's what I found for "${searchTerm}":`,
                    recommendations: formattedResults
                };
            }
        case 'dietary_inquiry':
            const dietType = query.includes('vegetarian') ? 'vegetarian' :
                           query.includes('vegan') ? 'vegan' :
                           query.includes('halal') ? 'halal' : 'dietary';
            return {
                message: `Here are our ${dietType} options:`,
                recommendations: formattedResults
            };
        case 'recommendation':
            return {
                message: `Here are some special recommendations just for you:`,
                recommendations: formattedResults
            };
        case 'greeting':
            return {
                message: `Hello! Welcome to FoodHUB! I can help you find dishes, check prices, and explore our menu. Here are some popular items to get you started:`,
                recommendations: formattedResults.slice(0, 5)
            };
        case 'menu_inquiry':
            return {
                message: `Here's our current menu:`,
                recommendations: formattedResults
            };
        case 'product_search':
            return {
                message: `Here's what I found for "${query.trim()}":`,
                recommendations: formattedResults
            };
            
        default:
            return {
                message: `Here are some items you might like:`,
                recommendations: formattedResults.slice(0, 5)
            };
    }
};

// Get chatbot recommendations based on user query

router.post('/query', async (req, res) => {
    try {
        const { query } = req.body;
        
        if (!query) {
            return res.json({
                message: 'Hello! How can I help you today? You can ask about our menu, prices, or specific dishes.',
                recommendations: []
            });
        }

        const intent = classifyIntent(query);
        let sqlQuery = `
            SELECT 
                p.id,
                p.name,
                p.description,
                p.price,
                p.image_url,
                COALESCE(c.name, 'Uncategorized') as category_name
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id
        `;
        let params = [];
        const searchTerm = `%${query.toLowerCase()}%`;

        switch (intent) {
            case 'price_inquiry':
                if (query.includes('cheap') || query.includes('affordable')) {
                    sqlQuery += ' WHERE p.price < 500 ORDER BY p.price ASC';
                } else if (query.includes('expensive') || query.includes('premium')) {
                    sqlQuery += ' WHERE p.price > 1000 ORDER BY p.price DESC';
                } else {
                    // If asking about specific item's price
                    sqlQuery += ' WHERE LOWER(p.name) LIKE ? ORDER BY p.price ASC';
                    params = [searchTerm];
                }
                break;

            case 'product_search':
                sqlQuery += ' WHERE LOWER(p.name) LIKE ? OR LOWER(p.description) LIKE ?';
                params = [searchTerm, searchTerm];
                break;

            case 'recommendation':
                sqlQuery += ' WHERE 1=1 ORDER BY RAND()';
                break;

            case 'greeting':
                sqlQuery += ' WHERE 1=1 ORDER BY RAND()';
                break;

            case 'menu_inquiry':
                // For menu inquiry, join with categories table to get category names
                sqlQuery = `
                    SELECT 
                        p.id,
                        p.name,
                        p.description,
                        p.price,
                        p.image_url,
                        COALESCE(c.name, 'Uncategorized') as category_name
                    FROM products p 
                    LEFT JOIN categories c ON p.category_id = c.id 
                    ORDER BY category_name, p.price ASC
                `;
                break;
                
            default:
                sqlQuery += ' WHERE (p.name LIKE ? OR p.description LIKE ?)';
                params = [`%${query}%`, `%${query}%`];
        }

        // Only limit results for non-menu queries
        if (intent !== 'menu_inquiry') {
            sqlQuery += ' LIMIT 5';
        }

        // Execute the query
        const [results] = await db.query(sqlQuery, params);

        // Format response
        let recommendations = [];
        if (intent === 'menu_inquiry') {
            // Group by category for menu inquiry
            const groupedItems = {};
            results.forEach(item => {
                const category = item.category_name;
                if (!groupedItems[category]) {
                    groupedItems[category] = [];
                }
                console.log('Raw item:', item);
                console.log('Raw price:', item.price, typeof item.price);
                const formattedPrice = formatCurrency(item.price);
                console.log('Formatted price:', formattedPrice);
                
                groupedItems[category].push({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    price: formattedPrice,
                    imageUrl: item.image_url,
                    category: category
                });
            });

            // Convert grouped items to a formatted list
            Object.entries(groupedItems).forEach(([category, items]) => {
                recommendations.push({ type: 'category', name: category });
                recommendations.push(...items);
            });
        } else {
            // Regular format for other queries
            recommendations = results.map(item => ({
                id: item.id,
                name: item.name,
                description: item.description,
                price: formatCurrency(item.price),
                imageUrl: item.image_url,
                category: item.category_name
            }));
        }

        // Generate appropriate response based on intent
        const response = generateResponse(intent, recommendations);

        res.json({
            success: true,
            message: response.message,
            recommendations: response.recommendations
        });
    } catch (error) {
        console.error('Chatbot query error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing your request'
        });
    }
});

module.exports = router;
