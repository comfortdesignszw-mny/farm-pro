import { CropCycle, Animal, Farm, Tool } from '../types';

export interface ShareResult {
  success: boolean;
  type: 'shared' | 'copied' | 'failed';
  message: string;
}

export async function shareCropDetails(cycle: CropCycle, farm: Farm): Promise<ShareResult> {
  const plantDate = new Date(cycle.plantingDate);
  const daysGrowing = Math.max(0, Math.floor((Date.now() - plantDate.getTime()) / (1000 * 60 * 60 * 24)));
  
  const cleanCrop = cycle.cropType.replace(/\s+/g, '');
  const cleanVariety = cycle.variety ? cycle.variety.replace(/\s+/g, '') : '';
  const cleanFarm = farm.name.replace(/\s+/g, '');

  const text = [
    `🌾 [FARM PRO] Crop Record: ${cycle.cropType.toUpperCase()}`,
    `----------------------------------------`,
    `🌱 Variety: ${cycle.variety || 'Standard / Unspecified'}`,
    `📍 Field: ${cycle.fieldId} (${cycle.fieldSize || farm.size} ${farm.sizeUnit})`,
    `📅 Planted: ${cycle.plantingDate} (${daysGrowing} days active)`,
    `⏳ Expected Harvest: ${cycle.harvestDateExpected || 'TBD'}`,
    `⚡ Status: ${cycle.status.toUpperCase()}`,
    cycle.notes ? `📝 Notes: ${cycle.notes}` : '',
    `🏡 Farm: ${farm.name} • ${farm.location || 'Local'}`,
    `----------------------------------------`,
    `🏷️ Metadata & Tags:`,
    `#FarmPro #CropRecord #${cleanCrop} ${cleanVariety ? `#${cleanVariety}` : ''} #${cleanFarm} #SmartFarming #AfricanAgriculture #RecordKeeping`,
  ]
    .filter(Boolean)
    .join('\n');

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: `Farm Pro: ${cycle.cropType} Crop Record`,
        text: text,
      });
      return { success: true, type: 'shared', message: `Crop details shared!` };
    } catch (e: any) {
      if (e.name === 'AbortError') {
        return { success: false, type: 'failed', message: 'Share dismissed' };
      }
    }
  }

  // Fallback to clipboard
  try {
    await navigator.clipboard.writeText(text);
    return {
      success: true,
      type: 'copied',
      message: 'Crop details & meta tags copied to clipboard!',
    };
  } catch (err) {
    return {
      success: false,
      type: 'failed',
      message: 'Could not share details automatically.',
    };
  }
}

export async function shareAnimalDetails(animal: Animal, farm: Farm): Promise<ShareResult> {
  const cleanSpecies = animal.species.replace(/[^a-zA-Z0-9]/g, '');
  const cleanBreed = animal.breed ? animal.breed.replace(/[^a-zA-Z0-9]/g, '') : '';
  const cleanFarm = farm.name.replace(/[^a-zA-Z0-9]/g, '');

  const text = [
    `🐾 [FARM PRO] Livestock Record: ${animal.species.toUpperCase()}`,
    `----------------------------------------`,
    `📊 Batch Size: ${animal.batchSize} head`,
    `🧬 Breed: ${animal.breed || 'Mixed / Indigenous'}`,
    `📅 Acquired: ${animal.acquisitionDate} (${animal.acquisitionMethod})`,
    animal.cost ? `💰 Cost: $${animal.cost}` : '',
    `⚡ Status: ${animal.status.toUpperCase()}`,
    animal.notes ? `📝 Notes: ${animal.notes}` : '',
    `🏡 Farm: ${farm.name} • ${farm.location || 'Local'}`,
    `----------------------------------------`,
    `🏷️ Metadata & Tags:`,
    `#FarmPro #LivestockRecord #${cleanSpecies} ${cleanBreed ? `#${cleanBreed}` : ''} #${cleanFarm} #AnimalHealth #AfricanFarming #RecordKeeping`,
  ]
    .filter(Boolean)
    .join('\n');

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: `Farm Pro: ${animal.species} Livestock Record`,
        text: text,
      });
      return { success: true, type: 'shared', message: `Livestock details shared!` };
    } catch (e: any) {
      if (e.name === 'AbortError') {
        return { success: false, type: 'failed', message: 'Share dismissed' };
      }
    }
  }

  // Fallback to clipboard
  try {
    await navigator.clipboard.writeText(text);
    return {
      success: true,
      type: 'copied',
      message: 'Livestock details & meta tags copied to clipboard!',
    };
  } catch (err) {
    return {
      success: false,
      type: 'failed',
      message: 'Could not share details automatically.',
    };
  }
}

export async function shareToolDetails(tool: Tool, farm: Farm): Promise<ShareResult> {
  const cleanName = tool.name.replace(/\s+/g, '');
  const cleanCat = tool.category.replace(/\s+/g, '');
  const cleanFarm = farm.name.replace(/\s+/g, '');

  const categoryLabels: Record<string, string> = {
    hand_tool: 'Hand Tool',
    irrigation: 'Irrigation & Pumping',
    machinery: 'Tractor & Machinery',
    storage: 'Storage & Post-Harvest',
    livestock: 'Livestock Equipment',
    other: 'General Tool',
  };

  const conditionLabels: Record<string, string> = {
    excellent: 'Excellent Condition (Like New)',
    good: 'Good Working Condition',
    fair: 'Fair (Usable / Functional)',
    needs_repair: 'Needs Maintenance / Repair',
  };

  const text = [
    `🔧 [FARM PRO] Equipment & Tool Record: ${tool.name.toUpperCase()}`,
    `----------------------------------------`,
    `📂 Category: ${categoryLabels[tool.category] || tool.category}`,
    `⚙️ Condition: ${conditionLabels[tool.condition] || tool.condition}`,
    `📅 Acquired Date: ${tool.purchaseDate || 'Not specified'}`,
    tool.cost > 0 ? `💰 Purchase / Valued Cost: $${tool.cost.toFixed(2)}` : '',
    tool.serialNumber ? `🔢 Serial / Tag ID: ${tool.serialNumber}` : '',
    tool.notes ? `📝 Description / Notes: ${tool.notes}` : '',
    `🏡 Farm: ${farm.name} • ${farm.location || 'Local District'}`,
    `----------------------------------------`,
    `🏷️ Metadata & Tags:`,
    `#FarmPro #FarmTool #${cleanName} #${cleanCat} #${cleanFarm} #FarmMachinery #SmartFarming #AgriculturalEquipment`,
  ]
    .filter(Boolean)
    .join('\n');

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: `Farm Pro: ${tool.name} Tool Record`,
        text: text,
      });
      return { success: true, type: 'shared', message: `Tool details shared!` };
    } catch (e: any) {
      if (e.name === 'AbortError') {
        return { success: false, type: 'failed', message: 'Share dismissed' };
      }
    }
  }

  // Fallback to clipboard
  try {
    await navigator.clipboard.writeText(text);
    return {
      success: true,
      type: 'copied',
      message: 'Tool details & meta tags copied to clipboard!',
    };
  } catch (err) {
    return {
      success: false,
      type: 'failed',
      message: 'Could not share tool details automatically.',
    };
  }
}
