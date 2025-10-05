const orderService = require('../services/orderService');

class OrderController {
  /**
   * Create new order
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async createOrder(req, res) {
    try {
      const orderData = req.body;

      // Validate required fields
      const requiredFields = [
        'order_id',
        'order_created_time',
        'customer_name',
        'customer_address_line1',
        'customer_pincode',
        'customer_city',
        'customer_state',
        'customer_country',
        'customer_phone',
        'customer_email',
        'order_items',
        'invoice_value',
        'dimensions',
        'order_type',
      ];

      const missingFields = requiredFields.filter(field => !orderData[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
          missingFields,
        });
      }

      // Validate order items
      if (!Array.isArray(orderData.order_items) || orderData.order_items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'order_items must be a non-empty array',
        });
      }

      // Validate dimensions
      const requiredDimensions = ['height', 'length', 'weight', 'breadth'];
      const missingDimensions = requiredDimensions.filter(
        dim => !orderData.dimensions[dim]
      );

      if (missingDimensions.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Missing required dimensions',
          missingDimensions,
        });
      }

      const result = await orderService.createOrder(orderData);

      return res.status(201).json({
        success: true,
        message: result.message,
        data: {
          order_id: result.order.order_id,
          shipment_id: result.order.shipment_id,
          shipment_status: result.order.shipment_status,
          created_at: result.order.created_at,
        },
        shipment_api_response: result.shipmentResult,
      });
    } catch (error) {
      console.error('Create Order Error:', error);

      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to create order',
        error: error.message,
      });
    }
  }

 
  async getOrder(req, res) {
    try {
      const { orderId } = req.params;

      const order = await orderService.getOrderById(orderId);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      console.error('Get Order Error:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve order',
        error: error.message,
      });
    }
  }

 
  async getAllOrders(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      const orders = await orderService.getAllOrders(limit, offset);

      return res.status(200).json({
        success: true,
        count: orders.length,
        data: orders,
      });
    } catch (error) {
      console.error('Get All Orders Error:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve orders',
        error: error.message,
      });
    }
  }
}

module.exports = new OrderController();