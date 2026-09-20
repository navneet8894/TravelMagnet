const AuditLog=require("../models/AuditLog");
const clean=value=>{if(!value)return value;const copy=JSON.parse(JSON.stringify(value));for(const key of ["password","token","accessToken","refreshToken","authOtpHash","twoFactorSecretHash","resetPasswordTokenHash"])delete copy[key];return copy};
async function audit(req,{action,resourceType,resourceId,previous,next,reason,outcome="success"}){try{await AuditLog.create({actor:req.user?._id,actorRole:req.user?.role,action,resourceType,resourceId,previous:clean(previous),next:clean(next),reason,outcome,ip:req.ip,userAgent:req.get("user-agent")})}catch(error){console.error("Audit write failed",error.message)}}
module.exports={audit};
