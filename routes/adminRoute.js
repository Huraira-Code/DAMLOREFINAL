import express from "express";
import {
  handleHomePage,
  handleUploadImage,
  handleImageDelete,
  createShootingList,
  deleteShootingList,
  createShootingSession,
  deleteShootingSession,
  addNotesToImage,
  handleSendImage,
  getAllShootingSession,
  getAllShootingList,
  getAllImagesOfList,
  getAllUsers,
  handleUpdateSession,
  handleUpdateList,
  updateImageMetadata,
} from "../controllers/controller.js";
import { upload } from "../middleware/multer.js";
const adminRouter = express.Router();

// Home Page
adminRouter.route("/home").get(handleHomePage);

// Image Post Route
adminRouter
  .route("/upload")
  .post(upload.array("files", 10), handleUploadImage);

// Add Notes
adminRouter.route("/notes/:id").post(addNotesToImage);

// Image Delete Route
adminRouter.route("/deleteimage/:listId/:id").delete(handleImageDelete);

// Create Shooting List Route
adminRouter.route("/createlist").post(createShootingList);

// Get All Shooting List Route
adminRouter.route("/:id/lists").get(getAllShootingList);

// Delete Shooting List Route
adminRouter.route("/deletelist/:sessionId/:id").delete(deleteShootingList);

// Create Shooting Session Route
adminRouter.route("/createsession").post(createShootingSession);

// Get All Shooting Session Route
adminRouter.route("/sessions").get(getAllShootingSession);

// Get All Images of List Route
adminRouter.route("/images/:listId").get(getAllImagesOfList);

// Delete Shooting Session Route
adminRouter.route("/deletesession/:id").delete(deleteShootingSession);

// Send Image Route
  adminRouter.route("/send/:id").put(handleSendImage);

// Get All Users Route
adminRouter.route("/users").get(getAllUsers);

// Get All Images Of A List Route
adminRouter.route("/images/:listId").get(getAllImagesOfList);
adminRouter.route("/images/:imageId").put(updateImageMetadata);

// Update Session Route
adminRouter.route("/session/:sessionId").patch(handleUpdateSession);
// Update Session Route
adminRouter.route("/list/:listId").patch(handleUpdateList);

export default adminRouter;
