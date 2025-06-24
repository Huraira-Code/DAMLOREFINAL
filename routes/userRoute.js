import express from "express";
import {
  handleHomePage,
  handleRejectImage,
  showListImagesToUser,
  showShootingListsToUser,
  showShootingSessionsToUser,
  handleSendImage,
} from "../controllers/controller.js";

const userRouter = express.Router();

userRouter.route("/home").get(handleHomePage);
userRouter.route("/sessions").get(showShootingSessionsToUser);
userRouter.route("/lists/:sessionId").get(showShootingListsToUser);
userRouter.route("/images/:listId").get(showListImagesToUser);
userRouter.route("/rejectImage/:id").patch(handleRejectImage);
userRouter.route("/send/:id").put(handleSendImage);

export default userRouter;
