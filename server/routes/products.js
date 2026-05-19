const router=require("express").Router();

router.get("/",(req,res)=>{
res.send("Products route working");
});

module.exports=router;
