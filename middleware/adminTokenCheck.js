import { Admin } from "../models/index.js";
import { jwt, HTTP_STATUS_CODE } from "../config/constant.js";

export const protect = async (req, res, next) => {
    try {
        // get token from header
        const token = req.headers.authorization.split(" ")[1];
        // verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // get user id from token
        req.auth.userId = decoded.userId;
        // check if user exists
        if (!req.auth.userId) {
            return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({ success: false, message: "Unauthorized" })
        } else {
            // get user from database
            const admin = await Admin.findById(req.auth.userId);
            // check if user exists
            if (!admin) {
                return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({ success: false, message: "Unauthorized" })
            }
            // set user to req.user
            req.user = admin;
            // call next middleware
            next();
        }
    } catch (error) {
        res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
}