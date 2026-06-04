const express=require("express");
const cors=require("cors");
const axios=require("axios");
const db=require("./db");
const app=express();

const CONSUMER_KEY=
process.env.CONSUMER_KEY;

const CONSUMER_SECRET=
process.env.CONSUMER_SECRET;

const BUSINESS_SHORTCODE=
process.env.BUSINESS_SHORTCODE;

const PASSKEY=
process.env.PASSKEY;

app.use(cors());
app.use(express.json());

/* HOME */

app.get("/",(req,res)=>{

res.send("CampusDuka backend running");

});


/* DATABASE TEST */

app.get("/test-db",async(req,res)=>{

try{

const result=
await db.query(
"SELECT NOW()"
);

res.json({

success:true,
time:result.rows[0]

});

}catch(err){

res.status(500).json({

success:false,
error:err.message

});

}

});

/* USERS TABLE */

app.get("/create-users",async(req,res)=>{

try{

await db.query(`

CREATE TABLE IF NOT EXISTS users(

id SERIAL PRIMARY KEY,

fullname VARCHAR(100),

email VARCHAR(100) UNIQUE,

phone VARCHAR(20),

password VARCHAR(255),

created_at TIMESTAMP
DEFAULT CURRENT_TIMESTAMP

)

`);

res.send(
"Users table created"
);

}catch(err){

res.send(
err.message
);

}

});


/* SIGNUP */

app.post("/signup",async(req,res)=>{

try{

const{

fullname,
email,
phone,
password

}=req.body;

await db.query(

`INSERT INTO users
(fullname,email,phone,password)

VALUES($1,$2,$3,$4)`,

[
fullname,
email,
phone,
password
]

);

res.json({

success:true,
message:"User created"

});

}catch(err){

res.status(500).json({

success:false,
error:err.message

});

}

});


/* LOGIN */

app.post("/login",async(req,res)=>{

try{

const{
email,
password
}=req.body;

const user=
await db.query(

`SELECT * FROM users
WHERE email=$1
AND password=$2`,

[
email,
password
]

);

if(user.rows.length===0){

return res.json({

success:false,
message:"Invalid email"

});

}

res.json({

success:true,
message:"Login successful",
user:user.rows[0]

});

}catch(err){

res.status(500).json({

success:false,
error:err.message

});

}

});


/* CREATE PRODUCTS TABLE */

app.get("/create-products",async(req,res)=>{

try{

await db.query(`

CREATE TABLE IF NOT EXISTS products(

id SERIAL PRIMARY KEY,

name VARCHAR(100),

description TEXT,

price INT,
seller_id INTEGER,
image TEXT,

category VARCHAR(50),

created_at TIMESTAMP
DEFAULT CURRENT_TIMESTAMP

)

`);
  db.query(`

CREATE TABLE IF NOT EXISTS sellers(

id SERIAL PRIMARY KEY,

name TEXT,

email TEXT UNIQUE,

phone VARCHAR(20),

password TEXT

)
`);

res.send(
"Products table created"
);

}catch(err){

res.send(
err.message
);

}

});


/* UPDATE PRODUCTS */

app.get("/update-products",async(req,res)=>{

try{

await db.query(

`ALTER TABLE products
ADD COLUMN IF NOT EXISTS images TEXT[]`

);

res.send(
"Products updated"
);

}catch(err){

res.send(
err.message
);

}

});


/* ADD PRODUCT */

app.post("/add-product",async(req,res)=>{

try{

// 1. Get data from frontend
const {
name,
description,
price,
images,
category,
seller_id
} = req.body;

// 2. Force status = pending (VERY IMPORTANT)
const status = "pending";

// 3. Save to database
await db.query(

`INSERT INTO products
(name,description,price,images,category,status,seller_id)

VALUES($1,$2,$3,$4,$5,$6,$7)`,

[
name,
description,
price,
images || [],
category,
status,
seller_id
]

);

// 4. Response
res.json({
success:true,
message:"Product submitted for approval"
});

}catch(err){

res.status(500).json({
success:false,
error:err.message
});

}

});


/* GET PRODUCTS */

app.get("/products",async(req,res)=>{

try{

const products=
await db.query(

`SELECT * FROM products

WHERE status='approved'

ORDER BY id DESC`

);

res.json(
products.rows
);

}catch(err){

res.send(
err.message
);

}

});

const PORT=
process.env.PORT || 3000;

app.delete("/delete-product/:id", async(req,res)=>{

try{

const id=req.params.id;

await db.query(

"DELETE FROM products WHERE id=$1",

[id]

);

res.json({

success:true,
message:"Deleted"

});

}catch(err){

res.status(500).json({

success:false,
error:err.message

});

}

});
app.put("/edit-product/:id",async(req,res)=>{

try{

const id=req.params.id;

const{

name,
description,
price

}=req.body;

await db.query(

`UPDATE products

SET
name=$1,
description=$2,
price=$3

WHERE id=$4`,

[
name,
description,
price,
id
]

);

res.json({

success:true,
message:"Updated"

});

}catch(err){

res.status(500).json({

success:false,
error:err.message

});

}

});
app.get("/update-status",async(req,res)=>{

try{

await db.query(

`ALTER TABLE products
ADD COLUMN IF NOT EXISTS status
VARCHAR(20)
DEFAULT 'approved'`

);

res.send(
"Status column added"
);

}catch(err){

res.send(
err.message
);

}

});
app.get("/pending-products",async(req,res)=>{

try{

const products=
await db.query(

`SELECT

products.*,

sellers.name AS seller_name,

sellers.email AS seller_email,

sellers.phone AS seller_phone

FROM products

LEFT JOIN sellers

ON products.seller_id=sellers.id

WHERE status='pending'

ORDER BY products.id DESC`

);

res.json(
products.rows
);

}catch(err){

res.send(
err.message
);

}

});

app.put("/approve-product/:id",async(req,res)=>{

try{

const id=req.params.id;

await db.query(

`UPDATE products

SET

status='approved',

rejection_reason=NULL

WHERE id=$1`,

[id]

);

res.json({

success:true,
message:"Product approved"

});

}catch(err){

res.status(500).json({

success:false,
error:err.message

});

}

});
app.put("/reject-product/:id",async(req,res)=>{

try{

const id=
req.params.id;

const{
reason
}=req.body;

await db.query(

`UPDATE products

SET

status='rejected',

rejection_reason=$1

WHERE id=$2`,

[
reason,
id
]

);

res.json({

success:true,
message:"Product rejected"

});

}catch(err){

res.status(500).json({

success:false,
error:err.message

});

}

});

app.post("/seller-register",async(req,res)=>{

try{

const{
name,
email,
phone,
password
}=req.body;

await db.query(

`INSERT INTO sellers
(name,email,phone,password)

VALUES($1,$2,$3,$4)`,

[
name,
email,
phone,
password
]

);

res.json({

success:true,
message:"Account created"

});

}catch(err){

res.status(500).json({

success:false,
error:err.message

});

}

});

app.post("/seller-login",async(req,res)=>{

try{

const{
email,
password
}=req.body;

const seller=
await db.query(

`SELECT * FROM sellers

WHERE email=$1
AND password=$2`,

[
email,
password
]

);

if(seller.rows.length===0){

return res.json({

success:false,
message:"Invalid credentials"

});

}

res.json({

success:true,
message:"Login successful",

seller:seller.rows[0]

});

}catch(err){

res.status(500).json({

success:false,
error:err.message

});

}

});
app.get("/add-seller-id",async(req,res)=>{

try{

await db.query(

`ALTER TABLE products

ADD COLUMN IF NOT EXISTS seller_id INTEGER`

);

res.send(
"seller_id column added"
);

}catch(err){

res.send(
err.message
);

}

});
app.get("/seller-products/:seller_id",async(req,res)=>{

try{

const seller_id=
req.params.seller_id;

const products=
await db.query(

`SELECT * FROM products

WHERE seller_id=$1

ORDER BY id DESC`,

[seller_id]

);

res.json(
products.rows
);

}catch(err){

res.status(500).json({

success:false,
error:err.message

});

}

});
app.get("/add-seller-phone",async(req,res)=>{

try{

await db.query(

`ALTER TABLE sellers

ADD COLUMN IF NOT EXISTS phone VARCHAR(20)`

);

res.send(
"Phone column added"
);

}catch(err){

res.send(
err.message
);

}

});
app.get("/all-sellers",async(req,res)=>{

try{

const sellers=
await db.query(

`SELECT * FROM sellers

ORDER BY id DESC`

);

res.json(
sellers.rows
);

}catch(err){

res.status(500).json({

success:false,
error:err.message

});

}

});
app.get("/all-users",async(req,res)=>{

try{

const users=
await db.query(

`SELECT *

FROM users

ORDER BY id DESC`

);

res.json(
users.rows
);

}catch(err){

res.status(500).json({

success:false,
error:err.message

});

}

});
app.get("/add-rejection-reason",async(req,res)=>{

try{

await db.query(

`ALTER TABLE products

ADD COLUMN IF NOT EXISTS rejection_reason TEXT`

);

res.send(
"rejection_reason column added"
);

}catch(err){

res.send(
err.message
);

}

});

app.get("/create-orders",async(req,res)=>{

try{

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

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

)

`);

res.send(
"Orders table created"
);

}catch(err){

res.send(
err.message
);

}

});

app.post("/create-order",async(req,res)=>{

try{

const{

buyer_name,
buyer_phone,
delivery_location,
seller_id,
product_id,
amount

}=req.body;

await db.query(

`INSERT INTO orders

(
buyer_name,
buyer_phone,
delivery_location,
seller_id,
product_id,
amount
)

VALUES($1,$2,$3,$4,$5,$6)`,

[
buyer_name,
buyer_phone,
delivery_location,
seller_id,
product_id,
amount
]

);

res.json({

success:true,
message:"Order created"

});

}catch(err){

res.status(500).json({

success:false,
error:err.message

});

}

});

app.get("/mpesa-token",async(req,res)=>{

try{

const auth=

Buffer.from(

`${CONSUMER_KEY}:${CONSUMER_SECRET}`

).toString("base64");

const response=
await axios.get(

"https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",

{

headers:{

Authorization:
`Basic ${auth}`

}

}

);

res.json({

success:true,
token:
response.data.access_token

});

}catch(err){

res.status(500).json({

success:false,
error:err.message

});

}

});

app.post("/stkpush",async(req,res)=>{

try{

const {phone,amount}=req.body;

const auth=

Buffer.from(

`${CONSUMER_KEY}:${CONSUMER_SECRET}`

).toString("base64");

const tokenResponse=
await axios.get(

"https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",

{
headers:{
Authorization:`Basic ${auth}`
}
}

);

const token=
tokenResponse.data.access_token;

const timestamp=

new Date()
.toISOString()
.replace(/[-:TZ.]/g,"")
.substring(0,14);

const password=

Buffer.from(
BUSINESS_SHORTCODE+
PASSKEY+
timestamp
).toString("base64");

const response=
await axios.post(

"https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",

{
BusinessShortCode:
BUSINESS_SHORTCODE,

Password:
password,

Timestamp:
timestamp,

TransactionType:
"CustomerPayBillOnline",

Amount:
amount,

PartyA:
phone,

PartyB:
BUSINESS_SHORTCODE,

PhoneNumber:
phone,

CallBackURL:
"https://campusduka-api.onrender.com/mpesa-callback",

AccountReference:
"CampusDuka",

TransactionDesc:
"CampusDuka Order"
},

{
headers:{
Authorization:`Bearer ${token}`
}
}

);

res.json(response.data);

}catch(err){

res.status(500).json({
success:false,
error:err.message
});

}

});

app.listen(PORT,()=>{

console.log(
"Server running"
);

});
