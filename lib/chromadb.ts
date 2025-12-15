import { ChromaClient, Collection } from 'chromadb';

const CHROMADB_URL = process.env.CHROMADB_URL || 'http://localhost:8000';
const COLLECTION_NAME = 'media_library';

let client: ChromaClient | null = null;
let collection: Collection | null = null;

export async function getChromaClient(): Promise<ChromaClient> {
  if (!client) {
    client = new ChromaClient({ path: CHROMADB_URL });
  }
  return client;
}

export async function getCollection(): Promise<Collection> {
  if (!collection) {
    const chromaClient = await getChromaClient();
    try {
      collection = await chromaClient.getOrCreateCollection({
        name: COLLECTION_NAME,
        metadata: { 'hnsw:space': 'cosine' },
      });
    } catch (error) {
      console.error('Error getting/creating ChromaDB collection:', error);
      // BUG FIX: Reset and retry once to recover from stale connection
      collection = null;
      try {
        collection = await chromaClient.getOrCreateCollection({
          name: COLLECTION_NAME,
          metadata: { 'hnsw:space': 'cosine' },
        });
      } catch (retryError) {
        console.error('Retry failed for ChromaDB collection:', retryError);
        throw retryError;
      }
    }
  }
  return collection;
}

export async function addEmbedding(
  id: string,
  embedding: number[],
  metadata: Record<string, any>,
  document: string
): Promise<void> {
  try {
    const coll = await getCollection();
    await coll.add({
      ids: [id],
      embeddings: [embedding],
      metadatas: [metadata],
      documents: [document],
    });
  } catch (error) {
    console.error('Error adding embedding to ChromaDB:', error);
    throw error;
  }
}

export async function updateEmbedding(
  id: string,
  embedding: number[],
  metadata: Record<string, any>,
  document: string
): Promise<void> {
  try {
    const coll = await getCollection();
    await coll.upsert({
      ids: [id],
      embeddings: [embedding],
      metadatas: [metadata],
      documents: [document],
    });
  } catch (error) {
    console.error('Error updating embedding in ChromaDB:', error);
    throw error;
  }
}

export async function deleteEmbedding(id: string): Promise<void> {
  try {
    const coll = await getCollection();
    await coll.delete({ ids: [id] });
  } catch (error) {
    console.error('Error deleting embedding from ChromaDB:', error);
    throw error;
  }
}

export async function queryEmbeddings(
  queryEmbedding: number[],
  nResults: number = 10
): Promise<{ ids: string[]; distances: number[] }> {
  try {
    const coll = await getCollection();
    const results = await coll.query({
      queryEmbeddings: [queryEmbedding],
      nResults,
    });

    return {
      ids: results.ids[0] || [],
      distances: results.distances?.[0] || [],
    };
  } catch (error) {
    console.error('Error querying embeddings from ChromaDB:', error);
    throw error;
  }
}

export async function clearAllEmbeddings(): Promise<void> {
  try {
    const chromaClient = await getChromaClient();
    try {
      await chromaClient.deleteCollection({ name: COLLECTION_NAME });
    } catch (deleteError: any) {
      // If collection doesn't exist, that's fine - we wanted it gone anyway
      if (deleteError?.message?.includes('does not exist') || deleteError?.name === 'ChromaNotFoundError') {
        console.log(`Collection ${COLLECTION_NAME} does not exist, skipping deletion`);
      } else {
        throw deleteError;
      }
    }
    collection = null; // Reset the collection reference
    await getCollection(); // Recreate the collection
  } catch (error) {
    console.error('Error clearing all embeddings from ChromaDB:', error);
    throw error;
  }
}
