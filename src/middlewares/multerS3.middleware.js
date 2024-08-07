import { S3Client } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from "multer-s3";
import "dotenv/config";
import { getUserById } from "../services/user.services.js";

export const s3 = new S3Client({
  region: process.env.AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

const uploadS3 = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: async function (req, file, cb) {
      const { userId } = req;
      const user = await getUserById(userId);

      const type = file.mimetype.split("/")[0];
      const year = new Date().getFullYear();

      const path = `uploads/${type}/${year}/${user.name}`;
      cb(null, `${path}/${Date.now().toString()}-${file.originalname}`);
    },
  }),
});

export default uploadS3;
