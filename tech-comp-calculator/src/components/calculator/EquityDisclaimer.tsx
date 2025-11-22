import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle } from 'lucide-react';

const EquityDisclaimer = ({ companyType }) => {
  if (companyType !== 'private') return null;

  return (
    <Alert variant="warning" className="mt-2 mb-8">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Important Note About Private Company Equity</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-2">
          The total compensation shown includes equity value which may not be immediately accessible:
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Private company equity is typically illiquid and cannot be sold until a liquidation event (IPO, acquisition, etc.)</li>
          <li>The actual value of equity may vary significantly from these estimates based on company performance and market conditions</li>
          <li>Equity values are projections and not guaranteed</li>
          <li>Consider liquid compensation (salary + bonus) separately when comparing offers</li>
        </ul>
      </AlertDescription>
    </Alert>
  );
};

export default EquityDisclaimer;