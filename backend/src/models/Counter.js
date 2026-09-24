const mongoose=require("mongoose");
const schema=new mongoose.Schema({_id:{type:String,required:true},value:{type:Number,default:0}},{versionKey:false});
module.exports=mongoose.model("Counter",schema);
