import { createAdminClient } from '@/lib/supabase/server'

/**
 * Check if organization has reached project limit
 */
export async function checkProjectLimit(organizationId) {
    const supabase = createAdminClient()

    // Get organization's subscription and plan
    const { data: subscription } = await supabase
        .from('organization_subscriptions')
        .select(`
      *,
      plan:billing_plans(max_projects)
    `)
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .single()

    if (!subscription || !subscription.plan) {
        return { allowed: false, message: 'No active subscription found' }
    }

    const maxProjects = subscription.plan.max_projects

    // NULL means unlimited
    if (maxProjects === null) {
        return { allowed: true, limit: null, current: null }
    }

    // Count current projects
    const { count: currentProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)

    if (currentProjects >= maxProjects) {
        return {
            allowed: false,
            limit: maxProjects,
            current: currentProjects,
            message: `Project limit reached. Your plan allows ${maxProjects} projects. Upgrade to create more.`
        }
    }

    return {
        allowed: true,
        limit: maxProjects,
        current: currentProjects
    }
}

/**
 * Check if organization has reached lead limit
 */
export async function checkLeadLimit(organizationId) {
    const supabase = createAdminClient()

    // Get organization's subscription and plan
    const { data: subscription } = await supabase
        .from('organization_subscriptions')
        .select(`
      *,
      plan:billing_plans(max_leads)
    `)
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .single()

    if (!subscription || !subscription.plan) {
        return { allowed: false, message: 'No active subscription found' }
    }

    const maxLeads = subscription.plan.max_leads

    // NULL means unlimited
    if (maxLeads === null) {
        return { allowed: true, limit: null, current: null }
    }

    // Count current leads
    const { count: currentLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)

    if (currentLeads >= maxLeads) {
        return {
            allowed: false,
            limit: maxLeads,
            current: currentLeads,
            message: `Lead limit reached. Your plan allows ${maxLeads} leads. Upgrade to add more.`
        }
    }

    return {
        allowed: true,
        limit: maxLeads,
        current: currentLeads
    }
}

/**
 * Check if organization can add more users
 */
export async function checkUserLimit(organizationId) {
    const supabase = createAdminClient()

    // Get organization's subscription and plan
    const { data: subscription } = await supabase
        .from('organization_subscriptions')
        .select(`
      *,
      plan:billing_plans(max_users, name)
    `)
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .single()

    if (!subscription || !subscription.plan) {
        return { allowed: false, message: 'No active subscription found' }
    }

    const maxUsers = subscription.plan.max_users

    // NULL means unlimited
    if (maxUsers === null) {
        return { allowed: true, limit: null, current: null }
    }

    // Count current users
    const { count: currentUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)

    if (currentUsers >= maxUsers) {
        return {
            allowed: false,
            limit: maxUsers,
            current: currentUsers,
            message: `User limit reached. ${subscription.plan.name} plan allows ${maxUsers} user${maxUsers > 1 ? 's' : ''}. Upgrade to Pro to add team members.`
        }
    }

    return {
        allowed: true,
        limit: maxUsers,
        current: currentUsers
    }
}

/**
 * Check if organization has access to a specific module
 */
export async function checkModuleAccess(organizationId, moduleName) {
    const supabase = createAdminClient()

    // Get organization's subscription, plan, and add-ons
    const { data: subscription } = await supabase
        .from('organization_subscriptions')
        .select(`
      *,
      plan:billing_plans(allowed_modules, features)
    `)
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .single()

    if (!subscription || !subscription.plan) {
        return { allowed: false, message: 'No active subscription found' }
    }

    // Check if module is in allowed_modules
    const allowedModules = subscription.plan.allowed_modules || []
    if (allowedModules.includes(moduleName)) {
        return { allowed: true, source: 'plan' }
    }

    // Check if module is enabled via add-on
    const { data: addons } = await supabase
        .from('organization_addons')
        .select(`
      *,
      addon:subscription_addons(features)
    `)
        .eq('organization_id', organizationId)
        .eq('status', 'active')

    if (addons && addons.length > 0) {
        for (const orgAddon of addons) {
            const addonFeatures = orgAddon.addon?.features || {}
            if (addonFeatures[`${moduleName}_access`] === true) {
                return { allowed: true, source: 'addon' }
            }
        }
    }

    return {
        allowed: false,
        message: `Access to ${moduleName} module not included in your plan. Upgrade or purchase the add-on.`
    }
}

/**
 * Check if organization can export data
 */
export async function checkExportAccess(organizationId) {
    const supabase = createAdminClient()

    const { data: subscription } = await supabase
        .from('organization_subscriptions')
        .select(`
      *,
      plan:billing_plans(features)
    `)
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .single()

    if (!subscription || !subscription.plan) {
        return { allowed: false, message: 'No active subscription found' }
    }

    const features = subscription.plan.features || {}

    if (features.csv_export !== true) {
        return {
            allowed: false,
            message: 'Data export is not available on the Free plan. Upgrade to Pro to export your data.'
        }
    }

    return { allowed: true }
}

/**
 * Get usage statistics for an organization
 */
export async function getUsageStats(organizationId) {
    const supabase = createAdminClient()

    // Get subscription and plan limits
    const { data: subscription } = await supabase
        .from('organization_subscriptions')
        .select(`
      *,
      plan:billing_plans(name, max_projects, max_leads, max_users)
    `)
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .single()

    if (!subscription || !subscription.plan) {
        return null
    }

    // Get current counts
    const [
        { count: projectCount },
        { count: leadCount },
        { count: userCount }
    ] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId),
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId)
    ])

    return {
        plan: subscription.plan.name,
        projects: {
            current: projectCount,
            limit: subscription.plan.max_projects,
            percentage: subscription.plan.max_projects ? (projectCount / subscription.plan.max_projects) * 100 : 0
        },
        leads: {
            current: leadCount,
            limit: subscription.plan.max_leads,
            percentage: subscription.plan.max_leads ? (leadCount / subscription.plan.max_leads) * 100 : 0
        },
        users: {
            current: userCount,
            limit: subscription.plan.max_users,
            percentage: subscription.plan.max_users ? (userCount / subscription.plan.max_users) * 100 : 0
        }
    }
}
