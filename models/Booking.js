import { mongoose } from "../config/constant.js";

const bookingSchema = new mongoose.Schema({
    user: {
        type: String,
        ref: "User",
        required: true,
    },
    room: {
        type: String,
        ref: "Room",
        required: true,
    },
    hotel: {
        type: String,
        ref: "Hotel",
        required: true,
    },
    checkInDate: {
        type: Date,
        required: true,
    },
    checkOutDate: {
        type: Date,
        required: true,
    },
    totalPrice: {
        type: Number,
        required: true,
    },
    guests: {
        type: Number,
        required: true,
    },
    paymentMethod: {
        type: String,
        required: true,
        default: "Pay At Hotel",
    },
    isPaid: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ["pending", "completed", "cancelled"],
        default: "pending",
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

// Middleware to automatically exclude deleted bookings
bookingSchema.pre('find', function () {
    this.where({ isDeleted: false });
});

bookingSchema.pre('findOne', function () {
    this.where({ isDeleted: false });
});

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;