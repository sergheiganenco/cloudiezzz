import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, requireRole } from '@/lib/auth';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

// Mints a client-upload token so the admin browser can upload sample audio
// directly to Vercel Blob (bypassing the serverless body limit).
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!requireRole(user, 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        addRandomSuffix: true,
        maximumSizeInBytes: MAX_FILE_SIZE,
        allowedContentTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/webm'],
      }),
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(jsonResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload authorization failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
