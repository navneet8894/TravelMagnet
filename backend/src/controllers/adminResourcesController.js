const Payment = require("../models/Payment");
const Review = require("../models/Review");
const AIConversation = require("../models/AIConversation");
const AdminRole = require("../models/AdminRole");
const FraudAlert = require("../models/FraudAlert");
const Hotel = require("../models/Hotel");

const resources = {
  payments: Payment,
  reviews: Review,
  "ai-monitoring": AIConversation,
  roles: AdminRole,
  "fraud-alerts": FraudAlert,
};

async function listAdminResource(req, res) {
  const Model = resources[req.params.section];
  if (!Model) return res.status(404).json({ message: "Admin section not found" });
  const rows = await Model.find().sort({ createdAt: -1 }).limit(200).lean();
  res.json(rows);
}

async function listReviews(req, res) {
  const filter = req.user.role === "admin" ? {} : req.user.role === "vendor"
    ? { hotel: { $in: await Hotel.find({ owner: req.user._id }).distinct("_id") } }
    : { user: req.user._id };
  res.json(await Review.find(filter).populate("hotel", "name city").sort({ createdAt: -1 }).limit(200).lean());
}

module.exports = { listAdminResource, listReviews };
