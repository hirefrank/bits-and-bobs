import { CompPackage } from './package';

export interface Config {
  taxRates: {
    federal: number;
    state: number;
    amt: number;
    capitalGains: {
      shortTerm: number;
      longTerm: number;
    };
  };
  equity: {
    defaultVestingSchedule: number[];
    defaultRefreshGrants: Array<any>;
  };
  company: {
    defaultLiquidityDiscount: number;
    defaultExitMultiple: number;
  };
  packages: {
    current: CompPackage;
    new: CompPackage;
  };
}