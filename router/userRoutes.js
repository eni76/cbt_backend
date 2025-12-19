import express from "express";
import {


  registerSchool,
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/register", registerSchool);

export { userRouter };
