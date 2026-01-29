require("dotenv").config();
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const mongoose = require("mongoose");
const Asset = require("../models/Asset");

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

// MongoDB connect
async function connectDB() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connected");
}

// Upload ONE file
async function uploadFile(filePath, folder, fileName) {
  const tempPath = path.join(__dirname, "temp-" + fileName);

  await sharp(filePath)
    .resize({ width: 1600 })
    .jpeg({ quality: 80 })
    .toFile(tempPath);

  const result = await cloudinary.uploader.upload(tempPath, {
    folder: `smartstay/${folder}`,
    use_filename: true,
    unique_filename: false,
    overwrite: true,
  });

  fs.unlinkSync(tempPath);

  console.log("Uploaded:", result.secure_url);

  const asset = await Asset.create({
    name: fileName,
    type: "property",
    category: folder,
    url: result.secure_url,
  });

  console.log("Saved to MongoDB:", asset.url);
}

// Walk folders recursively
async function uploadDir(dir, folder = "") {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      await uploadDir(fullPath, path.join(folder, file));
    } else {
      await uploadFile(fullPath, folder, file);
    }
  }
}

// RUN
(async () => {
  try {
    await connectDB();
    const baseDir = path.join(__dirname, "../public/images/properties");
    await uploadDir(baseDir);
    console.log("All uploads complete");
    process.exit(0);
  } catch (err) {
    console.error("ERROR:", err);
    process.exit(1);
  }
})();
