import mongoose from "mongoose";
import saveImageVersion from "../services/imageVersion.service.js";

const imageModelSchema = new mongoose.Schema(
  {
    imageURL: { type: String, required: true },
    status: {
      type: String,
      required: true,
      default: "SHOT",
      enum: ["SHOT", "IN PROGRESS", "READY", "DELIVERED"],
    },
    sku: { type: String },
    barcode: { type: String },
    gender: { type: String },
    merchandisingclass: { type: String },
    assetypes: {
      type: String,
      enum: ["On Model", "Ghost", "Still Life", "Video"],
    },
    arrival: { type: String },
    comments: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
        content: { type: String },
      },
    ],
    notes: [{ type: String }],
        versionHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: "imageVersion" }],

  },
  { timestamps: true }
);

// Pre-save hook for versioning
imageModelSchema.pre("save", async function (next) {
  if (!this.isNew && this.isModified()) {
    await saveImageVersion(this);
  }
  next();
});

const ImageModel = mongoose.model("imageModel", imageModelSchema);
export default ImageModel;
