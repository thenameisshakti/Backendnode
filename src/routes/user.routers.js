import { Router} from "express";
import registerUser, { changeCurrentPassword, getCurrentUser,getWatchHistory,getUserChannelProfile } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { loginUser } from "../controllers/user.controller.js";
import { logoutUser,updateAccount ,updateUserAvatar,updateUserCoverImage,} from "../controllers/user.controller.js";
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
userRouter.route("/change-password").post(verifyJWT,changeCurrentPassword)
userRouter.route("/current-user").get(verifyJWT,getCurrentUser)

userRouter
.route("/update-accout")
.patch(verifyJWT,updateAccount)

userRouter
.route("/avatar")
.patch(verifyJWT,upload.single
("avatar"),updateUserAvatar)

userRouter
.route('/coverImage')
.patch(verifyJWT,upload.single
("coverImage"),updateUserCoverImage)

userRouter.route("/c/:username").get(verifyJWT,getUserChannelProfile) //becaure is req.params
userRouter.route("/History").get(verifyJWT,getWatchHistory)





export default userRouter