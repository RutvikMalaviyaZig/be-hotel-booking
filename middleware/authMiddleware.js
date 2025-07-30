import { jwt, HTTP_STATUS_CODE, db } from "../config/constant.js";
import { ObjectId } from "mongodb";

export const protect = async (req, res, next) => {
    try {
        // get token from header
        const token = req.headers.authorization.split(" ")[1];
        // verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // get user id from token
        const userId = decoded.userId;
        // check if user exists
        if (!userId) {
            return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({ success: false, message: req.__('General.Unauthorized') })
        } else {
            // get user from database
            const user = await db.collection("users").findOne({ _id: new ObjectId(String(userId)) });

            // check if user exists
            if (!user) {
                return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({ success: false, message: req.__('General.Unauthorized') })
            }
            // set user to req.user
            req.user = {
                ...user,
                _id: user._id.toString()
            };
            // call next middleware
            next();
        }
    } catch (error) {
        res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ success: false, message: req.__('General.InternalServerError') });
    }
}