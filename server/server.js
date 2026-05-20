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
const PORT=
process.env.PORT || 3000;

app.listen(PORT,()=>{

console.log(
"Server running"
);

});
