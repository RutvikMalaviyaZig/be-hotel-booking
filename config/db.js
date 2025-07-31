import mongoose from "mongoose";
import { MongoClient } from "mongodb";
import { INDEX_NAME, INDEX_OPTIONS, MODELS } from "./constant.js";
// const connectDB = async () => {
//     try {
//         mongoose.connection.on('connected', () => {
//             console.log('MongoDB connected');
//         })

//         await mongoose.connect(`${process.env.MONGODB_URI}/hotel-booking`);
//     } catch (error) {
//         console.log(error.message);
//     }
// };

// export default connectDB;

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

let db;

export async function connectToMongo() {
    if (db) return db;

    const client = new MongoClient(uri);

    await client.connect();
    db = client.db(dbName);
    console.log(`-----Connected to MongoDB: ${dbName}-----`);

    // call function for create collections
    const existingCollections = await db.listCollections().toArray();
    const collectionNames = existingCollections.map(col => col.name);

    const requiredCollections = [MODELS.USER, MODELS.ADMIN, MODELS.HOTEL, MODELS.ROOM, MODELS.BOOKING];

    for (const name of requiredCollections) {
        if (!collectionNames.includes(name)) {
            await db.createCollection(name);
            console.log(`-----Created collection: ${name}-----`);
        }
    }

    // call function for create indexes for all collections
    await createIndexes(db);

    return db;
}

export function getDb() {
    if (!db) {
        throw new Error('-----MongoDB not connected. Call connectToMongo() first.-----');
    }
    return db;
}

// function for check if an index exists
async function indexExists(collection, indexName) {
    const indexes = await collection.listIndexes().toArray();
    return indexes.some(index => index.name === indexName);
}

// function for create all necessary indexes
async function createIndexes(db) {
    try {
        // Users collection indexes
        const users = db.collection(MODELS.USER);

        if (!await indexExists(users, INDEX_NAME.EMAIL)) {
            await users.createIndex(
                { email: INDEX_OPTIONS.email },
                {
                    unique: true,
                    name: INDEX_NAME.EMAIL
                }
            );
            console.log(`-----Created index: ${INDEX_NAME.EMAIL}-----`);
        }

        if (!await indexExists(users, INDEX_NAME.PHONE)) {
            await users.createIndex(
                { phone: INDEX_OPTIONS.phone },
                {
                    unique: true,
                    sparse: true,
                    name: INDEX_NAME.PHONE
                }
            );
            console.log(`-----Created index: ${INDEX_NAME.PHONE}-----`);
        }

        // Hotels collection indexes
        const hotels = db.collection(MODELS.HOTEL);

        if (!await indexExists(hotels, INDEX_NAME.HOTEL_SEARCH)) {
            await hotels.createIndex(
                {
                    hotelSearch: INDEX_OPTIONS.hotelSearch
                },
                {
                    name: INDEX_NAME.HOTEL_SEARCH,
                    weights: {
                        name: 1,
                        address: 1
                    }
                }
            );
            console.log(`-----Created index: ${INDEX_NAME.HOTEL_SEARCH}-----`);
        }

        if (!await indexExists(hotels, INDEX_NAME.LOCATION_2DSPHERE)) {
            await hotels.createIndex(
                { location: INDEX_OPTIONS.location },
                { name: INDEX_NAME.LOCATION_2DSPHERE }
            );
            console.log(`-----Created index: ${INDEX_NAME.LOCATION_2DSPHERE}-----`);
        }

        // Rooms collection indexes
        const rooms = db.collection(MODELS.ROOM);

        if (!await indexExists(rooms, INDEX_NAME.HOTEL_ROOM_NUMBER)) {
            await rooms.createIndex(
                {
                    hotel: INDEX_OPTIONS.ASC,
                    roomType: INDEX_OPTIONS.ASC
                },
                {
                    unique: true,
                    name: INDEX_NAME.HOTEL_ROOM_NUMBER
                }
            );
            console.log(`-----Created index: ${INDEX_NAME.HOTEL_ROOM_NUMBER}-----`);
        }

        if (!await indexExists(rooms, INDEX_NAME.PRICE)) {
            await rooms.createIndex(
                { pricePerNight: INDEX_OPTIONS.ASC },
                { name: INDEX_NAME.PRICE }
            );
            console.log(`-----Created index: ${INDEX_NAME.PRICE}-----`);
        }

        // Bookings collection indexes
        const bookings = db.collection(MODELS.BOOKING);

        if (!await indexExists(bookings, INDEX_NAME.BOOKING_DATES)) {
            await bookings.createIndex(
                { checkInDate: INDEX_OPTIONS.ASC, checkOutDate: INDEX_OPTIONS.ASC },
                { name: INDEX_NAME.BOOKING_DATES }
            );
            console.log(`-----Created index: ${INDEX_NAME.BOOKING_DATES}-----`);
        }

        if (!await indexExists(bookings, INDEX_NAME.USER_BOOKINGS)) {
            await bookings.createIndex(
                { user: INDEX_OPTIONS.ASC },
                { name: INDEX_NAME.USER_BOOKINGS }
            );
            console.log(`-----Created index: ${INDEX_NAME.USER_BOOKINGS}-----`);
        }

        if (!await indexExists(bookings, INDEX_NAME.ROOM_BOOKINGS)) {
            await bookings.createIndex(
                { room: INDEX_OPTIONS.ASC },
                { name: INDEX_NAME.ROOM_BOOKINGS }
            );
            console.log(`-----Created index: ${INDEX_NAME.ROOM_BOOKINGS}-----`);
        }

        if (!await indexExists(bookings, INDEX_NAME.BOOKING_STATUS)) {
            await bookings.createIndex(
                { status: INDEX_OPTIONS.ASC },
                { name: INDEX_NAME.BOOKING_STATUS }
            );
            console.log(`-----Created index: ${INDEX_NAME.BOOKING_STATUS}-----`);
        }

        // Admin collection indexes
        const admins = db.collection(MODELS.ADMIN);

        if (!await indexExists(admins, INDEX_NAME.ADMIN_EMAIL)) {
            await admins.createIndex(
                { email: INDEX_OPTIONS.ASC },
                {
                    unique: true,
                    name: INDEX_NAME.ADMIN_EMAIL
                }
            );
            console.log(`-----Created index: ${INDEX_NAME.ADMIN_EMAIL}-----`);
        }


        console.log('----- Index creation complete -----');
    } catch (error) {
        console.error('Error creating indexes:', error);
        throw error;
    }
}

const dbPromise = connectToMongo().then(() => getDb());
export default dbPromise;