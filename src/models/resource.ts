// Resource model definitions for Vet1Stop
import { ObjectId } from 'mongodb';

// Resource categories
export type ResourceCategory = 'education' | 'health' | 'careers' | 'life-leisure';

// Resource subcategories
export type ResourceSubcategory = 'federal' | 'state' | 'ngo' | 'local';

// Resource type
export interface Resource {
  _id: ObjectId;
  title: string;
  category: ResourceCategory;
  subcategory: ResourceSubcategory;
  description: string;
  content?: string;
  url: string;
  eligibility?: string[];
  tags: string[];
  featured: boolean;
  isPremiumContent?: boolean;
  dateAdded: Date;
  lastUpdated: Date;
}

// Interface for resource filtering
export interface ResourceFilter {
  category?: ResourceCategory;
  subcategory?: ResourceSubcategory;
  eligibility?: string;
  tags?: string[];
  featured?: boolean;
  search?: string;
}

// Resource with populated references
export interface ResourceWithReferences extends Resource {
  relatedResources?: Resource[];
}
