import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema(
  {
    building_name: {
      type: String,
      required: true,
    },
    area_name: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const CustomerSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      unique: true,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    address: {
      type: AddressSchema,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Customer = mongoose.model("Customer", CustomerSchema);
