export type UserRole = "admin" | "manager" | "accountant" | "staff";

export interface Permission {
  resource: string;
  action: "create" | "read" | "update" | "delete";
}

const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    // Full access to everything
    { resource: "*", action: "create" },
    { resource: "*", action: "read" },
    { resource: "*", action: "update" },
    { resource: "*", action: "delete" },
  ],
  manager: [
    // Read/write access to financials, fleet, employees
    { resource: "financials", action: "create" },
    { resource: "financials", action: "read" },
    { resource: "financials", action: "update" },
    { resource: "financials", action: "delete" },
    { resource: "fleet", action: "create" },
    { resource: "fleet", action: "read" },
    { resource: "fleet", action: "update" },
    { resource: "fleet", action: "delete" },
    { resource: "employees", action: "create" },
    { resource: "employees", action: "read" },
    { resource: "employees", action: "update" },
    { resource: "employees", action: "delete" },
    { resource: "reports", action: "read" },
  ],
  accountant: [
    // Read/write access to financials only
    { resource: "financials", action: "create" },
    { resource: "financials", action: "read" },
    { resource: "financials", action: "update" },
    { resource: "financials", action: "delete" },
    { resource: "reports", action: "read" },
  ],
  staff: [
    // Read own data, submit expenses
    { resource: "own-data", action: "read" },
    { resource: "expenses", action: "create" },
    { resource: "expenses", action: "read" },
  ],
};

export function hasPermission(
  userRole: UserRole | undefined,
  resource: string,
  action: Permission["action"]
): boolean {
  if (!userRole) return false;

  const permissions = rolePermissions[userRole];
  
  // Check for wildcard permission (admin)
  if (
    permissions.some(
      (p) => p.resource === "*" && p.action === action
    )
  ) {
    return true;
  }

  // Check for specific resource permission
  return permissions.some(
    (p) => p.resource === resource && p.action === action
  );
}

export function canAccessRoute(userRole: UserRole | undefined, route: string): boolean {
  if (!userRole) return false;
  if (userRole === "admin") return true;

  const routePermissions: Record<string, { resource: string; action: Permission["action"] }> = {
    "/accounts-payable": { resource: "financials", action: "read" },
    "/accounts-receivable": { resource: "financials", action: "read" },
    "/credit-cards": { resource: "financials", action: "read" },
    "/checks": { resource: "financials", action: "read" },
    "/transactions": { resource: "financials", action: "read" },
    "/fleet": { resource: "fleet", action: "read" },
    "/fuel": { resource: "fleet", action: "read" },
    "/staff": { resource: "employees", action: "read" },
    "/payroll": { resource: "employees", action: "read" },
    "/reports": { resource: "reports", action: "read" },
    "/admin": { resource: "*", action: "read" },
  };

  const permission = routePermissions[route];
  if (!permission) return true; // Allow access to routes not in the list

  return hasPermission(userRole, permission.resource, permission.action);
}

export function filterByPermission<T extends { id?: string; created_by?: string }>(
  items: T[],
  userRole: UserRole | undefined,
  userId: string | undefined,
  resource: string
): T[] {
  if (!userRole || !userId) return [];
  
  if (userRole === "admin" || userRole === "manager") {
    return items;
  }

  if (userRole === "staff") {
    // Staff can only see their own data
    return items.filter(item => item.created_by === userId);
  }

  return items;
}
