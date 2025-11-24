import { NextRequest, NextResponse } from 'next/server';
import { getUserInfoFromHeaders } from '@/lib/audit-logger';
import { uploadToS3 } from '@/lib/s3';

// Configure upload settings
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Allowed file types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

// POST /api/upload - Upload file to S3
export async function POST(request: NextRequest) {
  try {
    const headers = request.headers;
    const actorUserId = headers.get('x-user-id')?.trim();

    if (!actorUserId) {
      return NextResponse.json(
        { ok: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { ok: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { ok: false, error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { ok: false, error: 'File type not allowed' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to S3
    const { url, path } = await uploadToS3(buffer, file.name, file.type);

    return NextResponse.json({
      ok: true,
      url,
      path,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { ok: false, error: error?.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}
