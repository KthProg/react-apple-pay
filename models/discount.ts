export interface InnerCoupon {
  id: string;
  key: string;
  target: {
    type: string;
  } | null;
  cartPredicate: string | null;
}

export interface Coupon {
  code: string;
  id: string;
  isActive: boolean;
  validFrom: string | null;
  validUntil: string | null;
  name: string;
  cartPredicate: string | null;
  description: string;
  cartDiscounts: InnerCoupon[];
}

export interface PromoDiscount {
  state: string;
  discountCode: Coupon;
}
