const axios = require('axios');
const RetryHandler = require('../utils/retryHandler');
require('dotenv').config();

class ShipmentService {
  constructor() {
    // Split base URL and endpoint properly
    this.apiUrl = 'https://apiv2.shiprocket.in/v1/external';
    this.createOrderEndpoint = '/orders/create/adhoc';
    this.apiToken = process.env.SHIPMENT_API_TOKEN;
    this.retryHandler = new RetryHandler(
      parseInt(process.env.MAX_RETRIES) || 3,
      parseInt(process.env.INITIAL_RETRY_DELAY) || 1000
    );

    // Configure axios instance
    this.axiosInstance = axios.create({
      baseURL: this.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiToken}`, // Set globally
      },
    });
  }

  /**
   * Split full name into first and last name
   * @param {string} fullName - Full customer name
   * @returns {Object} Object with firstName and lastName
   */
  splitName(fullName) {
    if (!fullName) {
      return { firstName: 'Customer', lastName: 'Name' };
    }
    
    const nameParts = fullName.trim().split(' ');
    if (nameParts.length === 1) {
      return { firstName: nameParts[0], lastName: '.' };
    }
    
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');
    
    return { firstName, lastName };
  }

  transformOrderData(orderData) {
    const { firstName, lastName } = this.splitName(orderData.customer_name);
    
    return {
      order_id: orderData.order_id,
      order_date: orderData.order_created_time,
      pickup_location: orderData.pickup_location,
      billing_customer_name: firstName,
      billing_last_name: lastName,
      billing_address: orderData.customer_address_line1,
      billing_address_2: orderData.customer_address_line2 || '',
      billing_city: orderData.customer_city,
      billing_pincode: orderData.customer_pincode,
      billing_state: orderData.customer_state,
      billing_country: orderData.customer_country,
      billing_email: orderData.customer_email,
      billing_phone: orderData.customer_phone,
      shipping_is_billing: true,
      order_items: orderData.order_items.map(item => ({
        name: item.sku_name,
        sku: item.sku,
        units: item.quantity,
        selling_price: item.sku_mrp.toString(),
        discount: '',
        tax: '',
        hsn: '',
      })),
      payment_method: orderData.order_type === 'COD' ? 'COD' : 'Prepaid',
      sub_total: orderData.invoice_value,
      length: orderData.dimensions.length,
      breadth: orderData.dimensions.breadth,
      height: orderData.dimensions.height,
      weight: orderData.dimensions.weight,
    };
  }

  /**
   * Create shipment via third-party API with retry mechanism
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} API response
   */
  async createShipment(orderData) {
    const transformedData = this.transformOrderData(orderData);

    const makeRequest = async () => {
      const response = await this.axiosInstance.post(
        this.createOrderEndpoint,
        transformedData
      );

      return response.data;
    };

    try {
      const result = await this.retryHandler.executeWithRetry(
        makeRequest,
        `Create Shipment API (Order: ${orderData.order_id})`
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('Shipment API Error:', error.message);
      console.error('Response:', error.response?.data);
      console.error('Status:', error.response?.status);
      
      return {
        success: false,
        error: {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        },
      };
    }
  }
}

module.exports = new ShipmentService();