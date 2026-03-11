import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';

function inferContentType(pathname: string): string {
  const ext = pathname.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'mp4':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    case 'mp3':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    case 'ogg':
      return 'audio/ogg';
    default:
      return 'application/octet-stream';
  }
}

export async function GET() {
  try {
    const listing = await list({ prefix: 'generated/' });

    const items = listing.blobs.map((blob) => ({
      url: blob.url,
      pathname: blob.pathname,
      contentType: inferContentType(blob.pathname),
      uploadedAt: blob.uploadedAt,
      size: blob.size,
    }));

    // Sort newest first
    items.sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch history';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
