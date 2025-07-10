import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import uploadOnCloudinary from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

const generateAccessAndRefershToken = async (userId){
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

        const avatarLocalPath = req.files?.avatar[0]?.path
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

  if (!username || !email){
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
 const loggedInUser = User.findById(user._id).
 select("-password -refershToken")

 const options ={ 
  httpOnly : true,
  secure: true

 }

 return res
 .status(200)
 .cookie("accessToken", accessToken, options)
 .cookie("refershToken", refereshToken,options)
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

export default registerUser 
export {loginUser,logoutUser}
