export interface TaxRule {
  id?: string;
  originState: string;
  destinationState: string;
  icmsRate: number;
  ipiRate: number;
  pisRate: number;
  cofinsRate: number;
}

export interface TaxProfile {
  id: string;
  name: string;
  description?: string;
  rules: TaxRule[];
}
