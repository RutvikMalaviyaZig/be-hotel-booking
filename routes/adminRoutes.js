import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { signInAdmin, signUpAdmin, signOutAdmin, refreshToken, getAllUsers, getAllHotelOwners, getAllHotels, getAllRooms, getAllBookings, getHotelBookings, getUserBookings } from "../controllers/adminController.js";

const adminRouter = express.Router();

adminRouter.post("/sign-up", signUpAdmin);
adminRouter.post("/sign-in", signInAdmin);
adminRouter.post("/sign-out", protect, signOutAdmin);
adminRouter.post("/refresh-token", refreshToken);
adminRouter.get("/all-users", protect, getAllUsers);
adminRouter.get("/all-hotel-owners", protect, getAllHotelOwners);
adminRouter.get("/all-hotels", protect, getAllHotels);
adminRouter.get("/all-rooms", protect, getAllRooms);
adminRouter.get("/all-bookings", protect, getAllBookings);
adminRouter.get("/hotel-bookings/:id", protect, getHotelBookings);
adminRouter.get("/user-bookings/:id", protect, getUserBookings);

export default adminRouter;
