const express=require("express");
const cors=require("cors");

const app=express();

app.use(cors());
app.use(express.json());

const products=require("./routes/products");
const events=require("./routes/events");
const users=require("./routes/users");

app.use("/api/products",products);
app.use("/api/events",events);
app.use("/api/users",users);

app.get("/",(req,res)=>{
res.send("CampusDuka backend running");
});

const PORT=process.env.PORT || 3000;

app.listen(PORT,()=>{
console.log("Server running");
});
