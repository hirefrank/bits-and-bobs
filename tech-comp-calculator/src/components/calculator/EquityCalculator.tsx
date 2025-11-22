import React, { useEffect } from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import defaultConfig from '../../config/defaults.json';

interface EquityCalculatorProps {
  package: any; // TODO: Use proper type from PackageComparison
  onUpdate: (pkg: any) => void;
}
const { taxRates: DEFAULT_TAX_RATES } = defaultConfig;

export default function EquityCalculator({ package: pkg, onUpdate }: EquityCalculatorProps) {
  const [taxRates, setTaxRates] = useState(() => {
    const savedTaxRates = sessionStorage.getItem('taxRates');
    return savedTaxRates ? JSON.parse(savedTaxRates) : DEFAULT_TAX_RATES;
  });

  useEffect(() => {
    sessionStorage.setItem('taxRates', JSON.stringify(taxRates));
  }, [taxRates]);

  const handleEquityChange = (field: string, value: any) => {
    onUpdate({
      ...pkg,
      equity: {
        ...pkg.equity,
        [field]: value
      }
    });
  };

  const handleCompanyChange = (type: 'public' | 'private') => {
    if (type === 'public') {
      // Reset private company fields when switching to public
      onUpdate({
        ...pkg,
        company: { type },
        equity: {
          ...pkg.equity,
          liquidityDiscount: undefined,
          exitMultiple: undefined
        }
      });
    } else {
      // Set default values from config when switching to private
      onUpdate({
        ...pkg,
        company: { type },
        equity: {
          ...pkg.equity,
          liquidityDiscount: defaultConfig.company.defaultLiquidityDiscount,
          exitMultiple: defaultConfig.company.defaultExitMultiple
        }
      });
    }
  };

  const calculateTax = (totalValue: number) => {
    // Calculate tax implications based on equity type
    if (pkg.equity.type === 'RSU') {
      return totalValue * ((taxRates.federal + taxRates.state) / 100);
    } else if (pkg.equity.type === 'ISO' && pkg.equity.strikePrice && pkg.equity.shares) {
      // AMT calculation for ISOs
      const amtIncome = totalValue - (pkg.equity.shares * pkg.equity.strikePrice);
      return Math.max(0, amtIncome * (taxRates.amt / 100));
    } else if (pkg.equity.strikePrice && pkg.equity.shares) { // NSO
      const spread = totalValue - (pkg.equity.shares * pkg.equity.strikePrice);
      return spread * ((taxRates.federal + taxRates.state) / 100);
    }
    return 0;
  };

  const calculateYearlyEquity = (year: number) => {
    // Calculate appreciation multiplier
    const appreciationRate = pkg.equity.annualAppreciation || 0;
    const appreciationMultiplier = Math.pow(1 + appreciationRate / 100, year);

    // Calculate vested equity with appreciation
    const vestedPercent = pkg.equity.vestingSchedule[year];
    const vestedValue = pkg.equity.initialGrant * (vestedPercent / 100) * appreciationMultiplier;

    // Calculate refresh grants with appreciation
    const refreshValue = pkg.equity.refreshGrants
      .filter(grant => grant.year === year + 1)
      .reduce((sum, grant) => {
        const yearsAppreciated = year - (grant.year - 1);
        const grantAppreciationMultiplier = Math.pow(1 + appreciationRate / 100, yearsAppreciated);
        return sum + (grant.amount * grantAppreciationMultiplier);
      }, 0);

    let totalValue = vestedValue + refreshValue;

    // Apply private company adjustments
    if (pkg.company.type === 'private' && pkg.equity.liquidityDiscount && pkg.equity.exitMultiple) {
      totalValue *= (1 - pkg.equity.liquidityDiscount / 100);
      totalValue *= pkg.equity.exitMultiple;
    }

    return {
      gross: totalValue,
      tax: calculateTax(totalValue),
      net: totalValue - calculateTax(totalValue)
    };
  };

  const chartData = Array(4).fill(null).map((_, year) => {
    const values = calculateYearlyEquity(year);
    return {
      year: `Year ${year + 1}`,
      ...values
    };
  });

  useEffect(() => {
    const savedPackage = sessionStorage.getItem('equityPackage');
    if (savedPackage) {
      onUpdate(JSON.parse(savedPackage));
    }
  }, [onUpdate]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equity Details</CardTitle>
        <CardDescription>Configure equity grant and vesting details</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="grant">
          <TabsList>
            <TabsTrigger value="grant">Grant Details</TabsTrigger>
            <TabsTrigger value="vesting">Vesting</TabsTrigger>
            <TabsTrigger value="tax">Tax</TabsTrigger>
          </TabsList>

          <TabsContent value="grant" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Company Type</label>
                <Select
                  value={pkg.company.type}
                  onValueChange={handleCompanyChange}
                >
                  <SelectTrigger className="w-full h-9 px-3 py-2 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="min-w-[8rem] bg-white">
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Equity Type</label>
                <Select
                  value={pkg.equity.type}
                  onValueChange={(value) => handleEquityChange('type', value)}
                >
                  <SelectTrigger className="w-full h-9 px-3 py-2 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="min-w-[8rem] bg-white">
                    <SelectItem value="RSU">RSUs</SelectItem>
                    <SelectItem value="ISO">ISOs</SelectItem>
                    <SelectItem value="NSO">NSOs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Initial Grant Value</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    type="number"
                    value={pkg.equity.initialGrant}
                    onChange={(e) => handleEquityChange('initialGrant', Number(e.target.value))}
                    className="pl-6"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Annual Appreciation (%)</label>
                <div className="relative">
                  <Input
                    type="number"
                    value={pkg.equity.annualAppreciation || 0}
                    onChange={(e) => handleEquityChange('annualAppreciation', Number(e.target.value))}
                    className="pr-6"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                </div>
              </div>

              {(pkg.equity.type === 'ISO' || pkg.equity.type === 'NSO') && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Strike Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <Input
                        type="number"
                        value={pkg.equity.strikePrice}
                        onChange={(e) => handleEquityChange('strikePrice', Number(e.target.value))}
                        className="pl-6"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Number of Shares</label>
                    <Input
                      type="number"
                      value={pkg.equity.shares}
                      onChange={(e) => handleEquityChange('shares', Number(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Current FMV</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <Input
                        type="number"
                        value={pkg.equity.currentFMV}
                        onChange={(e) => handleEquityChange('currentFMV', Number(e.target.value))}
                        className="pl-6"
                      />
                    </div>
                  </div>
                </>
              )}

              {pkg.company.type === 'private' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Liquidity Discount (%)</label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={pkg.equity.liquidityDiscount || 20}
                        onChange={(e) => handleEquityChange('liquidityDiscount', Number(e.target.value))}
                        className="pr-6"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Exit Multiple</label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={pkg.equity.exitMultiple || 1.0}
                        onChange={(e) => handleEquityChange('exitMultiple', Number(e.target.value))}
                        step="0.1"
                        className="pr-6"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">x</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="vesting" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Vesting Schedule</label>
                <div className="grid grid-cols-4 gap-4">
                  {pkg.equity.vestingSchedule.map((percent, index) => (
                    <div key={index}>
                      <label className="block text-xs mb-1">Year {index + 1}</label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={percent}
                          onChange={(e) => {
                            const newSchedule = [...pkg.equity.vestingSchedule];
                            newSchedule[index] = Number(e.target.value);
                            handleEquityChange('vestingSchedule', newSchedule);
                          }}
                          className="pr-6"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Refresh Grants</label>
                <div className="space-y-2">
                  {pkg.equity.refreshGrants.map((grant, index) => (
                    <div key={index} className="grid grid-cols-7 gap-2 items-end">
                      <div className="col-span-2">
                        <label className="block text-xs mb-1">Year</label>
                        <Input
                          type="number"
                          value={grant.year}
                          onChange={(e) => {
                            const newGrants = [...pkg.equity.refreshGrants];
                            newGrants[index] = {
                              ...grant,
                              year: Number(e.target.value)
                            };
                            handleEquityChange('refreshGrants', newGrants);
                          }}
                          min="2"
                        />
                      </div>
                      <div className="col-span-4">
                        <label className="block text-xs mb-1">Amount</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                          <Input
                            type="number"
                            value={grant.amount}
                            onChange={(e) => {
                              const newGrants = [...pkg.equity.refreshGrants];
                              newGrants[index] = {
                                ...grant,
                                amount: Number(e.target.value)
                              };
                              handleEquityChange('refreshGrants', newGrants);
                            }}
                            className="pl-6"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tax" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Federal Tax Rate (%)</label>
                <div className="relative">
                  <Input
                    type="number"
                    value={taxRates.federal}
                    onChange={(e) => setTaxRates(prev => ({ ...prev, federal: Number(e.target.value) }))}
                    className="pr-6"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">State Tax Rate (%)</label>
                <div className="relative">
                  <Input
                    type="number"
                    value={taxRates.state}
                    onChange={(e) => setTaxRates(prev => ({ ...prev, state: Number(e.target.value) }))}
                    className="pr-6"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                </div>
              </div>

              {pkg.equity.type === 'ISO' && (
                <div>
                  <label className="block text-sm font-medium mb-1">AMT Rate (%)</label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={taxRates.amt}
                      onChange={(e) => setTaxRates(prev => ({ ...prev, amt: Number(e.target.value) }))}
                      className="pr-6"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-8">
          <h3 className="font-medium text-lg mb-4">Equity Value Projection</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(value) => `$${(value / 1000)}k`} />
              <Tooltip
                formatter={(value: number) => `$${value.toLocaleString()}`}
                labelFormatter={(label) => `${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="gross"
                name="Gross Value"
                stroke="#8884d8"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="tax"
                name="Tax"
                stroke="#ff8884"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="net"
                name="Net Value"
                stroke="#82ca9d"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}