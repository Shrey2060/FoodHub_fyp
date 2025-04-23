-- Create subscription_plan_items table to associate products with subscription plans
CREATE TABLE IF NOT EXISTS `subscription_plan_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `plan_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_plan_product` (`plan_id`, `product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample data for testing (uncomment to use)
/*
INSERT INTO `subscription_plan_items` (`plan_id`, `product_id`) VALUES
(1, 1), -- Associate product ID 1 with plan ID 1
(1, 2), -- Associate product ID 2 with plan ID 1
(1, 3), -- Associate product ID 3 with plan ID 1
(2, 1), -- Associate product ID 1 with plan ID 2
(2, 2), -- Associate product ID 2 with plan ID 2
(2, 4), -- Associate product ID 4 with plan ID 2
(2, 5), -- Associate product ID 5 with plan ID 2
(3, 1), -- Associate product ID 1 with plan ID 3
(3, 2), -- Associate product ID 2 with plan ID 3
(3, 3), -- Associate product ID 3 with plan ID 3
(3, 4), -- Associate product ID 4 with plan ID 3
(3, 5), -- Associate product ID 5 with plan ID 3
(3, 6); -- Associate product ID 6 with plan ID 3
*/ 