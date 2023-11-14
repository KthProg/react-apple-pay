import { CartShippingAddress } from 'models/cart';
import { IApplePayCommonService } from './interfaces/applePayCommonService';

export class ApplePayCommonService implements IApplePayCommonService {
  convertCartAddressToContact(
    shippingAddress: CartShippingAddress,
  ): ApplePayJS.ApplePayPaymentContact {
    return {
      locality: shippingAddress.city ?? undefined,
      countryCode: shippingAddress.country ?? undefined,
      postalCode: shippingAddress.postalCode ?? undefined,
      administrativeArea: shippingAddress.state ?? undefined,
      addressLines: [
        `${shippingAddress.streetNumber ?? ''} ${shippingAddress.streetName ?? ''}`,
        ...(!!shippingAddress.apartment ? [shippingAddress.apartment] : []),
      ],
      emailAddress: shippingAddress.email ?? undefined,
      phoneNumber: shippingAddress.phone ?? undefined,
      givenName: shippingAddress.firstName ?? undefined,
      familyName: shippingAddress.lastName ?? undefined,
    };
  }
}
