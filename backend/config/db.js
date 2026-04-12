const mongoose = require('mongoose');
const connectDB = async () => {
    if (!process.env.MONGODB_URI) {
        console.warn('MONGODB_URI is not defined.');
        return;
    }
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};
module.exports = connectDB;
