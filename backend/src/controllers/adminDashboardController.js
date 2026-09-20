const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");
const User = require("../models/User");

const paidRevenue = {
  $cond: [
    { $and: [{ $eq: ["$paymentStatus", "paid"] }, { $not: [{ $in: ["$bookingStatus", ["cancelled", "refunded"]] }] }] },
    "$totalAmount",
    0,
  ],
};

async function adminDashboard(req, res) {
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCMonth(start.getUTCMonth() - 5);

  const [bookings, properties, users, pendingOwners, pendingProperties, confirmedBookings, revenueRows, monthlyRows, statuses, recentBookings, topCities] = await Promise.all([
    Booking.countDocuments(),
    Hotel.countDocuments(),
    User.countDocuments(),
    User.countDocuments({ role: "vendor", status: { $in: ["pending", "under_review"] } }),
    Hotel.countDocuments({ verificationStatus: { $in: ["submitted", "under_review"] } }),
    Booking.countDocuments({ bookingStatus: "confirmed" }),
    Booking.aggregate([{ $group: { _id: null, revenue: { $sum: paidRevenue } } }]),
    Booking.aggregate([
      { $match: { createdAt: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: "UTC" } }, bookings: { $sum: 1 }, revenue: { $sum: paidRevenue } } },
      { $sort: { _id: 1 } },
    ]),
    Booking.aggregate([{ $group: { _id: "$bookingStatus", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Booking.find().select("invoiceNumber bookingStatus paymentStatus totalAmount createdAt hotel user").populate("hotel", "name city").populate("user", "name").sort({ createdAt: -1 }).limit(7).lean(),
    Hotel.aggregate([{ $match: { publicationStatus: "published" } }, { $group: { _id: "$city", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 5 }]),
  ]);

  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index, 1));
    const month = date.toISOString().slice(0, 7);
    const row = monthlyRows.find(item => item._id === month);
    return { month, bookings: row?.bookings || 0, revenue: row?.revenue || 0 };
  });

  res.json({
    summary: { bookings, properties, users, revenue: revenueRows[0]?.revenue || 0, pendingOwners, pendingProperties, confirmedBookings },
    months,
    statuses: statuses.map(item => ({ status: item._id || "unknown", count: item.count })),
    recentBookings,
    topCities: topCities.map(item => ({ city: item._id || "Unknown", count: item.count })),
  });
}

module.exports = { adminDashboard };
