const Delivery = require('../models/Delivery');

const deliveryController = {
    // Create a new delivery
    createDelivery: async (req, res) => {
        try {
            const deliveryData = req.body;
            const deliveryId = await Delivery.create(deliveryData);
            res.status(201).json({ message: 'Delivery created successfully', deliveryId });
        } catch (error) {
            res.status(500).json({ message: 'Error creating delivery', error: error.message });
        }
    },

    // Get delivery by ID
    getDeliveryById: async (req, res) => {
        try {
            const delivery = await Delivery.getDeliveryById(req.params.id);
            if (!delivery) {
                return res.status(404).json({ message: 'Delivery not found' });
            }
            res.json(delivery);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching delivery', error: error.message });
        }
    },

    // Get deliveries by order ID
    getDeliveriesByOrderId: async (req, res) => {
        try {
            const deliveries = await Delivery.getDeliveriesByOrderId(req.params.orderId);
            res.json(deliveries);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching deliveries', error: error.message });
        }
    },

    // Update delivery status
    updateDeliveryStatus: async (req, res) => {
        try {
            const { status } = req.body;
            const success = await Delivery.updateDeliveryStatus(req.params.id, status);
            if (!success) {
                return res.status(404).json({ message: 'Delivery not found' });
            }
            res.json({ message: 'Delivery status updated successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Error updating delivery status', error: error.message });
        }
    },

    // Get all deliveries
    getAllDeliveries: async (req, res) => {
        try {
            const deliveries = await Delivery.getAllDeliveries();
            res.json(deliveries);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching deliveries', error: error.message });
        }
    }
};

module.exports = deliveryController; 