import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({
    path: './.env'
})


connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
})


/*

const app = express()

(async () => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error) => {
            console.log("ERRRR : ", error ) 
            throw error 
        })
        app.listen(process.env.PORT, () => {
            console.log(`app is listening the ${process.env.PORT}`)
        })

    } catch (error) {
        console.error("Error : ", error)
        throw error 
    }
})()
    */