import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {

    const user = await User.findById(userId);
    
    const accessToken = await user.generateAccessToken();
    
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    

    return { accessToken, refreshToken };
  } catch (e) {
    throw new ApiError(500, "Something went Wrong in server!");
  }
};

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
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  //then save to database
  const user = await User.create({
    username: username?.toLowerCase() || "",
    email,
    fullname,
    password,
    avatar: avatar.url,
  });

  //checking user creation
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrnog while registering user");
  }

  //return json response

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully!"));
});

const loginUser = asyncHandler(async (req, res) => {
  //get user details from req.body
  const { email, username, password } = req.body;

  //check if emial or username is passed

  if (!(username || email)) {
    throw new ApiError(400, " Username or Email is required!");
  }

  //check for username or email in db
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User with username or email doesn't exist!");
  }

  //check if password is valid
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Username or Password doesn't match!");
  }

  //generate access and refresh tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
  };

  //return response

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in Successfully!"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: { refreshToken: "" },
    },
    {
      new: true,
    }
  );


  const options = {
    httpOnly: true,
  };


  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Loggedout Successfully!"))
});

export { registerUser, loginUser, logoutUser };
