import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema.Types;

const cartItemSchema = new mongoose.Schema(
  {
    catalogue_id: {
      type: String,
      required: true,
    },
    sku_id: {
      type: String,
      required: true,
    },
    count: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const customerCartSchema = new mongoose.Schema(
  {
    customer: {
      type: ObjectId,
      ref: "Customer",
      required: true,
    },
    seller: {
      type: ObjectId,
      ref: "Seller",
      required: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

customerCartSchema.index({ customer: 1, seller: 1 }, { unique: true });

export const CustomerCart = mongoose.model("CustomerCart", customerCartSchema);
