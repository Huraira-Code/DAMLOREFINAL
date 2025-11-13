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
const allowedOrigins = [
  'https://glittery-pastelito-13a69e.netlify.app',
  'https://oneframedam.oneframeagency.com',
  'http://oneframedam.oneframeagency.com',
  'http://localhost:3000', // for local development
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS: ' + origin));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
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


