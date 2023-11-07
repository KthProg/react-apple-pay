import { ExtendedPaymentOptions, ExtendedPaymentRequest } from 'models/payment/paymentRequest';
import {
  ApplePayPaymentDetailsInit,
  ApplePayPaymentMethodData,
} from 'services/interfaces/applePayPaymentRequestService';

export const createPaymentRequest = (
  applePayPaymentMethodData: ApplePayPaymentMethodData,
  paymentDetails: ApplePayPaymentDetailsInit,
) => {
  return new PaymentRequest(
    [applePayPaymentMethodData],
    paymentDetails,
    // below options not standard and not available on most browsers
    /* @ts-ignore */
    {
      requestPayerEmail: true,
      requestPayerName: true,
      requestPayerPhone: true,
      requestShipping: true,
      shippingType: 'shipping',
    } as ExtendedPaymentOptions,
  ) as ExtendedPaymentRequest;
};
