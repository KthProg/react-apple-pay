import { Cart } from 'models/cart';
import { ShippingMethod } from 'models/shippingMethod';

export interface IApplePaySDKService {
  setOnErrorCallback(callback: (err: unknown) => void): void;
  convertShippingMethodsToPaymentShippingMethods(
    shippingMethods: ShippingMethod[],
  ): ApplePayJS.ApplePayShippingMethod[];
  convertCartToLineItems(cart: Cart): ApplePayJS.ApplePayLineItem[];
  convertCartToTotal(cart: Cart): ApplePayJS.ApplePayLineItem;
  createSession(
    version: number,
    paymentRequest: ApplePayJS.ApplePayPaymentRequest
  ): void;
  getLatestSupportedVersion(): number;
  getCanMakePaymentsWithActiveCardAsync(merchantId: string): Promise<boolean>;
  onPaymentMethodChangedAsync(event: ApplePayJS.ApplePayPaymentMethodSelectedEvent): Promise<void>;
  onShippingAddressChangedAsync(
    event: ApplePayJS.ApplePayShippingContactSelectedEvent,
  ): Promise<void>;
  onShippingMethodChangedAsync(
    event: ApplePayJS.ApplePayShippingMethodSelectedEvent,
  ): Promise<void>;
  onMerchantValidationAsync(event: ApplePayJS.ApplePayValidateMerchantEvent): Promise<void>;
  onPaymentAuthorizedAsync(event: ApplePayJS.ApplePayPaymentAuthorizedEvent): Promise<void>;
  onCancel(event: ApplePayJS.Event): void;
  startSession(): void;
  endSession(): void;
}
