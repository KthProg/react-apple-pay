export interface ShippingMethod {
  // added during parsing
  isFree?: boolean;

  id: string;
  name: string;
  shippingMethodName: string;
  isDefault: boolean;
  amount: number;
  currencyCode: string;

  deliveryDate: string;
}
