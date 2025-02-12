import mongoose from 'mongoose'
import { DB_NAME } from '../constants.js'

//connecting database to project
const connectDB = async() =>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`MongoDB connected!! ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("Error occured connecting to MongoDB database", error)
        process.exit(1)
    }
    
}

export default connectDB