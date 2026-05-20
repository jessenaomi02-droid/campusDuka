const express=require("express");
const cors=require("cors");
const db=require("./db");

const app=express();

app.use(cors());
app.use(express.json());

app.get("/",(req,res)=>{
res.send("CampusDuka backend running");
});

/* database test */

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

const PORT=
process.env.PORT || 3000;

app.listen(PORT,()=>{

console.log(
"Server running"
);

});

