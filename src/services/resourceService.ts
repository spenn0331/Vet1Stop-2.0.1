// Resource service for fetching and managing resources from MongoDB
import { Collection, Document, ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { Resource, ResourceFilter, ResourceCategory } from '@/models/resource';

// Database and collection names
const DB_NAME = 'vet1stop';
const RESOURCES_COLLECTION = 'resources';

// Get MongoDB collection
async function getResourceCollection(): Promise<Collection<Document>> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  return db.collection(RESOURCES_COLLECTION);
}

// Get all resources with optional filtering
export async function getResources(filter: ResourceFilter = {}): Promise<Resource[]> {
  const collection = await getResourceCollection();
  
  // Build MongoDB query from filter
  const query: any = {};
  
  if (filter.category) {
    query.category = filter.category;
  }
  
  if (filter.subcategory) {
    query.subcategory = filter.subcategory;
  }
  
  if (filter.eligibility) {
    query.eligibility = { $in: [filter.eligibility] };
  }
  
  if (filter.tags && filter.tags.length > 0) {
    query.tags = { $in: filter.tags };
  }
  
  if (filter.featured !== undefined) {
    query.featured = filter.featured;
  }
  
  if (filter.search) {
    // Text search in title and description
    query.$or = [
      { title: { $regex: filter.search, $options: 'i' } },
      { description: { $regex: filter.search, $options: 'i' } },
    ];
  }
  
  // Execute query and convert to Resource type
  const resources = await collection.find(query).sort({ featured: -1, dateAdded: -1 }).limit(100).toArray();
  
  return resources as unknown as Resource[];
}

// Get a single resource by ID
export async function getResourceById(id: string): Promise<Resource | null> {
  const collection = await getResourceCollection();
  
  const resource = await collection.findOne({ _id: new ObjectId(id) });
  
  return resource as unknown as Resource;
}

// Get featured resources for a specific category
export async function getFeaturedResources(category?: ResourceCategory): Promise<Resource[]> {
  const filter: ResourceFilter = {
    featured: true,
  };
  
  if (category) {
    filter.category = category;
  }
  
  return getResources(filter);
}

// Search resources by query string
export async function searchResources(query: string): Promise<Resource[]> {
  if (!query.trim()) {
    return [];
  }
  
  return getResources({ search: query });
}

// Get resources by category
export async function getResourcesByCategory(category: ResourceCategory): Promise<Resource[]> {
  return getResources({ category });
}

// Get resources by subcategory within a category
export async function getResourcesBySubcategory(
  category: ResourceCategory,
  subcategory: string
): Promise<Resource[]> {
  return getResources({
    category,
    subcategory: subcategory as any,
  });
}

// Get related resources for a specific resource
export async function getRelatedResources(resourceId: string): Promise<Resource[]> {
  const resource = await getResourceById(resourceId);
  
  if (!resource) {
    return [];
  }
  
  // Find resources with similar tags or in the same category
  const relatedFilter: ResourceFilter = {
    category: resource.category,
  };
  
  if (resource.tags && resource.tags.length > 0) {
    relatedFilter.tags = resource.tags.slice(0, 3); // Use up to 3 tags for relevance
  }
  
  const relatedResources = await getResources(relatedFilter);
  
  // Filter out the original resource and limit to 3 related resources
  return relatedResources
    .filter(r => r._id.toString() !== resourceId)
    .slice(0, 3);
}
