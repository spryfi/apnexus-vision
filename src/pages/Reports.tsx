import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Plus, 
  DollarSign, 
  Truck, 
  Users, 
  Settings,
  Download,
  Calendar
} from "lucide-react";
import APAgingReport from "@/components/reports/APAgingReport";
import ARAgingReport from "@/components/reports/ARAgingReport";
import CashFlowReport from "@/components/reports/CashFlowReport";
import SpendingByCategoryReport from "@/components/reports/SpendingByCategoryReport";
import FleetCostReport from "@/components/reports/FleetCostReport";
import EmployeeSpendingReport from "@/components/reports/EmployeeSpendingReport";

const Reports = () => {
  const [activeTab, setActiveTab] = useState("financial");

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Generate comprehensive reports and insights
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Report
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Custom Report
          </Button>
        </div>
      </div>

      {/* Reports Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="financial">
            <DollarSign className="h-4 w-4 mr-2" />
            Financial
          </TabsTrigger>
          <TabsTrigger value="fleet">
            <Truck className="h-4 w-4 mr-2" />
            Fleet
          </TabsTrigger>
          <TabsTrigger value="employees">
            <Users className="h-4 w-4 mr-2" />
            Employees
          </TabsTrigger>
          <TabsTrigger value="operational">
            <Settings className="h-4 w-4 mr-2" />
            Operational
          </TabsTrigger>
          <TabsTrigger value="custom">
            <Plus className="h-4 w-4 mr-2" />
            Custom
          </TabsTrigger>
        </TabsList>

        {/* Financial Reports */}
        <TabsContent value="financial" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="font-semibold text-lg mb-2">AP Aging Report</h3>
              <p className="text-sm text-muted-foreground mb-4">
                View outstanding payables by aging bucket
              </p>
              <Button size="sm" className="w-full">Generate Report</Button>
            </Card>
            
            <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="font-semibold text-lg mb-2">AR Aging Report</h3>
              <p className="text-sm text-muted-foreground mb-4">
                View outstanding receivables by aging bucket
              </p>
              <Button size="sm" className="w-full">Generate Report</Button>
            </Card>

            <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="font-semibold text-lg mb-2">Cash Flow Statement</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Track cash inflows and outflows over time
              </p>
              <Button size="sm" className="w-full">Generate Report</Button>
            </Card>

            <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="font-semibold text-lg mb-2">Spending by Category</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Analyze expenses across all categories
              </p>
              <Button size="sm" className="w-full">Generate Report</Button>
            </Card>

            <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="font-semibold text-lg mb-2">Vendor Spending</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Total spending per vendor with trends
              </p>
              <Button size="sm" className="w-full">Generate Report</Button>
            </Card>

            <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="font-semibold text-lg mb-2">P&L Statement</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Monthly profit and loss statement
              </p>
              <Button size="sm" className="w-full">Generate Report</Button>
            </Card>
          </div>

          {/* Show actual reports */}
          <div className="space-y-8">
            <APAgingReport />
            <ARAgingReport />
            <CashFlowReport />
            <SpendingByCategoryReport />
          </div>
        </TabsContent>

        {/* Fleet Reports */}
        <TabsContent value="fleet" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="font-semibold text-lg mb-2">Vehicle Cost Analysis</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Total fleet costs by vehicle and category
              </p>
              <Button size="sm" className="w-full">Generate Report</Button>
            </Card>

            <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="font-semibold text-lg mb-2">Fuel Analysis</h3>
              <p className="text-sm text-muted-foreground mb-4">
                MPG, fuel costs, and efficiency metrics
              </p>
              <Button size="sm" className="w-full">Generate Report</Button>
            </Card>

            <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="font-semibold text-lg mb-2">Maintenance History</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Complete maintenance records and costs
              </p>
              <Button size="sm" className="w-full">Generate Report</Button>
            </Card>

            <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="font-semibold text-lg mb-2">Vehicle Utilization</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Track active days vs. downtime
              </p>
              <Button size="sm" className="w-full">Generate Report</Button>
            </Card>

            <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="font-semibold text-lg mb-2">Compliance Status</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Insurance and registration tracking
              </p>
              <Button size="sm" className="w-full">Generate Report</Button>
            </Card>
          </div>

          <FleetCostReport />
        </TabsContent>

        {/* Employee Reports */}
        <TabsContent value="employees" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="font-semibold text-lg mb-2">Employee Spending</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Track spending by employee and category
              </p>
              <Button size="sm" className="w-full">Generate Report</Button>
            </Card>

            <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="font-semibold text-lg mb-2">Employee Directory</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Complete employee list with details
              </p>
              <Button size="sm" className="w-full">Generate Report</Button>
            </Card>

            <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="font-semibold text-lg mb-2">Device Assignments</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Track all assigned company devices
              </p>
              <Button size="sm" className="w-full">Generate Report</Button>
            </Card>

            <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="font-semibold text-lg mb-2">Time Off Report</h3>
              <p className="text-sm text-muted-foreground mb-4">
                PTO usage and remaining balances
              </p>
              <Button size="sm" className="w-full">Generate Report</Button>
            </Card>
          </div>

          <EmployeeSpendingReport />
        </TabsContent>

        {/* Operational Reports */}
        <TabsContent value="operational" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="font-semibold text-lg mb-2">Transaction Log</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Complete transaction history with filters
              </p>
              <Button size="sm" className="w-full">Generate Report</Button>
            </Card>

            <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="font-semibold text-lg mb-2">Approval Queue Status</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Track pending approvals and timelines
              </p>
              <Button size="sm" className="w-full">Generate Report</Button>
            </Card>

            <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="font-semibold text-lg mb-2">AI Review Analytics</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Flags, anomalies, and review metrics
              </p>
              <Button size="sm" className="w-full">Generate Report</Button>
            </Card>
          </div>
        </TabsContent>

        {/* Custom Reports */}
        <TabsContent value="custom" className="space-y-6 mt-6">
          <Card className="p-12 text-center">
            <Plus className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Custom Report Builder</h3>
            <p className="text-muted-foreground mb-4">
              Create custom reports with flexible filters and visualizations
            </p>
            <Button size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Build Custom Report
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
