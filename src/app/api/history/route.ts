import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';

function inferContentType(pathname: string): string {
  const ext = pathname.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png': return 'image/png';
    case 'jpg': case 'jpeg': return 'image/jpeg';
    case 'gif': return 'image/gif';
    case 'webp': return 'image/webp';
    case 'mp4': return 'video/mp4';
    case 'webm': return 'video/webm';
    case 'mp3': return 'audio/mpeg';
    case 'wav': return 'audio/wav';
    case 'ogg': return 'audio/ogg';
    default: return 'application/octet-stream';
  }
}

export async function GET() {
  try {
    const listing = await list({ prefix: 'generated/' });

    // Separate media files from metadata files
    const metaBlobs = listing.blobs.filter((b) => b.pathname.endsWith('.meta.json'));
    const mediaBlobs = listing.blobs.filter((b) => !b.pathname.endsWith('.meta.json'));

    // Build a map of generation ID -> metadata URL
    const metaMap = new Map<string, string>();
    for (const meta of metaBlobs) {
      // pathname like generated/abc-123.meta.json -> extract ID prefix
      const filename = meta.pathname.split('/').pop() || '';
      const id = filename.replace('.meta.json', '');
      metaMap.set(id, meta.url);
    }

    const items = mediaBlobs.map((blob) => {
      const contentType = inferContentType(blob.pathname);
      const filename = blob.pathname.split('/').pop() || blob.pathname;

      // Try to find metadata by matching the generation ID prefix
      // Files are like generated/abc-123-0.png or generated/abc-123.mp4
      // Meta files are like generated/abc-123.meta.json
      let metadataUrl: string | undefined;
      for (const [id, url] of metaMap.entries()) {
        if (filename.startsWith(id)) {
          metadataUrl = url;
          break;
        }
      }

      return {
        url: blob.url,
        pathname: blob.pathname,
        contentType,
        uploadedAt: blob.uploadedAt,
        size: blob.size,
        metadataUrl,
      };
    });

    items.sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch history';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
