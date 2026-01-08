/**
 * OpenAI Voice Service
 * Handles AI conversation instructions and voice configuration
 */

/**
 * Create AI conversation instructions for a call
 * @param {object} campaign - Campaign details
 * @param {object} lead - Lead details
 * @param {object} organization - Organization details
 * @returns {string} AI instructions
 */
export function createVoiceInstructions(campaign, lead, organization) {
    const script = campaign.ai_script || `
Hello, this is an AI assistant calling from ${organization.name}.
I'm reaching out to ${lead.name} regarding our services.
Are you interested in learning more?
  `.trim()

    return `
You are an AI sales assistant calling on behalf of ${organization.name}.

LEAD INFORMATION:
- Name: ${lead.name}
- Email: ${lead.email || 'Not provided'}
- Phone: ${lead.phone}
- Project: ${campaign.project_name || 'General inquiry'}

YOUR SCRIPT:
${script}

INSTRUCTIONS:
1. Be professional, friendly, and conversational
2. Speak in ${campaign.ai_language === 'hi-IN' ? 'Hindi' : 'English'}
3. Use natural pauses and intonation
4. Listen carefully to the lead's responses
5. If the lead shows interest, call the transfer_to_human function
6. If the lead is not interested, politely thank them and end the call
7. Keep the conversation under 1 minute
8. Do NOT be pushy or aggressive
9. Respect if they ask to be removed from the list

AVAILABLE FUNCTIONS:
- transfer_to_human(): Transfer interested lead to a human employee
- end_call(): End the conversation politely

COMPLIANCE:
- This call is being recorded for quality purposes
- The lead has consented to being contacted
- Follow TRAI guidelines for telemarketing
`.trim()
}

/**
 * Get OpenAI voice configuration
 * @param {string} voiceName - Voice name from campaign (alloy, echo, fable, onyx, nova, shimmer)
 * @returns {object} Voice configuration
 */
export function getVoiceConfig(voiceName = 'alloy') {
    const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']
    const voice = validVoices.includes(voiceName) ? voiceName : 'alloy'

    return {
        voice,
        model: 'gpt-4o-realtime-preview',
        modalities: ['text', 'audio'],
        instructions: '', // Will be set per call
        temperature: 0.8,
        max_response_output_tokens: 4096,
    }
}

/**
 * Create function definitions for OpenAI
 * @returns {array} Function definitions
 */
export function getAIFunctions() {
    return [
        {
            name: 'transfer_to_human',
            description: 'Transfer the call to a human employee when the lead shows interest or requests to speak with someone',
            parameters: {
                type: 'object',
                properties: {
                    reason: {
                        type: 'string',
                        description: 'Brief reason for transfer (e.g., "Lead wants more information", "Ready to purchase")'
                    }
                },
                required: ['reason']
            }
        },
        {
            name: 'end_call',
            description: 'End the call politely when the conversation is complete or lead is not interested',
            parameters: {
                type: 'object',
                properties: {
                    reason: {
                        type: 'string',
                        description: 'Brief reason for ending (e.g., "Not interested", "Wrong number", "Call back later")'
                    }
                },
                required: ['reason']
            }
        }
    ]
}

/**
 * Parse AI function call and determine action
 * @param {object} functionCall - Function call from OpenAI
 * @returns {object} Action to take
 */
export function parseAIFunction(functionCall) {
    const { name, arguments: args } = functionCall
    const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args

    switch (name) {
        case 'transfer_to_human':
            return {
                action: 'transfer',
                reason: parsedArgs.reason || 'Lead requested transfer'
            }

        case 'end_call':
            return {
                action: 'hangup',
                reason: parsedArgs.reason || 'Call completed'
            }

        default:
            return {
                action: 'continue',
                reason: 'Unknown function'
            }
    }
}

/**
 * Check if OpenAI is configured
 * @returns {boolean} Configuration status
 */
export function isOpenAIConfigured() {
    return !!process.env.OPENAI_API_KEY
}

/**
 * Get greeting message based on language
 * @param {string} language - Language code (en-IN, hi-IN)
 * @param {string} leadName - Lead's name
 * @returns {string} Greeting message
 */
export function getGreeting(language, leadName) {
    if (language === 'hi-IN') {
        return `नमस्ते ${leadName}, मैं एक AI सहायक हूं।`
    }
    return `Hello ${leadName}, this is an AI assistant.`
}

/**
 * Get closing message based on language
 * @param {string} language - Language code
 * @returns {string} Closing message
 */
export function getClosing(language) {
    if (language === 'hi-IN') {
        return 'धन्यवाद। अच्छा दिन हो।'
    }
    return 'Thank you for your time. Have a great day.'
}
