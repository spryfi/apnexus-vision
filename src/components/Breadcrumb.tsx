import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Breadcrumb as BreadcrumbUI,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const routeNames: Record<string, string> = {
  "/": "Dashboard",
  "/accounts-payable": "Accounts Payable",
  "/accounts-receivable": "Accounts Receivable",
  "/credit-cards": "Credit Cards",
  "/checks": "Checks",
  "/transactions": "All Transactions",
  "/fleet": "Vehicles",
  "/fleet/maintenance": "Maintenance",
  "/fleet/documents": "Documents",
  "/fuel": "Fuel Tracking",
  "/staff": "Employees",
  "/payroll": "Payroll",
  "/devices": "Devices",
  "/admin/approvals": "Approval Queue",
  "/admin/ai-review": "AI Review",
  "/reminders": "Reminders",
  "/vendors": "Vendors",
  "/categories": "Categories",
  "/reports": "Reports",
  "/settings": "Settings",
};

export const Breadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <BreadcrumbUI className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/" className="flex items-center">
              <Home className="h-4 w-4" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {pathnames.map((_, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
          const isLast = index === pathnames.length - 1;
          const name = routeNames[routeTo] || pathnames[index];

          return (
            <div key={routeTo} className="flex items-center">
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={routeTo}>{name}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          );
        })}
      </BreadcrumbList>
    </BreadcrumbUI>
  );
};
