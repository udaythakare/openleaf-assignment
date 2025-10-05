const db = require('../config/database');
const shipmentService = require('./shipmentService');

class OrderService {
  
  async createOrder(orderData) {
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      // Check if order already exists
      const existingOrder = await client.query(
        'SELECT order_id FROM shipment_orders WHERE order_id = $1',
        [orderData.order_id]
      );

      if (existingOrder.rows.length > 0) {
        throw new Error(`Order with ID ${orderData.order_id} already exists`);
      }

      // Call third-party shipment API with retry mechanism
      console.log(`📦 Creating shipment for order: ${orderData.order_id}`);
      const shipmentResult = await shipmentService.createShipment(orderData);

      // Extract shipment details from API response
      let shipmentId = null;
      let shipmentStatus = 'pending';

      if (shipmentResult.success && shipmentResult.data) {
        shipmentId = shipmentResult.data.shipment_id || 
                     shipmentResult.data.order_id ||
                     null;
        shipmentStatus = shipmentResult.data.status || 'created';
      }

      // Insert order into database
      const orderInsertQuery = `
        INSERT INTO shipment_orders (
          order_id, order_created_time, pickup_location,
          customer_name, customer_address_line1, customer_address_line2,
          customer_pincode, customer_city, customer_state, customer_country,
          customer_phone, customer_email, invoice_value, dimensions,
          marketplace, order_type, cod_amount, gst_total_tax, tax_percentage,
          invoice_number, order_note, order_mode, shipment_api_response,
          shipment_id, shipment_status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
        ) RETURNING *
      `;

      const orderValues = [
        orderData.order_id,
        orderData.order_created_time,
        orderData.pickup_location,
        orderData.customer_name,
        orderData.customer_address_line1,
        orderData.customer_address_line2,
        orderData.customer_pincode,
        orderData.customer_city,
        orderData.customer_state,
        orderData.customer_country,
        orderData.customer_phone,
        orderData.customer_email,
        orderData.invoice_value,
        JSON.stringify(orderData.dimensions),
        orderData.marketplace,
        orderData.order_type,
        orderData.cod_amount,
        orderData.gst_total_tax,
        orderData.tax_percentage,
        orderData.invoice_number,
        orderData.order_note,
        orderData.order_mode,
        JSON.stringify(shipmentResult),
        shipmentId,
        shipmentStatus,
      ];

      const orderResult = await client.query(orderInsertQuery, orderValues);

      // Insert order items
      const itemInsertQuery = `
        INSERT INTO order_items (
          order_id, sku, sku_mrp, quantity, sku_name, brand_name, product_image
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;

      for (const item of orderData.order_items) {
        await client.query(itemInsertQuery, [
          orderData.order_id,
          item.sku,
          item.sku_mrp,
          item.quantity,
          item.sku_name,
          item.brand_name || '',
          item.product_image || '',
        ]);
      }

      await client.query('COMMIT');

      return {
        success: true,
        message: 'Order created successfully',
        order: orderResult.rows[0],
        shipmentResult: shipmentResult,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getOrderById(orderId) {
    const orderQuery = `
      SELECT 
        so.*,
        json_agg(
          json_build_object(
            'id', oi.id,
            'sku', oi.sku,
            'sku_mrp', oi.sku_mrp,
            'quantity', oi.quantity,
            'sku_name', oi.sku_name,
            'brand_name', oi.brand_name,
            'product_image', oi.product_image
          )
        ) as items
      FROM shipment_orders so
      LEFT JOIN order_items oi ON so.order_id = oi.order_id
      WHERE so.order_id = $1
      GROUP BY so.id
    `;

    const result = await db.query(orderQuery, [orderId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  async getAllOrders(limit = 50, offset = 0) {
    const ordersQuery = `
      SELECT 
        so.*,
        json_agg(
          json_build_object(
            'id', oi.id,
            'sku', oi.sku,
            'sku_mrp', oi.sku_mrp,
            'quantity', oi.quantity,
            'sku_name', oi.sku_name,
            'brand_name', oi.brand_name,
            'product_image', oi.product_image
          )
        ) as items
      FROM shipment_orders so
      LEFT JOIN order_items oi ON so.order_id = oi.order_id
      GROUP BY so.id
      ORDER BY so.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await db.query(ordersQuery, [limit, offset]);
    return result.rows;
  }
}

module.exports = new OrderService();