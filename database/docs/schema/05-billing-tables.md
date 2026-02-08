# Billing & Subscription Tables

## subscription_plans

**Purpose**: Available subscription tiers and pricing.

### Key Columns

- `id`, `name`, `slug` (UNIQUE)
- `description`
- `price_monthly`, `price_yearly`
- `features` (jsonb) - Feature flags and limits
- `is_active`, `sort_order`

### RLS Policies

- `View subscription plans`: Public can view active plans

---

## subscriptions

**Purpose**: Organization subscriptions to plans.

### Key Columns

- `id`, `organization_id`, `plan_id`
- `status` (active, cancelled, past_due, trialing, inactive)
- `billing_cycle` (monthly, yearly)
- `current_period_start`, `current_period_end`
- `cancel_at_period_end`, `cancelled_at`
- `trial_ends_at`
- `metadata` (jsonb)

---

## invoices

**Purpose**: Billing invoices for subscriptions.

### Key Columns

- `id`, `subscription_id`, `organization_id`
- `amount`, `currency` (default: INR)
- `status` (draft, open, paid, void, uncollectible)
- `invoice_number` (UNIQUE, auto-generated)
- `invoice_date`, `due_date`, `paid_at`
- `payment_method_id`
- `metadata` (jsonb)

### Triggers

- `set_invoice_number_trigger`: Auto-generates invoice numbers

---

## payment_methods

**Purpose**: Stored payment methods for organizations.

### Key Columns

- `id`, `organization_id`
- `type` (card, upi, bank_transfer, razorpay, stripe)
- `last4`, `brand`, `expiry_month`, `expiry_year`
- `is_default`
- `gateway_customer_id`, `gateway_payment_method_id`
- `metadata` (jsonb)

---

## usage_logs

**Purpose**: Track feature usage for billing purposes.

### Key Columns

- `organization_id`, `feature_key`
- `usage_count`
- `period_start`, `period_end`
- `metadata` (jsonb)

---

## Summary

The Billing module provides:

- **Subscription Management**: Plan-based billing
- **Invoice Generation**: Automatic invoice creation
- **Payment Processing**: Multiple payment gateway support
- **Usage Tracking**: Feature usage metering
- **Trial Management**: Trial period handling
