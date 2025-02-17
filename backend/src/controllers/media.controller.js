import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { Media } from "../models/media.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const uploadMedia = asyncHandler(async (req, res) => {
  const { filename } = req.body;

  if(!filename){
    throw new ApiError(400, "Filename is required!")
  }

  const mediaLocalPath =
    req.files?.media && req.files.media.length > 0
      ? req.files.media[0].path
      : undefined;

  if (!mediaLocalPath) {
    throw new ApiError(400, "Media file is required!");
  }

  const media = await uploadOnCloudinary(mediaLocalPath);

  if (!media) {
    throw new ApiError(400, "Media file is required!");
  }

  const thumbnailLocalPath =
    req.files?.thumbnail && req.files.thumbnail.length > 0
      ? req.files.thumbnail[0].path
      : undefined;

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail file is required!");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!thumbnail) {
    throw new ApiError(400, "Thumbnail file is required!");
  }

  const newMedia = await Media.create({
    user: req.user._id,
    filename: filename?.toLowerCase(),
    fileType: media.resource_type,
    media: media.url,
    thumbnail: thumbnail.url,
    fileSize: parseFloat((media.bytes / (1024 * 1024)).toFixed(2))//converting to MB,
  });

  if (!newMedia) {
    throw new ApiError(500, "Something went wrong while uploading Media!");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, newMedia, "Media File saved Successfully!"));
});

export { uploadMedia };
