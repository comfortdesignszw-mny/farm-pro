export type SizeUnit = 'ha' | 'acre';
export type WeightUnit = 'kg' | 'lb' | 'bags_50kg' | 'crates' | 'tonnes';
export type VolumeUnit = 'L' | 'gal';
export type LanguageCode = 'en' | 'sn' | 'nd';

export interface Farm {
  id: string;
  name: string;
  size: number;
  sizeUnit: SizeUnit;
  location: string;
  coordinates?: {
    latitude: number;
    longitude: number;
    regionName?: string;
  };
  cropsSpecialized: string[];
  createdAt: number;
}

export interface Field {
  id: string;
  farmId: string;
  name: string;
  size: number;
  cropCurrent?: string;
}

export type CropCategory =
  | 'Maize'
  | 'Groundnuts'
  | 'Tomatoes'
  | 'Soybeans'
  | 'Cabbage'
  | 'Sorghum'
  | 'Potatoes'
  | 'Wheat'
  | 'Fine Beans'
  | 'Vegetables'
  | 'Fruits'
  | 'Other';

export type CropStatus = 'active' | 'harvested' | 'failed';

export interface CropCycle {
  id: string;
  farmId: string;
  fieldId: string;
  cropType: string;
  variety: string;
  plantingDate: string;
  harvestDateExpected: string;
  status: CropStatus;
  photo?: Blob;
  fieldSize?: number;
  notes?: string;
  createdAt: number;
}

export type InputType = 'seed' | 'fertilizer' | 'spray' | 'labor';

export interface InputRecord {
  id: string;
  cropCycleId: string;
  type: InputType;
  subtype: string;
  quantity: number;
  unit: string;
  quantityPerHectare: number;
  cost: number;
  date: string;
  photo?: Blob;
  notes?: string;
  createdAt: number;
}

export interface YieldRecord {
  id: string;
  cropCycleId: string;
  quantity: number;
  unit: string;
  quantityPerHectare: number;
  date: string;
  photo?: Blob;
  notes?: string;
  createdAt: number;
}

export type AnimalSpecies =
  | 'Chickens - Layers'
  | 'Broilers'
  | 'Ducks'
  | 'Pigs'
  | 'Horses'
  | 'Cattle - Beef'
  | 'Cattle - Dairy'
  | 'Goats'
  | 'Sheep';

export type AnimalStatus = 'active' | 'sold' | 'culled' | 'deceased';
export type AcquisitionMethod = 'bought' | 'born_on_farm' | 'gift' | 'other';

export interface Animal {
  id: string;
  farmId: string;
  species: AnimalSpecies;
  breed: string;
  batchSize: number;
  acquisitionDate: string;
  acquisitionMethod: AcquisitionMethod;
  cost?: number;
  photo?: Blob;
  status: AnimalStatus;
  tagOrName?: string;
  notes?: string;
  createdAt: number;
}

export type HealthRecordType = 'vaccination' | 'treatment' | 'deworming' | 'checkup';

export interface AnimalHealthRecord {
  id: string;
  animalId: string;
  type: HealthRecordType;
  product: string;
  date: string;
  nextDueDate?: string;
  cost: number;
  photo?: Blob;
  notes?: string;
  createdAt: number;
}

export interface AnimalFeedRecord {
  id: string;
  animalId: string;
  feedType: string;
  quantity: number;
  unit: string;
  cost: number;
  date: string;
  notes?: string;
  createdAt: number;
}

export type ProductionProductType = 'eggs' | 'milk' | 'meat' | 'wool' | 'hay' | 'other';

export interface AnimalProductionRecord {
  id: string;
  animalId: string;
  productType: ProductionProductType;
  quantity: number;
  unit: string;
  date: string;
  photo?: Blob;
  notes?: string;
  createdAt: number;
}

export type ToolCondition = 'excellent' | 'good' | 'fair' | 'needs_repair';
export type ToolCategory = 'hand_tool' | 'irrigation' | 'machinery' | 'storage' | 'livestock' | 'other';

export interface Tool {
  id: string;
  farmId: string;
  name: string;
  category: ToolCategory;
  condition: ToolCondition;
  purchaseDate: string;
  cost: number;
  photo?: Blob;
  notes?: string;
  createdAt: number;
}

export type AdvisorIntent =
  | 'crop_advisory'
  | 'animal_advisory'
  | 'disease_pest_diagnosis'
  | 'vaccination_treatment_schedule'
  | 'record_help'
  | 'general_question'
  | 'unclear';

export interface DiagnosticData {
  intent?: AdvisorIntent;
  language?: LanguageCode;
  observation?: string;
  diagnosis?: {
    most_likely?: string | null;
    other_possibilities?: string[];
    confidence?: 'high' | 'medium' | 'low';
  };
  recommendations?: string[];
  escalate_to_professional?: boolean;
  follow_up_question?: string | null;
  reply_text?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mediaAttachment?: Blob;
  mediaPreview?: string;
  timestamp: number;
  synced: boolean;
  isOfflineGenerated?: boolean;
  topic?: string;
  diagnosticData?: DiagnosticData;
}

export interface AdvisoryItem {
  id?: number;
  topic: string;
  category: 'crop' | 'species';
  language: LanguageCode;
  title: string;
  summary: string;
  bulletPoints: string[];
  imageUrl: string;
  keywords: string[];
}

export interface AppSettings {
  language: LanguageCode;
  sizeUnit: SizeUnit;
  weightUnit: WeightUnit;
  volumeUnit: VolumeUnit;
  currency: string;
  voiceMode?: 'transcribe' | 'voice_search';
  autoSpeakBack?: boolean;
  hasCompletedOnboarding: boolean;
}
