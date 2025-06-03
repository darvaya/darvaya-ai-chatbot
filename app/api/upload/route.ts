import { NextResponse } from "next/server";
import { uploadFile, deleteFile } from "@/lib/storage";

// Route segment config
export const dynamic = "force-dynamic";
export const maxDuration = 60; // 1 minute
export const runtime = "nodejs";
// Next.js 13+ automatically handles body parsing for file uploads

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const path = formData.get("path") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload the file
    const url = await uploadFile({
      file: buffer,
      fileName: file.name,
      contentType: file.type,
      path: path || undefined,
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    // Extract the key from the URL
    const key = new URL(url).pathname.replace(/^\//, "");

    await deleteFile(key);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 },
    );
  }
}
