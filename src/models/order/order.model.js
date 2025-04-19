import mongoose, { Schema } from "mongoose";
import { AddressSchema } from "../user/customer.model.js";
const { ObjectId } = mongoose.Schema.Types;

const OrderStatusSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: [
        "pending",
        "ready to ship",
        "pickup pending",
        "intransit",
        "delivered",
        "rto intransit",
        "rto delivered",
        "lost",
      ],
    },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ProductSchema = new mongoose.Schema(
  {
    customer_product_short_id: String,
    customer_sku_short_id: String,
    size: String,
    product_name: String,
    product_image: String,
    quantity_to_buy: Number,
    mrp: Number,
    selling_price_per_unit: Number,
    effective_price: Number,
  },
  { _id: false }
);

const BillDetailsSchema = new mongoose.Schema(
  {
    items: Number,
    item_total: Number,
    sale_discount: Number,
    coupon_discount: Number,
    delivery_fee: Number,
    total_amount: Number,
    total_mrp: Number,
  },
  { _id: false }
);

const CouponDetailsSchema = new mongoose.Schema(
  {
    short_id: String,
    code: String,
    title: String,
    discount_type: { type: String, enum: ["fixed", "percentage"] },
    discount_amount_applied: Number,
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    order_id: { type: String, unique: true, required: true },
    status_history: [OrderStatusSchema],
    payment_mode: {
      type: String,
      enum: ["cod", "online"],
      required: true,
    },
    products: [ProductSchema],
    bill_details: BillDetailsSchema,
    coupon_details: CouponDetailsSchema,
    seller: {
      type: ObjectId,
      ref: "Seller",
      required: true,
    },
    customer_details: {
      name: { type: String },
      phone: {
        type: String,
        required: true,
      },
      address: AddressSchema,
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", OrderSchema);
