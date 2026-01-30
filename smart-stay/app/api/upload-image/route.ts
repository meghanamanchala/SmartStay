import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");
  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  // Check if file is a Blob
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Uploaded file is not a valid Blob" }, { status: 400 });
  }
  // Convert file to buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  // Upload to Cloudinary
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ resource_type: "image" }, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }).end(buffer);
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
