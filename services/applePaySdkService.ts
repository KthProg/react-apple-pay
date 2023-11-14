import { ShippingMethod } from 'models/shippingMethod';
import { Cart, CartShippingAddress } from '../models/cart';
import { IApplePaySDKService } from './interfaces/applePaySdkService';
import { isError } from 'helpers/errors';
import { APPLE_PAY_LATEST_VERSION, APPLE_PAY_EARLIEST_VERSION } from 'constants/apple-pay';

const AppleNoOp = (_event: ApplePayJS.Event) => {
  return;
};

/**
 * Service for handling apple pay requests via the ApplePay JS SDK
 */
export class ApplePaySDKService implements IApplePaySDKService {
  private session: ApplePaySession | null = null;
  private version: number = APPLE_PAY_LATEST_VERSION;
  private onError: ((err: unknown) => void) | null = null;

  // @ts-ignore //
  constructor(private applePayCommonService: IApplePayCommonService) {}
  setOnErrorCallback(callback: (err: unknown) => void): void {
    this.onError = callback;
  }

  convertShippingMethodsToPaymentShippingMethods(
    shippingMethods: ShippingMethod[],
  ): ApplePayJS.ApplePayShippingMethod[] {
    return shippingMethods.map(shippingMethod => ({
      amount: shippingMethod.amount.toFixed(2),
      detail: shippingMethod.name,
      label: shippingMethod.name,
      identifier: shippingMethod.id,
    }));
  }

  convertCartToLineItems(cart: Cart): ApplePayJS.ApplePayLineItem[] {
    const lineItems = cart.lineItems.map(cartLineItem => ({
      amount: (cartLineItem.totalPrice!.centAmount / 100).toFixed(2),
      label: cartLineItem.name,
      type: 'final' as ApplePayJS.ApplePayLineItemType,
    }));

    if (cart.shippingInfo && (cart.shippingInfo?.price?.centAmount ?? 0) > 0) {
      lineItems.push({
        amount: (cart.shippingInfo.price.centAmount / 100).toFixed(2),
        type: 'final' as ApplePayJS.ApplePayLineItemType,
        label: 'Shipping',
      });
    }

    if ((cart.taxedPrice?.totalGross?.centAmount ?? 0) > 0) {
      lineItems.push({
        amount: cart.tax.toFixed(2),
        type: 'final' as ApplePayJS.ApplePayLineItemType,
        label: 'Taxes',
      });
    }

    return lineItems;
  }

  convertCartToTotal(cart: Cart): ApplePayJS.ApplePayLineItem {
    return {
      amount: (
        (cart.taxedPrice ? cart.taxedPrice.totalGross.centAmount : cart.totalPrice.centAmount) / 100
      ).toFixed(2),
      label: 'Total',
      type: 'final',
    };
  }

  createSession(
    version: number,
    paymentRequest: ApplePayJS.ApplePayPaymentRequest,
  ): ApplePaySession {
    this.session = new ApplePaySession(version, paymentRequest);
    this.session.onpaymentmethodselected = this.onPaymentMethodChangedAsync.bind(this);
    this.session.onpaymentauthorized = this.onPaymentAuthorizedAsync.bind(this);
    this.session.onshippingcontactselected = this.onShippingAddressChangedAsync.bind(this);
    this.session.onshippingmethodselected = this.onShippingMethodChangedAsync.bind(this);
    this.session.onvalidatemerchant = this.onMerchantValidationAsync.bind(this);
    this.session.oncancel = this.onCancel.bind(this);

    return this.session;
  }

  async onPaymentMethodChangedAsync(
    _event: ApplePayJS.ApplePayPaymentMethodSelectedEvent,
  ): Promise<void> {
    if (!this.session) {
      return;
    }

    const cart = {} as Cart; // TODO: get current cart, set taxes

    if (!cart) {
      throw new Error('No cart in session while paying with Apple Pay');
    }

    const applePayTotal = this.convertCartToTotal(cart);
    const applePayLineItems = this.convertCartToLineItems(cart);

    if (this.version < APPLE_PAY_LATEST_VERSION) {
      this.session.completePaymentMethodSelection(applePayTotal, applePayLineItems);
    } else {
      this.session.completePaymentMethodSelection({
        newTotal: applePayTotal,
        newLineItems: applePayLineItems,
      });
    }
  }

  convertContactToCartAddress(contact: ApplePayJS.ApplePayPaymentContact): CartShippingAddress {
    return {
      city: contact.locality ?? '',
      country: contact.countryCode ?? 'US',
      postalCode: contact.postalCode ?? '',
      state: contact.administrativeArea ?? '',
      streetName: (contact.addressLines?.[0] ?? '').split(' ', 2)?.[1] ?? '',
      streetNumber: (contact.addressLines?.[0] ?? '').split(' ', 2)?.[0] ?? '',
      apartment: contact.addressLines?.[1],
      email: contact.emailAddress ?? '',
      phone: (contact.phoneNumber ?? '').replace('+1', ''),
      firstName: contact.givenName,
      lastName: contact.familyName,
    };
  }

  async onShippingAddressChangedAsync(
    event: ApplePayJS.ApplePayShippingContactSelectedEvent,
  ): Promise<void> {
    if (!this.session) {
      return;
    }

    // @ts-ignore //
    const newCartShippingAddress: CartShippingAddress = this.convertContactToCartAddress(
      event.shippingContact,
    );

    // TODO: call your set shipping address endpoint
    // TODO: recalculate your shipping and taxes
    // TODO: fetch updates shipping methods

    const cart = {} as Cart;
    const shippingMethods = [] as ShippingMethod[];

    if (!cart) {
      throw new Error('No cart returned from tax update request');
    }

    const applePayTotal = this.convertCartToTotal(cart);
    const applePayLineItems = this.convertCartToLineItems(cart);
    const applePayShippingMethods = this.convertShippingMethodsToPaymentShippingMethods(
      shippingMethods,
    );

    if (this.version < APPLE_PAY_LATEST_VERSION) {
      this.session.completeShippingContactSelection(
        ApplePaySession.STATUS_SUCCESS,
        applePayShippingMethods,
        applePayTotal,
        applePayLineItems,
      );
    } else {
      this.session.completeShippingContactSelection({
        newTotal: applePayTotal,
        newLineItems: applePayLineItems,
        newShippingMethods: applePayShippingMethods,
      });
    }
  }

  async onShippingMethodChangedAsync(
    // @ts-ignore //
    event: ApplePayJS.ApplePayShippingMethodSelectedEvent,
  ): Promise<void> {
    if (!this.session) {
      return;
    }

    // TODO: call your set shipping method endpoint
    // TODO: recalculate your shipping and taxes
    // TODO: fetch updates shipping methods

    const cart = {} as Cart;

    if (!cart) {
      throw new Error('No cart returned from tax update request');
    }

    const applePayTotal = this.convertCartToTotal(cart);
    const applePayLineItems = this.convertCartToLineItems(cart);

    if (this.version < APPLE_PAY_LATEST_VERSION) {
      this.session.completeShippingMethodSelection(
        ApplePaySession.STATUS_SUCCESS,
        applePayTotal,
        applePayLineItems,
      );
    } else {
      this.session.completeShippingMethodSelection({
        newTotal: applePayTotal,
        newLineItems: applePayLineItems,
      });
    }
  }

  async onMerchantValidationAsync(event: ApplePayJS.ApplePayValidateMerchantEvent): Promise<void> {
    if (!this.session) {
      return;
    }

    const merchantSession = await fetch('/api/apple/validate-merchant', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        url: event.validationURL
      })
    });
    this.session.completeMerchantValidation(merchantSession);
  }

  async onPaymentAuthorizedAsync(event: ApplePayJS.ApplePayPaymentAuthorizedEvent): Promise<void> {
    if (!this.session) {
      return;
    }

    if (!event.payment.shippingContact) {
      if (this.version < APPLE_PAY_LATEST_VERSION) {
        this.session.completePayment(ApplePaySession.STATUS_INVALID_SHIPPING_CONTACT);
      } else {
        this.session.completePayment({
          status: ApplePaySession.STATUS_INVALID_SHIPPING_CONTACT,
          errors: [
            new ApplePayError(
              'shippingContactInvalid',
              undefined,
              'Your shipping information is missing',
            ),
          ],
        });
      }
      return;
    }

    if (!event.payment.billingContact) {
      if (this.version < APPLE_PAY_LATEST_VERSION) {
        this.session.completePayment(ApplePaySession.STATUS_INVALID_BILLING_POSTAL_ADDRESS);
      } else {
        this.session.completePayment({
          status: ApplePaySession.STATUS_INVALID_BILLING_POSTAL_ADDRESS,
          errors: [
            new ApplePayError(
              'billingContactInvalid',
              undefined,
              'Your billing information is missing',
            ),
          ],
        });
      }
      return;
    }

    try {
      const paymentData = {
        applePayToken: Buffer.from(JSON.stringify(event.payment.token.paymentData)).toString(
          'base64',
        ),
        creditCardBrand: event.payment.token.paymentMethod.network,
        shippingAddress: this.convertContactToCartAddress(event.payment.shippingContact),
        billingAddress: this.convertContactToCartAddress(event.payment.billingContact),
      };

      // @ts-ignore //
      const paymentResult = await fetch('/api/apple/process/payment', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      // TODO: process the payment result
    } catch (ex) {
      if (this.version < APPLE_PAY_LATEST_VERSION) {
        this.session.completePayment(ApplePaySession.STATUS_FAILURE);
      } else {
        this.session.completePayment({
          status: ApplePaySession.STATUS_FAILURE,
          errors: isError(ex) ? [new ApplePayError('unknown', undefined, String(ex.message))] : [],
        });
      }
      if (this.onError) {
        // If there is an error to display, then we abort the payment
        // and show the page again to display the error.
        // Otherwise we'll just let the payment sheet show the default
        // error (which is just a message to "switch payment methods").
        this.onError(ex);
        this.endSession();
      }
      return;
    }

    if (this.version < APPLE_PAY_LATEST_VERSION) {
      this.session.completePayment(ApplePaySession.STATUS_SUCCESS);
    } else {
      this.session.completePayment({
        status: ApplePaySession.STATUS_SUCCESS,
      });
    }
  }

  onCancel(event: ApplePayJS.Event): void {
    console.info('cancelled', event);
  }

  async getCanMakePaymentsWithActiveCardAsync(merchantId: string): Promise<boolean> {
    return await ApplePaySession.canMakePaymentsWithActiveCard(merchantId);
  }

  getLatestSupportedVersion(): number {
    let version = APPLE_PAY_LATEST_VERSION;
    // will default to 3 if 1 and 2 are not supported
    while (version > APPLE_PAY_EARLIEST_VERSION) {
      if (ApplePaySession.supportsVersion(version)) {
        break;
      }
      --version;
    }
    return version;
  }

  startSession(): void {
    if (!this.session) {
      return;
    }
    this.session.begin();
  }

  endSession(): void {
    if (!this.session) {
      return;
    }

    this.session.onvalidatemerchant = AppleNoOp;
    this.session.onvalidatemerchant = AppleNoOp;
    this.session.onshippingcontactselected = AppleNoOp;
    this.session.onshippingmethodselected = AppleNoOp;
    this.session.onpaymentmethodselected = AppleNoOp;
    this.session.onpaymentauthorized = AppleNoOp;
    this.session.oncancel = AppleNoOp;

    this.onError = null;

    this.session.abort();

    this.session = null;
  }
}
