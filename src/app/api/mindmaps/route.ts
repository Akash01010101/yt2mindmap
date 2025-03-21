import { NextResponse } from 'next/server';
import { BlobServiceClient } from '@azure/storage-blob';
import { getServerSession } from 'next-auth';
import { v4 as uuidv4 } from 'uuid';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, youtubeUrl, htmlContent } = await request.json();
    const containerName = 'html';
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    // Create container if it doesn't exist
    await containerClient.createIfNotExists();

    const userEmail = session.user.email.toLowerCase();
    const mindmapId = uuidv4();
    
    // Save metadata
    const metadataBlobName = `user-${userEmail.split("@")[0]}/${mindmapId}.json`;
    const metadataBlobClient = containerClient.getBlockBlobClient(metadataBlobName);
    const metadata = {
      id: mindmapId,
      title,
      youtubeUrl,
      createdAt: new Date().toISOString(),
    };
    await metadataBlobClient.upload(
      JSON.stringify(metadata),
      JSON.stringify(metadata).length
    );

    // Save HTML content
    const htmlBlobName = `user-${userEmail.split("@")[0]}/${mindmapId}.html`;
    const htmlBlobClient = containerClient.getBlockBlobClient(htmlBlobName);
    await htmlBlobClient.upload(htmlContent, htmlContent.length);

    return NextResponse.json(metadata);
  } catch (error) {
    console.error('Error saving mindmap:', error);
    return NextResponse.json(
      { error: 'Failed to save mindmap' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const containerName = 'html';
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const userEmail = session.user.email.toLowerCase();
    const userFolder = `user-${userEmail.split("@")[0]}`;

    // List all metadata blobs for this user
    const mindmaps = [];
    for await (const blob of containerClient.listBlobsByHierarchy('/', { prefix: `${userFolder}/` })) {
      if (blob.kind === 'blob' && blob.name.endsWith('.json')) {
        const blobClient = containerClient.getBlockBlobClient(blob.name);
        const downloadResponse = await blobClient.download();
        const metadata = await streamToString(downloadResponse.readableStreamBody);
        mindmaps.push(JSON.parse(metadata));
      }
    }

    return NextResponse.json(mindmaps.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
  } catch (error) {
    console.error('Error fetching mindmaps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mindmaps' },
      { status: 500 }
    );
  }
}

async function streamToString(readableStream: NodeJS.ReadableStream | undefined | null): Promise<string> {
  if (!readableStream) {
    return '';
  }

  const chunks: Buffer[] = [];
  for await (const chunk of readableStream) {
    if (Buffer.isBuffer(chunk)) {
      chunks.push(chunk);
    } else {
      chunks.push(Buffer.from(chunk));
    }
  }
  return Buffer.concat(chunks).toString('utf-8');
}