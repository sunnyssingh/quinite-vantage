/**
 * Validation Schemas
 * 
 * This module provides Zod schemas for validating data across the application.
 */

import { z } from 'zod'

// =====================================================
// Organization Profile Schemas
// =====================================================

export const organizationProfileSchema = z.object({
    sector: z.enum(['real_estate'], {
        errorMap: () => ({ message: 'Currently only real estate sector is supported' })
    }),
    businessType: z.enum(['agent', 'builder'], {
        errorMap: () => ({ message: 'Business type must be either agent or builder' })
    }),
    companyName: z.string()
        .min(2, 'Company name must be at least 2 characters')
        .max(100, 'Company name must not exceed 100 characters')
        .trim(),
    gstin: z.string()
        .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format')
        .optional()
        .or(z.literal('')),
    contactNumber: z.string()
        .regex(/^[+]?[0-9]{10,15}$/, 'Invalid contact number format')
        .trim(),
    addressLine1: z.string()
        .min(5, 'Address must be at least 5 characters')
        .max(200, 'Address must not exceed 200 characters')
        .trim(),
    addressLine2: z.string()
        .max(200, 'Address must not exceed 200 characters')
        .trim()
        .optional()
        .or(z.literal('')),
    city: z.string()
        .min(2, 'City must be at least 2 characters')
        .max(50, 'City must not exceed 50 characters')
        .trim(),
    state: z.string()
        .min(2, 'State must be at least 2 characters')
        .max(50, 'State must not exceed 50 characters')
        .trim(),
    country: z.string()
        .min(2, 'Country must be at least 2 characters')
        .max(50, 'Country must not exceed 50 characters')
        .default('India'),
    pincode: z.string()
        .regex(/^[0-9]{6}$/, 'Pincode must be 6 digits')
        .trim(),
    isComplete: z.boolean().optional()
})

// Partial schema for draft saves
export const organizationProfileDraftSchema = organizationProfileSchema.partial()

// =====================================================
// User Schemas
// =====================================================

export const signupSchema = z.object({
    email: z.string()
        .email('Invalid email address')
        .toLowerCase()
        .trim(),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password must not exceed 100 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    fullName: z.string()
        .min(2, 'Full name must be at least 2 characters')
        .max(100, 'Full name must not exceed 100 characters')
        .trim()
        .optional(),
    organizationName: z.string()
        .min(2, 'Organization name must be at least 2 characters')
        .max(100, 'Organization name must not exceed 100 characters')
        .trim()
        .optional()
})

export const signinSchema = z.object({
    email: z.string()
        .email('Invalid email address')
        .toLowerCase()
        .trim(),
    password: z.string()
        .min(1, 'Password is required')
})

export const onboardSchema = z.object({
    fullName: z.string()
        .min(2, 'Full name must be at least 2 characters')
        .max(100, 'Full name must not exceed 100 characters')
        .trim(),
    organizationName: z.string()
        .min(2, 'Organization name must be at least 2 characters')
        .max(100, 'Organization name must not exceed 100 characters')
        .trim()
})

// =====================================================
// Project Schemas
// =====================================================

export const projectSchema = z.object({
    name: z.string()
        .min(2, 'Project name must be at least 2 characters')
        .max(100, 'Project name must not exceed 100 characters')
        .trim(),
    description: z.string()
        .max(500, 'Description must not exceed 500 characters')
        .trim()
        .optional()
        .or(z.literal('')),
    status: z.enum(['active', 'completed', 'archived'])
        .default('active'),
    metadata: z.record(z.any()).optional()
})

// =====================================================
// Campaign Schemas
// =====================================================

export const campaignSchema = z.object({
    project_id: z.string()
        .uuid('Invalid project ID'),
    name: z.string()
        .min(2, 'Campaign name must be at least 2 characters')
        .max(100, 'Campaign name must not exceed 100 characters')
        .trim(),
    description: z.string()
        .max(500, 'Description must not exceed 500 characters')
        .trim()
        .optional()
        .or(z.literal('')),
    scheduled_at: z.string()
        .datetime('Invalid datetime format')
        .optional(),
    status: z.enum(['scheduled', 'processing', 'completed', 'failed'])
        .default('scheduled'),
    metadata: z.record(z.any()).optional()
})

// =====================================================
// Pagination Schemas
// =====================================================

export const paginationSchema = z.object({
    page: z.coerce.number()
        .int()
        .positive()
        .default(1),
    limit: z.coerce.number()
        .int()
        .positive()
        .max(100, 'Limit cannot exceed 100')
        .default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// =====================================================
// Filter Schemas
// =====================================================

export const auditLogFilterSchema = z.object({
    action: z.string().optional(),
    entity_type: z.string().optional(),
    user_id: z.string().uuid().optional(),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
    search: z.string().optional()
}).merge(paginationSchema)

// =====================================================
// ID Validation
// =====================================================

export const uuidSchema = z.string().uuid('Invalid ID format')

// =====================================================
// Helper Functions
// =====================================================

/**
 * Sanitize string input to prevent XSS
 * @param {string} input - Input string
 * @returns {string} Sanitized string
 */
export function sanitizeString(input) {
    if (typeof input !== 'string') return input

    return input
        .replace(/[<>]/g, '') // Remove < and >
        .trim()
}

/**
 * Sanitize object recursively
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
export function sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) return obj

    const sanitized = {}
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeString(value)
        } else if (typeof value === 'object') {
            sanitized[key] = sanitizeObject(value)
        } else {
            sanitized[key] = value
        }
    }
    return sanitized
}
