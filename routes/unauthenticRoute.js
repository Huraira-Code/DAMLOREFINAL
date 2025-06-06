import express from "express";
import {
  handleUserLogin,
  handleUserSignup,
} from "../controllers/controller.js";

const router = express.Router();

router.route("/signup").post(handleUserSignup);
router.route("/login").post(handleUserLogin);

export default router;
