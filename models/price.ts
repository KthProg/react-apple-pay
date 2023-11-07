export interface Price {
  isSale?: boolean;
  isSitewideCoupon?: boolean;
  currencyCode: string;
  amount: number;
  fractionDigits: number;
}

export interface NormalizedProductPrice {
  basePrice: Price;
  customerGroup: string | null;
  discountPrice: Price | null;
  salePrice: Price;
}