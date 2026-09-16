import dotenv from 'dotenv'
dotenv.config()
import mongoose from "mongoose";
async function connectdb() {
    try {
        await mongoose.connect(process.env.MONGODBURL)
        console.log("mongodb connected");
        
    } catch (error) {
        console.log("mongodb not connected");
        
    }
}
export default connectdb