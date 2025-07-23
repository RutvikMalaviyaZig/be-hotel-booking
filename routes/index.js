import express from 'express';
import adminRouter from "./adminRoutes.js";
import bookingRoute from "./bookingRoutes.js";
import hotelRoute from "./hotelRoute.js";
import roomRoute from "./roomRoute.js";
import userRouter from "./userRoutes.js";
import webhookRouter from "./webhookRoutes.js";

const router = express.Router();

// Webhook routes must be before body parser
router.use('/webhooks', webhookRouter);

// Other routes
router.use("/admin", adminRouter);
router.use("/bookings", bookingRoute);
router.use("/hotels", hotelRoute);
router.use("/rooms", roomRoute);
router.use("/user", userRouter);

export default router;
