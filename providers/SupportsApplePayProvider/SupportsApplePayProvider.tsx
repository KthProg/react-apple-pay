import { ServiceContext } from 'providers/ServiceProvider/ServiceProvider';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ApplePayPaymentMethodData } from 'services/interfaces/applePayPaymentRequestService';

export const SupportsApplePayContext = createContext({
  isSupported: false,
  supportsApplePaySdk: false,
  supportsPaymentRequestApi: false,
  canMakePaymentsWithPaymentRequestApi: false,
  isSupportDetermined: false,
});

const DEFAULT_APPLE_PAY_SETUP: ApplePayPaymentMethodData = {
  supportedMethods: 'https://apple.com/apple-pay',
  data: {
    countryCode: 'US',
    merchantIdentifier: '',
    requiredShippingContactFields: ['postalAddress', 'email', 'name', 'phone'],
    requiredBillingContactFields: ['postalAddress', 'email', 'name', 'phone'],
    // TODO: how do we get the best available Apple Pay version here?
    version: 3,
    supportedNetworks: ['amex', 'masterCard', 'visa', 'discover'],
    merchantCapabilities: ['supportsEMV', 'supports3DS', 'supportsCredit', 'supportsDebit'],
  },
};

const DEFAULT_APPLE_PAY_LINE_ITEMS = {
  total: {
    amount: {
      currency: 'USD',
      value: '0.00', // this doesn't matter, we're just checking if they can make payments
    },
    label: 'Support Test',
  },
  displayItems: [],
  shippingOptions: [
    {
      amount: {
        currency: 'USD',
        value: '0.00', // this doesn't matter, we're just checking if they can make payments
      },
      id: '1',
      label: 'Test shipping',
      selected: true,
    },
  ],
};

const SupportsApplePayProvider = ({ children }: { children: React.ReactNode }) => {
  const { applePayPaymentRequestService } = useContext(ServiceContext);


  const [isSupportDetermined, setIsSupportDetermined] = useState(false);
  const applePayMerchantId = ''; // your apple pay merchant id here

  const supportsPaymentRequestApi = useMemo(() => {
    return 'PaymentRequest' in window && !!window.PaymentRequest;
  }, []);

  const supportsApplePaySdk = useMemo(() => {
    return 'ApplePaySession' in window && !!window.ApplePaySession;
  }, []);

  const [canMakePaymentsWithPaymentRequestApi, setCanMakePaymentsWithPaymentRequestApi] = useState(
    false,
  );

  useEffect(() => {
    if (!supportsPaymentRequestApi || !applePayMerchantId || isSupportDetermined) {
      return;
    }

    applePayPaymentRequestService.createSession(
      {
        ...DEFAULT_APPLE_PAY_SETUP,
        data: {
          ...DEFAULT_APPLE_PAY_SETUP.data,
          merchantIdentifier: applePayMerchantId,
        },
      },
      DEFAULT_APPLE_PAY_LINE_ITEMS,
    );

    applePayPaymentRequestService.getCanMakePaymentsAsync().then(canMakePayments => {
      setCanMakePaymentsWithPaymentRequestApi(canMakePayments);
      setIsSupportDetermined(true);
    });
  }, [
    applePayMerchantId,
    isSupportDetermined,
    applePayPaymentRequestService,
    supportsPaymentRequestApi,
    setCanMakePaymentsWithPaymentRequestApi,
    setIsSupportDetermined,
  ]);

  return (
    <SupportsApplePayContext.Provider
      value={{
        isSupported:
          supportsApplePaySdk ||
          (supportsPaymentRequestApi && canMakePaymentsWithPaymentRequestApi),
        supportsApplePaySdk,
        supportsPaymentRequestApi,
        canMakePaymentsWithPaymentRequestApi,
        isSupportDetermined,
      }}
    >
      {children}
    </SupportsApplePayContext.Provider>
  );
};

export default SupportsApplePayProvider;
