import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const connectDB = await mongoose.connect (process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${connectDB.connection.host}`);
    } catch (error) {
        console.error(`Error: mongodb connection failed - ${error.message}`);        
        process.exit(1);
    }
}

export {connectDB};