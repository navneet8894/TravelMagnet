const mongoose = require("mongoose");
const inventoryHoldSchema = new mongoose.Schema({
  booking:{type:mongoose.Schema.Types.ObjectId,ref:"Booking",required:true,unique:true},user:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},hotel:{type:mongoose.Schema.Types.ObjectId,ref:"Hotel",required:true},roomType:{type:mongoose.Schema.Types.ObjectId,ref:"RoomType",required:true,index:true},dates:[Date],quantity:{type:Number,required:true,min:1},status:{type:String,enum:["active","confirmed","released","expired"],default:"active",index:true},expiresAt:{type:Date,required:true,index:true}
},{timestamps:true});
inventoryHoldSchema.index({expiresAt:1},{expireAfterSeconds:86400});
module.exports=mongoose.model("InventoryHold",inventoryHoldSchema);
