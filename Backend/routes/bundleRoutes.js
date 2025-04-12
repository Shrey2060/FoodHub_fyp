const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const mysql = require('mysql2/promise');
const dbConfig = require('../config/database');

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Experience types and their associated content
const EXPERIENCE_TYPES = {
    TRIVIA: 'trivia',
    RECIPE_CHALLENGE: 'recipe_challenge',
    CULTURAL_PLAYLIST: 'cultural_playlist'
};

// Get all bundles with experiences
router.get('/', async (req, res) => {
    try {
        const [bundles] = await pool.query(`
            SELECT * FROM food_bundles
        `);

        // Add experience data to each bundle
        const bundlesWithExperiences = bundles.map(bundle => ({
            ...bundle,
            experiences: {
                trivia: {
                    title: 'Food Trivia Challenge',
                    questions: [
                        { 
                            question: `What cuisine is ${bundle.name} inspired by?`,
                            points: 10,
                            options: ['Italian', 'Mexican', 'Indian', 'Chinese']
                        },
                        { 
                            question: 'What are the key ingredients in this dish?',
                            points: 15,
                            options: ['Rice', 'Pasta', 'Noodles', 'Bread']
                        }
                    ]
                },
                recipe_challenge: {
                    title: `${bundle.name} Cooking Challenge`,
                    description: `Learn to make elements of ${bundle.name} at home!`,
                    difficulty: 'Medium',
                    estimatedTime: '30 mins',
                    steps: [
                        'Gather your ingredients',
                        'Follow along with our video guide',
                        'Share your creation!'
                    ],
                    tips: ['Prep all ingredients before starting', 'Take photos of your progress']
                },
                cultural_playlist: {
                    title: `${bundle.name} Cultural Experience`,
                    description: 'Enjoy your meal with themed music',
                    genres: ['Traditional', 'Contemporary', 'Fusion'],
                    duration: '45 mins',
                    moodTags: ['Upbeat', 'Cultural', 'Relaxing']
                }
            }
        }));

        res.json({ success: true, bundles: bundlesWithExperiences });
    } catch (error) {
        console.error('Error fetching bundles:', error);
        res.status(500).json({ success: false, message: 'Error fetching bundles' });
    }
});

// Get bundle details with experiences
router.get('/:id', async (req, res) => {
    try {
        const [bundle] = await pool.query('SELECT * FROM food_bundles WHERE id = ?', [req.params.id]);

        if (!bundle[0]) {
            return res.status(404).json({ success: false, message: 'Bundle not found' });
        }

        // Add experience data
        const bundleWithExperiences = {
            ...bundle[0],
            experiences: {
                trivia: {
                    title: 'Food Trivia Challenge',
                    questions: [
                        { 
                            question: `What cuisine is ${bundle[0].name} inspired by?`,
                            points: 10,
                            options: ['Italian', 'Mexican', 'Indian', 'Chinese']
                        },
                        {
                            question: 'What are the key ingredients in this dish?',
                            points: 15,
                            options: ['Rice', 'Pasta', 'Noodles', 'Bread']
                        }
                    ],
                    totalPoints: 25
                },
                recipe_challenge: {
                    title: `${bundle[0].name} Cooking Challenge`,
                    description: `Learn to make elements of ${bundle[0].name} at home!`,
                    difficulty: 'Medium',
                    estimatedTime: '30 mins',
                    steps: [
                        'Gather your ingredients',
                        'Follow along with our video guide',
                        'Share your creation!'
                    ],
                    tips: ['Prep all ingredients before starting', 'Take photos of your progress']
                },
                cultural_playlist: {
                    title: `${bundle[0].name} Cultural Experience`,
                    description: 'Enjoy your meal with themed music',
                    genres: ['Traditional', 'Contemporary', 'Fusion'],
                    duration: '45 mins',
                    moodTags: ['Upbeat', 'Cultural', 'Relaxing']
                }
            }
        };
        
        res.json({ success: true, bundle: bundleWithExperiences });
    } catch (error) {
        console.error('Error fetching bundle details:', error);
        res.status(500).json({ success: false, message: 'Error fetching bundle details' });
    }
});

// Start experience for a bundle
router.post('/:id/start-experience', authenticateToken, async (req, res) => {
    try {
        const { experienceType } = req.body;
        const bundleId = req.params.id;
        
        // Validate experience type
        if (!Object.values(EXPERIENCE_TYPES).includes(experienceType)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid experience type' 
            });
        }

        const [bundle] = await pool.query('SELECT * FROM food_bundles WHERE id = ?', [bundleId]);
        
        if (!bundle[0]) {
            return res.status(404).json({ 
                success: false, 
                message: 'Bundle not found' 
            });
        }

        // Record experience start in user_activities table
        await pool.query(`
            INSERT INTO user_activities (user_id, bundle_id, activity_type, created_at)
            VALUES (?, ?, ?, NOW())
        `, [req.user.id, bundleId, `started_${experienceType}`]);

        // Return experience data based on type
        const experienceData = {
            trivia: {
                title: 'Food Trivia Challenge',
                questions: [
                    { 
                        question: `What cuisine is ${bundle[0].name} inspired by?`,
                        points: 10,
                        options: ['Italian', 'Mexican', 'Indian', 'Chinese']
                    },
                    {
                        question: 'What are the key ingredients in this dish?',
                        points: 15,
                        options: ['Rice', 'Pasta', 'Noodles', 'Bread']
                    }
                ]
            },
            recipe_challenge: {
                title: `${bundle[0].name} Cooking Challenge`,
                description: `Learn to make elements of ${bundle[0].name} at home!`,
                difficulty: 'Medium',
                estimatedTime: '30 mins',
                steps: [
                    'Gather your ingredients',
                    'Follow along with our video guide',
                    'Share your creation!'
                ],
                tips: ['Prep all ingredients before starting', 'Take photos of your progress']
            },
            cultural_playlist: {
                title: `${bundle[0].name} Cultural Experience`,
                description: 'Enjoy your meal with themed music',
                genres: ['Traditional', 'Contemporary', 'Fusion'],
                duration: '45 mins',
                moodTags: ['Upbeat', 'Cultural', 'Relaxing']
            }
        };

        res.json({ 
            success: true, 
            message: 'Experience started successfully',
            experienceData: experienceData[experienceType]
        });
    } catch (error) {
        console.error('Error starting experience:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error starting experience' 
        });
    }
});

module.exports = router;