import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//routes import 

import userRouter from "./routes/user.routers.js"

//routes decteration  the syntax is different is here is because 
// we have create the routes different 

app.use("/api/v1/users", userRouter)   // it act as prefix  // http://localhost:8000/api/v1/users/register


export default app