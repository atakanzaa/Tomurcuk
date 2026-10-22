// Yetki matrisi (docs/mvp.md "Yetki matrisi"). Arayüz yalnızca gösterir ya da gizler;
// asıl kontrol backend'de izin bazlıdır (ORDER_CANCEL, CUSTOMER_PII_VIEW gibi).
import { ShopRole, SupportRole } from "@/lib/api/types";

export const Permission = {
  OrderCancel: "ORDER_CANCEL",
  RefundStart: "REFUND_START",
  CustomerPiiView: "CUSTOMER_PII_VIEW",
  ShopImpersonate: "SHOP_IMPERSONATE",
  ShopSuspend: "SHOP_SUSPEND",
  CatalogEdit: "CATALOG_EDIT",
  AuditViewAll: "AUDIT_VIEW_ALL",
} as const;
export type Permission = (typeof Permission)[keyof typeof Permission];

const supportMatrix: Record<SupportRole, Permission[]> = {
  [SupportRole.Owner]: Object.values(Permission),
  [SupportRole.Lead]: Object.values(Permission),
  // Temsilci telefonu maskeli görür, gerekçeyle açar; iptal için lidere aktarır.
  [SupportRole.Agent]: [Permission.ShopImpersonate, Permission.CatalogEdit],
};

const shopMatrix: Record<ShopRole, Permission[]> = {
  [ShopRole.Owner]: [Permission.OrderCancel, Permission.RefundStart, Permission.CustomerPiiView, Permission.CatalogEdit],
  [ShopRole.Staff]: [Permission.CustomerPiiView],
};

export const supportCan = (role: SupportRole, permission: Permission) => supportMatrix[role].includes(permission);
export const shopCan = (role: ShopRole, permission: Permission) => shopMatrix[role].includes(permission);

export const supportRoleLabel: Record<SupportRole, string> = {
  [SupportRole.Owner]: "Platform sahibi",
  [SupportRole.Lead]: "Destek lideri",
  [SupportRole.Agent]: "Destek temsilcisi",
};
