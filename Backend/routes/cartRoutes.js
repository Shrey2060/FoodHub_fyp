const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");

// Get cart items for the logged-in user
router.get("/", authenticateToken, (req, res) => {
    const userId = req.user.id;

    const query = `
        SELECT 
            c.id AS cart_item_id, 
            c.quantity, 
            c.name AS product_name, 
            c.description, 
            c.price,
            c.discount_percentage,
            c.final_price, 
            c.image_url,
            c.is_bundle,
            CASE 
                WHEN c.is_bundle = 1 THEN (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'product_id', bi.product_id,
                            'name', p.name,
                            'quantity', bi.quantity
                        )
                    )
                    FROM cart_bundle_items bi
                    JOIN products p ON bi.product_id = p.id
                    WHERE bi.cart_item_id = c.id
                )
                ELSE NULL
            END as bundle_items
        FROM cart c 
        WHERE c.user_id = ?`;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error("❌ Error fetching cart items:", err.message);
            return res.status(500).json({
                success: false,
                message: "Database error while fetching cart items.",
            });
        }

        res.status(200).json({ success: true, cartItems: results });
    });
});

// Add a bundle to cart
router.post("/add-bundle", authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { bundleId, name, price, discount_percentage, items, final_price } = req.body;

    if (!bundleId || !name || !price || !items) {
        return res.status(400).json({
            success: false,
            message: "Bundle details are required.",
        });
    }

    // Start transaction
    db.beginTransaction(err => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Transaction error.",
            });
        }

        // Insert into cart
        const insertCartQuery = `
            INSERT INTO cart (user_id, item_id, name, description, price, discount_percentage, final_price, image_url, quantity, is_bundle) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1)`;

        db.query(
            insertCartQuery,
            [userId, bundleId, name, "Bundle", price, discount_percentage, final_price, null],
            (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({
                            success: false,
                            message: "Error adding bundle to cart.",
                        });
                    });
                }

                const cartItemId = result.insertId;

                // Insert bundle items
                const insertItemsPromises = items.map(item => {
                    return new Promise((resolve, reject) => {
                        db.query(
                            `INSERT INTO cart_bundle_items (cart_item_id, product_id, quantity) VALUES (?, ?, ?)`,
                            [cartItemId, item.product_id, item.quantity],
                            (err) => {
                                if (err) reject(err);
                                else resolve();
                            }
                        );
                    });
                });

                Promise.all(insertItemsPromises)
                    .then(() => {
                        db.commit(err => {
                            if (err) {
                                return db.rollback(() => {
                                    res.status(500).json({
                                        success: false,
                                        message: "Error committing transaction.",
                                    });
                                });
                            }
                            res.status(201).json({
                                success: true,
                                message: "Bundle added to cart successfully.",
                            });
                        });
                    })
                    .catch(err => {
                        db.rollback(() => {
                            res.status(500).json({
                                success: false,
                                message: "Error adding bundle items.",
                            });
                        });
                    });
            }
        );
    });
});

// Add regular item to cart
router.post("/", authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { product_id, quantity } = req.body;

    if (!product_id || !quantity || quantity < 1) {
        return res.status(400).json({
            success: false,
            message: "Product ID and a valid quantity are required.",
        });
    }

    const fetchProductQuery = `
    SELECT id, name, description, price, image_url 
    FROM products 
    WHERE id = ?`;

    db.query(fetchProductQuery, [product_id], (err, productResults) => {
        if (err) {
            console.error("❌ Error fetching product details:", err.message);
            return res.status(500).json({
                success: false,
                message: "Database error while fetching product details.",
            });
        }

        if (productResults.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found.",
            });
        }

        const product = productResults[0];

        const insertOrUpdateCartQuery = `
            INSERT INTO cart (user_id, item_id, name, description, price, image_url, quantity, is_bundle) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 0) 
            ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`;

        db.query(
            insertOrUpdateCartQuery,
            [userId, product.id, product.name, product.description, product.price, product.image_url, quantity],
            (err) => {
                if (err) {
                    console.error("❌ Error adding/updating cart:", err.message);
                    return res.status(500).json({
                        success: false,
                        message: "Database error while adding/updating cart.",
                    });
                }

                res.status(201).json({
                    success: true,
                    message: "Item added to cart successfully.",
                });
            }
        );
    });
});

// Remove an item from cart
router.delete("/:cart_item_id", authenticateToken, (req, res) => {
    const { cart_item_id } = req.params;

    db.beginTransaction(err => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Transaction error.",
            });
        }

        // First delete bundle items if any
        db.query("DELETE FROM cart_bundle_items WHERE cart_item_id = ?", [cart_item_id], (err) => {
            if (err) {
                return db.rollback(() => {
                    res.status(500).json({
                        success: false,
                        message: "Error removing bundle items.",
                    });
                });
            }

            // Then delete the cart item
            db.query("DELETE FROM cart WHERE id = ?", [cart_item_id], (err) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({
                            success: false,
                            message: "Error removing cart item.",
                        });
                    });
                }

                db.commit(err => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({
                                success: false,
                                message: "Error committing transaction.",
                            });
                        });
                    }

                    res.status(200).json({
                        success: true,
                        message: "Item removed from cart successfully.",
                    });
                });
            });
        });
    });
});

// Clear cart
router.delete("/", authenticateToken, (req, res) => {
    const userId = req.user.id;

    if (req.query.clear === "true") {
        db.beginTransaction(err => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Transaction error.",
                });
            }

            // First delete all bundle items
            db.query(
                "DELETE bi FROM cart_bundle_items bi JOIN cart c ON bi.cart_item_id = c.id WHERE c.user_id = ?",
                [userId],
                (err) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({
                                success: false,
                                message: "Error clearing bundle items.",
                            });
                        });
                    }

                    // Then delete all cart items
                    db.query("DELETE FROM cart WHERE user_id = ?", [userId], (err) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({
                                    success: false,
                                    message: "Error clearing cart.",
                                });
                            });
                        }

                        db.commit(err => {
                            if (err) {
                                return db.rollback(() => {
                                    res.status(500).json({
                                        success: false,
                                        message: "Error committing transaction.",
                                    });
                                });
                            }

                            res.status(200).json({
                                success: true,
                                message: "Cart cleared successfully.",
                            });
                        });
                    });
                }
            );
        });
    } else {
        return res.status(400).json({
            success: false,
            message: "Invalid request. Use ?clear=true to clear the cart.",
        });
    }
});

module.exports = router;