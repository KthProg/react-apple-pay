import React, { createContext } from 'react';
import { ApplePayPaymentRequestService } from 'services/applePayPaymentRequestService';
import { ApplePaySDKService } from 'services/applePaySdkService';
import { IApplePayPaymentRequestService } from 'services/interfaces/applePayPaymentRequestService';
import { IApplePaySDKService } from 'services/interfaces/applePaySdkService';

const applePayPaymentRequestService: IApplePayPaymentRequestService = new ApplePayPaymentRequestService();
const applePaySdkService: IApplePaySDKService = new ApplePaySDKService();

export const SERVICES = {
  applePayPaymentRequestService,
  applePaySdkService,
};

export const ServiceContext = createContext(SERVICES);

const ServiceProvider = ({ children }: { children: React.ReactNode }) => {
  return <ServiceContext.Provider value={SERVICES}>{children}</ServiceContext.Provider>;
};

export default ServiceProvider;
