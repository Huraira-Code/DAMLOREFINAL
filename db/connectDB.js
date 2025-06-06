import mongoose from "mongoose";

const connectDB = () => {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("database connecteed successfully");
    })
    .catch(() => {
      console.log("database Error");
    });
};

export default connectDB;
