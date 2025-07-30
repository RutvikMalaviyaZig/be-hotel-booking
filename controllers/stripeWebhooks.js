import { stripe, HTTP_STATUS_CODE, BOOKING_STATUS, PAYMENT_STATUS, PAYMENT_METHOD, PAYMENT_EVENTS, db, MODELS, ObjectId } from "../config/constant.js";
import { Booking } from "../models/index.js";

/**
* @name stripeWebhooks
* @file stripeWebhooks.js
* @param {Request} req
* @param {Response} res
* @description stripe webhooks
* @author Rutvik Malaviya (Zignuts)
*/
export const stripeWebhooks = async (req, res) => {
    try {
        // get data from request headers and body
        const sig = req.headers["stripe-signature"];
        const rawBody = req.rawBody || JSON.stringify(req.body);

        // check if signature is present
        if (!sig) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ error: req.__('Stripe.WebhookSignatureVerificationFailed'), received: false });
        }

        // check if webhook secret is present
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({ error: req.__('Stripe.ServerConfigurationError'), received: false });
        }

        let event;
        try {
            // construct event
            event = stripe.webhooks.constructEvent(
                rawBody,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (error) {
            // if signature verification fails return error
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
                error: req.__('Stripe.WebhookSignatureVerificationFailed'),
                message: error.message,
                received: false
            });
        }

        // get payment intent and booking id
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata?.bookingId;

        // check if booking id is present
        if (!bookingId) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ error: req.__('Stripe.NoBookingIdInMetadata') });
        }

        try {
            // update booking status based on payment intent status
            switch (event.type) {
                case PAYMENT_EVENTS.PAYMENT_INTENT_SUCCEEDED: {
                    // update booking status
                    const updatedBooking = await db.collection(MODELS.BOOKING).updateOne(
                        { _id: new ObjectId(String(bookingId)) },
                        {
                            status: BOOKING_STATUS.COMPLETED,
                            paymentStatus: PAYMENT_STATUS.PAID,
                            paymentId: paymentIntent.id,
                            paymentDate: new Date(),
                            isPaid: true,
                            paymentMethod: PAYMENT_METHOD.STRIPE
                        },
                        { new: true }
                    );

                    // if booking not found return error
                    if (!updatedBooking) {
                        return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({ error: req.__('Booking.BookingNotFound') });
                    }
                    break;
                }
                // if payment failed
                case PAYMENT_EVENTS.PAYMENT_INTENT_PAYMENT_FAILED: {
                    // update booking status
                    await db.collection(MODELS.BOOKING).updateOne(
                        { _id: new ObjectId(String(bookingId)) },
                        {
                            status: BOOKING_STATUS.PAYMENT_FAILED,
                            paymentStatus: PAYMENT_STATUS.FAILED,
                            paymentError: paymentIntent.last_payment_error?.message,
                            isPaid: false
                        }
                    );
                    break;
                }
                // if payment canceled
                case PAYMENT_EVENTS.PAYMENT_INTENT_CANCELED: {
                    // update booking status
                    await db.collection(MODELS.BOOKING).updateOne(
                        { _id: new ObjectId(String(bookingId)) },
                        {
                            status: BOOKING_STATUS.CANCELLED,
                            paymentStatus: PAYMENT_STATUS.CANCELLED,
                            isPaid: false
                        }
                    );
                    break;
                }
                // default case
                default:
                    return res.json({ received: true });
            }
            // commit the transaction
            await session.commitTransaction();
            session.endSession();
            return res.json({ received: true });
        } catch (error) {
            // if anything goes wrong, abort the transaction and end the session and return error
            await session.abortTransaction();
            session.endSession();
            return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
                error: req.__('Booking.UpdateFailed'),
                message: error.message
            });
        }
    } catch (error) {
        // if anything goes wrong, abort the transaction and end the session and return error
        await session.abortTransaction();
        session.endSession();
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            error: req.__('Booking.UpdateFailed'),
            message: error.message
        });
    }
};
