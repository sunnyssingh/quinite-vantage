/**
 * Razorpay Payment Integration
 * Handles payment processing for invoices and credit purchases
 */

import Razorpay from 'razorpay'
import crypto from 'crypto'

// Initialize Razorpay instance
export function getRazorpayInstance() {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error('Razorpay credentials not configured')
    }

    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    })
}

/**
 * Create a Razorpay order for invoice payment
 * @param {object} invoice - Invoice object
 * @param {object} organization - Organization object
 * @returns {Promise<{success: boolean, order: object|null, error: string|null}>}
 */
export async function createRazorpayOrder(invoice, organization) {
    try {
        const razorpay = getRazorpayInstance()

        // Convert amount to paise (smallest currency unit)
        const amountInPaise = Math.round(parseFloat(invoice.total_amount) * 100)

        const orderOptions = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: invoice.invoice_number,
            notes: {
                invoice_id: invoice.id,
                organization_id: organization.id,
                organization_name: organization.name
            }
        }

        const order = await razorpay.orders.create(orderOptions)

        return {
            success: true,
            order,
            error: null
        }
    } catch (error) {
        console.error('Error creating Razorpay order:', error)
        return {
            success: false,
            order: null,
            error: error.message || 'Failed to create payment order'
        }
    }
}

/**
 * Verify Razorpay payment signature
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature
 * @returns {boolean}
 */
export function verifyRazorpaySignature(orderId, paymentId, signature) {
    try {
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${orderId}|${paymentId}`)
            .digest('hex')

        return generatedSignature === signature
    } catch (error) {
        console.error('Error verifying Razorpay signature:', error)
        return false
    }
}

/**
 * Fetch payment details from Razorpay
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Promise<{success: boolean, payment: object|null, error: string|null}>}
 */
export async function fetchRazorpayPayment(paymentId) {
    try {
        const razorpay = getRazorpayInstance()
        const payment = await razorpay.payments.fetch(paymentId)

        return {
            success: true,
            payment,
            error: null
        }
    } catch (error) {
        console.error('Error fetching Razorpay payment:', error)
        return {
            success: false,
            payment: null,
            error: error.message || 'Failed to fetch payment details'
        }
    }
}

/**
 * Process refund for a payment
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amount - Amount to refund (in rupees)
 * @param {string} reason - Refund reason
 * @returns {Promise<{success: boolean, refund: object|null, error: string|null}>}
 */
export async function processRazorpayRefund(paymentId, amount, reason) {
    try {
        const razorpay = getRazorpayInstance()

        // Convert amount to paise
        const amountInPaise = Math.round(amount * 100)

        const refund = await razorpay.payments.refund(paymentId, {
            amount: amountInPaise,
            notes: {
                reason
            }
        })

        return {
            success: true,
            refund,
            error: null
        }
    } catch (error) {
        console.error('Error processing Razorpay refund:', error)
        return {
            success: false,
            refund: null,
            error: error.message || 'Failed to process refund'
        }
    }
}

/**
 * Create a payment link for invoice
 * @param {object} invoice - Invoice object
 * @param {object} organization - Organization object
 * @returns {Promise<{success: boolean, link: object|null, error: string|null}>}
 */
export async function createPaymentLink(invoice, organization) {
    try {
        const razorpay = getRazorpayInstance()

        // Convert amount to paise
        const amountInPaise = Math.round(parseFloat(invoice.total_amount) * 100)

        const linkOptions = {
            amount: amountInPaise,
            currency: 'INR',
            description: `Invoice ${invoice.invoice_number}`,
            customer: {
                name: organization.name,
                email: organization.email || '',
                contact: organization.phone || ''
            },
            notify: {
                sms: true,
                email: true
            },
            reminder_enable: true,
            notes: {
                invoice_id: invoice.id,
                organization_id: organization.id
            },
            callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/payment/callback`,
            callback_method: 'get'
        }

        const link = await razorpay.paymentLink.create(linkOptions)

        return {
            success: true,
            link,
            error: null
        }
    } catch (error) {
        console.error('Error creating payment link:', error)
        return {
            success: false,
            link: null,
            error: error.message || 'Failed to create payment link'
        }
    }
}
