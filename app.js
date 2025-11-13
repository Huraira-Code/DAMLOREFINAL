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
const corsOptions = {
  origin: 'https://glittery-pastelito-13a69e.netlify.app', // ✅ Allow requests from your frontend's origin
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // ✅ Specify allowed HTTP methods
  credentials: true, // ✅ Allow cookies to be sent with requests (if needed for authentication)
  optionsSuccessStatus: 204 // ✅ Set the status code for successful OPTIONS preflight requests
};

// Apply the CORS middleware with the defined options
app.use(cors(corsOptions));
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

