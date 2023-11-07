import { APPLE_PAY_PAYMENT_METHOD, StartSessionData } from 'constants/apple-pay';
import { Cart } from 'models/cart';
import { ExtendedPaymentDetailsInit, ExtendedPaymentShippingOption } from 'models/payment/paymentDetails';
import { ShippingMethod } from 'models/shippingMethod';

export interface ApplePayPaymentDetailsInit extends ExtendedPaymentDetailsInit {
  modifiers?: ApplePayModifier[];
}

export interface ApplePayModifier extends PaymentDetailsModifier {
  supportedMethods: typeof APPLE_PAY_PAYMENT_METHOD;
  data: {
    paymentMethodType: ApplePayJS.ApplePayPaymentMethodType;
    total?: ApplePayJS.ApplePayLineItem;
    additionalLineItems?: ApplePayJS.ApplePayLineItem[];
    additionalShippingMethods?: ApplePayJS.ApplePayShippingMethod[];
    multiTokenContexts?: ApplePayJS.ApplePayPaymentTokenContext[];
    automaticReloadPaymentRequest?: ApplePayJS.ApplePayAutomaticReloadPaymentRequest;
    recurringPaymentRequest?: ApplePayJS.ApplePayRecurringPaymentRequest;
    // deferredPaymentRequest: ApplePayJS.ApplePayDeferredPaymentRequest;
  };
}

export interface ApplePayPaymentMethodData extends PaymentMethodData {
  supportedMethods: typeof APPLE_PAY_PAYMENT_METHOD;
  data: {
    version: number;
    merchantIdentifier: string;
    merchantCapabilities: ApplePayJS.ApplePayMerchantCapability[];
    supportedNetworks: string[];
    countryCode: string;
    requiredBillingContactFields?: string[];
    requiredShippingContactFields?: string[];
    billingContact?: ApplePayJS.ApplePayPaymentContact;
    shippingContact?: ApplePayJS.ApplePayPaymentContact;
    applicationData?: string;
    supportedCountries?: string[];
    supportsCouponCode?: boolean;
    couponCode?: string;
    shippingContactEditingMode?: 'available' | 'storePickup';
  };
}

export interface ApplePayPaymentMethodChangeEvent extends PaymentMethodChangeEvent {
  methodDetails: ApplePayJS.ApplePayPaymentMethod; // can also be ApplePayCouponCodeDetails
}

export interface ApplePayPaymentResponse extends PaymentResponse {
  details: ApplePayJS.ApplePayPayment;
}

export interface MerchantValidationEvent extends Event {
  methodName: string;
  validationURL: string;
  complete: (session: unknown) => void;
}

export interface IApplePayPaymentRequestService {
  getCanMakePaymentsAsync(): Promise<boolean>;
  convertShippingMethodsToPaymentShippingMethods(
    shippingMethods: ShippingMethod[],
    selectedShippingMethodId?: string,
  ): ExtendedPaymentShippingOption[];
  convertCartToLineItems(cart: Cart): PaymentItem[];
  convertCartToTotal(cart: Cart): PaymentItem;
  createSession(
    paymentDetailsModifier: ApplePayPaymentMethodData,
    paymentDetails: ApplePayPaymentDetailsInit,
    startSessionData: StartSessionData,
  ): void;
  startSessionAsync(): Promise<PaymentResponse | null>;
  onPaymentMethodChanged(event: Event): void;
  onShippingAddressChanged(event: Event): void;
  onShippingMethodChanged(event: Event): void;
  onMerchantValidation(event: Event): void;
  onPaymentAuthorizedAsync(paymentResponse: ApplePayPaymentResponse): Promise<void>;
}
