import { Router} from "express";
import registerUser from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { loginUser } from "../controllers/user.controller.js";
import { logoutUser } from "../controllers/user.controller.js";
import { refreshAccessToken } from "../controllers/user.controller.js";


const userRouter = Router()

userRouter.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,

        },
        {
            name: "coverImage",
            maxCount : 3
        }
    ]),
    registerUser)

userRouter.route("/login").post(loginUser)

//secured routes 
userRouter.route("/logout").post(verifyJWT,logoutUser)
userRouter.route("/referesh-token").post(refreshAccessToken)


export default userRouter