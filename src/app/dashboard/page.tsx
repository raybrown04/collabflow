"use client"

import React from 'react';
import { DashboardCard } from '@/components/DashboardCard';
import { Chart } from '@/components/ui/chart';
import { 
  DollarSign, 
  Users, 
  CreditCard, 
  Activity,
  BarChart3
} from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <select className="bg-background border border-input rounded-md px-3 py-1 text-sm">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 3 months</option>
            <option>Last 12 months</option>
          </select>
          <button className="bg-primary text-primary-foreground rounded-md px-3 py-1 text-sm">
            Download
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Total Revenue"
          value="$45,231.89"
          description="Monthly revenue"
          trend={{ value: 12.5, isPositive: true }}
          showChart={true}
          chartData={[30, 48, 31, 45, 50, 43, 60, 53, 56, 62, 59, 71]}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <DashboardCard
          title="New Customers"
          value="1,234"
          description="Active users"
          trend={{ value: 20.1, isPositive: false }}
          showChart={true}
          chartData={[25, 30, 35, 40, 45, 40, 35, 30, 25, 20, 15, 10]}
          icon={<Users className="h-4 w-4" />}
        />
        <DashboardCard
          title="Active Accounts"
          value="573"
          description="Monthly active users"
          trend={{ value: 12.5, isPositive: true }}
          showChart={true}
          chartData={[10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65]}
          icon={<CreditCard className="h-4 w-4" />}
        />
        <DashboardCard
          title="Growth Rate"
          value="12.5%"
          description="Compared to last month"
          trend={{ value: 4.5, isPositive: true }}
          showChart={true}
          chartData={[5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]}
          icon={<Activity className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        <div className="lg:col-span-4">
          <div className="rounded-lg border bg-card text-card-foreground shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Overview</h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-primary"></div>
                  <span className="text-sm text-muted-foreground">This Year</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-muted"></div>
                  <span className="text-sm text-muted-foreground">Last Year</span>
                </div>
              </div>
            </div>
            <div className="h-[300px]">
              <Chart 
                height={300}
                showXAxis={true}
                showYAxis={true}
                showGrid={true}
                data={[30, 40, 35, 50, 45, 60, 55, 65, 75, 70, 80, 85]}
              />
            </div>
          </div>
        </div>
        <div className="lg:col-span-3">
          <div className="rounded-lg border bg-card text-card-foreground shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Recent Sales</h3>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-4">
              {[
                { name: 'John Smith', email: 'john@example.com', amount: '$250.00' },
                { name: 'Jane Cooper', email: 'jane@example.com', amount: '$350.00' },
                { name: 'Robert Fox', email: 'robert@example.com', amount: '$450.00' },
                { name: 'Emily Wilson', email: 'emily@example.com', amount: '$550.00' },
                { name: 'Michael Brown', email: 'michael@example.com', amount: '$650.00' }
              ].map((sale, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                      {sale.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{sale.name}</p>
                      <p className="text-xs text-muted-foreground">{sale.email}</p>
                    </div>
                  </div>
                  <div className="text-sm font-medium">{sale.amount}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
