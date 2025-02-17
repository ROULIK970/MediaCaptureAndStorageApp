import { Router } from "express";
import { uploadMedia } from "../controllers/media.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/upload-media").post(
  verifyJWT,
  upload.fields([
    {
      name: "media",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  uploadMedia
);

export default router;
