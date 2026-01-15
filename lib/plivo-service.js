import plivo from 'plivo'

/**
 * Plivo Service for Real Telephony
 * Handles making calls, transferring calls, and managing call state
 */

// Initialize Plivo client
const getPlivoClient = () => {
    if (!process.env.PLIVO_AUTH_ID || !process.env.PLIVO_AUTH_TOKEN) {
        throw new Error('Plivo credentials not configured')
    }

    return new plivo.Client(
        process.env.PLIVO_AUTH_ID,
        process.env.PLIVO_AUTH_TOKEN
    )
}

/**
 * Make an outbound call to a lead
 * @param {string} toNumber - Lead's phone number
 * @param {string} leadId - Lead ID for tracking
 * @param {string} campaignId - Campaign ID
 * @returns {Promise<string>} Call SID
 */
export async function makeCall(toNumber, leadId, campaignId) {
    const MAX_RETRIES = 3
    let lastError

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const client = getPlivoClient()
            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

            // Determine Answer URL
            // If WEBSOCKET_SERVER_URL is set (e.g. for testing with separate server), use it.
            // Otherwise, default to the internal Next.js API route.
            let answerUrl;
            if (process.env.WEBSOCKET_SERVER_URL) {
                answerUrl = `${process.env.WEBSOCKET_SERVER_URL}/answer?leadId=${leadId}&campaignId=${campaignId}`;
                console.log(`Using External WebSocket Server for Answer URL: ${answerUrl}`);
            } else {
                answerUrl = `${baseUrl}/api/webhooks/plivo/answer?leadId=${leadId}&campaignId=${campaignId}`;
            }

            console.log(`Plivo makeCall attempt ${attempt}/${MAX_RETRIES} to ${toNumber}`)

            const response = await client.calls.create(
                process.env.PLIVO_PHONE_NUMBER, // from
                toNumber, // to
                answerUrl, // answer_url
                {
                    answer_method: 'POST',
                    hangup_method: 'POST',
                    record: 'false', // Recording disabled for now
                    record_callback_url: `${baseUrl}/api/webhooks/plivo/recording`,
                    record_callback_method: 'POST',
                    record_callback_method: 'POST',
                    callback_url: `${baseUrl}/api/webhooks/plivo/status?leadId=${leadId}&campaignId=${campaignId}`,
                    callback_method: 'POST',
                    time_limit: 1800, // 30 minutes max call duration
                }
            )

            console.log('Call initiated:', response)
            return response.requestUuid // This is the call_sid
        } catch (error) {
            console.error(`Plivo makeCall attempt ${attempt} failed:`, error.message)
            lastError = error

            // Wait before retrying (exponential backoff: 1s, 2s, 4s)
            if (attempt < MAX_RETRIES) {
                const delay = Math.pow(2, attempt - 1) * 1000
                await new Promise(resolve => setTimeout(resolve, delay))
            }
        }
    }

    throw new Error(`Failed to make call after ${MAX_RETRIES} attempts: ${lastError.message}`)
}

/**
 * Transfer an ongoing call to an employee
 * @param {string} callSid - Call UUID from Plivo
 * @param {string} employeePhone - Employee's phone number
 * @returns {Promise<boolean>} Success status
 */
export async function transferCall(callSid, employeePhone) {
    try {
        const client = getPlivoClient()
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

        await client.calls.transfer(callSid, {
            legs: 'aleg', // Transfer the caller (lead)
            aleg_url: `${baseUrl}/api/webhooks/plivo/transfer?to=${employeePhone}`,
            aleg_method: 'POST'
        })

        console.log('Call transferred:', callSid, 'to', employeePhone)
        return true
    } catch (error) {
        console.error('Plivo transferCall error:', error)
        throw new Error(`Failed to transfer call: ${error.message}`)
    }
}

/**
 * Hang up an ongoing call
 * @param {string} callSid - Call UUID from Plivo
 * @returns {Promise<boolean>} Success status
 */
export async function hangupCall(callSid) {
    try {
        const client = getPlivoClient()

        await client.calls.hangup(callSid)

        console.log('Call hung up:', callSid)
        return true
    } catch (error) {
        console.error('Plivo hangupCall error:', error)
        throw new Error(`Failed to hangup call: ${error.message}`)
    }
}

/**
 * Get call details
 * @param {string} callSid - Call UUID from Plivo
 * @returns {Promise<object>} Call details
 */
export async function getCallDetails(callSid) {
    try {
        const client = getPlivoClient()

        const call = await client.calls.get(callSid)

        return {
            callSid: call.callUuid,
            from: call.fromNumber,
            to: call.toNumber,
            status: call.callStatus,
            duration: call.billDuration,
            direction: call.callDirection,
            endTime: call.endTime
        }
    } catch (error) {
        console.error('Plivo getCallDetails error:', error)
        return null
    }
}

/**
 * Check if Plivo is configured
 * @returns {boolean} Configuration status
 */
export function isPlivoConfigured() {
    return !!(
        process.env.PLIVO_AUTH_ID &&
        process.env.PLIVO_AUTH_TOKEN &&
        process.env.PLIVO_PHONE_NUMBER
    )
}

/**
 * Validate phone number format for India
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Validation result
 */
export function validateIndianPhone(phone) {
    // Indian phone numbers: +91XXXXXXXXXX (10 digits after +91)
    const regex = /^\+91[6-9]\d{9}$/
    return regex.test(phone)
}
