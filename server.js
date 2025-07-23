import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDB from "./config/db.js";
import router from "./routes/index.js";
import connectCloudinary from "./config/cloudinary.js";
import { i18n } from "./config/constant.js";
import { corsOptions } from "./config/security.js";

connectDB();
connectCloudinary();

const app = express();

// Initialize i18n first
app.use(i18n.init);

// Apply CORS
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json());

// Parse JSON bodies (must come after the webhook route)
app.use(express.json());
// app.use(clerkMiddleware());

// API routes
app.use("/api", router);

app.get("/", (req, res) => {
    res.status(200).json({ success: true, message: "Server is running in ec2 instance" });
});
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
