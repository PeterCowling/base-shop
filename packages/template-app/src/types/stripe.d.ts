declare module "stripe" {
  namespace Stripe {
    interface SubscriptionCreateParams {
      prorate?: boolean;
    }
    interface SubscriptionUpdateParams {
      prorate?: boolean;
    }
  }
}
