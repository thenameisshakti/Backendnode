import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const connectDB = async () => {
    try {
       const connectionInstance =  await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       console.log(`\n Mongodb  connected !! Db Host: ${connectionInstance.connection.host}`)

    }catch (error) {
        console.log("MONGO DB connection error ok ", error)
        process.exit(1)
    }
}

export default connectDB