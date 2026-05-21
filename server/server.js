const express=require("express");
const cors=require("cors");
const db=require("./db");

const app=express();

app.use(cors());
app.use(express.json());

/* Home route */

app.get("/",(req,res)=>{

res.send("CampusDuka backend running");

});


/* Database test */

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

res.status(500)
.json({
success:false,
error:err.message
});

}

});


/* Create users table */

app.get("/create-users",async(req,res)=>{

try{

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

res.send(
"Users table created"
);

}catch(err){

res.status(500)
.send(
err.message
);

}

});

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

res.status(500)
.json({
success:false,
error:err.message
});

}

});
app.get("/test-signup",async(req,res)=>{

try{

await db.query(

`INSERT INTO users
(fullname,email,phone,password)

VALUES($1,$2,$3,$4)`,

[
"Jesse",
"jesse@test.com",
"0712345678",
"12345"
]

);

res.send(
"Test user added"
);

}catch(err){

res.send(
err.message
);

}

});
app.post("/login",async(req,res)=>{

try{

const {email,password}=req.body;

const user=
await db.query(

`SELECT * FROM users
WHERE email=$1
AND password=$2`,

[email,password]

);

if(user.rows.length===0){

return res.json({
success:false,
message:"Invalid email or password"
});

}

res.json({
success:true,
message:"Login successful",
user:user.rows[0]
});

}catch(err){

res.status(500)
.json({
success:false,
error:err.message
});

}

});
app.get("/create-products",async(req,res)=>{

try{

await db.query(`

CREATE TABLE IF NOT EXISTS products(
id SERIAL PRIMARY KEY,
name VARCHAR(100),
description TEXT,
price INT,
image TEXT,
category VARCHAR(50),
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

`);

res.send("Products table created");

}catch(err){

res.send(err.message);

}

});
app.post("/add-product",async(req,res)=>{

try{

const{
name,
description,
price,
image,
category
}=req.body;

await db.query(

`INSERT INTO products
(name,description,price,image,category)

VALUES($1,$2,$3,$4,$5)`,

[
name,
description,
price,
image,
category
]

);

res.json({

success:true,
message:"Product added"

});

}catch(err){

res.status(500)
.json({

success:false,
error:err.message

});

}

});
app.get("/products",async(req,res)=>{

try{

const products=
await db.query(
"SELECT * FROM products ORDER BY id DESC"
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
const PORT=
process.env.PORT || 3000;

app.listen(PORT,()=>{

console.log(
"Server running"
);

});
