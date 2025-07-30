import express from 'express';
import { protect } from "../middleware/authMiddleware.js";
import { registerHotel, updateHotel, deleteHotel, findHotelOnGeoLocation } from "../controllers/hotelController.js"

const hotelRoute = express.Router();

hotelRoute.post("/", protect, registerHotel);
hotelRoute.put("/", protect, updateHotel);
hotelRoute.delete("/", protect, deleteHotel);
hotelRoute.get("/", protect, findHotelOnGeoLocation);

export default hotelRoute;