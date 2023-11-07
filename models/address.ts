export const enum ADDRESS_FIELDS {
  KEY = 'key',
  ADDRESS_NICKNAME = 'title',
  FIRST_NAME = 'firstName',
  LAST_NAME = 'lastName',
  COMPANY = 'company',
  COUNTRY = 'country',
  APARTMENT = 'apartment',
  CITY = 'city',
  STATE = 'state',
  POSTAL_CODE = 'postalCode',
  EMAIL = 'email',
  PHONE = 'phone',
  PHONE1 = 'phone1',
  PHONE2 = 'phone2',
  PHONE3 = 'phone3',
  STREET_NUMBER = 'streetNumber',
  STREET_NAME = 'streetName',
  STREET_NAME_NUMBER = 'streetNameNumber',
}

export const AddressFieldsList = [
  'key',
  'title',
  'firstName',
  'lastName',
  'company',
  'country',
  'apartment',
  'city',
  'state',
  'postalCode',
  'email',
  'phone',
  'phone1',
  'phone2',
  'phone3',
  'streetNumber',
  'streetName',
  'streetNameNumber',
] as ADDRESS_FIELDS[];

export type AddressForm = {
  key: string;
  title: string;
  firstName: string;
  lastName: string;
  company: string | null;
  country: string;
  apartment: string;
  city: string;
  state: string;
  postalCode: string;
  email: string;
  phone: string;
  phone1: string;
  phone2: string;
  phone3: string;
  streetNumber: string;
  streetName: string;
  streetNameNumber: string;
  [key: string]: string | null | undefined;
};

export type CustomerAddress = {
  key?: string;
  id?: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  country: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  email?: string;
  phone?: string;
  phone1?: string;
  phone2?: string;
  phone3?: string;
  streetNumber?: string;
  streetName: string;
  streetNameNumber?: string;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
  isShipping?: boolean;
  isBilling?: boolean;
};

export interface ChangeField {
  changes?: any;
  value?: string | number;
}

export interface FedExAddress {
  // id: ChangeField;
  postalBase: ChangeField;
  postalAddOn: ChangeField;
  streetNumber: ChangeField;
  streetName: ChangeField;
  streetSuffix: ChangeField;
}

export interface CatalogAddress {
  city: string;
  country: string;
  countryCode: string;
  email: string;
  firstName: string;
  id: string;
  lastName: string;
  line1: string;
  line2: string;
  phone: string;
  postalCode: string;
  province: string;
  state: string;
  type: string;
  zip4: string;
}

export type AddressFormError = null | undefined | { type: string };
export type AddressFormErrors = { [key: string]: AddressFormError };
