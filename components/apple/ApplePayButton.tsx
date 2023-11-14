import { makeStyles } from '@material-ui/styles';
import clsx from 'clsx';
import { isError } from 'helpers/errors';
import { ServiceContext } from 'providers/ServiceProvider/ServiceProvider';
import 'react';
import { useCallback, useContext, useMemo, useState } from 'react';
import { ApplePayPaymentMethodData, ApplePayPaymentDetailsInit } from 'services/interfaces/applePayPaymentRequestService';
import ApplePayLogo from 'assets/icons/apple-pay.svg';
import { ShippingMethod } from 'models/shippingMethod';
import { Cart, CartLineItem } from 'models/cart';
import { SupportsApplePayContext } from 'providers/SupportsApplePayProvider/SupportsApplePayProvider';

interface ApplePayButtonProps {
  doShowCheckoutText?: boolean;
  checkoutDisabled?: boolean;
  onClick?: (() => void) | null;
}

const useStyles = makeStyles(
  (theme: any) => ({
    root: {
      flex: '0 0 50%',
      marginTop: 10,
      minHeight: 40,
      [theme.breakpoints.down('md')]: {
        flex: '0 0 100%',
      },
      '&:hover': {
        cursor: 'pointer',
      },
    },
    wrapper: {
      width: '100%',
      height: 40,
    },
    // https://developer.apple.com/documentation/apple_pay_on_the_web/displaying_apple_pay_buttons_using_css#3667429
    applePayButton: {
      display: 'inline-block',
      borderRadius: 5,
      padding: 0,
      boxSizing: 'border-box',
      width: '100%',
      height: 40,
      backgroundColor: 'black',
    },
    applePayCheckout: {},
    applePayLogo: {
      width: 'auto',
      height: 40,
    },
    disabled: {
      pointerEvents: 'none',
      cursor: 'auto',
    },
    error: {
      marginTop: 5,
    },
  }),
  { name: 'ApplePayButton' },
);

class CannotMakePaymentsApplePaySdkError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'CannotMakePaymentsApplePaySdkError';
  }
}

const ApplePayButton = ({
  doShowCheckoutText = false,
  checkoutDisabled = false,
  onClick,
}: ApplePayButtonProps) => {
  const classes = useStyles();

  const [errorMessage, setErrorMessage] = useState('');

  const applePayMerchantId = ''; // your merchant id here
  const applePayDomain = ''; // your apple pay domain here
  const cart = {} as Cart; // your actual cart here
  const cartTotal = 125; // your cart total here
  const lineItems: CartLineItem[] = []; // your line items here
  const selectedShippingMethodId = '1'; // your selected shipping method id here
  const shippingMethods: ShippingMethod[] = []; // your available shipping methods

  const { applePayPaymentRequestService, applePaySdkService, applePayCommonService } = useContext(ServiceContext);
    const {
    canMakePaymentsWithPaymentRequestApi,
    // @ts-ignore //
    isSupported,
    supportsApplePaySdk,
    supportsPaymentRequestApi,
  } = useContext(SupportsApplePayContext);

  const paymentMethodData: ApplePayPaymentMethodData = useMemo(
    () => ({
      supportedMethods: 'https://apple.com/apple-pay',
      data: {
        countryCode: 'US',
        merchantIdentifier: applePayMerchantId,
        requiredShippingContactFields: ['postalAddress', 'email', 'name', 'phone'],
        requiredBillingContactFields: ['postalAddress', 'email', 'name', 'phone'],
        // TODO: how do we get the best available Apple Pay version here?
        version: 3,
        supportedNetworks: ['amex', 'masterCard', 'visa', 'discover'],
        merchantCapabilities: ['supportsEMV', 'supports3DS', 'supportsCredit', 'supportsDebit'],
        shippingContact:
          !!cart?.shippingAddress
            ? applePayCommonService.convertCartAddressToContact(cart.shippingAddress)
            : undefined,
        billingContact:
          !!cart?.billingAddress
            ? applePayCommonService.convertCartAddressToContact(cart.billingAddress)
            : undefined,
      },
    }),
    [applePayMerchantId, applePayCommonService, cart],
  );

  const paymentDetails: ApplePayPaymentDetailsInit = useMemo(
    () => ({
      total: cart
        ? applePayPaymentRequestService.convertCartToTotal(cart)
        : {
            amount: {
              currency: 'USD',
              value: '0',
            },
            label: 'Total',
          },
      displayItems: [...(cart ? applePayPaymentRequestService.convertCartToLineItems(cart) : [])],
      shippingOptions: [
        ...applePayPaymentRequestService.convertShippingMethodsToPaymentShippingMethods(
          shippingMethods,
          selectedShippingMethodId,
        ),
      ],
    }),
    [cartTotal, shippingMethods, selectedShippingMethodId, cart, applePayPaymentRequestService],
  );

  const paymentRequest: ApplePayJS.ApplePayPaymentRequest = useMemo(
    () => ({
      currencyCode: 'USD',
      countryCode: 'US',
      requiredShippingContactFields: ['postalAddress', 'email', 'name', 'phone'],
      requiredBillingContactFields: ['postalAddress', 'email', 'name', 'phone'],
      lineItems: [...(cart ? applePaySdkService.convertCartToLineItems(cart) : [])],
      total: {
        label: 'Total',
        amount: cartTotal.toFixed(2),
      },
      supportedNetworks: ['amex', 'masterCard', 'visa', 'discover'],
      merchantCapabilities: ['supportsEMV', 'supports3DS', 'supportsCredit', 'supportsDebit'],
      shippingContact:
        !!cart?.shippingAddress
          ? applePayCommonService.convertCartAddressToContact(cart.shippingAddress)
          : undefined,
      billingContact:
        !!cart?.billingAddress
          ? applePayCommonService.convertCartAddressToContact(cart.billingAddress)
          : undefined,
      shippingMethods: applePaySdkService.convertShippingMethodsToPaymentShippingMethods(
        shippingMethods,
      ),
      applicationData: Buffer.from(applePayDomain).toString('base64'),
    }),
    [cartTotal, lineItems, applePayCommonService, cart, applePayDomain, shippingMethods],
  );

  const handleError = useCallback((err: unknown) => {
    if (!isError(err)) {
      return;
    }

    if (err.name === 'AbortError' || err.name === 'TypeError' || err.name === 'InvalidStateError') {
      // these errors give us no meaningful information
      return;
    } else if (err.name === 'NotSupportedError') {
      setErrorMessage('Your device does not support Apple Pay');
    } else if (err.name === 'SecurityError') {
      setErrorMessage('Your device has determined that it cannot make a payment securely');
    } else {
      setErrorMessage(err.message);
    }
  }, [setErrorMessage]);

  const handleApplePaySdk = useCallback(async () => {
    // Cannot create an apple pay session unless it's from a click/touch handler,
    // so we have to create a new one every time payment is attempted, and show
    // an error if they have no usable payment methods

    const version = applePaySdkService.getLatestSupportedVersion();
    applePaySdkService.createSession(version, paymentRequest);

    const canMakePayments = await applePaySdkService.getCanMakePaymentsWithActiveCardAsync(
      applePayMerchantId,
    );

    if (!canMakePayments) {
      return false;
    }

    applePaySdkService.setOnErrorCallback(handleError);
    applePaySdkService.startSession();

    return true;
  }, [applePaySdkService, setErrorMessage, applePayMerchantId, handleError, paymentRequest]);

  const handleApplePayPaymentRequest = useCallback(async () => {
    // No need to check if they can make payments or to create a session, as this is done via effects
    // which update the state flags. If they made it to this point, then they can make payments and have an
    // session which they can now start.

    applePayPaymentRequestService.createSession(paymentMethodData, paymentDetails);

    const paymentResponse = await applePayPaymentRequestService.startSessionAsync();
    if (!paymentResponse) {
      throw new Error('A valid payment response was not received');
    }
    await applePayPaymentRequestService.onPaymentAuthorizedAsync(paymentResponse);
  }, [paymentMethodData, paymentDetails, applePayPaymentRequestService, setErrorMessage]);

  const handleApplePay = useCallback(async () => {
    // button is only available if on eor both payment methods is/are available,
    // so we are checking support only to see which we should use. If apple pay sdk
    // is available, we prefer that. If they do not have a card in their wallet that
    // can be used to complete payments, then we try the payment API instead. We'll
    // also go directly to the payment API if their browser does not support apple pay
    // sdk but does support the payment request API. If they cannot make payments with any
    // method, then they have to have no valid payment methods available but one or both
    // APIs/SDKs supported, since the button would not otherwise appear. Therefore we
    // throw an error indicating that they need to add a useable payment method.
    //
    // Technically, the check for `canMakePaymentsWithPaymentRequestApi` isn't needed
    // since we won't show the button if it's false, but it doesn't hurt to include it.

    setErrorMessage('');

    try {
      if (supportsApplePaySdk) {
        console.info('ApplePayJS SDK available');
        const canMakePaymentsWithApplePaySdk = await handleApplePaySdk();
        if (canMakePaymentsWithApplePaySdk) {
          return;
        }
        console.info('Cannot make payments with apple pay sdk');
      }

      if (supportsPaymentRequestApi && canMakePaymentsWithPaymentRequestApi) {
        console.info(
          'ApplePayJS SDK not available or no supported payment methods, defaulting to PaymentRequest API',
        );
        await handleApplePayPaymentRequest();
      } else {
        throw new CannotMakePaymentsApplePaySdkError(
          'Your Apple Pay wallet does not contain any supported payment methods. Please try another payment method, or add a new card to your Apple Pay account.',
        );
      }
    } catch (e) {
      handleError(e);
    }
  }, [
    handleApplePayPaymentRequest,
    handleApplePaySdk,
    setErrorMessage,
    supportsApplePaySdk,
    supportsPaymentRequestApi,
    canMakePaymentsWithPaymentRequestApi,
    handleError,
  ]);

  const isApplePaySupported = useMemo(() => {
    return supportsApplePaySdk ||
          (supportsPaymentRequestApi && canMakePaymentsWithPaymentRequestApi);
  }, [supportsApplePaySdk, supportsPaymentRequestApi, canMakePaymentsWithPaymentRequestApi]);

  const isCartReady = useMemo(() => {
    return shippingMethods.length > 0 && cartTotal > 0;
  }, [shippingMethods, cartTotal]);

  return (
    <div
      className={clsx(classes.root, {
        [classes.disabled]: !isApplePaySupported
      })}
      onClick={onClick ? onClick : undefined}
    >
      <div className={classes.wrapper}>
        {isApplePaySupported&& isCartReady ? (
          <button
            onClick={handleApplePay}
            className={clsx(classes.applePayButton, {
              [classes.applePayCheckout]: !!doShowCheckoutText,
              [classes.disabled]: !!checkoutDisabled,
            })}
          >
            <ApplePayLogo className={classes.applePayLogo} />
          </button>
        ) : null}
      </div>
      {!!errorMessage ? (
        <p
          className={classes.error}
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
};

export default ApplePayButton;
