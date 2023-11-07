import { CustomerAddress } from './address';
import { CustomField } from './customField';
import { Customer } from './customer';
import { Coupon, PromoDiscount } from './discount';
import { NormalizedProductPrice } from './price';

export interface CartUpdateInfo {
  id: string | null;
  version: number | null;
}

export interface CustomerUpdateInfo {
  id: string | null;
  version: number | null;
}

export interface CartShippingRateUpdateInfo extends CartUpdateInfo {
  lineItems: CartLineItem[];
}

export interface CartCustomerGroupUpdateInfo extends CartUpdateInfo {
  customerGroup: string;
}

export interface CustomerCustomerGroupUpdateInfo extends CustomerUpdateInfo {
  customerGroup: string;
}

export interface CartTaxesUpdateInfo extends CartUpdateInfo {
  isSalesInvoice?: boolean;
  isPlaceOrderFlow?: boolean;
  overrideShippingAddress?: CartShippingAddress;
}

export interface Cart {
  anonymousId: string;
  id: string;
  customer: Customer | null;
  version: number | null;
  discountCodes: DiscountCode[];
  items: CartLineItem[];
  lineItems: CartLineItem[];
  shouldHideEconomyShippingDate: boolean;
  taxMode: string;
  shippingAddress: CartShippingAddress | null;
  billingAddress: CartShippingAddress | null;
  shippingInfo: ShippingInfo | null;
  customerGroup: {
    name: string;
    key: string;
    id: string;
  } | null;
  customerId: string;
  customerEmail: string;
  totalPrice: {
    centAmount: number;
  };
  taxedPrice: {
    totalGross: {
      centAmount: number;
    };
    totalNet: {
      centAmount: number;
    };
  } | null;
  refusedGifts: any[];
  cartState: string;
  paymentInfo: any;

  // TODO: normalized cart only
  cartPromoMessage: string;
  cashBackEarnedCostRemaining: number;
  cashBackEarnedCost: number;
  totalAmount: number;
  lineItemsPromotion: number;
  lineItemsTotalAmount: number;
  subtotal: number;

  isCashBackEarnedEnabled: boolean;
  cashBackEarnedMinimumPurchase: number;
  cashBackEarnedPercent: number;
  cashBackEarned: any;
  cashBackEarnedCouponName: string;
  lineItemsPromotionObj: any;
  cashBackDiscountObj: any;

  total: number;
  tax: number;
  giftCertificatesAmount: number;
  promotions: number;
  shippingAmount: number;

  giftMessage: string;
  contentfulSkusData: any;
}

export interface NormalizedCart extends Cart {
  cartPromoMessage: string;
  cashBackEarnedCostRemaining: number;
  cashBackEarnedCost: number;
  totalAmount: number;
  lineItemsPromotion: number;
  lineItemsTotalAmount: number;
  subtotal: number;

  isCashBackEarnedEnabled: boolean;
  cashBackEarnedMinimumPurchase: number;
  cashBackEarnedPercent: number;
  cashBackEarned: any;
  cashBackEarnedCouponName: string;
  lineItemsPromotionObj: any;
  cashBackDiscountObj: any;

  total: number;
  tax: number;
  giftCertificatesAmount: number;
  promotions: number;
  shippingAmount: number;

  giftMessage: string;
  contentfulSkusData: any;
}

export interface ShippingInfo {
  shippingMethodName: string;
  shippingMethodState: string;
  shippingMethod: {
    name: string;
    key: string;
    id: string;
    predicate: string;
    isDefault: boolean;
  };
  price: {
    centAmount: number;
  };
}

export interface CartShippingAddress extends CustomerAddress {}

export interface Order extends Cart {
  orderNumber: string;
  status: number; // FUTURE: enum
  completedAt: string; // date string
  createdAt: string; // date string
}

export interface NormalizedOrder extends Order, NormalizedCart {}

export interface DiscountCode extends PromoDiscount {}

export interface Payment {
  paymentMethodInfo: {
    method: string;
  };
}

export interface CartPersonalizationConfig {
  attrId: string;
}

export interface DiscountedPrice {
  value: {
    centAmount: number;
  };
  includedDiscounts: { discount: Coupon }[];
}

export interface DiscountedPriceWithQuantity {
  quantity: number;
  discountedPrice: DiscountedPrice;
}

export interface CartLineItem {
  color: string;
  custom: {
    customFieldsRaw: CustomField[];
  };
  currentPrice: number;
  description: string;
  discountAmount: number;
  discountCodes: PromoDiscount[];
  discountedPricePerQuantity: DiscountedPriceWithQuantity[];
  estimatedShippingDate: string;
  estimatedShippingDateRaw: string;
  expectedToSellOut: string;
  finalCost: number;
  finalPriceDollars: number;
  hideFromCart: string;
  id: string;
  image: {
    src: string;
  };
  inventory: number;
  isBackOrdered: string;
  isComplimentaryGiftCard: boolean;
  isOnStock?: boolean;
  lineItemId: string;
  name: string;
  onlyRemainingX: string;
  option: string;
  optionalFields: any;
  personalizationTypeId: {
    attributes: CartPersonalizationConfig[];
    priceSkuId: string;
  } | null;
  price: NormalizedProductPrice;
  productId: string;
  productSlug: string;
  quantity: number;
  size: string;
  skuId: string;
  skuPromoText: string;
  totalPrice?: {
    centAmount: number;
  };
  url: string;
  variant?: {
    attributesRaw: LineItemAttribute[];
    sku: string;
  };
}

export interface LineItemAttribute {
  name: string;
  value: string | number;
}

export interface ExcludedShippingMethod {
  key: string;
}
