import { CustomerAddress } from './address';

export interface Customer {
  id: string;
  key: string | null;
  version: number;
  createdAt: string;
  firstName: string;
  lastName: string;
  email: string;
  shippingAddressIds: string[];
  billingAddressIds: string[];
  defaultShippingAddressId: string | null;
  defaultBillingAddressId: string | null;
  custom: any | null;
  addresses: CustomerAddress[];
  customerGroup: {
    name: string;
    id: string;
    key: string;
  };
}