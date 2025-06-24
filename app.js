import express from "express";
import dotenv from "dotenv";
import cors from "cors"; // ✅ Import CORS
import connectDB from "./db/connectDB.js";
import router from "./routes/unauthenticRoute.js";
import adminRouter from "./routes/adminRoute.js";
import userRouter from "./routes/userRoute.js";
import authenticationMiddleware from "./middleware/authentication.js";
import { authorizeAdmin } from "./middleware/authorizeAdmin.js";

const app = express();
dotenv.config();

app.use(cors()); // ✅ Allow CORS from all origins

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const PORT = process.env.PORT || 5000;
connectDB();

app.use("/", router);
app.use("/admin/", authenticationMiddleware, authorizeAdmin, adminRouter);
app.use("/user/", authenticationMiddleware, userRouter);

app.listen(PORT, () =>
  console.log(`Server is running at http://localhost:${PORT}`)
);
