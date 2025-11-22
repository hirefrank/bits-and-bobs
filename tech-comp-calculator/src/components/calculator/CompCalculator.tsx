import React, { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CompCalculatorProps {
  package: any; // Replace with proper type from PackageComparison
  onUpdate: (pkg: any) => void;
  title: string;
}

export default function CompCalculator({ package: pkg, onUpdate, title }: CompCalculatorProps) {
  useEffect(() => {
    const savedPackage = sessionStorage.getItem('compPackage');
    if (savedPackage) {
      onUpdate(JSON.parse(savedPackage));
    }
  }, [onUpdate]);

  const handleGrowthChange = (year: number, field: string, value: number) => {
    const newGrowth = [...pkg.growth];
    newGrowth[year] = {
      ...newGrowth[year],
      [field]: value
    };
    onUpdate({
      ...pkg,
      growth: newGrowth
    });
  };

  const calculateSalaryForYear = (baseSalary: number, year: number) => {
    let currentSalary = baseSalary;
    for (let i = 0; i <= year; i++) {
      currentSalary *= (1 + pkg.growth[i].salaryGrowth / 100);
    }
    return currentSalary;
  };

  const calculateYearlyCompensation = (year: number) => {
    const currentSalary = calculateSalaryForYear(pkg.base, year);
    const bonus = currentSalary * (pkg.growth[year].bonusPercentage / 100);

    return {
      salary: currentSalary,
      bonus: bonus,
      total: currentSalary + bonus
    };
  };

  const chartData = pkg.growth.map((_, index) => {
    const comp = calculateYearlyCompensation(index);
    return {
      year: `Year ${index + 1}`,
      ...comp
    };
  });

  useEffect(() => {
    sessionStorage.setItem('compPackage', JSON.stringify(pkg));
  }, [pkg]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Configure base salary and bonus targets</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Base Salary</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <Input
                type="number"
                value={pkg.base}
                onChange={(e) => onUpdate({
                  ...pkg,
                  base: Number(e.target.value)
                })}
                className="pl-6"
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-4">Year by Year Growth</h3>
            <div className="space-y-4">
              {pkg.growth.map((yearGrowth, index) => {
                const yearlyComp = calculateYearlyCompensation(index);

                return (
                  <div key={index} className="p-4 border rounded-lg space-y-4">
                    <h4 className="font-medium">Year {index + 1}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm mb-1">Salary Growth</label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={yearGrowth.salaryGrowth}
                            onChange={(e) => handleGrowthChange(index, 'salaryGrowth', Number(e.target.value))}
                            className="pr-6"
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Target Bonus</label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={yearGrowth.bonusPercentage}
                            onChange={(e) => handleGrowthChange(index, 'bonusPercentage', Number(e.target.value))}
                            className="pr-6"
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      <div>Base Salary: ${calculateSalaryForYear(pkg.base, index).toLocaleString()}</div>
                      <div>Target Bonus: ${(calculateSalaryForYear(pkg.base, index) * (yearGrowth.bonusPercentage / 100)).toLocaleString()} ({yearGrowth.bonusPercentage}% of base)</div>
                      <div className="font-medium">Total: ${(calculateSalaryForYear(pkg.base, index) * (1 + yearGrowth.bonusPercentage / 100)).toLocaleString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8">
            <h3 className="font-medium text-lg mb-4">Compensation Growth</h3>
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
                  dataKey="salary"
                  name="Base Salary"
                  stroke="#8884d8"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="bonus"
                  name="Target Bonus"
                  stroke="#82ca9d"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total Cash"
                  stroke="#ffc658"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}