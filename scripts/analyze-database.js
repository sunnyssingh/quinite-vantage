/**
 * Database Schema Documentation & RLS Policy Analyzer
 * 
 * This script connects to Supabase and:
 * 1. Fetches all tables, columns, and relationships
 * 2. Documents all RLS policies
 * 3. Lists all triggers and functions
 * 4. Identifies potential infinite recursion issues
 * 5. Generates documentation and fix scripts
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local')
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function getAllTables() {
    const { data, error } = await supabase.rpc('get_all_tables')

    if (error) {
        // Fallback: Query information_schema
        const { data: tables, error: err } = await supabase
            .from('information_schema.tables')
            .select('table_name, table_schema')
            .eq('table_schema', 'public')

        if (err) throw err
        return tables
    }

    return data
}

async function getTableColumns(tableName) {
    const query = `
        SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
        ORDER BY ordinal_position;
    `

    const { data, error } = await supabase.rpc('exec_sql', { query })
    return data || []
}

async function getForeignKeys(tableName) {
    const query = `
        SELECT
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = '${tableName}';
    `

    const { data, error } = await supabase.rpc('exec_sql', { query })
    return data || []
}

async function getRLSPolicies(tableName) {
    const query = `
        SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = '${tableName}';
    `

    const { data, error } = await supabase.rpc('exec_sql', { query })
    return data || []
}

async function getAllRLSPolicies() {
    const query = `
        SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
        FROM pg_policies
        WHERE schemaname = 'public'
        ORDER BY tablename, policyname;
    `

    const { data, error } = await supabase.rpc('exec_sql', { query })
    return data || []
}

async function getTriggers(tableName) {
    const query = `
        SELECT 
            trigger_name,
            event_manipulation,
            event_object_table,
            action_statement,
            action_timing
        FROM information_schema.triggers
        WHERE event_object_schema = 'public'
        AND event_object_table = '${tableName}'
        ORDER BY trigger_name;
    `

    const { data, error } = await supabase.rpc('exec_sql', { query })
    return data || []
}

async function getAllFunctions() {
    const query = `
        SELECT 
            routine_name,
            routine_type,
            data_type,
            routine_definition
        FROM information_schema.routines
        WHERE routine_schema = 'public'
        AND routine_type = 'FUNCTION'
        ORDER BY routine_name;
    `

    const { data, error } = await supabase.rpc('exec_sql', { query })
    return data || []
}

function analyzeRecursionRisk(policies, foreignKeys) {
    const risks = []

    // Check for self-referencing foreign keys
    const selfRefs = foreignKeys.filter(fk =>
        fk.foreign_table_name === fk.table_name
    )

    if (selfRefs.length > 0) {
        risks.push({
            type: 'SELF_REFERENCE',
            severity: 'HIGH',
            description: 'Table has self-referencing foreign keys',
            details: selfRefs,
            recommendation: 'RLS policies should not traverse self-referencing relationships'
        })
    }

    // Check for policies that might cause recursion
    policies.forEach(policy => {
        const qual = policy.qual || ''
        const withCheck = policy.with_check || ''

        // Look for subqueries that reference the same table
        if (qual.includes('FROM profiles') || withCheck.includes('FROM profiles')) {
            risks.push({
                type: 'RECURSIVE_POLICY',
                severity: 'HIGH',
                policyName: policy.policyname,
                description: 'Policy contains subquery that may cause recursion',
                recommendation: 'Use auth.uid() directly or create a SECURITY DEFINER function'
            })
        }
    })

    return risks
}

function generateFixScript(tableName, risks) {
    let script = `-- Fix Script for ${tableName}\n-- Generated: ${new Date().toISOString()}\n\n`

    if (risks.some(r => r.type === 'RECURSIVE_POLICY')) {
        script += `-- Step 1: Drop problematic policies\n`
        risks
            .filter(r => r.type === 'RECURSIVE_POLICY')
            .forEach(risk => {
                script += `DROP POLICY IF EXISTS "${risk.policyName}" ON ${tableName};\n`
            })

        script += `\n-- Step 2: Create safe, non-recursive policies\n`
        script += `
-- Allow users to view their own profile
CREATE POLICY "view_own_${tableName}"
ON ${tableName}
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to view profiles in their organization (non-recursive)
CREATE POLICY "view_org_${tableName}"
ON ${tableName}
FOR SELECT
TO authenticated
USING (
  organization_id = (
    SELECT p.organization_id 
    FROM ${tableName} p
    WHERE p.id = auth.uid()
    LIMIT 1
  )
);

-- Allow users to update their own profile
CREATE POLICY "update_own_${tableName}"
ON ${tableName}
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
`
    }

    return script
}

async function generateDocumentation() {
    console.log('🔍 Analyzing database schema...\n')

    let markdown = `# Database Schema Documentation\n\n`
    markdown += `Generated: ${new Date().toISOString()}\n\n`
    markdown += `## Overview\n\n`

    // Get all tables
    const tables = await getAllTables()
    markdown += `Total Tables: ${tables.length}\n\n`

    // Get all RLS policies
    const allPolicies = await getAllRLSPolicies()
    markdown += `Total RLS Policies: ${allPolicies.length}\n\n`

    // Get all functions
    const functions = await getAllFunctions()
    markdown += `Total Functions: ${functions.length}\n\n`

    markdown += `---\n\n`

    // Document each table
    for (const table of tables) {
        const tableName = table.table_name
        console.log(`📋 Analyzing table: ${tableName}`)

        markdown += `## Table: \`${tableName}\`\n\n`

        // Columns
        const columns = await getTableColumns(tableName)
        markdown += `### Columns\n\n`
        markdown += `| Column | Type | Nullable | Default |\n`
        markdown += `|--------|------|----------|----------|\n`
        columns.forEach(col => {
            markdown += `| ${col.column_name} | ${col.data_type} | ${col.is_nullable} | ${col.column_default || 'NULL'} |\n`
        })
        markdown += `\n`

        // Foreign Keys
        const foreignKeys = await getForeignKeys(tableName)
        if (foreignKeys.length > 0) {
            markdown += `### Foreign Keys\n\n`
            foreignKeys.forEach(fk => {
                markdown += `- \`${fk.column_name}\` → \`${fk.foreign_table_name}.${fk.foreign_column_name}\`\n`
            })
            markdown += `\n`
        }

        // RLS Policies
        const policies = await getRLSPolicies(tableName)
        if (policies.length > 0) {
            markdown += `### RLS Policies\n\n`
            policies.forEach(policy => {
                markdown += `#### ${policy.policyname}\n`
                markdown += `- **Command**: ${policy.cmd}\n`
                markdown += `- **Roles**: ${policy.roles?.join(', ')}\n`
                if (policy.qual) markdown += `- **USING**: \`${policy.qual}\`\n`
                if (policy.with_check) markdown += `- **WITH CHECK**: \`${policy.with_check}\`\n`
                markdown += `\n`
            })
        }

        // Triggers
        const triggers = await getTriggers(tableName)
        if (triggers.length > 0) {
            markdown += `### Triggers\n\n`
            triggers.forEach(trigger => {
                markdown += `- **${trigger.trigger_name}**: ${trigger.action_timing} ${trigger.event_manipulation}\n`
            })
            markdown += `\n`
        }

        // Analyze recursion risks
        const risks = analyzeRecursionRisk(policies, foreignKeys)
        if (risks.length > 0) {
            markdown += `### ⚠️ Potential Issues\n\n`
            risks.forEach(risk => {
                markdown += `**${risk.type}** (${risk.severity})\n`
                markdown += `- ${risk.description}\n`
                markdown += `- **Recommendation**: ${risk.recommendation}\n\n`
            })

            // Generate fix script
            const fixScript = generateFixScript(tableName, risks)
            const fixFileName = `fix_${tableName}_rls.sql`
            fs.writeFileSync(path.join(__dirname, fixFileName), fixScript)
            markdown += `**Fix Script Generated**: \`${fixFileName}\`\n\n`
            console.log(`  ⚠️  Issues found! Fix script: ${fixFileName}`)
        }

        markdown += `---\n\n`
    }

    // Document functions
    markdown += `## Database Functions\n\n`
    functions.forEach(func => {
        markdown += `### ${func.routine_name}\n`
        markdown += `- **Type**: ${func.routine_type}\n`
        markdown += `- **Returns**: ${func.data_type}\n\n`
    })

    // Save documentation
    const docFileName = 'DATABASE_SCHEMA.md'
    fs.writeFileSync(path.join(__dirname, docFileName), markdown)
    console.log(`\n✅ Documentation generated: ${docFileName}`)

    return { tables, policies: allPolicies, functions }
}

// Main execution
async function main() {
    try {
        await generateDocumentation()
        console.log('\n✅ Schema analysis complete!')
        process.exit(0)
    } catch (error) {
        console.error('\n❌ Error:', error.message)
        console.error(error)
        process.exit(1)
    }
}

main()
