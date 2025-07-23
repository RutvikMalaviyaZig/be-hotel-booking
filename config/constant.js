import "dotenv/config";
import stripe from "stripe";
import { SQSClient } from "@aws-sdk/client-sqs";
import transporter from "./nodemailer.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import { Webhook } from "svix";
import cron from 'node-cron';
import multer from "multer";
import i18n from "i18n";
import validator from "validatorjs";

// Get directory path in ES modules
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure i18n
i18n.configure({
  locales: ['en'], // Default to English
  defaultLocale: 'en',
  directory: join(__dirname, 'locales'),
  objectNotation: true,
  updateFiles: false,
  autoReload: true,
  syncFiles: true,
  register: global
});

const SQS = new SQSClient({
  region: process.env.AWS_REGION,
});

const EVENT_TYPES = {
  BOOKING: "booking",
  PAYMENT: "payment",
}

const ACTIONS = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
}

const MESSAGES = {
  INVALID_TYPE: "Invalid type",
  INVALID_ACTION: "Invalid action",
  INVALID_ID: "Booking ID is required for deletion",
  NOT_FOUND: "Booking not found",
}

const HTTP_STATUS_CODE = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
}

// JWT Expiry
const TOKEN_EXPIRY = {
  USER_ACCESS_TOKEN: '1d',
  USER_REFRESH_TOKEN: '7d',
  ADMIN_ACCESS_TOKEN: '7d',
  ADMIN_REFRESH_TOKEN: '7d',
};

const USER_ROLES = {
  HOTEL_OWNER: 'hotelOwner',
  ADMIN: 'admin',
  USER: 'user',
};

const PAYMENT_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
};


const BOOKING_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

const CURRENCY = {
  USD: "USD",
  INR: "INR",
};

const PAYMENT_METHOD = {
  STRIPE: "stripe",
};

const PAYMENT_EVENTS = {
  PAYMENT_INTENT_SUCCEEDED: "payment_intent.succeeded",
  PAYMENT_INTENT_PAYMENT_FAILED: "payment_intent.payment_failed",
  PAYMENT_INTENT_CANCELED: "payment_intent.canceled",
}

const VALIDATION_EVENTS = {
  CREATE_USER: "createUser",
  UPDATE_USER: "updateUser",
  DELETE_USER: "deleteUser",
  STORE_RECENT_SEARCHED_CITIES: "storeRecentSearchedCities",
  SIGN_IN_USER: "signInUser",
  SIGN_OUT_USER: "signOutUser",
  CREATE_ADMIN: "createAdmin",
  UPDATE_ADMIN: "updateAdmin",
  DELETE_ADMIN: "deleteAdmin",
  SIGN_IN_ADMIN: "signInAdmin",
  SIGN_OUT_ADMIN: "signOutAdmin",
  CREATE_HOTEL: "createHotel",
  UPDATE_HOTEL: "updateHotel",
  DELETE_HOTEL: "deleteHotel",
  CREATE_ROOM: "createRoom",
  UPDATE_ROOM: "updateRoom",
  DELETE_ROOM: "deleteRoom",
  CREATE_BOOKING: "createBooking",
  UPDATE_BOOKING: "updateBooking",
  DELETE_BOOKING: "deleteBooking",
  CHECK_AVAILABILITY: "checkAvailability",
  GET_HOTEL_BOOKINGS: "getHotelBookings",
  GET_USER_BOOKINGS: "getUserBookings",
  TOGGLE_ROOM_AVAILABILITY: "toggleRoomAvailability",
  GET_OWNER_ROOMS: "getOwnerRooms",
  GOOGLE_SIGN_IN: "googleSignIn",
}

export default i18n;

export { SQS, cron, stripe, transporter, mongoose, bcrypt, jwt, cloudinary, Webhook, multer, EVENT_TYPES, ACTIONS, MESSAGES, HTTP_STATUS_CODE, TOKEN_EXPIRY, USER_ROLES, PAYMENT_STATUS, BOOKING_STATUS, CURRENCY, PAYMENT_METHOD, validator, PAYMENT_EVENTS, VALIDATION_EVENTS, i18n };