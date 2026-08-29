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
    chatMessages,
    settings,
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
    getAppSettings(),
  ]);

  // Strip blobs to ensure clean portable JSON backup
  const cleanData = {
    appName: 'FarmPro',
    exportedAt: new Date().toISOString(),
    version: 1,
    settings,
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

export interface ImportBackupResult {
  success: boolean;
  message: string;
  farm?: Farm;
  counts?: {
    farms: number;
    fields: number;
    crops: number;
    inputs: number;
    yields: number;
    animals: number;
    health: number;
    feeds: number;
    productions: number;
    tools: number;
    messages: number;
  };
}

/**
 * Import and restore a JSON database backup into IndexedDB.
 */
export async function importDatabaseBackup(jsonString: string): Promise<ImportBackupResult> {
  try {
    const data = JSON.parse(jsonString);

    if (!data || typeof data !== 'object') {
      return { success: false, message: 'Invalid backup file format.' };
    }

    // Extract collections with fallbacks for single objects or alternative keys
    const rawFarms: Farm[] = Array.isArray(data.farms)
      ? data.farms
      : data.farm
      ? [data.farm]
      : [];

    const rawFields: Field[] = Array.isArray(data.fields) ? data.fields : [];
    const rawCrops: CropCycle[] = Array.isArray(data.cropCycles)
      ? data.cropCycles
      : Array.isArray(data.crops)
      ? data.crops
      : [];
    const rawInputs: InputRecord[] = Array.isArray(data.inputRecords)
      ? data.inputRecords
      : Array.isArray(data.inputs)
      ? data.inputs
      : [];
    const rawYields: YieldRecord[] = Array.isArray(data.yieldRecords)
      ? data.yieldRecords
      : Array.isArray(data.yields)
      ? data.yields
      : [];
    const rawAnimals: Animal[] = Array.isArray(data.animals) ? data.animals : [];
    const rawHealth: AnimalHealthRecord[] = Array.isArray(data.animalHealthRecords)
      ? data.animalHealthRecords
      : Array.isArray(data.healthRecords)
      ? data.healthRecords
      : [];
    const rawFeeds: AnimalFeedRecord[] = Array.isArray(data.animalFeedRecords)
      ? data.animalFeedRecords
      : [];
    const rawProductions: AnimalProductionRecord[] = Array.isArray(data.animalProductionRecords)
      ? data.animalProductionRecords
      : [];
    const rawTools: Tool[] = Array.isArray(data.tools) ? data.tools : [];
    const rawMessages: ChatMessage[] = Array.isArray(data.chatMessages)
      ? data.chatMessages
      : [];

    // Verify there is at least something to restore
    if (
      rawFarms.length === 0 &&
      rawCrops.length === 0 &&
      rawAnimals.length === 0 &&
      rawTools.length === 0
    ) {
      return {
        success: false,
        message: 'No recognizable Farm Pro records found in this backup file.',
      };
    }

    // Perform atomic transaction replacement
    await db.transaction(
      'rw',
      [
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
        db.chatMessages,
      ],
      async () => {
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

        if (rawFarms.length > 0) await db.farms.bulkPut(rawFarms);
        if (rawFields.length > 0) await db.fields.bulkPut(rawFields);
        if (rawCrops.length > 0) await db.cropCycles.bulkPut(rawCrops);
        if (rawInputs.length > 0) await db.inputRecords.bulkPut(rawInputs);
        if (rawYields.length > 0) await db.yieldRecords.bulkPut(rawYields);
        if (rawAnimals.length > 0) await db.animals.bulkPut(rawAnimals);
        if (rawHealth.length > 0) await db.animalHealthRecords.bulkPut(rawHealth);
        if (rawFeeds.length > 0) await db.animalFeedRecords.bulkPut(rawFeeds);
        if (rawProductions.length > 0) await db.animalProductionRecords.bulkPut(rawProductions);
        if (rawTools.length > 0) await db.tools.bulkPut(rawTools);
        if (rawMessages.length > 0) await db.chatMessages.bulkPut(rawMessages);
      }
    );

    // Restore app settings if present
    if (data.settings && typeof data.settings === 'object') {
      await saveAppSettings(data.settings);
    }
    localStorage.setItem('farmpro_onboarding_completed', 'true');

    // Retrieve the newly restored active farm
    const restoredFarm = (await getCurrentFarm()) || rawFarms[0];

    return {
      success: true,
      message: 'Farm data restored successfully!',
      farm: restoredFarm,
      counts: {
        farms: rawFarms.length,
        fields: rawFields.length,
        crops: rawCrops.length,
        inputs: rawInputs.length,
        yields: rawYields.length,
        animals: rawAnimals.length,
        health: rawHealth.length,
        feeds: rawFeeds.length,
        productions: rawProductions.length,
        tools: rawTools.length,
        messages: rawMessages.length,
      },
    };
  } catch (err: any) {
    console.error('Failed to import database backup:', err);
    return {
      success: false,
      message: `Failed to restore database: ${err?.message || 'Unknown error'}`,
    };
  }
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
