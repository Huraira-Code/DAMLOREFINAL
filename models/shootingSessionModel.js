import mongoose from "mongoose";

const shootingSessionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    assignedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    barcode: { type: String },
    gender: { type: String },
    merchandisingclass: { type: String },
    assetypes: {
      type: String,
      enum: ["On Model", "Ghost", "Still Life", "Video"], // Corrected! Each value is a separate string.
    },
    arrival: { type: String },
    imageIDs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "imageModel",
      },
    ],
    // shootingListIDs: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "shootingList",
    //   },
    // ],
  },
  { timestamps: true }
);

const ShootingSession = mongoose.model(
  "shootingSession",
  shootingSessionSchema
);

export default ShootingSession;
