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
  const { from, to } = req.query;
  const validDate = value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
  if ((from && !validDate(from)) || (to && !validDate(to)) || (from && to && from > to)) {
    return res.status(422).json({ message: "Choose a valid date range" });
  }
  const createdAt = {};
  if (from) createdAt.$gte = new Date(`${from}T00:00:00+05:30`);
  if (to) createdAt.$lt = new Date(new Date(`${to}T00:00:00+05:30`).getTime() + 86400000);
  const dateFilter = Object.keys(createdAt).length ? { createdAt } : {};

  const start = from ? new Date(`${from.slice(0, 7)}-01T00:00:00Z`) : new Date();
  if (!from && !to) start.setUTCMonth(start.getUTCMonth() - 5);
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  const end = to ? new Date(`${to.slice(0, 7)}-01T00:00:00Z`) : new Date();
  const graphFilter = Object.keys(createdAt).length ? dateFilter : { createdAt: { $gte: start } };

  const [bookings, properties, users, pendingOwners, pendingProperties, confirmedBookings, revenueRows, monthlyRows, statuses, recentBookings, topCities] = await Promise.all([
    Booking.countDocuments(dateFilter),
    Hotel.countDocuments(dateFilter),
    User.countDocuments(dateFilter),
    User.countDocuments({ ...dateFilter, role: "vendor", status: { $in: ["pending", "under_review"] } }),
    Hotel.countDocuments({ ...dateFilter, verificationStatus: { $in: ["submitted", "under_review"] } }),
    Booking.countDocuments({ ...dateFilter, bookingStatus: "confirmed" }),
    Booking.aggregate([{ $match: dateFilter }, { $group: { _id: null, revenue: { $sum: paidRevenue } } }]),
    Booking.aggregate([
      { $match: graphFilter },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: "Asia/Kolkata" } }, bookings: { $sum: 1 }, revenue: { $sum: paidRevenue } } },
      { $sort: { _id: 1 } },
    ]),
    Booking.aggregate([{ $match: dateFilter }, { $group: { _id: "$bookingStatus", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Booking.find(dateFilter).select("invoiceNumber bookingStatus paymentStatus totalAmount createdAt hotel user").populate("hotel", "name city").populate("user", "name").sort({ createdAt: -1 }).limit(7).lean(),
    Hotel.aggregate([{ $match: { ...dateFilter, publicationStatus: "published" } }, { $group: { _id: "$city", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 5 }]),
  ]);

  const monthCount = Math.max(1, (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth() + 1);
  const months = Array.from({ length: monthCount }, (_, index) => {
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
