import mongoose from "mongoose";

const imageModelSchema = new mongoose.Schema(
  {
    imageURL: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      required: true,
      default: "SHOT",
      enum: ["SHOT", "IN PROGRESS", "APPROVED", "DELIVERED"],
    },
    sku: {
      type: String,
    },
    barcode: { type: String },
    gender: { type: String },
    merchandisingclass: { type: String },
    assetypes: {
      type: String,
      enum: ["On Model", "Ghost", "Still Life", "Video"], // Corrected! Each value is a separate string.
    },
    arrival: { type: String },
    comments: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user",
        },

        content: {
          type: String,
        },
      },
    ],

    notes: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

const ImageModel = mongoose.model("imageModel", imageModelSchema);

export default ImageModel;
