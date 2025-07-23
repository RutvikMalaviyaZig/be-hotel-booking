import { User } from "../models/index.js";
import { jwt, HTTP_STATUS_CODE } from "../config/constant.js";

export const protect = async (req, res, next) => {
    try {
        // get token from header
        const token = req.headers.authorization.split(" ")[1];
        // verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // get user id from token
        req.user = decoded.userId;
        // check if user exists
        if (!req.user) {
            return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({ success: false, message: req.__('General.Unauthorized') })
        } else {
            // get user from database
            const user = await User.findById(req.user);
            // check if user exists
            if (!user) {
                return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({ success: false, message: req.__('General.Unauthorized') })
            }
            // set user to req.user
            req.user = user;
            // call next middleware
            next();
        }
    } catch (error) {
        res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: req.__('General.InternalServerError') });
    }
}