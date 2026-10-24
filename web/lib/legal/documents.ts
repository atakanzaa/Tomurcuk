// Dükkânın sözleşme sayfalarının adları ve adresleri; metinler components/legal/ShopDocuments.tsx'te.

export const ShopDocument = {
  PreInformation: "on-bilgilendirme",
  DistanceSale: "mesafeli-satis",
  DeliveryReturns: "teslimat-ve-iade",
  Privacy: "kvkk",
} as const;
export type ShopDocument = (typeof ShopDocument)[keyof typeof ShopDocument];

export const shopDocumentTitle: Record<ShopDocument, string> = {
  [ShopDocument.PreInformation]: "Ön bilgilendirme formu",
  [ShopDocument.DistanceSale]: "Mesafeli satış sözleşmesi",
  [ShopDocument.DeliveryReturns]: "Teslimat ve iade şartları",
  [ShopDocument.Privacy]: "Kişisel verilerin işlenmesi hakkında aydınlatma metni",
};

/** Altbilgideki kısa adlar. */
export const shopDocumentShortTitle: Record<ShopDocument, string> = {
  [ShopDocument.PreInformation]: "Ön bilgilendirme",
  [ShopDocument.DistanceSale]: "Mesafeli satış sözleşmesi",
  [ShopDocument.DeliveryReturns]: "Teslimat ve iade",
  [ShopDocument.Privacy]: "Kişisel veriler",
};

export const documentPath = (slug: string, doc: ShopDocument) => `/${slug}/sozlesmeler/${doc}`;
