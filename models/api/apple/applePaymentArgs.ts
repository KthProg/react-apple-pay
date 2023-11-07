import { CartLineItem, CartShippingAddress } from 'models/cart';

export interface ApplePaymentArgs {
  lineItems: CartLineItem[];
  totalAmount: number;
  billingAddressInfo: CartShippingAddress;
  shippingAddressInfo: CartShippingAddress;
  applePayToken: string;
  salesOrderId: string;
  customMerchantData: any;
  ip: string;
  creditCardBrand: string;
}
