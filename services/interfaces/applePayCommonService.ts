import { CartShippingAddress } from 'models/cart';

export interface IApplePayCommonService {
  convertCartAddressToContact(
    shippingAddress: CartShippingAddress,
  ): ApplePayJS.ApplePayPaymentContact;
}
