import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        default: "admin",
    },
    password: {
        type: String,
        required: true,
    },
    refreshToken: {
        type: String,
    },
    accessToken: {
        type: String,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;
