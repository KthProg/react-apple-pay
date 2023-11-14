import React, { createContext } from 'react';
import { ApplePayCommonService } from 'services/applePayCommonService';
import { ApplePayPaymentRequestService } from 'services/applePayPaymentRequestService';
import { ApplePaySDKService } from 'services/applePaySdkService';
import { IApplePayCommonService } from 'services/interfaces/applePayCommonService';
import { IApplePayPaymentRequestService } from 'services/interfaces/applePayPaymentRequestService';
import { IApplePaySDKService } from 'services/interfaces/applePaySdkService';

const applePayCommonService: IApplePayCommonService = new ApplePayCommonService();
const applePayPaymentRequestService: IApplePayPaymentRequestService = new ApplePayPaymentRequestService(applePayCommonService);
const applePaySdkService: IApplePaySDKService = new ApplePaySDKService(applePayCommonService);

export const SERVICES = {
  applePayPaymentRequestService,
  applePaySdkService,
  applePayCommonService,
};

export const ServiceContext = createContext(SERVICES);

const ServiceProvider = ({ children }: { children: React.ReactNode }) => {
  return <ServiceContext.Provider value={SERVICES}>{children}</ServiceContext.Provider>;
};

export default ServiceProvider;
