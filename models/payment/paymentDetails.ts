export interface ExtendedPaymentShippingOption {
  id: string;
  label: string;
  amount: {
    currency: string;
    value: string;
  };
  selected: boolean;
}

export interface ExtendedPaymentDetailsInit extends PaymentDetailsInit {
  shippingOptions?: ExtendedPaymentShippingOption[];
}

export interface ExtendedPaymentDetailsUpdate extends PaymentDetailsUpdate {
  shippingOptions?: ExtendedPaymentShippingOption[];
}
