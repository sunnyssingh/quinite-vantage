// Default Role Templates for new Organizations
// These are seeded into the 'roles' table upon onboarding

export const DEFAULT_ROLES = [
    {
        name: 'Owner',
        description: 'Full access to all resources',
        is_system_default: true,
        permissions: [
            'project.view', 'project.create', 'project.edit', 'project.delete',
            'lead.view', 'lead.create', 'lead.edit', 'lead.delete',
            'campaign.view', 'campaign.create', 'campaign.edit', 'campaign.delete',
            'call_log.view',
            'analytics.view',
            'settings.view', 'settings.edit',
            'team.view', 'team.manage'
        ]
    },
    {
        name: 'Admin',
        description: 'Can manage resources but not billing',
        is_system_default: true,
        permissions: [
            'project.view', 'project.create', 'project.edit',
            'lead.view', 'lead.create', 'lead.edit', 'lead.delete',
            'campaign.view', 'campaign.create', 'campaign.edit',
            'call_log.view',
            'analytics.view',
            'settings.view',
            'team.view', 'team.manage'
        ]
    },
    {
        name: 'Member',
        description: 'Standard access',
        is_system_default: true,
        permissions: [
            'project.view',
            'lead.view', 'lead.create', 'lead.edit',
            'campaign.view',
            'call_log.view'
        ]
    }
]
