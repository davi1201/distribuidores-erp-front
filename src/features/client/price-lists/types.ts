export interface PriceList {
  id: string;
  name: string;
  percentageAdjustment?: number;
  isActive: boolean;
  _count?: {
    customers: number;
  };
}
