import express from 'express';
import { protect } from "../middleware/authMiddleware.js";
import { registerHotel } from "../controllers/hotelController.js"

const hotelRoute = express.Router();

hotelRoute.post("/", protect, registerHotel);

export default hotelRoute;