import mongoose from "mongoose";

const imageVersionSchema = new mongoose.Schema(
  {
    imageId: { type: mongoose.Schema.Types.ObjectId, ref: "imageModel" },
    versionNumber: Number,
    data: mongoose.Schema.Types.Mixed,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    reason: String,
  },
  { timestamps: true }
);

const ImageVersion = mongoose.model("imageVersion", imageVersionSchema);
export default ImageVersion;
