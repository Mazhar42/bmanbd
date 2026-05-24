const User = require("../models/User");
const Order = require("../models/Order");

const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort("-createdAt")
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    res.json({ success: true, total, users });
  } catch (err) {
    next(err);
  }
};

const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    const orders = await Order.find({ user: req.params.id })
      .sort("-createdAt")
      .limit(10);
    res.json({ success: true, user, orders });
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const allowed = ["name", "email", "phone", "role", "isActive"];
    const updates = {};
    allowed.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });
    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalOrders,
      monthOrders,
      lastMonthOrders,
      totalRevenue,
      monthRevenue,
      totalCustomers,
      pendingOrders,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.countDocuments({
        createdAt: { $gte: startOfLastMonth, $lt: startOfMonth },
      }),
      Order.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
      Order.aggregate([
        {
          $match: { paymentStatus: "paid", createdAt: { $gte: startOfMonth } },
        },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
      User.countDocuments({ role: "user" }),
      Order.countDocuments({ orderStatus: "pending" }),
    ]);

    // Sales by day (last 7 days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d.setHours(0, 0, 0, 0));
      const end = new Date(d.setHours(23, 59, 59, 999));
      const agg = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            paymentStatus: "paid",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalPrice" },
            count: { $sum: 1 },
          },
        },
      ]);
      last7Days.push({
        date: start.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        revenue: agg[0]?.total || 0,
        orders: agg[0]?.count || 0,
      });
    }

    res.json({
      success: true,
      stats: {
        totalOrders,
        monthOrders,
        lastMonthOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        monthRevenue: monthRevenue[0]?.total || 0,
        totalCustomers,
        pendingOrders,
      },
      salesChart: last7Days,
    });
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res
        .status(400)
        .json({
          success: false,
          message: "You cannot delete your own account",
        });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res.json({ success: true, message: "User permanently deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllUsers,
  getUser,
  updateUser,
  getDashboardStats,
  deleteUser,
};
