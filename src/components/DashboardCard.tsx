"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Chart } from '@/components/ui/chart';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  showChart?: boolean;
  chartData?: number[];
  className?: string;
  icon?: React.ReactNode;
}

export function DashboardCard({
  title,
  value,
  description,
  trend,
  showChart = false,
  chartData = [10, 20, 30, 22, 40, 35, 60, 45, 55, 48, 70, 75],
  className,
  icon
}: DashboardCardProps) {
  return (
    <Card className={cn("dashboard-card", className)}>
      <CardHeader className="dashboard-card-header p-4 pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="dashboard-card-title text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {icon && (
            <div className="h-4 w-4 text-muted-foreground">
              {icon}
            </div>
          )}
        </div>
        <div className="dashboard-card-value text-2xl font-bold">
          {value}
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-xs">
            <span className={cn(
              "flex items-center",
              trend.isPositive ? "text-emerald-500" : "text-rose-500"
            )}>
              {trend.isPositive ? (
                <ArrowUpIcon className="h-3 w-3" />
              ) : (
                <ArrowDownIcon className="h-3 w-3" />
              )}
              {Math.abs(trend.value)}%
            </span>
            <span className="text-muted-foreground">
              {trend.isPositive ? "increase" : "decrease"}
            </span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {showChart && (
          <div className="h-[80px] mt-3">
            <Chart 
              data={chartData}
              height={80}
              showXAxis={false}
              showYAxis={false}
              animated={true}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
