/**
 * Centralized Error Handling System
 * 
 * This module provides custom error classes and utilities for consistent
 * error handling across the application.
 */

// =====================================================
// Custom Error Classes
// =====================================================

export class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
        super(message)
        this.name = this.constructor.name
        this.statusCode = statusCode
        this.code = code
        this.isOperational = true
        Error.captureStackTrace(this, this.constructor)
    }
}

export class ValidationError extends AppError {
    constructor(message, details = null) {
        super(message, 400, 'VALIDATION_ERROR')
        this.details = details
    }
}

export class AuthenticationError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401, 'AUTHENTICATION_ERROR')
    }
}

export class AuthorizationError extends AppError {
    constructor(message = 'Insufficient permissions') {
        super(message, 403, 'AUTHORIZATION_ERROR')
    }
}

export class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND')
    }
}

export class DatabaseError extends AppError {
    constructor(message = 'Database operation failed', originalError = null) {
        super(message, 500, 'DATABASE_ERROR')
        this.originalError = originalError
    }
}

export class RateLimitError extends AppError {
    constructor(message = 'Too many requests') {
        super(message, 429, 'RATE_LIMIT_ERROR')
    }
}

// =====================================================
// Error Response Formatter
// =====================================================

/**
 * Format error for API response
 * @param {Error} error - The error object
 * @param {boolean} includeStack - Whether to include stack trace (dev only)
 * @returns {Object} Formatted error response
 */
export function formatErrorResponse(error, includeStack = false) {
    const response = {
        error: {
            message: error.message || 'An unexpected error occurred',
            code: error.code || 'INTERNAL_ERROR',
            statusCode: error.statusCode || 500
        }
    }

    // Add validation details if available
    if (error instanceof ValidationError && error.details) {
        response.error.details = error.details
    }

    // Include stack trace in development
    if (includeStack && process.env.NODE_ENV === 'development') {
        response.error.stack = error.stack
    }

    return response
}

// =====================================================
// Error Logger
// =====================================================

/**
 * Log error with context
 * @param {Error} error - The error object
 * @param {Object} context - Additional context (user, request, etc.)
 */
export function logError(error, context = {}) {
    const timestamp = new Date().toISOString()
    const logEntry = {
        timestamp,
        name: error.name,
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        stack: error.stack,
        ...context
    }

    // In production, you'd send this to a logging service (e.g., Sentry, LogRocket)
    if (process.env.NODE_ENV === 'production') {
        console.error('[ERROR]', JSON.stringify(logEntry))
    } else {
        console.error('[ERROR]', logEntry)
    }

    // TODO: Integrate with error tracking service
    // if (process.env.SENTRY_DSN) {
    //   Sentry.captureException(error, { extra: context })
    // }
}

// =====================================================
// Error Handler Middleware
// =====================================================

/**
 * Handle errors in API routes
 * @param {Error} error - The error object
 * @param {Object} context - Request context
 * @returns {Response} Next.js Response object
 */
export function handleApiError(error, context = {}) {
    // Log the error
    logError(error, context)

    // Determine if we should include stack trace
    const includeStack = process.env.NODE_ENV === 'development'

    // Format the error response
    const errorResponse = formatErrorResponse(error, includeStack)

    // Return appropriate status code
    const statusCode = error.statusCode || 500

    return {
        status: statusCode,
        body: errorResponse
    }
}

// =====================================================
// Async Error Wrapper
// =====================================================

/**
 * Wrap async functions to catch errors
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
export function asyncHandler(fn) {
    return async (...args) => {
        try {
            return await fn(...args)
        } catch (error) {
            throw error instanceof AppError ? error : new AppError(error.message)
        }
    }
}

// =====================================================
// Validation Helper
// =====================================================

/**
 * Validate data against schema and throw ValidationError if invalid
 * @param {Object} schema - Zod schema
 * @param {Object} data - Data to validate
 * @returns {Object} Validated data
 * @throws {ValidationError}
 */
export function validateOrThrow(schema, data) {
    const result = schema.safeParse(data)

    if (!result.success) {
        const details = result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
        }))

        throw new ValidationError('Validation failed', details)
    }

    return result.data
}
