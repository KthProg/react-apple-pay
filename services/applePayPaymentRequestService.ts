import { APPLE_PAY_PAYMENT_METHOD } from 'constants/apple-pay';
import {
  IApplePayPaymentRequestService,
  ApplePayPaymentMethodChangeEvent,
  MerchantValidationEvent,
  ApplePayPaymentResponse,
  ApplePayPaymentMethodData,
  ApplePayPaymentDetailsInit,
} from './interfaces/applePayPaymentRequestService';
import { ExtendedPaymentRequest, ExtendedPaymentShippingAddress } from 'models/payment/paymentRequest';
import { Cart, CartShippingAddress } from 'models/cart';
import { ShippingMethod } from 'models/shippingMethod';
import { ExtendedPaymentDetailsUpdate, ExtendedPaymentShippingOption } from 'models/payment/paymentDetails';
import { createPaymentRequest } from 'helpers/apple/paymentRequest';

export class ApplePayPaymentRequestService implements IApplePayPaymentRequestService {
  convertShippingMethodsToPaymentShippingMethods(
    shippingMethods: ShippingMethod[],
    selectedShippingMethodId?: string,
  ): ExtendedPaymentShippingOption[] {
    return shippingMethods.map(shippingMethod => ({
      id: shippingMethod.id,
      amount: {
        currency: 'USD',
        value: shippingMethod.amount.toFixed(2),
      },
      label: shippingMethod.name,
      selected: selectedShippingMethodId === shippingMethod.id,
    }));
  }
  convertCartToLineItems(cart: Cart): PaymentItem[] {
    const lineItems = cart.lineItems
      .filter(lineItem => !!lineItem.totalPrice)
      .map(cartLineItem => ({
        amount: {
          currency: 'USD',
          value: (cartLineItem.totalPrice!.centAmount / 100).toFixed(2),
        },
        label: cartLineItem.name,
      }));

    if (cart.shippingInfo && (cart.shippingInfo?.price?.centAmount ?? 0) > 0) {
      lineItems.push({
        amount: {
          value: (cart.shippingInfo.price.centAmount / 100).toFixed(2),
          currency: 'USD',
        },
        label: 'Shipping',
      });
    }

    if ((cart.taxedPrice?.totalGross?.centAmount ?? 0) > 0) {
      lineItems.push({
        amount: {
          value: cart.tax.toFixed(2),
          currency: 'USD',
        },
        label: 'Taxes',
      });
    }

    return lineItems;
  }
  convertCartToTotal(cart: Cart): PaymentItem {
    return {
      amount: {
        currency: 'USD',
        value: (
          (cart.taxedPrice ? cart.taxedPrice.totalGross.centAmount : cart.totalPrice.centAmount) /
          100
        ).toFixed(2),
      },
      label: 'Total',
    };
  }

  private paymentRequest: ExtendedPaymentRequest | null = null;

  async getCanMakePaymentsAsync(): Promise<boolean> {
    if (!this.paymentRequest) {
      return false;
    }

    return await this.paymentRequest.canMakePayment();
  }

  createSession(
    paymentMethodData: ApplePayPaymentMethodData,
    paymentDetails: ApplePayPaymentDetailsInit,
  ): PaymentRequest {
    this.paymentRequest = createPaymentRequest(paymentMethodData, paymentDetails);

    this.paymentRequest.addEventListener(
      'paymentmethodchange',
      this.onPaymentMethodChanged.bind(this),
    );
    // https://developer.apple.com/documentation/apple_pay_on_the_web/payment_request_api/setting_up_the_payment_request_api_to_accept_apple_pay
    this.paymentRequest.addEventListener(
      'merchantvalidation',
      this.onMerchantValidation.bind(this),
    );
    this.paymentRequest.addEventListener(
      'shippingaddresschange',
      this.onShippingAddressChanged.bind(this),
    );
    this.paymentRequest.addEventListener(
      'shippingoptionchange',
      this.onShippingMethodChanged.bind(this),
    );

    return this.paymentRequest;
  }

  async startSessionAsync(): Promise<PaymentResponse | null> {
    if (!this.paymentRequest) {
      return null;
    }

    return await this.paymentRequest.show();
  }

  onPaymentMethodChanged(event: Event): void {
    const evt = event as ApplePayPaymentMethodChangeEvent;
    // const req = evt.target as ExtendedPaymentRequest;

    evt.updateWith({});
  }

  convertPaymentAddressToCartAddress(address: ExtendedPaymentShippingAddress): CartShippingAddress {
    return {
      city: address.dependentLocality ?? '',
      country: address.country ?? 'US',
      postalCode: address.postalCode ?? '',
      state: address.region ?? '',
      streetName: (address.addressLine?.[0] ?? '').split(' ', 2)?.[1] ?? '',
      streetNumber: (address.addressLine?.[0] ?? '').split(' ', 2)?.[0] ?? '',
      apartment: address.addressLine?.[1],
      email: address.email ?? '',
      phone: (address.phone ?? '').replace('+1', ''),
      firstName: '',
      lastName: '',
    };
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
      phone: contact.phoneNumber ?? '',
      firstName: contact.givenName,
      lastName: contact.familyName,
    };
  }

  async updateCartWithAddressAsync(
    address: ExtendedPaymentShippingAddress | null,
  ): Promise<ExtendedPaymentDetailsUpdate> {
    if (!address) {
      return {};
    }

    const newCartShippingAddress = this.convertPaymentAddressToCartAddress(address);

    let cart = null;
    let shippingMethods = [];

    try {
      // TODO: call your set shipping address endpoint
      // TODO: recalculate your shipping and taxes
      // TODO: fetch updates shipping methods

      cart = {} as Cart;
      shippingMethods = [];

      if (!cart) {
        throw new Error('No cart returned from tax update request');
      }
    } catch (e) {
      console.error('error updating shipping address', e);
      return {};
    }

    const applePayTotal = this.convertCartToTotal(cart);
    const applePayLineItems = this.convertCartToLineItems(cart);
    const applePayShippingMethods = this.convertShippingMethodsToPaymentShippingMethods(
      shippingMethods,
      cart.shippingInfo?.shippingMethod.id,
    );

    return {
      shippingOptions: applePayShippingMethods,
      displayItems: applePayLineItems,
      total: applePayTotal,
    };
  }

  onShippingAddressChanged(event: Event): void {
    const evt = event as PaymentRequestUpdateEvent;
    const req = evt.target as ExtendedPaymentRequest;

    const updatesPromise = this.updateCartWithAddressAsync(req.shippingAddress);

    evt.updateWith(updatesPromise);
  }

  async updateCartWithShippingIdAsync(id: string): Promise<ExtendedPaymentDetailsUpdate> {
    let cart = null;
    let shippingMethods = [];

    try {
      // TODO: call your set shipping method endpoint
      // TODO: recalculate your shipping and taxes
      // TODO: fetch updates shipping methods

      cart = {} as Cart;

      if (!cart) {
        throw new Error('No cart returned from tax update request');
      }
    } catch (e) {
      console.error('error updating shipping address', e);
      return {};
    }

    const applePayTotal = this.convertCartToTotal(cart);
    const applePayLineItems = this.convertCartToLineItems(cart);
    const applePayShippingMethods = this.convertShippingMethodsToPaymentShippingMethods(
      shippingMethods,
      cart.shippingInfo?.shippingMethod.id,
    );

    return {
      shippingOptions: applePayShippingMethods,
      displayItems: applePayLineItems,
      total: applePayTotal,
    };
  }

  onShippingMethodChanged(event: Event): void {
    const evt = event as PaymentRequestUpdateEvent;
    const req = evt.target as ExtendedPaymentRequest;

    if (!req.shippingOption) {
      evt.updateWith({});
      return;
    }

    const updatesPromise = this.updateCartWithShippingIdAsync(req.shippingOption);

    evt.updateWith(updatesPromise);
  }

  onMerchantValidation(event: Event): void {
    const evt = event as MerchantValidationEvent;
    if (evt.methodName !== APPLE_PAY_PAYMENT_METHOD) {
      return;
    }

    // const req = evt.target as ExtendedPaymentRequest;

    // TODO: call your merchant validation endpoint
    const merchantSessionPromise = validateMerchant({ url: evt.validationURL });
    evt.complete(merchantSessionPromise);
  }

  async onPaymentAuthorizedAsync(paymentResponse: ApplePayPaymentResponse): Promise<void> {
    if (!paymentResponse.details.shippingContact || !paymentResponse.details.billingContact) {
      await paymentResponse.complete('fail');
      return;
    }

    try {
      const paymentData = {
        applePayToken: Buffer.from(
          JSON.stringify(paymentResponse.details.token.paymentData),
        ).toString('base64'),
        creditCardBrand: paymentResponse.details.token.paymentMethod.network,
        billingAddress: this.convertContactToCartAddress(
          paymentResponse.details.billingContact,
        ),
        shippingAddress: this.convertContactToCartAddress(
          paymentResponse.details.shippingContact,
        ),
      };

      // TODO: send payment data token to your payment completion endpoint / payment processor
    } catch (ex) {
      await paymentResponse.complete('fail');
      throw ex;
    }

    await paymentResponse.complete('success');
  }
}
