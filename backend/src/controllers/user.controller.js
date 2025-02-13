import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  //get user data from req.body
  const { username, email, fullname, password } = req.body;

  //validate to see if fields are not empty
  if (
    [username, email, fullname, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  //check if user already exist
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with username or email already exists!");
  }

  //check for avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  //upload avatar to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  //check if avatar file is uploaded to cloudinary
  if(!avatar){
    throw new ApiError(400, "Avatar file is required");
  }

  
  //then save to database
const user = await User.create({
  username: username.toLowerCase(),
  email,
  fullname,
  password,
  avatar:avatar.url
});

//checking user creation
const createdUser = await User.findById(user._id).select("-password -refreshToken")

if(!createdUser){
    throw new ApiError(500, "Something went wrnog while registering user")
}

  //return json response

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered successfully!")
  )
});

export { registerUser };
