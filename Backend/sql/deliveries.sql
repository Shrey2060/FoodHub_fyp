CREATE TABLE IF NOT EXISTS deliveries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    delivery_address TEXT NOT NULL,
    delivery_status ENUM('pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled') DEFAULT 'pending',
    estimated_delivery_time DATETIME,
    actual_delivery_time DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
); 