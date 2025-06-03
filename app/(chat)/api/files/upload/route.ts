import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { uploadFileToS3 } from "@/lib/s3";

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed file types
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"];

// File schema for validation
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: "File size should be less than 5MB",
    })
    .refine((file) => ALLOWED_FILE_TYPES.includes(file.type), {
      message:
        "File type not supported. Please upload a JPEG, PNG, or PDF file.",
    }),
  fileName: z.string().min(1, "File name is required"),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob | null;
    const fileName = formData.get("fileName") as string | null;

    if (!file || !fileName) {
      return NextResponse.json(
        { error: "File and file name are required" },
        { status: 400 },
      );
    }

    const validation = FileSchema.safeParse({ file, fileName });

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 },
      );
    }

    // Upload file to S3
    try {
      const { url, key } = await uploadFileToS3(file, fileName, file.type);

      return NextResponse.json({
        url,
        key,
        size: file.size,
        type: file.type,
        name: fileName,
      });
    } catch (error) {
      console.error("Error processing file upload:", error);
      return NextResponse.json(
        { error: "An error occurred while processing your request" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 },
    );
  }
}
