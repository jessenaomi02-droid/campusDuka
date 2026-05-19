const router=require("express").Router();

router.get("/",(req,res)=>{
res.send("Events route working");
});

module.exports=router;
