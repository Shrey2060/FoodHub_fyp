-- Drop existing tables if they exist
DROP TABLE IF EXISTS pre_order_items;
DROP TABLE IF EXISTS pre_orders;

-- Create pre_orders table
CREATE TABLE pre_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    scheduled_date DATE NOT NULL,
    delivery_time TIME NOT NULL,
    delivery_address TEXT NOT NULL,
    special_instructions TEXT,
    order_status ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create pre_order_items table
CREATE TABLE pre_order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pre_order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pre_order_id) REFERENCES pre_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
); 