/**
 * Stripe API Response Fixtures
 *
 * These fixtures represent realistic Stripe API response structures.
 * They are used for contract testing to ensure our code correctly
 * parses and handles all fields it relies on.
 *
 * Based on Stripe API version 2025-06-30.basil
 */

import type Stripe from "stripe";

export const checkoutSessionFixtures = {
  /**
   * Complete checkout session with all fields populated
   */
  complete: {
    id: "cs_test_a1b2c3d4e5f6g7h8i9j0",
    object: "checkout.session",
    after_expiration: null,
    allow_promotion_codes: true,
    amount_subtotal: 5000,
    amount_total: 5425,
    automatic_tax: {
      enabled: true,
      status: "complete",
    },
    billing_address_collection: "required",
    cancel_url: "https://example.com/cancel",
    client_reference_id: "order_123",
    consent: null,
    consent_collection: null,
    created: 1705600000,
    currency: "usd",
    custom_fields: [],
    custom_text: {
      shipping_address: null,
      submit: null,
    },
    customer: "cus_test_customer123",
    customer_creation: "always",
    customer_details: {
      address: {
        city: "San Francisco",
        country: "US",
        line1: "123 Market St",
        line2: null,
        postal_code: "94102",
        state: "CA",
      },
      email: "customer@example.com",
      name: "John Doe",
      phone: "+14155551234",
      tax_exempt: "none",
      tax_ids: [],
    },
    customer_email: "customer@example.com",
    expires_at: 1705686400,
    invoice: null,
    invoice_creation: {
      enabled: false,
      invoice_data: {
        account_tax_ids: null,
        custom_fields: null,
        description: null,
        footer: null,
        metadata: {},
        rendering_options: null,
      },
    },
    livemode: false,
    locale: "en",
    metadata: {
      depositTotal: "500",
      returnDate: "2025-02-15",
      internal_customer_id: "internal_cust_abc123",
      order_id: "ord_xyz789",
      cart_id: "cart_def456",
      stripe_customer_id: "cus_test_customer123",
    },
    mode: "payment",
    payment_intent: "pi_test_payment_intent_123",
    payment_link: null,
    payment_method_collection: "always",
    payment_method_options: {},
    payment_method_types: ["card"],
    payment_status: "paid",
    phone_number_collection: {
      enabled: true,
    },
    recovered_from: null,
    setup_intent: null,
    shipping_address_collection: {
      allowed_countries: ["US", "CA"],
    },
    shipping_cost: {
      amount_subtotal: 0,
      amount_tax: 0,
      amount_total: 0,
      shipping_rate: "shr_test_shipping",
    },
    shipping_details: {
      address: {
        city: "San Francisco",
        country: "US",
        line1: "123 Market St",
        line2: null,
        postal_code: "94102",
        state: "CA",
      },
      name: "John Doe",
    },
    shipping_options: [],
    status: "complete",
    submit_type: "pay",
    subscription: null,
    success_url: "https://example.com/success?session_id={CHECKOUT_SESSION_ID}",
    total_details: {
      amount_discount: 0,
      amount_shipping: 0,
      amount_tax: 425,
    },
    url: null,
  } as unknown as Stripe.Checkout.Session,

  /**
   * Minimal checkout session with only required fields
   */
  minimal: {
    id: "cs_test_minimal",
    object: "checkout.session",
    amount_subtotal: 1000,
    amount_total: 1000,
    created: 1705600000,
    currency: "usd",
    customer: null,
    customer_details: null,
    customer_email: null,
    expires_at: 1705686400,
    livemode: false,
    metadata: {},
    mode: "payment",
    payment_intent: "pi_minimal",
    payment_status: "unpaid",
    status: "open",
    success_url: "https://example.com/success",
    total_details: null,
    url: "https://checkout.stripe.com/c/pay/cs_test_minimal",
  } as unknown as Stripe.Checkout.Session,

  /**
   * Session with payment intent as object (not string)
   */
  withExpandedPaymentIntent: {
    id: "cs_test_expanded",
    object: "checkout.session",
    amount_subtotal: 2000,
    amount_total: 2100,
    created: 1705600000,
    currency: "usd",
    customer: "cus_expanded_123",
    customer_details: {
      email: "expanded@example.com",
      name: "Jane Smith",
    },
    customer_email: "expanded@example.com",
    expires_at: 1705686400,
    livemode: false,
    metadata: {
      depositTotal: "200",
      order_id: "ord_expanded",
    },
    mode: "payment",
    payment_intent: {
      id: "pi_expanded_intent",
      object: "payment_intent",
      amount: 2100,
      currency: "usd",
      status: "succeeded",
    } as unknown as Stripe.PaymentIntent,
    payment_status: "paid",
    status: "complete",
    success_url: "https://example.com/success",
    total_details: {
      amount_discount: 0,
      amount_shipping: 0,
      amount_tax: 100,
    },
  } as unknown as Stripe.Checkout.Session,

  /**
   * Session with subscription (recurring payment)
   */
  subscription: {
    id: "cs_test_subscription",
    object: "checkout.session",
    amount_subtotal: 4900,
    amount_total: 4900,
    created: 1705600000,
    currency: "usd",
    customer: "cus_subscription_123",
    customer_details: {
      email: "subscriber@example.com",
      name: "Subscriber Name",
    },
    customer_email: "subscriber@example.com",
    expires_at: 1705686400,
    livemode: false,
    metadata: {},
    mode: "subscription",
    payment_intent: null,
    payment_status: "paid",
    status: "complete",
    subscription: "sub_test_subscription_123",
    success_url: "https://example.com/success",
    total_details: {
      amount_discount: 0,
      amount_shipping: 0,
      amount_tax: 0,
    },
  } as unknown as Stripe.Checkout.Session,
};

export const paymentIntentFixtures = {
  /**
   * Successful payment intent
   */
  succeeded: {
    id: "pi_test_succeeded",
    object: "payment_intent",
    amount: 5000,
    amount_capturable: 0,
    amount_received: 5000,
    application: null,
    application_fee_amount: null,
    automatic_payment_methods: null,
    canceled_at: null,
    cancellation_reason: null,
    capture_method: "automatic",
    charges: {
      object: "list",
      data: [
        {
          id: "ch_test_charge",
          object: "charge",
          amount: 5000,
          status: "succeeded",
        },
      ],
      has_more: false,
      total_count: 1,
      url: "/v1/charges?payment_intent=pi_test_succeeded",
    },
    client_secret: "pi_test_succeeded_secret_abc123",
    confirmation_method: "automatic",
    created: 1705600000,
    currency: "usd",
    customer: "cus_test_123",
    description: "Order #123",
    invoice: null,
    last_payment_error: null,
    latest_charge: "ch_test_charge",
    livemode: false,
    metadata: {
      order_id: "ord_123",
    },
    next_action: null,
    on_behalf_of: null,
    payment_method: "pm_card_visa",
    payment_method_options: {
      card: {
        installments: null,
        mandate_options: null,
        network: null,
        request_three_d_secure: "automatic",
      },
    },
    payment_method_types: ["card"],
    processing: null,
    receipt_email: "customer@example.com",
    review: null,
    setup_future_usage: null,
    shipping: null,
    source: null,
    statement_descriptor: null,
    statement_descriptor_suffix: null,
    status: "succeeded",
    transfer_data: null,
    transfer_group: null,
  } as unknown as Stripe.PaymentIntent,

  /**
   * Payment intent requiring action (3DS)
   */
  requiresAction: {
    id: "pi_test_requires_action",
    object: "payment_intent",
    amount: 10000,
    amount_capturable: 0,
    amount_received: 0,
    client_secret: "pi_test_requires_action_secret_xyz",
    created: 1705600000,
    currency: "usd",
    customer: "cus_test_456",
    livemode: false,
    metadata: {},
    next_action: {
      type: "use_stripe_sdk",
      use_stripe_sdk: {
        type: "three_d_secure_redirect",
        stripe_js: "https://hooks.stripe.com/3d_secure/...",
      },
    },
    payment_method: "pm_card_threeDSecure",
    payment_method_options: {
      card: {
        request_three_d_secure: "any",
      },
    },
    payment_method_types: ["card"],
    status: "requires_action",
  } as unknown as Stripe.PaymentIntent,
};

export const refundFixtures = {
  /**
   * Successful refund
   */
  succeeded: {
    id: "re_test_refund_123",
    object: "refund",
    amount: 2500,
    balance_transaction: "txn_test_balance",
    charge: "ch_test_charge",
    created: 1705600000,
    currency: "usd",
    metadata: {
      reason: "customer_request",
    },
    payment_intent: "pi_test_succeeded",
    reason: "requested_by_customer",
    receipt_number: null,
    source_transfer_reversal: null,
    status: "succeeded",
    transfer_reversal: null,
  } as Stripe.Refund,

  /**
   * Pending refund
   */
  pending: {
    id: "re_test_pending",
    object: "refund",
    amount: 1000,
    charge: "ch_test_charge_2",
    created: 1705600000,
    currency: "usd",
    metadata: {},
    payment_intent: "pi_test_2",
    reason: null,
    status: "pending",
  } as unknown as Stripe.Refund,
};

export const webhookEventFixtures = {
  /**
   * checkout.session.completed event
   */
  checkoutSessionCompleted: {
    id: "evt_test_checkout_completed",
    object: "event",
    api_version: "2025-06-30.basil",
    created: 1705600000,
    data: {
      object: checkoutSessionFixtures.complete,
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: "req_test_123",
      idempotency_key: "key_test_abc",
    },
    type: "checkout.session.completed",
  } as Stripe.Event,

  /**
   * payment_intent.succeeded event
   */
  paymentIntentSucceeded: {
    id: "evt_test_payment_succeeded",
    object: "event",
    api_version: "2025-06-30.basil",
    created: 1705600000,
    data: {
      object: paymentIntentFixtures.succeeded,
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: "req_test_456",
      idempotency_key: null,
    },
    type: "payment_intent.succeeded",
  } as Stripe.Event,

  /**
   * charge.refunded event
   */
  chargeRefunded: {
    id: "evt_test_charge_refunded",
    object: "event",
    api_version: "2025-06-30.basil",
    created: 1705600000,
    data: {
      object: {
        id: "ch_test_refunded",
        object: "charge",
        amount: 5000,
        amount_refunded: 2500,
        refunded: true,
        refunds: {
          object: "list",
          data: [refundFixtures.succeeded],
          has_more: false,
          total_count: 1,
        },
        status: "succeeded",
      },
    },
    livemode: false,
    pending_webhooks: 1,
    request: null,
    type: "charge.refunded",
  } as unknown as Stripe.Event,
};

export const customerFixtures = {
  /**
   * Full customer object
   */
  complete: {
    id: "cus_test_complete",
    object: "customer",
    address: {
      city: "San Francisco",
      country: "US",
      line1: "123 Market St",
      line2: null,
      postal_code: "94102",
      state: "CA",
    },
    balance: 0,
    created: 1705600000,
    currency: "usd",
    default_source: null,
    delinquent: false,
    description: "Test customer",
    discount: null,
    email: "customer@example.com",
    invoice_prefix: "ABC123",
    invoice_settings: {
      custom_fields: null,
      default_payment_method: "pm_card_visa",
      footer: null,
      rendering_options: null,
    },
    livemode: false,
    metadata: {
      internal_id: "internal_123",
    },
    name: "John Doe",
    next_invoice_sequence: 1,
    phone: "+14155551234",
    preferred_locales: ["en"],
    shipping: null,
    tax_exempt: "none",
    test_clock: null,
  } as Stripe.Customer,
};
