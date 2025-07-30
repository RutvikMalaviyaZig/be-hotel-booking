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

    // create collections
    const existingCollections = await db.listCollections().toArray();
    const collectionNames = existingCollections.map(col => col.name);

    const requiredCollections = [MODELS.USER, MODELS.ADMIN, MODELS.HOTEL, MODELS.ROOM, MODELS.BOOKING];

    for (const name of requiredCollections) {
        if (!collectionNames.includes(name)) {
            await db.createCollection(name);
            console.log(`-----Created collection: ${name}-----`);
        }
    }

    // create 2dsphere index only if it doesn't exist
    const hotelCollection = db.collection(MODELS.HOTEL);
    const indexExists = await hotelCollection.indexExists(INDEX_NAME.LOCATION_2DSPHERE);

    if (!indexExists) {
        await hotelCollection.createIndex(
            { location: INDEX_OPTIONS.location },
            { name: INDEX_NAME.LOCATION_2DSPHERE }
        );
        console.log("-----Created 2dsphere index on 'location'-----");
    } else {
        console.log("-----2dsphere index on 'location' already exists-----");
    }

    return db;
}

export function getDb() {
    if (!db) {
        throw new Error('-----MongoDB not connected. Call connectToMongo() first.-----');
    }
    return db;
}

const dbPromise = connectToMongo().then(() => getDb());
export default dbPromise;