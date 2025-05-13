const pool = require('../db');

class Delivery {
    static async create(deliveryData) {
        const { order_id, delivery_address, delivery_status, estimated_delivery_time } = deliveryData;
        const [result] = await pool.execute(
            'INSERT INTO deliveries (order_id, delivery_address, delivery_status, estimated_delivery_time) VALUES (?, ?, ?, ?)',
            [order_id, delivery_address, delivery_status, estimated_delivery_time]
        );
        return result.insertId;
    }

    static async getDeliveryById(deliveryId) {
        const [rows] = await pool.execute(
            'SELECT * FROM deliveries WHERE id = ?',
            [deliveryId]
        );
        return rows[0];
    }

    static async getDeliveriesByOrderId(orderId) {
        const [rows] = await pool.execute(
            'SELECT * FROM deliveries WHERE order_id = ?',
            [orderId]
        );
        return rows;
    }

    static async updateDeliveryStatus(deliveryId, status) {
        const [result] = await pool.execute(
            'UPDATE deliveries SET delivery_status = ? WHERE id = ?',
            [status, deliveryId]
        );
        return result.affectedRows > 0;
    }

    static async getAllDeliveries() {
        const [rows] = await pool.execute('SELECT * FROM deliveries');
        return rows;
    }
}

module.exports = Delivery; 