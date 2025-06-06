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
      default: "Pending",
      enum: ["Pending", "Delivered"],
    },

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
