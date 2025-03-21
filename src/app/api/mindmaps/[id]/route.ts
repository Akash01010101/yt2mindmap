import { NextResponse } from 'next/server';
import { BlobServiceClient } from '@azure/storage-blob';
import { getServerSession } from 'next-auth';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const containerName = 'html';
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    // Get the mindmap content
    const { id } = await(params);
    const userEmail = session.user.email.toLowerCase();
    
    // Get metadata
    const metadataBlobName = `user-${userEmail.split("@")[0]}/${id}.json`;
    const metadataBlobClient = containerClient.getBlockBlobClient(metadataBlobName);
    const metadataResponse = await metadataBlobClient.download();
    const metadataContent = await streamToString(metadataResponse.readableStreamBody || null);
    if (!metadataContent) {
      return NextResponse.json({ error: 'Mindmap not found' }, { status: 404 });
    }
    const metadata = JSON.parse(metadataContent);

    // Get HTML content
    const htmlBlobName = `user-${userEmail.split("@")[0]}/${id}.html`;
    const htmlBlobClient = containerClient.getBlockBlobClient(htmlBlobName);
    const htmlResponse = await htmlBlobClient.download();
    const htmlContent = await streamToString(htmlResponse.readableStreamBody || null);
    if (!htmlContent) {
      return NextResponse.json({ error: 'Mindmap HTML content not found' }, { status: 404 });
    }

    return NextResponse.json({
      metadata,
      htmlContent
    });

  } catch (error) {
    console.error('Error fetching mindmap:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mindmap' },
      { status: 500 }
    );
  }
}

async function streamToString(readableStream: NodeJS.ReadableStream | null): Promise<string> {
  if (!readableStream) {
    return '';
  }

  const chunks: Buffer[] = [];
  for await (const chunk of readableStream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf-8');
}