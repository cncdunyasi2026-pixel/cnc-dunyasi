import path from "node:path";
import { readFile } from "node:fs/promises";
import type {
  District,
  Neighborhood,
  NeighborhoodOption,
  Province,
  Village,
} from "@/lib/locations/types";
import { formatNeighborhoodLabel } from "@/lib/locations/formatNeighborhoodLabel";

type RawProvince = { id: string; name: string };
type RawDistrict = { id: string; il_id: string; name: string };
type RawVillage = { id: string; ilce_id: string; name: string };
type RawNeighborhood = { id: string; koy_id: string; name: string };

type PhpMyAdminExport<T> = Array<{ data?: T[] }>;

type LocationIndexes = {
  provinces: Province[];
  districtsByProvinceId: Map<string, District[]>;
  villagesByDistrictId: Map<string, Village[]>;
  neighborhoodsByVillageId: Map<string, Neighborhood[]>;
};

let indexesPromise: Promise<LocationIndexes> | null = null;

async function readExportData<T>(fileName: string): Promise<T[]> {
  const filePath = path.join(process.cwd(), "src/data/locations", fileName);
  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as PhpMyAdminExport<T>;
  const table = parsed.find((entry) => Array.isArray(entry.data));
  return table?.data ?? [];
}

async function loadIndexes(): Promise<LocationIndexes> {
  const [rawProvinces, rawDistricts, rawVillages, rawNeighborhoods] = await Promise.all([
    readExportData<RawProvince>("il.json"),
    readExportData<RawDistrict>("ilce.json"),
    readExportData<RawVillage>("koy.json"),
    readExportData<RawNeighborhood>("mahalle.json"),
  ]);

  const provinces = rawProvinces
    .map((item) => ({ id: item.id, name: item.name }))
    .sort((a, b) => a.name.localeCompare(b.name, "tr"));

  const districtsByProvinceId = new Map<string, District[]>();
  for (const item of rawDistricts) {
    const district: District = { id: item.id, ilId: item.il_id, name: item.name };
    const list = districtsByProvinceId.get(item.il_id) ?? [];
    list.push(district);
    districtsByProvinceId.set(item.il_id, list);
  }
  for (const list of districtsByProvinceId.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }

  const villagesByDistrictId = new Map<string, Village[]>();
  for (const item of rawVillages) {
    const village: Village = { id: item.id, ilceId: item.ilce_id, name: item.name };
    const list = villagesByDistrictId.get(item.ilce_id) ?? [];
    list.push(village);
    villagesByDistrictId.set(item.ilce_id, list);
  }
  for (const list of villagesByDistrictId.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }

  const neighborhoodsByVillageId = new Map<string, Neighborhood[]>();
  for (const item of rawNeighborhoods) {
    const neighborhood: Neighborhood = { id: item.id, koyId: item.koy_id, name: item.name };
    const list = neighborhoodsByVillageId.get(item.koy_id) ?? [];
    list.push(neighborhood);
    neighborhoodsByVillageId.set(item.koy_id, list);
  }
  for (const list of neighborhoodsByVillageId.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }

  return {
    provinces,
    districtsByProvinceId,
    villagesByDistrictId,
    neighborhoodsByVillageId,
  };
}

async function getIndexes(): Promise<LocationIndexes> {
  if (!indexesPromise) {
    indexesPromise = loadIndexes();
  }
  return indexesPromise;
}

export async function getProvinces(): Promise<Province[]> {
  const { provinces } = await getIndexes();
  return provinces;
}

export async function getDistrictsByProvinceId(provinceId: string): Promise<District[]> {
  const { districtsByProvinceId } = await getIndexes();
  return districtsByProvinceId.get(provinceId) ?? [];
}

export async function getNeighborhoodOptionsByDistrictId(districtId: string): Promise<NeighborhoodOption[]> {
  const { villagesByDistrictId, neighborhoodsByVillageId } = await getIndexes();
  const villages = villagesByDistrictId.get(districtId) ?? [];
  const options: NeighborhoodOption[] = [];

  for (const village of villages) {
    const neighborhoods = neighborhoodsByVillageId.get(village.id) ?? [];
    for (const neighborhood of neighborhoods) {
      options.push({
        id: `${village.id}:${neighborhood.id}`,
        label: formatNeighborhoodLabel(village.name, neighborhood.name),
      });
    }
  }

  const unique = new Map<string, NeighborhoodOption>();
  for (const option of options) {
    const key = option.label.toLocaleUpperCase("tr");
    if (!unique.has(key)) {
      unique.set(key, option);
    }
  }

  return [...unique.values()].sort((a, b) => a.label.localeCompare(b.label, "tr"));
}
