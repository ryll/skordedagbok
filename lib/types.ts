export interface CatalogItem {
  id: string;
  name: string;
  active: boolean;
}

export interface Variety extends CatalogItem {
  crop_type_id: string;
}

export interface CropGoal {
  crop_type_id: string;
  year: number;
  goal_weight_grams: number;
  crop_type?: Pick<CatalogItem, "name">;
}

export interface Harvest {
  id: string;
  harvest_date: string;
  crop_type_id: string;
  variety_id: string | null;
  growing_location_id: string;
  quantity: number;
  weight_grams: number;
  sowing_date: string | null;
  circumference_cm: number | null;
  length_cm: number | null;
  comment: string | null;
  created_at: string;
  updated_at: string;
  crop_type?: CatalogItem;
  variety?: Variety | null;
  growing_location?: CatalogItem;
}

export interface HarvestInput {
  harvest_date: string;
  crop_type_id: string;
  variety_id?: string | null;
  growing_location_id: string;
  quantity: number;
  weight_grams: number;
  sowing_date?: string | null;
  circumference_cm?: number | null;
  length_cm?: number | null;
  comment?: string | null;
}

export interface DashboardFilters {
  from?: string;
  to?: string;
  year?: number;
  cropTypeId?: string;
  varietyId?: string;
  growingLocationId?: string;
}

export interface DashboardStats {
  totalWeightGrams: number;
  totalQuantity: number;
  entryCount: number;
  previousWeightGrams: number;
  weightChangePercent: number | null;
  monthly: Array<{ month: string; weightGrams: number }>;
  crops: Array<{
    id: string;
    name: string;
    weightGrams: number;
    quantity: number;
    goalWeightGrams: number | null;
    varieties: Array<{ name: string; weightGrams: number; quantity: number }>;
  }>;
  locations: Array<{ name: string; weightGrams: number }>;
  comparisonLabel: string;
}

export interface ImportReviewRow {
  sourceSheet: string;
  sourceRow: number;
  harvestDate: string;
  originalLabel: string;
  originalLocation: string;
  quantity: number | string;
  weightGrams: number | string;
  sowingDate: string;
  circumferenceCm: number | string;
  lengthCm: number | string;
  comment: string;
  reason: string;
  suggestedCorrection: string;
}
