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

    shootingListIDs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "shootingList",
      },
    ],
  },
  { timestamps: true }
);

const ShootingSession = mongoose.model(
  "shootingSession",
  shootingSessionSchema
);

export default ShootingSession;
