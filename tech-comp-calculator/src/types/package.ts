export interface CompPackage {
  base: number;
  growth: {
    salaryGrowth: number;
    bonusPercentage: number;
  }[];
  company: {
    type: 'public' | 'private';
  };
  equity: {
    type: 'RSU' | 'ISO' | 'NSO';
    initialGrant: number;
    vestingSchedule: number[];
    refreshGrants: {
      year: number;
      amount: number;
    }[];
    strikePrice?: number;
    currentFMV?: number;
    shares?: number;
    liquidityDiscount?: number;
    exitMultiple?: number;
    annualAppreciation?: number;
  };
}