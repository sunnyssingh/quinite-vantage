/**
 * Subscription and Feature Access Middleware
 * Handles subscription status checks, feature gating, and account locking
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * Check if an organization's subscription is active and not locked
 * @param {string} organizationId - Organization UUID
 * @returns {Promise<{isActive: boolean, isLocked: boolean, reason: string|null, subscription: object|null}>}
 */
export async function checkSubscriptionStatus(organizationId) {
  const supabase = await createServerSupabaseClient()

  try {
    // Get subscription details
    const { data: subscription, error } = await supabase
      .from('organization_subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .single()

    if (error || !subscription) {
      return {
        isActive: false,
        isLocked: true,
        reason: 'No active subscription found',
        subscription: null
      }
    }

    // Check if subscription is active
    if (subscription.status === 'suspended') {
      return {
        isActive: false,
        isLocked: true,
        reason: 'Account suspended due to non-payment',
        subscription
      }
    }

    if (subscription.status === 'cancelled') {
      return {
        isActive: false,
        isLocked: true,
        reason: 'Subscription has been cancelled',
        subscription
      }
    }

    // Check for overdue invoices
    const { data: overdueInvoices } = await supabase
      .from('billing_invoices')
      .select('id, invoice_number, due_date, total_amount')
      .eq('organization_id', organizationId)
      .eq('status', 'overdue')
      .order('due_date', { ascending: true })
      .limit(1)

    if (overdueInvoices && overdueInvoices.length > 0) {
      const invoice = overdueInvoices[0]
      const daysPastDue = Math.floor(
        (new Date() - new Date(invoice.due_date)) / (1000 * 60 * 60 * 24)
      )

      // Lock account if more than 7 days past due
      if (daysPastDue > 7) {
        // Update subscription status to suspended
        await supabase
          .from('organization_subscriptions')
          .update({ status: 'suspended' })
          .eq('organization_id', organizationId)

        return {
          isActive: false,
          isLocked: true,
          reason: `Payment overdue by ${daysPastDue} days. Invoice #${invoice.invoice_number}`,
          subscription
        }
      }
    }

    return {
      isActive: subscription.status === 'active' || subscription.status === 'trial',
      isLocked: false,
      reason: null,
      subscription
    }
  } catch (error) {
    console.error('Error checking subscription status:', error)
    return {
      isActive: false,
      isLocked: true,
      reason: 'Error checking subscription status',
      subscription: null
    }
  }
}

/**
 * Check if an organization has access to a specific feature
 * @param {string} organizationId - Organization UUID
 * @param {string} feature - Feature key (e.g., 'csv_export', 'advanced_analytics')
 * @returns {Promise<{hasAccess: boolean, reason: string|null}>}
 */
export async function checkFeatureAccess(organizationId, feature) {
  const supabase = await createServerSupabaseClient()

  try {
    // First check subscription status
    const { isActive, isLocked } = await checkSubscriptionStatus(organizationId)

    if (!isActive || isLocked) {
      return {
        hasAccess: false,
        reason: 'Subscription is not active'
      }
    }

    // Get subscription with plan details
    const { data: subscription, error } = await supabase
      .from('organization_subscriptions')
      .select(`
        *,
        plan:billing_plans(*)
      `)
      .eq('organization_id', organizationId)
      .single()

    if (error || !subscription) {
      return {
        hasAccess: false,
        reason: 'Could not verify subscription plan'
      }
    }

    // Check if feature is included in plan
    const planFeatures = subscription.plan?.features || {}

    if (planFeatures[feature] === true) {
      return {
        hasAccess: true,
        reason: null
      }
    }

    return {
      hasAccess: false,
      reason: `Feature '${feature}' requires a Pro subscription`
    }
  } catch (error) {
    console.error('Error checking feature access:', error)
    return {
      hasAccess: false,
      reason: 'Error checking feature access'
    }
  }
}

/**
 * Check if an organization has access to a specific module
 * @param {string} organizationId - Organization UUID
 * @param {string} module - Module name ('crm', 'inventory', 'analytics')
 * @returns {Promise<{hasAccess: boolean, reason: string|null}>}
 */
export async function checkModuleAccess(organizationId, module) {
  const supabase = await createServerSupabaseClient()

  try {
    const { data: subscription, error } = await supabase
      .from('organization_subscriptions')
      .select('modules_enabled, status')
      .eq('organization_id', organizationId)
      .single()

    if (error || !subscription) {
      return {
        hasAccess: false,
        reason: 'No active subscription found'
      }
    }

    if (subscription.status !== 'active' && subscription.status !== 'trial') {
      return {
        hasAccess: false,
        reason: 'Subscription is not active'
      }
    }

    const modulesEnabled = subscription.modules_enabled || []

    if (modulesEnabled.includes(module) || modulesEnabled.includes('all_modules')) {
      return {
        hasAccess: true,
        reason: null
      }
    }

    return {
      hasAccess: false,
      reason: `Module '${module}' is not included in your subscription`
    }
  } catch (error) {
    console.error('Error checking module access:', error)
    return {
      hasAccess: false,
      reason: 'Error checking module access'
    }
  }
}

/**
 * Get organization's current credit balance
 * @param {string} organizationId - Organization UUID
 * @returns {Promise<{balance: number, lowBalance: boolean}>}
 */
export async function getCreditBalance(organizationId) {
  const supabase = await createServerSupabaseClient()

  try {
    const { data: credits, error } = await supabase
      .from('call_credits')
      .select('balance, low_balance_threshold')
      .eq('organization_id', organizationId)
      .single()

    if (error || !credits) {
      return {
        balance: 0,
        lowBalance: true
      }
    }

    return {
      balance: parseFloat(credits.balance),
      lowBalance: parseFloat(credits.balance) < parseFloat(credits.low_balance_threshold)
    }
  } catch (error) {
    console.error('Error getting credit balance:', error)
    return {
      balance: 0,
      lowBalance: true
    }
  }
}

/**
 * Deduct call credits based on call duration
 * 1 Credit = 1 Minute (4 Rupees = 1 Credit)
 * @param {string} organizationId - Organization UUID
 * @param {number} durationMinutes - Call duration in minutes
 * @param {string} callId - Reference to the call record
 * @returns {Promise<{success: boolean, newBalance: number, error: string|null}>}
 */
export async function deductCallCredits(organizationId, durationMinutes, callId) {
  const supabase = await createServerSupabaseClient()

  try {
    // Round up partial minutes
    const creditsToDeduct = Math.ceil(durationMinutes)

    // Get current balance
    const { data: credits, error: fetchError } = await supabase
      .from('call_credits')
      .select('balance')
      .eq('organization_id', organizationId)
      .single()

    if (fetchError || !credits) {
      return {
        success: false,
        newBalance: 0,
        error: 'Could not fetch credit balance'
      }
    }

    const currentBalance = parseFloat(credits.balance)

    // Check if sufficient balance
    if (currentBalance < creditsToDeduct) {
      return {
        success: false,
        newBalance: currentBalance,
        error: `Insufficient credits. Required: ${creditsToDeduct}, Available: ${currentBalance}`
      }
    }

    const newBalance = currentBalance - creditsToDeduct

    // Update balance
    const { error: updateError } = await supabase
      .from('call_credits')
      .update({
        balance: newBalance,
        total_consumed: supabase.raw(`total_consumed + ${creditsToDeduct}`),
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', organizationId)

    if (updateError) {
      return {
        success: false,
        newBalance: currentBalance,
        error: 'Failed to update credit balance'
      }
    }

    // Log transaction
    await supabase
      .from('credit_transactions')
      .insert({
        organization_id: organizationId,
        transaction_type: 'consumption',
        amount: -creditsToDeduct,
        balance_before: currentBalance,
        balance_after: newBalance,
        reference_type: 'call',
        reference_id: callId,
        description: `Call duration: ${durationMinutes.toFixed(2)} minutes`
      })

    return {
      success: true,
      newBalance,
      error: null
    }
  } catch (error) {
    console.error('Error deducting call credits:', error)
    return {
      success: false,
      newBalance: 0,
      error: 'Error processing credit deduction'
    }
  }
}

/**
 * Add credits to organization account (purchase or refund)
 * @param {string} organizationId - Organization UUID
 * @param {number} credits - Number of credits to add
 * @param {string} transactionType - 'purchase' or 'refund'
 * @param {string} referenceId - Payment transaction ID or invoice ID
 * @param {string} userId - User who initiated the transaction
 * @returns {Promise<{success: boolean, newBalance: number, error: string|null}>}
 */
export async function addCallCredits(organizationId, credits, transactionType, referenceId, userId) {
  const supabase = await createServerSupabaseClient()

  try {
    // Get or create credit record
    let { data: creditRecord, error: fetchError } = await supabase
      .from('call_credits')
      .select('balance, total_purchased')
      .eq('organization_id', organizationId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      return {
        success: false,
        newBalance: 0,
        error: 'Error fetching credit record'
      }
    }

    const currentBalance = creditRecord ? parseFloat(creditRecord.balance) : 0
    const totalPurchased = creditRecord ? parseFloat(creditRecord.total_purchased) : 0
    const newBalance = currentBalance + credits
    const newTotalPurchased = transactionType === 'purchase' ? totalPurchased + credits : totalPurchased

    // Upsert credit record
    const { error: upsertError } = await supabase
      .from('call_credits')
      .upsert({
        organization_id: organizationId,
        balance: newBalance,
        total_purchased: newTotalPurchased,
        last_recharged_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'organization_id'
      })

    if (upsertError) {
      return {
        success: false,
        newBalance: currentBalance,
        error: 'Failed to update credit balance'
      }
    }

    // Log transaction
    await supabase
      .from('credit_transactions')
      .insert({
        organization_id: organizationId,
        transaction_type: transactionType,
        amount: credits,
        balance_before: currentBalance,
        balance_after: newBalance,
        reference_type: transactionType === 'purchase' ? 'invoice' : 'manual',
        reference_id: referenceId,
        description: `${transactionType === 'purchase' ? 'Purchased' : 'Refunded'} ${credits} credits`,
        created_by: userId
      })

    return {
      success: true,
      newBalance,
      error: null
    }
  } catch (error) {
    console.error('Error adding call credits:', error)
    return {
      success: false,
      newBalance: 0,
      error: 'Error processing credit addition'
    }
  }
}
