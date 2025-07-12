import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import uploadOnCloudinary from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import { use } from "react"

const generateAccessAndRefershToken = async (userId) => {
  try{
     const user = await User.findById(userId)
     const refreshToken =user.generateRefreshToken ()
     const accessToken=  user.generateAccessToken ()

     user.refreshToken = refreshToken // save in data base
     await user.save({validateBeforeSaves: false}) // special case NTR

     return {accessToken,refreshToken}

  }catch (error) {
    throw new ApiError(500 , "my mistake some thing wet wrong")
  }
}

const registerUser = asyncHandler( async (req,res)  => {

      const {fullName,email,username,password } = req.body
      //console.log("email:",email)

      if (
        [fullName ,email,username , password].some( (field) => 
          field?.trim() ==="")
          
        ) {

          throw new ApiError(400, "All field are required")
        }

       const existedUser =  await User.findOne({
          $or: [ { username }, { email }]
        })

        if(existedUser) {
          throw new ApiError(409,"User with email or useranme still exist")
        }
        console.log(req.files)

        // images by mullter 

        const avatarLocalPath = req.files?.avatar[0]?.path // multiple option to upload files thats why files
        //const coverImageLocalPath = req.files?.coverImages[0]?.path

        let coverImageLocalPath;
        if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
      }
    

        

        if (!avatarLocalPath){
          throw new ApiError(400, "Avatar files is required")

        }

        const avatar = await uploadOnCloudinary(avatarLocalPath) 
        const coverImage = await uploadOnCloudinary(coverImageLocalPath)

        if (!avatar) {
          throw new ApiError(400, "Avatar files is required")
        }

        const user = await User.create({
          fullName,
          avatar: avatar.url ,
          coverImage : coverImage?.url || " ",
          email,
          password,
          username: username.toLowerCase()
        })
        console.log(user)

        const createduser = await User.findById(user._id).select(
          "-password -refreshToken"
        )

        if (!createduser){
          throw new ApiError(500, "Some thing went wrong while registering the user")
        }

        return res.status(201).json(
          new ApiResponse(200,createduser,"user Register successfully")

        )
        
        




        // console log use to know better 

      


    
})

const loginUser = asyncHandler(async (req,res) => {
  //req body -> data
  //username is exist or not 
  //find the user 
  //password check
  //access and refresh token 
  //send cookie

  const {email,username,password} = req.body
  console.log(email)

  if (!username && !email){
    throw new ApiError(400 , "username or password is required")

  } 
  
  const user = await User.findOne({
    $or:[{username}, {email}]
  })

  if (!user){
    throw new ApiError(404,"user does not exist")
  }
  // User is object of mongodb gotchhha!!!
  const isPasswordValid = await user.isPasswordCorrect(password)  
  
  if (!isPasswordValid){
    throw new ApiError(401, "invalid credential")
  }
    
  // now access token and refressed token alag se bna liya 
 const {accessToken,refreshToken} = await generateAccessAndRefershToken(user._id)

 // think to understand 
 const loggedInUser = await User.findById(user._id).
 select("-password -refreshToken")

 const options ={ 
  httpOnly : true,
  secure: true

 }

 return res
 .status(200)
 .cookie("accessToken", accessToken, options)
 .cookie("refreshToken", refreshToken,options)
 .json(
  new ApiResponse(
    200,
    {
      user: loggedInUser,accessToken,refreshToken
    }, "user logged in successfully"
  )
 )

})

const logoutUser = asyncHandler( async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,{
      $set: {
        refereshToken: undefined,
      }
    },
    {
      new: true 
    }
  )

  const options ={
    httpOnly: true,
    secure: true

  }

  

  return  res
  .status(200)
  .clearCookies("accessToken",options)
  .clearCookies("refreshToken",options)
  .json(new ApiResponse(200, {},"user logout"))

  
})


const refreshAccessToken = asyncHandler(async (req,res) => {
  const incommingRefreshToken = req.cookies.refereshToken || req.body.refreshToken

  if (!incommingRefreshToken){
    throw new ApiError (401, "Unauthorised request")
  }

  try {
    const decodedToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
  
    const user =await User.findById (decodedToken?._id)
  
    if (!user) {
      throw new ApiError(401, "in valid referesh token")
    }
    
  
    // at this point you should know about which token is what and its comes form where
    if (incommingRefreshToken  !== user?.refereshToken){
      throw new ApiError (401, "referesh token is expired or used")
    }
  
    const options = {
      httpOnly: true,
      secure: true 
    }
  
    const {accessToken , newrefereshToken} = await generateAccessAndRefershToken(user._id)
  
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken", newrefereshToken,options)
    .json(
      new ApiResponse(
        200,
        {accessToken,refreshToken: newrefereshToken},
        "Acces token refereshed"
      )
    )
  
  } catch (error) {
    throw new ApiError(401,error?.message || "invalid referesh token")
    
  }

   
})

const changeCurrentPassword = asyncHandler( async (req,res) => {
  const {oldPassword , newPassword } = req.body

  // imp concept think 
  // if he change his pass word means in is logged in : this we got to know form middleware req.user

  const user = await User.findById( req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if (!isPasswordCorrect) {
    throw new ApiError(400, "invalid password ")
    
  }

   user.password = newPassword
   await user.save({validateBeforeSaves: false})

   return res
   .status(200)
   .json(new ApiResponse (200,{}, "password has been changed"))
})

const getCurrentUser = asyncHandler( async (req, res) => {
  return res
  .status(200)
  .json(200,req.user, "current user fetch successfully")
})

const updateAccount = asyncHandler(async (req,res) => {
  const { fullName, email} = req.body

  if(!fullName || !email){
    throw new ApiError (400 , "all field are required")

  }

  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      // mongodb operator 
      $set : {
        fullName,
        email: email,
      }
    },
    {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200, user,"account details updated successfully"))



})

const updateUserAvatar = asyncHandler(async (req,res) => {
  const avatarLocalPath = req.file?.path  //no need to get multiflies as per need here
  if (!avatarLocalPath){
    throw new ApiError(400, "avatar file is missing")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if (!avatar.url){
    throw new ApiError (400, "Error  while uploading on avatar")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar:avatar.url

      }
    },
    {new:true}
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200, user,"avatar upladed successfully")
  )

})

const updateUserCoverImage = asyncHandler(async (req,res) => {
  const coverImageLocalPath = req.file?.path  //no need to get multiflies as per need here
  if (!coverImageLocalPath){
    throw new ApiError(400, "Cover Image file is missing")
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!coverImage.url){
    throw new ApiError (400, "Error  while uploading on Cover Image")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage:coverImage.url

      }
    },
    {new:true}
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200, user,"cover Image upladed successfully")
  )
})

const getUserChannelProfile = asyncHandler(async(req,res) => {    
  const {username} = req.prams

  if (!username?.trim()) {
    throw new ApiError(400, " username is Missing")

  }

  // old way to it User.find({username}) 
  const channel = User.aggregate([
    {
      $match:{
        username: username?.toLowerCase()
      }
    },
    {
      $lookup:
      {
        from: "subcriptions",  // all become lower and in plural
        localField: "_id",
        foreignField: "channels",
        as: "subscriber"
      }
    },
    {
      $lookup: 
      {
        from: "subsciptions",
        localField: '_id',
        foreignField: "subscriber",
        as : "subscribeTo"

      }
    },
    {
      $addFields:
      {
         subscribersCount: {
          $size: "$subscribers"
         },
         channelsSubcriberedtoCount:{
          $size: " $subscribeTo"
         },
         isSubscribed:
         {
          $cond : {
            if: {$in: [req.user?._id, "$subcribers.subscriber"]},
            then: true,
            else: false
          }
         }
      }
    },
    { //selected things
      $project :
      {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubcriberedtoCount:1,
        avatar: 1,
        coverImage: 1,
        email: 1,

      }
    }
  ]) //it return array 
})

if (!channel?.length) {
  throw new ApiError (400,"channel is not exists")

}

return res
.status(200)
.json(
  new ApiResponse(200, channel[0],  " user channel fetch successfully")

)
  
const getWatchHistory = asyncHandler(async (req,res) => {
  const user = await User.aggregate([
    {
      $match: {
        // _id: req.user._ic this will never work here we need proper reference
        _id : new mongoose.Types.ObjectId(req.user._id)
        }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField : "_id",
        as : "Watch_History",
        pipeline: [
          {
            $lookup: {
              form: "users",
              localField: "owner",
              foreignField: "_id",
              as : "Owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar : 1
                  }
                }
              ]
            }
          },
          { // act as pipeline
            $addFields: {
              Owner: {
                $first: "$owner"
              }
             }
          }
        ]
      }
    }
  ])

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      user[0].watchHistory,
      " watch history fetched sucessfully"
    )
  )
})

export default registerUser 
export {
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  changeCurrentPassword ,
  updateAccount,
  updateUserAvatar,
  updateUserCoverImage,
getUserChannelProfile,
getWatchHistory}
