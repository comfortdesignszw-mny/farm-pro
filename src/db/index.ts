import Dexie, { type Table } from 'dexie';
import {
  Farm,
  Field,
  CropCycle,
  InputRecord,
  YieldRecord,
  Animal,
  AnimalHealthRecord,
  AnimalFeedRecord,
  AnimalProductionRecord,
  Tool,
  ChatMessage,
  AdvisoryItem,
  AppSettings,
} from '../types';
import { SEED_ADVISORY_DATA } from './seedAdvisory';

export class FarmProDatabase extends Dexie {
  farms!: Table<Farm, string>;
  fields!: Table<Field, string>;
  cropCycles!: Table<CropCycle, string>;
  inputRecords!: Table<InputRecord, string>;
  yieldRecords!: Table<YieldRecord, string>;
  animals!: Table<Animal, string>;
  animalHealthRecords!: Table<AnimalHealthRecord, string>;
  animalFeedRecords!: Table<AnimalFeedRecord, string>;
  animalProductionRecords!: Table<AnimalProductionRecord, string>;
  tools!: Table<Tool, string>;
  chatMessages!: Table<ChatMessage, string>;
  advisoryCache!: Table<AdvisoryItem, number>;

  constructor() {
    super('FarmProDB');
    this.version(1).stores({
      farms: 'id, name, createdAt',
      fields: 'id, farmId, name',
      cropCycles: 'id, farmId, fieldId, cropType, status, plantingDate, createdAt',
      inputRecords: 'id, cropCycleId, type, date, createdAt',
      yieldRecords: 'id, cropCycleId, date, createdAt',
      animals: 'id, farmId, species, status, acquisitionDate, createdAt',
      animalHealthRecords: 'id, animalId, type, date, nextDueDate, createdAt',
      animalFeedRecords: 'id, animalId, date, createdAt',
      animalProductionRecords: 'id, animalId, productType, date, createdAt',
      tools: 'id, farmId, name, category, condition, createdAt',
      chatMessages: 'id, role, timestamp, synced',
      advisoryCache: '++id, topic, category, language, *keywords',
    });
  }
}

export const db = new FarmProDatabase();

/**
 * Seed initial advisory cache if empty
 */
export async function seedAdvisoryCacheIfNeeded(): Promise<void> {
  const count = await db.advisoryCache.count();
  if (count === 0) {
    await db.advisoryCache.bulkAdd(SEED_ADVISORY_DATA as any);
  }
}

/**
 * Seed a starter farm if completely clean and user wants quick test data,
 * or retrieve current farm.
 */
export async function getCurrentFarm(): Promise<Farm | undefined> {
  const all = await db.farms.toArray();
  return all[0];
}

/**
 * Reset all user tables (for Settings -> Reset data)
 */
export async function resetAllFarmData(): Promise<void> {
  await db.transaction('rw', [
    db.farms,
    db.fields,
    db.cropCycles,
    db.inputRecords,
    db.yieldRecords,
    db.animals,
    db.animalHealthRecords,
    db.animalFeedRecords,
    db.animalProductionRecords,
    db.tools,
    db.chatMessages
  ], async () => {
    await db.farms.clear();
    await db.fields.clear();
    await db.cropCycles.clear();
    await db.inputRecords.clear();
    await db.yieldRecords.clear();
    await db.animals.clear();
    await db.animalHealthRecords.clear();
    await db.animalFeedRecords.clear();
    await db.animalProductionRecords.clear();
    await db.tools.clear();
    await db.chatMessages.clear();
  });
  localStorage.removeItem('farmpro_onboarding_completed');
}

/**
 * Export entire IndexedDB to a JSON object (excluding binary Blobs or with metadata)
 */
export async function exportDatabaseBackup(): Promise<string> {
  const [
    farms,
    fields,
    cropCycles,
    inputRecords,
    yieldRecords,
    animals,
    animalHealthRecords,
    animalFeedRecords,
    animalProductionRecords,
    tools,
    chatMessages
  ] = await Promise.all([
    db.farms.toArray(),
    db.fields.toArray(),
    db.cropCycles.toArray(),
    db.inputRecords.toArray(),
    db.yieldRecords.toArray(),
    db.animals.toArray(),
    db.animalHealthRecords.toArray(),
    db.animalFeedRecords.toArray(),
    db.animalProductionRecords.toArray(),
    db.tools.toArray(),
    db.chatMessages.toArray(),
  ]);

  // Strip blobs to ensure clean portable JSON backup
  const cleanData = {
    exportedAt: new Date().toISOString(),
    version: 1,
    farms,
    fields,
    cropCycles: cropCycles.map(c => ({ ...c, photo: undefined })),
    inputRecords: inputRecords.map(i => ({ ...i, photo: undefined })),
    yieldRecords: yieldRecords.map(y => ({ ...y, photo: undefined })),
    animals: animals.map(a => ({ ...a, photo: undefined })),
    animalHealthRecords: animalHealthRecords.map(h => ({ ...h, photo: undefined })),
    animalFeedRecords,
    animalProductionRecords: animalProductionRecords.map(p => ({ ...p, photo: undefined })),
    tools: tools.map(t => ({ ...t, photo: undefined })),
    chatMessages: chatMessages.map(m => ({ ...m, mediaAttachment: undefined })),
  };

  return JSON.stringify(cleanData, null, 2);
}

const SETTINGS_KEY = 'farmpro_app_settings';

export async function getAppSettings(): Promise<AppSettings> {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading app settings:', e);
  }
  return {
    language: 'en',
    sizeUnit: 'ha',
    weightUnit: 'kg',
    volumeUnit: 'L',
    currency: 'USD',
    voiceMode: 'voice_search',
    autoSpeakBack: true,
    hasCompletedOnboarding: false,
  };
}

export async function saveAppSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getAppSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error saving app settings:', e);
  }
  return updated;
}
