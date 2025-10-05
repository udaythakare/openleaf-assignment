const { pool } = require('../../config/database');

const createTablesSQL = `
-- Drop tables if they exist
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS shipment_orders CASCADE;

-- Create shipment_orders table
CREATE TABLE shipment_orders (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(100) UNIQUE NOT NULL,
  order_created_time TIMESTAMP NOT NULL,
  pickup_location VARCHAR(255),
  customer_name VARCHAR(255) NOT NULL,
  customer_address_line1 TEXT NOT NULL,
  customer_address_line2 TEXT,
  customer_pincode VARCHAR(20) NOT NULL,
  customer_city VARCHAR(100) NOT NULL,
  customer_state VARCHAR(100) NOT NULL,
  customer_country VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  invoice_value DECIMAL(10, 2) NOT NULL,
  dimensions JSONB,
  marketplace VARCHAR(100),
  order_type VARCHAR(50) NOT NULL,
  cod_amount DECIMAL(10, 2) DEFAULT 0,
  gst_total_tax DECIMAL(10, 2) DEFAULT 0,
  tax_percentage DECIMAL(5, 2) DEFAULT 0,
  invoice_number VARCHAR(100),
  order_note TEXT,
  order_mode VARCHAR(50),
  shipment_api_response JSONB,
  shipment_id VARCHAR(100),
  shipment_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create order_items table
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(100) NOT NULL REFERENCES shipment_orders(order_id) ON DELETE CASCADE,
  sku VARCHAR(100) NOT NULL,
  sku_mrp DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  sku_name VARCHAR(255) NOT NULL,
  brand_name VARCHAR(255),
  product_image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_shipment_orders_order_id ON shipment_orders(order_id);
CREATE INDEX idx_shipment_orders_customer_email ON shipment_orders(customer_email);
CREATE INDEX idx_shipment_orders_created_at ON shipment_orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
`;

async function runMigration() {
  try {
    console.log('Running database migrations...');
    await pool.query(createTablesSQL);
    console.log('Database migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();