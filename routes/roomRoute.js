import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import { createRoom, getRooms, getOwnerRooms, toggleRoomAvailability } from "../controllers/roomController.js";
import { protect } from "../middleware/authMiddleware.js";

const roomRoute = express.Router();

roomRoute.post("/", upload.array("images", 4), protect, createRoom);
roomRoute.get("/", getRooms);
roomRoute.get("/owner", protect, getOwnerRooms);
roomRoute.post("/toggle-availability", protect, toggleRoomAvailability);

export default roomRoute;