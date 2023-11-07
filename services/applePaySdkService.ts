import validateMerchant from 'api/apple/validate-merchant';
import { ShippingMethod } from 'models/shippingMethod';
import { isError } from 'util';
import { Cart, CartShippingAddress } from '../models/cart';
import { IApplePaySDKService } from './interfaces/applePaySdkService';

const AppleNoOp = (_event: ApplePayJS.Event) => {
  return;
};

// always starts from 3 = latest to 1 = oldest
const APPLE_PAY_LATEST_VERSION = 3;

export class ApplePaySDKService implements IApplePaySDKService {
  private session: ApplePaySession | null = null;

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

    const cart = {} as Cart; // TODO: get current cart

    if (!cart) {
      throw new Error('No cart in session while paying with Apple Pay');
    }

    const newTotal = this.convertCartToTotal(cart);
    const lineItems = this.convertCartToLineItems(cart);

    this.session.completePaymentMethodSelection(newTotal, lineItems);
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

    const newCartShippingAddress: CartShippingAddress = this.convertContactToCartAddress(
      event.shippingContact,
    );

    // TODO: call your set shipping address endpoint
    // TODO: recalculate your shipping and taxes
    // TODO: fetch updates shipping methods

    const cart = {} as Cart;
    const shippingMethods = [];

    if (!cart) {
      throw new Error('No cart returned from tax update request');
    }

    const applePayTotal = this.convertCartToTotal(cart);
    const applePayLineItems = this.convertCartToLineItems(cart);
    const applePayShippingMethods = this.convertShippingMethodsToPaymentShippingMethods(
      shippingMethods,
    );

    this.session.completeShippingContactSelection(
      ApplePaySession.STATUS_SUCCESS,
      applePayShippingMethods,
      applePayTotal,
      applePayLineItems,
    );
  }

  async onShippingMethodChangedAsync(
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

    this.session.completeShippingMethodSelection(
      ApplePaySession.STATUS_SUCCESS,
      applePayTotal,
      applePayLineItems,
    );
  }

  async onMerchantValidationAsync(event: ApplePayJS.ApplePayValidateMerchantEvent): Promise<void> {
    if (!this.session) {
      return;
    }

    const merchantSession = await validateMerchant({ url: event.validationURL });
    this.session.completeMerchantValidation(merchantSession);
  }

  async onPaymentAuthorizedAsync(event: ApplePayJS.ApplePayPaymentAuthorizedEvent): Promise<void> {
    if (!this.session) {
      return;
    }

    if (!event.payment.shippingContact || !event.payment.billingContact) {
      this.session.completePayment(ApplePaySession.STATUS_FAILURE);
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

      // TODO: send payment data token to your payment completion endpoint / payment processor;
    } catch (ex) {
      this.session.completePayment({
        status: ApplePaySession.STATUS_FAILURE,
        errors: isError(ex)
          ? [
              {
                code: 'unknown',
                message: ex.message,
              },
            ]
          : [],
      });
      return;
    }

    this.session.completePayment(ApplePaySession.STATUS_SUCCESS);
  }

  onCancel(event: ApplePayJS.Event): void {
    console.info('cancelled', event);
  }

  async getCanMakePaymentsWithActiveCardAsync(merchantId: string): Promise<boolean> {
    return await ApplePaySession.canMakePaymentsWithActiveCard(merchantId);
  }

  getLatestSupportedVersion(): number {
    let useVersion = APPLE_PAY_LATEST_VERSION;
    while (!ApplePaySession.supportsVersion(useVersion)) {
      --useVersion;
      if (useVersion === 1) {
        break;
      }
    }
    return useVersion;
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

    this.session.abort();

    this.session = null;
  }
}
