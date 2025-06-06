import mongoose from "mongoose";

const shootingListSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
    },
    barcode: { type: String },
    gender: { type: String },
    size: { type: String },
    dimension: { type: String },
    arrival: { type: String },
    imageIDs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "imageModel",
      },
    ],
  },
  { timestamps: true }
);

const ShootingList = mongoose.model("shootingList", shootingListSchema);

export default ShootingList;
