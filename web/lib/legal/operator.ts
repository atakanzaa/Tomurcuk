// Tomurcuk'u işleten kişi ya da şirket: aracı hizmet sağlayıcı (6563 sayılı Kanun) ve Tomurcuk'un
// kendi verilerinde veri sorumlusu. Köşeli parantezli değerler henüz verilmedi; canlıya çıkmadan
// önce doldurulmalı ve metinler bir hukukçuya gösterilmeli.

export const OPERATOR = {
  /** Ticaret unvanı ya da şahıs şirketinde ad soyad. */
  name: "[Tomurcuk işleticisinin unvanı]",
  address: "[İşleticinin adresi]",
  email: "destek@tomurcuk.shop",
  web: "tomurcuk.shop",
  /** Sipariş ve hesap verilerinin tutulduğu sunucu. */
  hosting: "Hostinger International Ltd. (sanal sunucu)",
} as const;
