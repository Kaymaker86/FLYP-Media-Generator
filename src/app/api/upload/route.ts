import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { validateFileType, validateFileSize, sanitizeFilename } from '@/lib/validation';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!validateFileType(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Allowed: JPEG, PNG, GIF, WebP` },
        { status: 400 }
      );
    }

    if (!validateFileSize(file.size)) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 20 MB.' },
        { status: 400 }
      );
    }

    const filename = sanitizeFilename(file.name);
    const pathname = `uploads/${uuidv4()}-${filename}`;

    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    return NextResponse.json({ url: blob.url, pathname });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
