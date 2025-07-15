import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import fs from "fs";
import multer from "multer";
import config from "../config";

cloudinary.config({
	cloud_name: config.cloudinaryCloudName,
	api_key: config.cloudinaryAPIKey,
	api_secret: config.cloudinaryAPISecret,
});

export const sendImageToCloudinary = (
	imageName: string,
	path: string
): Promise<Record<string, unknown>> => {
	return new Promise((resolve, reject) => {
		cloudinary.uploader.upload(
			path,
			{ public_id: imageName },
			function (error, result) {
				if (error) {
					reject(error);
				}
				resolve(result as UploadApiResponse);

				// Delete a file asynchronously
				fs.unlink(path, (err) => {
					if (err) {
						reject(err);
					}
				});
			}
		);
	});
};

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, process.cwd() + "/uploads/");
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		cb(null, file.fieldname + "-" + uniqueSuffix);
	},
});

export const upload = multer({ storage: storage });
