import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getUserData, signInUser, signUpUser, storeRecentSearchedCities, signOutUser, refreshToken, googleSignIn, getUserDetails } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.get("/", protect, getUserData);
userRouter.post("/store-recent-search", protect, storeRecentSearchedCities);
userRouter.post("/sign-up", signUpUser);
userRouter.post("/sign-in", signInUser);
userRouter.post("/sign-out", protect, signOutUser);
userRouter.post("/refresh-token", refreshToken);
userRouter.post("/google-sign-in", googleSignIn);
userRouter.get("/user-details", protect, getUserDetails);

export default userRouter;
