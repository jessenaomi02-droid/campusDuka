const express = require("express");
const cors = require("cors");
const axios = require("axios");
const db = require("./db");
const app = express();
const cloudinary = require("cloudinary").v2;
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({
  storage: multer.memoryStorage()
});

const CONSUMER_KEY = process.env.CONSUMER_KEY;
const CONSUMER_SECRET = process.env.CONSUMER_SECRET;
const BUSINESS_SHORTCODE = process.env.BUSINESS_SHORTCODE;
const PASSKEY = process.env.PASSKEY;

app.use(cors());
app.use(express.json());

/* HOME */
app.get("/", (req, res) => {
  res.send("CampusDuka backend running");
});

/* DATABASE TEST */
app.get("/test-db", async (req, res) => {
  try {
    const result = await db.query("SELECT NOW()");
    res.json({
      success: true,
      time: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/* SETUP EXTENDED DB COLUMNS AND TABLES (NEW ADMIN & FEATURE BOOST FEATURES) */
app.get("/setup-extended-features", async (req, res) => {
  try {
    // 1. Create Feedback Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        user_type VARCHAR(20), -- 'buyer' or 'seller'
        name VARCHAR(100),
        email VARCHAR(100),
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Add structural financial columns to orders
    await db.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(10,2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS seller_payout NUMERIC(10,2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS payout_status VARCHAR(20) DEFAULT 'pending'
    `);

    // 3. Add advertising feature metrics to products table
    await db.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS featured_days INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS ad_charge NUMERIC(10,2) DEFAULT 0.00
    `);

    res.send("Extended Admin features database columns added successfully!");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/* USERS TABLE */
app.get("/create-users", async (req, res) => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,
        fullname VARCHAR(100),
        email VARCHAR(100) UNIQUE,
        phone VARCHAR(20),
        password VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    res.send("Users table created");
  } catch (err) {
    res.send(err.message);
  }
});

/* SIGNUP */
app.post("/signup", async (req, res) => {
  try {
    const { fullname, email, phone, password } = req.body;
    await db.query(
      `INSERT INTO users (fullname,email,phone,password) VALUES($1,$2,$3,$4)`,
      [fullname, email, phone, password]
    );
    res.json({
      success: true,
      message: "User created"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/* LOGIN */
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await db.query(
      `SELECT * FROM users WHERE email=$1 AND password=$2`,
      [email, password]
    );
    if (user.rows.length === 0) {
      return res.json({
        success: false,
        message: "Invalid email"
      });
    }
    res.json({
      success: true,
      message: "Login successful",
      user: user.rows[0]
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/* CREATE PRODUCTS TABLE */
app.get("/create-products", async (req, res) => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS products(
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        description TEXT,
        price INT,
        seller_id INTEGER,
        image TEXT,
        category VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS sellers(
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE,
        phone VARCHAR(20),
        password TEXT
      )
    `);
    res.send("Products table created");
  } catch (err) {
    res.send(err.message);
  }
});

/* UPDATE PRODUCTS */
app.get("/update-products", async (req, res) => {
  try {
    await db.query(
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[]`
    );
    res.send("Products updated");
  } catch (err) {
    res.send(err.message);
  }
});

/* ADD PRODUCT */
app.post("/add-product", async (req, res) => {
  try {
    const { name, description, price, images, category, seller_id } = req.body;
    const status = "pending";
    const featured = false;

    const seller = await db.query(
      "SELECT * FROM sellers WHERE id=$1",
      [seller_id]
    );
    const sellerData = seller.rows[0];

    let limit = 0;
    if (sellerData.subscription_plan === "free") { 
      limit = 2;
    } else if (sellerData.subscription_plan === "copper") {
      limit = 20;
    } else if (sellerData.subscription_plan === "bronze") {
      limit = 100;
    } else if (sellerData.subscription_plan === "gold") {
      limit = 999999;
    }

    if (sellerData.business_model === "subscription" && sellerData.uploads_used >= limit) {
      return res.json({
        success: false,
        message: `Your ${sellerData.subscription_plan} plan upload limit has been reached.`
      });
    }

    await db.query(
      `
      INSERT INTO products
      (name, description, price, images, category, status, seller_id, featured)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      `,
      [name, description, price, images || [], category, status, seller_id, featured]
    );

    await db.query(
      `UPDATE sellers SET uploads_used=uploads_used+1 WHERE id=$1`,
      [seller_id]
    );

    res.json({
      success: true,
      message: "Product submitted for approval"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/* GET PRODUCTS */
app.get("/products", async (req, res) => {
  try {
    const products = await db.query(
      `SELECT
        products.*,
        sellers.name AS seller_name,
        sellers.email AS seller_email,
        sellers.phone AS seller_phone
      FROM products
      LEFT JOIN sellers ON products.seller_id=sellers.id
      WHERE status='approved'
      ORDER BY products.featured DESC, products.id DESC`
    );
    res.json(products.rows);
  } catch (err) {
    res.send(err.message);
  }
});

app.delete("/delete-product/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await db.query("DELETE FROM products WHERE id=$1", [id]);
    res.json({
      success: true,
      message: "Deleted"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.put("/edit-product/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { name, description, price } = req.body;
    await db.query(
      `UPDATE products SET name=$1, description=$2, price=$3 WHERE id=$4`,
      [name, description, price, id]
    );
    res.json({
      success: true,
      message: "Updated"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.get("/update-status", async (req, res) => {
  try {
    await db.query(
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'approved'`
    );
    res.send("Status column added");
  } catch (err) {
    res.send(err.message);
  }
});

app.get("/pending-products", async (req, res) => {
  try {
    const products = await db.query(
      `SELECT
        products.*,
        sellers.name AS seller_name,
        sellers.email AS seller_email,
        sellers.phone AS seller_phone
      FROM products
      LEFT JOIN sellers ON products.seller_id=sellers.id
      WHERE status='pending'
      ORDER BY products.id DESC`
    );
    res.json(products.rows);
  } catch (err) {
    res.send(err.message);
  }
});

app.put("/approve-product/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await db.query(
      `UPDATE products SET status='approved', rejection_reason=NULL WHERE id=$1`,
      [id]
    );
    res.json({
      success: true,
      message: "Product approved"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.put("/reject-product/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { reason } = req.body;
    await db.query(
      `UPDATE products SET status='rejected', rejection_reason=$1 WHERE id=$2`,
      [reason, id]
    );
    res.json({
      success: true,
      message: "Product rejected"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.post("/seller-register", async (req, res) => {
  try {
    const { name, email, phone, password, seller_type, business_model, subscription_plan } = req.body;
    await db.query(
      `
      INSERT INTO sellers
      (name, email, phone, password, seller_type, business_model, subscription_plan)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [name, email, phone, password, seller_type, business_model, subscription_plan || "free"]
    );
    res.json({
      success: true,
      message: "Account created"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.post("/seller-login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const seller = await db.query(
      `SELECT * FROM sellers WHERE email=$1 AND password=$2`,
      [email, password]
    );
    if (seller.rows.length === 0) {
      return res.json({
        success: false,
        message: "Invalid credentials"
      });
    }
    res.json({
      success: true,
      message: "Login successful",
      seller: seller.rows[0]
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.get("/add-seller-id", async (req, res) => {
  try {
    await db.query(
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_id INTEGER`
    );
    res.send("seller_id column added");
  } catch (err) {
    res.send(err.message);
  }
});

app.get("/seller-products/:seller_id", async (req, res) => {
  try {
    const seller_id = req.params.seller_id;
    const products = await db.query(
      `SELECT * FROM products WHERE seller_id=$1 ORDER BY id DESC`,
      [seller_id]
    );
    res.json(products.rows);
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.get("/add-seller-phone", async (req, res) => {
  try {
    await db.query(
      `ALTER TABLE sellers ADD COLUMN IF NOT EXISTS phone VARCHAR(20)`
    );
    res.send("Phone column added");
  } catch (err) {
    res.send(err.message);
  }
});

app.get("/all-sellers", async (req, res) => {
  try {
    const sellers = await db.query(`SELECT * FROM sellers ORDER BY id DESC`);
    res.json(sellers.rows);
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.get("/all-users", async (req, res) => {
  try {
    const users = await db.query(`SELECT * FROM users ORDER BY id DESC`);
    res.json(users.rows);
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.get("/add-rejection-reason", async (req, res) => {
  try {
    await db.query(
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS rejection_reason TEXT`
    );
    res.send("rejection_reason column added");
  } catch (err) {
    res.send(err.message);
  }
});

app.get("/create-orders", async (req, res) => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS orders(
        id SERIAL PRIMARY KEY,
        buyer_name TEXT,
        buyer_phone VARCHAR(20),
        delivery_location TEXT,
        seller_id INTEGER,
        product_id INTEGER,
        amount INTEGER,
        payment_status VARCHAR(30) DEFAULT 'pending',
        delivery_status VARCHAR(30) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        commission_amount NUMERIC(10,2) DEFAULT 0.00,
        seller_payout NUMERIC(10,2) DEFAULT 0.00,
        payout_status VARCHAR(20) DEFAULT 'pending'
      )
    `);
    res.send("Orders table created");
  } catch (err) {
    res.send(err.message);
  }
});

/* CREATE ORDER (UPDATED TO AUTOMATICALLY COMPUTE COMMISSIONS / PAYOUT PARTS) */
app.post("/create-order", async (req, res) => {
  try {
    const { buyer_name, buyer_phone, delivery_location, seller_id, product_id, amount } = req.body;
    
    // Compute splitting fractions (10% commission fee)
    const rawAmt = parseFloat(amount);
    const commSplit = rawAmt * 0.10;
    const finalPayout = rawAmt - commSplit;

    await db.query(
      `INSERT INTO orders
      (buyer_name, buyer_phone, delivery_location, seller_id, product_id, amount, commission_amount, seller_payout, payout_status)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [buyer_name, buyer_phone, delivery_location, seller_id, product_id, rawAmt, commSplit, finalPayout, 'pending']
    );

    res.json({
      success: true,
      message: "Order created"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.get("/mpesa-token", async (req, res) => {
  try {
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString("base64");
    const response = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      { headers: { Authorization: `Basic ${auth}` } }
    );
    res.json({
      success: true,
      token: response.data.access_token
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/* STK PUSH (UPDATED TO ROBUSTLY PARSE INCOMING DATA KEYS AND ENFORCED STRICT TYPING) */
app.post("/stkpush", async (req, res) => {
  try {
    const { fullname, phone, location, cart, amount } = req.body;
    
    if (!cart || cart.length === 0) {
      return res.status(400).json({ success: false, error: "Cart cannot be empty" });
    }

    const firstItem = cart[0];

    // Safely check frontend variations of Product ID and Seller ID
    const resolvedProductId = firstItem.product_id || firstItem.id || null;
    const resolvedSellerId = firstItem.seller_id || firstItem.sellerId || null;

    if (!resolvedProductId || !resolvedSellerId) {
      return res.status(400).json({
        success: false,
        error: `Could not identify product/seller values. ID: ${resolvedProductId}, Seller: ${resolvedSellerId}`
      });
    }

    // Compute splits for payment metrics
    const rawAmt = parseFloat(amount);
    const commSplit = rawAmt * 0.10;
    const finalPayout = rawAmt - commSplit;

    const orderResult = await db.query(
      `
      INSERT INTO orders
      (buyer_name, buyer_phone, delivery_location, seller_id, product_id, amount, commission_amount, seller_payout, payout_status)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING id
      `,
      [fullname, phone, location, resolvedSellerId, resolvedProductId, rawAmt, commSplit, finalPayout, 'pending']
    );

    const orderId = orderResult.rows[0].id;
    console.log("Order Created:", orderId);

    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString("base64");
    const tokenResponse = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      { headers: { Authorization: `Basic ${auth}` } }
    );

    const token = tokenResponse.data.access_token;
    const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").substring(0, 14);
    const password = Buffer.from(BUSINESS_SHORTCODE + PASSKEY + timestamp).toString("base64");

    const response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        BusinessShortCode: BUSINESS_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(rawAmt),
        PartyA: phone,
        PartyB: BUSINESS_SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: "https://campusduka-api.onrender.com/mpesa-callback",
        AccountReference: `ORDER_${orderId}`,
        TransactionDesc: "CampusDuka Order"
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    res.json({
      orderId,
      ResponseCode: response.data.ResponseCode,
      CustomerMessage: response.data.CustomerMessage,
      ResponseDescription: response.data.ResponseDescription,
      CheckoutRequestID: response.data.CheckoutRequestID
    });
  } catch (err) {
    console.error("STK Push Failure context:", err.response ? err.response.data : err.message);
    res.status(500).json({
      success: false,
      error: err.message,
      details: err.response ? err.response.data : null
    });
  }
});

app.post("/mpesa-callback", async (req, res) => {
  console.log("CALLBACK RECEIVED");
  const callback = req.body.Body.stkCallback;

  if (callback.ResultCode === 0) {
    await db.query(
      `UPDATE orders SET payment_status='paid' WHERE id=(SELECT MAX(id) FROM orders)`
    );
    console.log("Order marked as PAID");
  } else {
    await db.query(
      `UPDATE orders SET payment_status='failed' WHERE id=(SELECT MAX(id) FROM orders)`
    );
    console.log("Order marked as FAILED");
  }

  res.status(200).json({
    ResultCode: 0,
    ResultDesc: "Accepted"
  });
});

app.get("/orders", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
        orders.*,
        products.name AS product_name,
        products.images AS product_images,
        products.price AS product_price
      FROM orders
      LEFT JOIN products ON orders.product_id = products.id
      ORDER BY orders.id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.put("/update-delivery-status/:id", async (req, res) => {
  try {
    const { status } = req.body;
    await db.query(
      `UPDATE orders SET delivery_status=$1 WHERE id=$2`,
      [status, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.get("/orders/:phone", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
        orders.*,
        products.name AS product_name,
        products.images AS product_images,
        products.price AS product_price
      FROM orders
      LEFT JOIN products ON orders.product_id = products.id
      WHERE orders.buyer_phone = $1
      ORDER BY orders.id DESC`,
      [req.params.phone]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.delete("/delete-order/:id", async (req, res) => {
  try {
    const order = await db.query("SELECT * FROM orders WHERE id=$1", [req.params.id]);
    if (order.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }
    if (order.rows[0].delivery_status !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "Only delivered orders can be deleted"
      });
    }
    await db.query("DELETE FROM orders WHERE id=$1", [req.params.id]);
    res.json({
      success: true,
      message: "Order deleted successfully"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.get("/test-cloudinary", async (req, res) => {
  try {
    const result = await cloudinary.api.ping();
    res.json({
      success: true,
      result
    });
  } catch (err) {
    res.json({
      success: false,
      error: err.message
    });
  }
});

app.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(
      `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`
    );
    res.json({
      success: true,
      url: result.secure_url
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    }); 
  }
});

app.get("/rejected-products", async (req, res) => {
  try {
    const products = await db.query(
      `SELECT
        products.*,
        sellers.name AS seller_name,
        sellers.email AS seller_email
      FROM products
      LEFT JOIN sellers ON products.seller_id=sellers.id
      WHERE status='rejected'
      ORDER BY products.id DESC`
    );
    res.json(products.rows);
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.get("/seller-details/:id", async (req, res) => {
  try {
    const seller = await db.query("SELECT * FROM sellers WHERE id=$1", [req.params.id]);
    const products = await db.query(
      `SELECT * FROM products WHERE seller_id=$1 ORDER BY id DESC`,
      [req.params.id]
    );
    const orders = await db.query(
      `SELECT * FROM orders WHERE seller_id=$1 ORDER BY id DESC`,
      [req.params.id]
    );
    res.json({
      seller: seller.rows[0],
      products: products.rows,
      orders: orders.rows
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.get("/test-upload", (req, res) => {
  res.send("UPLOAD ROUTE WORKING");
});

app.get("/add-seller-model", async (req, res) => {
  try {
    await db.query(`ALTER TABLE sellers ADD COLUMN IF NOT EXISTS seller_type VARCHAR(20)`);
    await db.query(`ALTER TABLE sellers ADD COLUMN IF NOT EXISTS business_model VARCHAR(20)`);
    res.send("seller_type and business_model added");
  } catch (err) {
    res.send(err.message);
  }
});

app.get("/upgrade-subscriptions", async (req, res) => {
  try {
    await db.query(`ALTER TABLE sellers ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(20) DEFAULT 'free'`);
    await db.query(`ALTER TABLE sellers ADD COLUMN IF NOT EXISTS uploads_used INTEGER DEFAULT 0`);
    await db.query(`ALTER TABLE sellers ADD COLUMN IF NOT EXISTS subscription_expiry DATE`);
    res.send("Subscription columns added");
  } catch (err) {
    res.send(err.message);
  }
});

app.put("/upgrade-plan/:seller_id", async (req, res) => {
  try {
    const seller_id = req.params.seller_id;
    const { plan } = req.body;
    let expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    await db.query(
      `UPDATE sellers SET subscription_plan=$1, subscription_expiry=$2 WHERE id=$3`,
      [plan, expiry, seller_id]
    );
    res.json({
      success: true,
      message: `Plan upgraded to ${plan}`
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.get("/add-featured", async (req, res) => {
  try {
    await db.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE`);
    res.send("Featured column added");
  } catch (err) {
    res.send(err.message);
  }
});

/* SUBMIT FEEDBACK */
app.post("/feedback", async (req, res) => {
  try {
    const { user_type, name, email, message } = req.body;
    await db.query(
      `INSERT INTO feedback (user_type, name, email, message) VALUES ($1, $2, $3, $4)`,
      [user_type, name, email, message]
    );
    res.json({ success: true, message: "Thank you for your feedback!" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* GET ALL FEEDBACKS */
app.get("/all-feedback", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM feedback ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* SETTLE PAYOUT */
app.put("/payout-seller/:order_id", async (req, res) => {
  try {
    await db.query(
      `UPDATE orders SET payout_status = 'paid_to_seller' WHERE id = $1`,
      [req.params.order_id]
    );
    res.json({ success: true, message: "Payout updated successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* REQUEST PRODUCT FEATURE / BOOST (With KES 50 Per Day Rate calculation logic) */
app.put("/feature-product/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Fallback safely to 1 day if 'days' is missing from request body
    const days = parseInt(req.body.days) || 1; 
    const DAILY_RATE = 50;
    const totalCost = days * DAILY_RATE;

    // Persist to PostgreSQL Database
    const result = await db.query(
      `UPDATE products 
       SET featured = true, featured_days = $1, ad_charge = $2 
       WHERE id = $3 
       RETURNING id, name, featured, featured_days, ad_charge`,
      [days, totalCost, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product listing not found"
      });
    }

    const updatedProduct = result.rows[0];

    res.json({
      success: true,
      message: "Product successfully scheduled for home page promotion!",
      productId: updatedProduct.id,
      name: updatedProduct.name,
      featured: updatedProduct.featured,
      days_promoted: updatedProduct.featured_days,
      total_cost: updatedProduct.ad_charge,
      payment_terms: `Payment of KES ${totalCost} will be deducted from your payout balance.`
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/* STK PUSH SUBSCRIPTION */
app.post("/stkpush-subscription", async (req, res) => {
  try {
    const { seller_id, phone, plan, amount } = req.body;
    let formattedPhone = phone;
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.substring(1);
    }

    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString("base64");
    const tokenResponse = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      { headers: { Authorization: `Basic ${auth}` } }
    );

    const token = tokenResponse.data.access_token;
    const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").substring(0, 14);
    const password = Buffer.from(BUSINESS_SHORTCODE + PASSKEY + timestamp).toString("base64");

    const payment = await db.query(
      `
      INSERT INTO subscription_payments (seller_id, plan, amount, checkout_request_id, status)
      VALUES ($1, $2, $3, 'pending', 'pending')
      RETURNING id
      `,
      [seller_id, plan, amount]
    );

    const response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        BusinessShortCode: BUSINESS_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: BUSINESS_SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: "https://campusduka-api.onrender.com/subscription-callback",
        AccountReference: `SELLER_${seller_id}`,
        TransactionDesc: `${plan} Subscription`
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log("STK Response:", response.data);
    await db.query(
      `UPDATE subscription_payments SET checkout_request_id=$1 WHERE id=$2`,
      [response.data.CheckoutRequestID, payment.rows[0].id]
    );

    res.json({
      success: true,
      seller_id,
      plan,
      CheckoutRequestID: response.data.CheckoutRequestID,
      CustomerMessage: response.data.CustomerMessage
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.get("/create-subscription-payments", async (req, res) => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS subscription_payments(
        id SERIAL PRIMARY KEY,
        seller_id INTEGER,
        plan VARCHAR(20),
        amount INTEGER,
        checkout_request_id TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    res.send("Subscription payments table created");
  } catch (err) {
    res.send(err.message);
  }
});

app.post("/subscription-callback", async (req, res) => {
  try {
    console.log("SUBSCRIPTION CALLBACK RECEIVED");
    console.log(JSON.stringify(req.body, null, 2));

    const callback = req.body.Body.stkCallback;
    const checkoutRequestID = callback.CheckoutRequestID;

    if (callback.ResultCode === 0) {
      const payment = await db.query(
        `SELECT * FROM subscription_payments WHERE checkout_request_id=$1`,
        [checkoutRequestID]
      );

      if (payment.rows.length > 0) {
        const seller_id = payment.rows[0].seller_id;
        const plan = payment.rows[0].plan;
        let expiry = new Date();
        expiry.setDate(expiry.getDate() + 30);

        await db.query(
          `UPDATE sellers SET subscription_plan=$1, subscription_expiry=$2, uploads_used=0 WHERE id=$3`,
          [plan, expiry, seller_id]
        );

        await db.query(
          `UPDATE subscription_payments SET status='paid' WHERE checkout_request_id=$1`,
          [checkoutRequestID]
        );
        console.log("Seller upgraded.");
      }
    }

    res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Accepted"
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.get("/subscription-status/:checkoutId", async (req, res) => {
  try {
    const payment = await db.query(
      `SELECT status FROM subscription_payments WHERE checkout_request_id=$1`,
      [req.params.checkoutId]
    );
    if (payment.rows.length === 0) {
      return res.json({
        success: false,
        status: "not_found"
      });
    }
    res.json({
      success: true,
      status: payment.rows[0].status
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
