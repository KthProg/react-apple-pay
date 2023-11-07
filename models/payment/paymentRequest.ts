export interface ExtendedPaymentOptions {
  requestPayerName: boolean;
  requestPayerEmail: boolean;
  requestPayerPhone: boolean;
  requestShipping: boolean;
  shippingType: 'shipping';
}
export interface ExtendedPaymentShippingAddress {
  addressLine: string[];
  region: string;
  country: string;
  city: string;
  dependentLocality: string;
  organization: string;
  phone: string;
  postalCode: string;
  recipient: string;
  sortingCode: string;
  email: string;
}

export interface ExtendedPaymentRequest extends PaymentRequest {
  shippingAddress: ExtendedPaymentShippingAddress | null;
  shippingOption: string | null;
  shippingType: 'shipping';
}
