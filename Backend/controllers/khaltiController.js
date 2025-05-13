const axios = require('axios');

const initiatePayment = async (req, res, next) => {
  try {
    const { amount, orderId, customerName, customerEmail, customerPhone } = req.body;

    const response = await axios.post(
      'https://a.khalti.com/api/v2/epayment/initiate/',
      {
        return_url: `${process.env.FRONTEND_URL}/payment/verify`,
        website_url: process.env.FRONTEND_URL,
        amount: amount * 100, // Convert to paisa
        purchase_order_id: orderId,
        purchase_order_name: `Order ${orderId}`,
        customer_info: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone
        }
      },
      {
        headers: {
          'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      data: {
        pidx: response.data.pidx,
        payment_url: response.data.payment_url
      }
    });
  } catch (error) {
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { pidx } = req.params;

    const response = await axios.post(
      'https://a.khalti.com/api/v2/epayment/lookup/',
      { pidx },
      {
        headers: {
          'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.status !== 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment is not completed'
      });
    }

    res.json({
      success: true,
      data: {
        status: response.data.status,
        amount: response.data.amount / 100, // Convert from paisa to rupees
        transaction_id: response.data.transaction_id,
        order_id: response.data.purchase_order_id
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initiatePayment,
  verifyPayment
}; 