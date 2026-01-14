// ==============================================================================
// Centralized Error Handling Utilities
// ==============================================================================

/**
 * Custom Error Classes
 */
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

// Authentication Errors (401)
export class AuthenticationError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401, 'AUTHENTICATION_ERROR')
    }
}

export class InvalidCredentialsError extends AppError {
    constructor(message = 'Invalid email or password') {
        super(message, 401, 'INVALID_CREDENTIALS')
    }
}

// Authorization Errors (403)
export class AuthorizationError extends AppError {
    constructor(message = 'You do not have permission to perform this action') {
        super(message, 403, 'AUTHORIZATION_ERROR')
    }
}

// Validation Errors (400)
export class ValidationError extends AppError {
    constructor(message = 'Validation failed', errors = []) {
        super(message, 400, 'VALIDATION_ERROR')
        this.errors = errors
    }
}

// Not Found Errors (404)
export class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND')
        this.resource = resource
    }
}

// Conflict Errors (409)
export class ConflictError extends AppError {
    constructor(message = 'Resource already exists') {
        super(message, 409, 'CONFLICT')
    }
}

/**
 * Error Handler for API Routes
 */
export function handleApiError(error) {
    // Log error
    console.error('[API Error]:', {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })

    // Operational errors (known errors)
    if (error.isOperational) {
        return {
            status: error.statusCode,
            body: {
                error: {
                    code: error.code,
                    message: error.message,
                    ...(error.errors && { details: error.errors })
                }
            }
        }
    }

    // Programming errors (unknown errors)
    return {
        status: 500,
        body: {
            error: {
                code: 'INTERNAL_ERROR',
                message: process.env.NODE_ENV === 'development'
                    ? error.message
                    : 'An unexpected error occurred'
            }
        }
    }
}

/**
 * Async error wrapper for API routes
 */
export function asyncHandler(fn) {
    return async (request, context) => {
        try {
            return await fn(request, context)
        } catch (error) {
            const { status, body } = handleApiError(error)
            return new Response(JSON.stringify(body), {
                status,
                headers: { 'Content-Type': 'application/json' }
            })
        }
    }
}

/**
 * Validate required fields
 */
export function validateRequired(data, requiredFields) {
    const missing = []

    for (const field of requiredFields) {
        if (!data[field]) {
            missing.push(field)
        }
    }

    if (missing.length > 0) {
        throw new ValidationError(
            `Missing required fields: ${missing.join(', ')}`,
            missing.map(field => ({ field, message: 'This field is required' }))
        )
    }
}

/**
 * Validate email format
 */
export function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        throw new ValidationError('Invalid email format')
    }
}

/**
 * Frontend error handler
 */
export function handleClientError(error) {
    console.error('[Client Error]:', error)

    // Return user-friendly message
    if (error.response) {
        return error.response.data?.error?.message || 'An error occurred'
    }

    return error.message || 'An unexpected error occurred'
}
