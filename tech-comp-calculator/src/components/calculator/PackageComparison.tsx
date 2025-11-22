import React from 'react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import CompCalculator from './CompCalculator';
import EquityCalculator from './EquityCalculator';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import EquityDisclaimer from './EquityDisclaimer';
import defaultConfig from '../../config/defaults.json';
import { Config } from '../../types/config';
import { CompPackage } from '../../types/package';

const config = defaultConfig as Config;

export default function PackageComparison() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'current';

  const updateTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const [currentPackage, setCurrentPackage] = useState<CompPackage>(() => {
    const savedCurrentPackage = sessionStorage.getItem('currentPackage');
    return savedCurrentPackage ? JSON.parse(savedCurrentPackage) : {
      ...config.packages.current,
      company: {
        ...config.packages.current.company,
        type: config.packages.current.company.type || 'public'
      },
      equity: {
        ...config.packages.current.equity,
        liquidityDiscount: config.packages.current.equity.liquidityDiscount || 0,
        exitMultiple: config.packages.current.equity.exitMultiple || 1.0
      }
    };
  });

  const [newPackage, setNewPackage] = useState<CompPackage>(() => {
    const savedNewPackage = sessionStorage.getItem('newPackage');
    return savedNewPackage ? JSON.parse(savedNewPackage) : {
      ...config.packages.new,
      company: {
        ...config.packages.new.company,
        type: config.packages.new.company.type || 'public'
      },
      equity: {
        ...config.packages.new.equity,
        liquidityDiscount: config.packages.new.equity.liquidityDiscount || 0,
        exitMultiple: config.packages.new.equity.exitMultiple || 1.0
      }
    };
  });

  const applyRiskAdjustments = (rawEquityValue: number, pkg: CompPackage) => {
    if (pkg.company.type === 'private' && pkg.equity.liquidityDiscount && pkg.equity.exitMultiple) {
      const afterDiscount = rawEquityValue * (1 - pkg.equity.liquidityDiscount / 100);
      return afterDiscount * pkg.equity.exitMultiple;
    }
    return rawEquityValue;
  };

  const calculateYearlyTotal = (pkg: CompPackage, year: number) => {
    // Calculate base salary with growth
    let currentSalary = pkg.base;
    for (let i = 0; i < year; i++) {
      currentSalary *= (1 + pkg.growth[i].salaryGrowth / 100);
    }

    // Calculate bonus based on the new salary
    const bonus = currentSalary * (pkg.growth[year].bonusPercentage / 100);

    // Calculate equity appreciation and vesting
    const appreciationRate = pkg.equity.annualAppreciation || 0;
    const appreciationMultiplier = Math.pow(1 + appreciationRate / 100, year);

    // Calculate vested equity value
    const vestedPercent = pkg.equity.vestingSchedule[year];
    const vestedValue = pkg.equity.initialGrant * (vestedPercent / 100) * appreciationMultiplier;

    // Calculate refresh grants
    const refreshValue = pkg.equity.refreshGrants
      .filter(grant => grant.year === year + 1)
      .reduce((sum, grant) => {
        const yearsAppreciated = year - (grant.year - 1);
        const grantAppreciationMultiplier = Math.pow(1 + appreciationRate / 100, yearsAppreciated);
        return sum + (grant.amount * grantAppreciationMultiplier);
      }, 0);

    // Total raw equity before risk adjustments
    const rawEquity = vestedValue + refreshValue;

    // Apply risk adjustments
    const riskAdjustedEquity = applyRiskAdjustments(rawEquity, pkg);

    return {
      salary: currentSalary,
      bonus: bonus,
      equity: riskAdjustedEquity,
      total: currentSalary + bonus + riskAdjustedEquity,
      equityDetails: {
        raw: rawEquity,
        riskAdjusted: riskAdjustedEquity,
        discount: pkg.equity.liquidityDiscount || 0,
        multiple: pkg.equity.exitMultiple || 1.0
      }
    };
  };

  const comparisonData = Array(4).fill(null).map((_, year) => {
    const currentYearTotal = calculateYearlyTotal(currentPackage, year);
    const newYearTotal = calculateYearlyTotal(newPackage, year);

    return {
      year: `Year ${year + 1}`,
      current: currentYearTotal,
      new: newYearTotal,
      difference: newYearTotal.total - currentYearTotal.total
    };
  });

  return (
    <div className="min-h-screen bg-gray-50 p-0">
      <div className="max-w-7xl mx-auto">
        <Tabs value={currentTab} onValueChange={updateTab} className="space-y-8">
          <TabsList>
            <TabsTrigger value="current">Current Package</TabsTrigger>
            <TabsTrigger value="new">New Package</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
          </TabsList>

          <TabsContent value="current">
            <div className="grid grid-cols-1 gap-8">
              <CompCalculator
                package={currentPackage}
                onUpdate={setCurrentPackage}
                title="Current Package"
              />
              <EquityCalculator
                package={currentPackage}
                onUpdate={setCurrentPackage}
              />
            </div>
          </TabsContent>

          <TabsContent value="new">
            <div className="grid grid-cols-1 gap-8">
              <CompCalculator
                package={newPackage}
                onUpdate={setNewPackage}
                title="New Package"
              />
              <EquityCalculator
                package={newPackage}
                onUpdate={setNewPackage}
              />
            </div>
          </TabsContent>

          <TabsContent value="comparison">
            <Card>
              <CardHeader>
                <CardTitle>Package Comparison</CardTitle>
                <CardDescription>Compare total compensation over time with risk-adjusted equity values</CardDescription>
              </CardHeader>
              <CardContent>
                {(currentPackage.company.type === 'private' || newPackage.company.type === 'private') && (
                  <EquityDisclaimer companyType="private" />
                )}
                <div className="space-y-8">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm font-medium">Year 1 Difference</div>
                        <div className={`text-2xl font-bold ${comparisonData[0].difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {comparisonData[0].difference >= 0 ? '+' : ''}
                          ${comparisonData[0].difference.toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-sm font-medium">4-Year Total Difference</div>
                        <div className={`text-2xl font-bold ${comparisonData.reduce((sum, year) => sum + year.difference, 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {comparisonData.reduce((sum, year) => sum + year.difference, 0) >= 0 ? '+' : ''}
                          ${comparisonData.reduce((sum, year) => sum + year.difference, 0).toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Comparison Chart */}
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={comparisonData}>
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
                          dataKey="current.total"
                          name="Current Package"
                          stroke="#8884d8"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="new.total"
                          name="New Package"
                          stroke="#82ca9d"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Detailed Breakdown */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Year by Year Breakdown</h3>
                    {comparisonData.map((year, index) => (
                      <Card key={index}>
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <div className="font-medium">{year.year}</div>
                              <div className="text-sm text-gray-500">Current Package</div>
                              <div className="mt-1">
                                <div>Base: ${year.current.salary.toLocaleString()}</div>
                                <div>Bonus: ${year.current.bonus.toLocaleString()}</div>
                                <div>
                                  Equity: ${year.current.equity.toLocaleString()}
                                  {currentPackage.company.type === 'private' && (
                                    <div className="text-xs text-gray-500">
                                      (Raw: ${year.current.equityDetails.raw.toLocaleString()})
                                      <br />
                                      Risk-adjusted after {year.current.equityDetails.discount}% discount & {year.current.equityDetails.multiple}x multiple
                                    </div>
                                  )}
                                </div>
                                <div className="font-medium mt-1">
                                  Total: ${year.current.total.toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <div>
                              <div className="font-medium">&nbsp;</div>
                              <div className="text-sm text-gray-500">New Package</div>
                              <div className="mt-1">
                                <div>Base: ${year.new.salary.toLocaleString()}</div>
                                <div>Bonus: ${year.new.bonus.toLocaleString()}</div>
                                <div>
                                  Equity: ${year.new.equity.toLocaleString()}
                                  {newPackage.company.type === 'private' && (
                                    <div className="text-xs text-gray-500">
                                      (Raw: ${year.new.equityDetails.raw.toLocaleString()})
                                      <br />
                                      Risk-adjusted after {year.new.equityDetails.discount}% discount & {year.new.equityDetails.multiple}x multiple
                                    </div>
                                  )}
                                </div>
                                <div className="font-medium mt-1">
                                  Total: ${year.new.total.toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <div>
                              <div className="font-medium">&nbsp;</div>
                              <div className="text-sm text-gray-500">Difference</div>
                              <div className="mt-1">
                                <div className={year.new.salary - year.current.salary >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  ${(year.new.salary - year.current.salary).toLocaleString()}
                                </div>
                                <div className={year.new.bonus - year.current.bonus >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  ${(year.new.bonus - year.current.bonus).toLocaleString()}
                                </div>
                                <div>
                                  <div className={year.new.equity - year.current.equity >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    ${(year.new.equity - year.current.equity).toLocaleString()}
                                  </div>
                                  {(currentPackage.company.type === 'private' || newPackage.company.type === 'private') && (
                                    <div className="text-xs text-gray-500">
                                      Raw difference: ${(year.new.equityDetails.raw - year.current.equityDetails.raw).toLocaleString()}
                                    </div>
                                  )}
                                </div>
                                <div className={`font-medium mt-1 ${year.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ${year.difference.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}