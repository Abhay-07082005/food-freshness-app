export interface AnalysisResult {
  itemName: string;
  isFresh: boolean;
  freshnessStatus: string;
  freshnessPercentage: number;
  shelfLifeEstimateDays: number;
  shelfLifeRange: string;
  visualObservations: string[];
  storageRecommendation: string;
  idealEnvironment: string;
  spoilageSignals: string[];
  culinaryAdvice: string;
}

export interface ScannedProduce {
  id: string;
  dateScanned: string; // ISO String
  itemImage: string; // Base64 or placeholder URL
  analysis: AnalysisResult;
  reminderScheduled: boolean;
  reminderDaysBefore: number; // e.g., 1 day before, 0 for on-site day
  expirationDate: string; // ISO String computed from shelfLifeEstimateDays
}

export interface ExpiryReminder {
  id: string;
  produceId: string;
  produceName: string;
  scheduledTime: string; // ISO string
  status: "pending" | "fired" | "dismissed";
  message: string;
}
