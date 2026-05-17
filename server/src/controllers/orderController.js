const Order = require("../models/Order");
const ProductVariant = require("../models/ProductVariant");
const InventoryTransaction = require("../models/InventoryTransaction");

// @desc    Create order (online)
// @route   POST /api/orders
const createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod, notes } = req.body;

    // Validate stock and compute totals
    let subtotal = 0;
    const enrichedItems = [];
    for (const item of items) {
      const variant = await ProductVariant.findById(item.variant).populate(
        "product",
        "name images",
      );
      if (!variant) {
        return res.status(404).json({
          success: false,
          message: `Variant ${item.variant} not found`,
        });
      }
      if (variant.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${variant.product.name} (${variant.size}/${variant.color})`,
        });
      }
      const price = variant.discountPrice || variant.price;
      subtotal += price * item.quantity;
      enrichedItems.push({
        product: variant.product._id,
        variant: variant._id,
        name: variant.product.name,
        size: variant.size,
        color: variant.color,
        image: variant.image || variant.product.images?.[0],
        price,
        quantity: item.quantity,
      });
    }

    const shippingCost = subtotal >= 1000 ? 0 : 80; // Free shipping above 1000 BDT
    const totalPrice = subtotal + shippingCost;

    const order = await Order.create({
      user: req.user?._id,
      items: enrichedItems,
      shippingAddress,
      subtotal,
      shippingCost,
      totalPrice,
      paymentMethod: paymentMethod || "cash_on_delivery",
      source: "online",
      notes,
    });

    // Reduce stock & log transactions
    for (const item of enrichedItems) {
      const variant = await ProductVariant.findById(item.variant);
      const before = variant.stock;
      variant.stock -= item.quantity;
      await variant.save();
      await InventoryTransaction.create({
        variant: item.variant,
        type: "sale",
        quantity: -item.quantity,
        stockBefore: before,
        stockAfter: variant.stock,
        source: "online",
        reference: order._id,
        referenceModel: "Order",
        createdBy: req.user?._id,
      });
    }

    res.status(201).json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user's orders
// @route   GET /api/orders/my
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort("-createdAt");
    res.json({ success: true, orders });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email phone",
    );
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    // Only allow owner or admin
    if (
      req.user.role !== "admin" &&
      req.user.role !== "staff" &&
      order.user?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all orders (admin)
// @route   GET /api/orders
const getAllOrders = async (req, res, next) => {
  try {
    const { status, source, page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (status) filter.orderStatus = status;
    if (source) filter.source = source;
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { "shippingAddress.fullName": { $regex: search, $options: "i" } },
        { "shippingAddress.phone": { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate("user", "name email")
      .sort("-createdAt")
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      orders,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus, paymentStatus, status } = req.body;
    const resolvedStatus = orderStatus || status;
    const update = {};

    if (resolvedStatus) {
      update.orderStatus = resolvedStatus;
      if (resolvedStatus === "delivered") update.deliveredAt = new Date();
    }

    // Explicit paymentStatus override from request (admin manually set it)
    if (paymentStatus) {
      update.paymentStatus = paymentStatus;
    }

    // Auto-logic for COD: collecting cash happens at delivery
    // Only auto-update if admin didn't explicitly send a paymentStatus
    if (!paymentStatus && resolvedStatus) {
      const existingOrder = await Order.findById(req.params.id).select(
        "paymentMethod paymentStatus",
      );
      if (existingOrder) {
        const isCOD = existingOrder.paymentMethod === "cash_on_delivery";
        if (isCOD && resolvedStatus === "delivered") {
          // Cash collected by delivery agent — mark paid
          update.paymentStatus = "paid";
        } else if (
          isCOD &&
          resolvedStatus === "cancelled" &&
          existingOrder.paymentStatus === "pending"
        ) {
          // COD cancelled before delivery — no money changed hands, stays pending
          // (no change needed, but explicitly do nothing)
        }
      }
    }

    const order = await Order.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// @desc    Create POS order (physical shop)
// @route   POST /api/orders/pos
const createPOSOrder = async (req, res, next) => {
  try {
    const {
      items,
      paymentMethod = "cash_pos",
      discount = 0,
      notes,
      customerName,
      customerPhone,
    } = req.body;

    let subtotal = 0;
    const enrichedItems = [];
    for (const item of items) {
      const variant = await ProductVariant.findById(item.variant).populate(
        "product",
        "name images",
      );
      if (!variant || variant.stock < item.quantity) {
        return res
          .status(400)
          .json({ success: false, message: `Stock issue: ${item.variant}` });
      }
      const price = variant.discountPrice || variant.price;
      subtotal += price * item.quantity;
      enrichedItems.push({
        product: variant.product._id,
        variant: variant._id,
        name: variant.product.name,
        size: variant.size,
        color: variant.color,
        image: variant.image || variant.product.images?.[0],
        price,
        quantity: item.quantity,
      });
    }

    const totalPrice = Math.max(0, subtotal - discount);
    const order = await Order.create({
      items: enrichedItems,
      shippingAddress: {
        fullName: customerName || "Walk-in Customer",
        phone: customerPhone || "0000000000",
        street: "Shop",
        city: "Dhaka",
      },
      subtotal,
      discount,
      totalPrice,
      paymentMethod,
      paymentStatus: "paid",
      orderStatus: "delivered",
      deliveredAt: new Date(),
      source: "pos",
      notes,
    });

    for (const item of enrichedItems) {
      const variant = await ProductVariant.findById(item.variant);
      const before = variant.stock;
      variant.stock -= item.quantity;
      await variant.save();
      await InventoryTransaction.create({
        variant: item.variant,
        type: "sale",
        quantity: -item.quantity,
        stockBefore: before,
        stockAfter: variant.stock,
        source: "pos",
        reference: order._id,
        referenceModel: "Order",
        createdBy: req.user?._id,
      });
    }

    res.status(201).json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
  createPOSOrder,
};
