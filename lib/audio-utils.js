/**
 * Audio Conversion Utilities
 * Handles conversion between Plivo (μ-law 8kHz) and OpenAI (PCM16 24kHz)
 */

/**
 * Decode μ-law to PCM16
 * @param {Buffer} mulawBuffer - μ-law encoded audio
 * @returns {Buffer} PCM16 audio
 */
export function decodeMulaw(mulawBuffer) {
    const MULAW_BIAS = 0x84
    const MULAW_MAX = 0x1FFF

    const pcmBuffer = Buffer.alloc(mulawBuffer.length * 2)

    for (let i = 0; i < mulawBuffer.length; i++) {
        let mulaw = mulawBuffer[i]
        mulaw = ~mulaw

        const sign = mulaw & 0x80
        const exponent = (mulaw >> 4) & 0x07
        const mantissa = mulaw & 0x0F

        let sample = mantissa << (exponent + 3)
        sample += MULAW_BIAS << exponent

        if (exponent === 0) sample += MULAW_BIAS
        if (sign !== 0) sample = -sample

        // Clamp to 16-bit range
        sample = Math.max(-32768, Math.min(32767, sample))

        pcmBuffer.writeInt16LE(sample, i * 2)
    }

    return pcmBuffer
}

/**
 * Encode PCM16 to μ-law
 * @param {Buffer} pcmBuffer - PCM16 audio
 * @returns {Buffer} μ-law encoded audio
 */
export function encodeMulaw(pcmBuffer) {
    const MULAW_MAX = 0x1FFF
    const MULAW_BIAS = 0x84

    const mulawBuffer = Buffer.alloc(pcmBuffer.length / 2)

    for (let i = 0; i < pcmBuffer.length; i += 2) {
        let sample = pcmBuffer.readInt16LE(i)

        const sign = sample < 0 ? 0x80 : 0x00
        if (sign) sample = -sample

        sample += MULAW_BIAS
        if (sample > MULAW_MAX) sample = MULAW_MAX

        let exponent = 7
        for (let exp = 0; exp < 8; exp++) {
            if (sample <= (0xFF << exp)) {
                exponent = exp
                break
            }
        }

        const mantissa = (sample >> (exponent + 3)) & 0x0F
        const mulaw = ~(sign | (exponent << 4) | mantissa)

        mulawBuffer[i / 2] = mulaw & 0xFF
    }

    return mulawBuffer
}

/**
 * Resample audio from one sample rate to another
 * @param {Buffer} inputBuffer - Input PCM16 audio
 * @param {number} inputRate - Input sample rate (Hz)
 * @param {number} outputRate - Output sample rate (Hz)
 * @returns {Buffer} Resampled PCM16 audio
 */
export function resample(inputBuffer, inputRate, outputRate) {
    const inputSamples = inputBuffer.length / 2
    const outputSamples = Math.floor(inputSamples * outputRate / inputRate)
    const outputBuffer = Buffer.alloc(outputSamples * 2)

    const ratio = inputRate / outputRate

    for (let i = 0; i < outputSamples; i++) {
        const srcIndex = i * ratio
        const srcIndexFloor = Math.floor(srcIndex)
        const srcIndexCeil = Math.min(srcIndexFloor + 1, inputSamples - 1)
        const fraction = srcIndex - srcIndexFloor

        const sample1 = inputBuffer.readInt16LE(srcIndexFloor * 2)
        const sample2 = inputBuffer.readInt16LE(srcIndexCeil * 2)

        // Linear interpolation
        const interpolated = Math.round(sample1 + (sample2 - sample1) * fraction)

        outputBuffer.writeInt16LE(interpolated, i * 2)
    }

    return outputBuffer
}

/**
 * Convert Plivo audio (μ-law 8kHz) to OpenAI format (PCM16 24kHz)
 * @param {Buffer} plivoBuffer - Plivo audio buffer
 * @returns {Buffer} OpenAI-compatible audio buffer
 */
export function convertPlivoToOpenAI(plivoBuffer) {
    // Step 1: Decode μ-law to PCM16
    const pcm8k = decodeMulaw(plivoBuffer)

    // Step 2: Resample from 8kHz to 24kHz
    const pcm24k = resample(pcm8k, 8000, 24000)

    return pcm24k
}

/**
 * Convert OpenAI audio (PCM16 24kHz) to Plivo format (μ-law 8kHz)
 * @param {Buffer} openaiBuffer - OpenAI audio buffer
 * @returns {Buffer} Plivo-compatible audio buffer
 */
export function convertOpenAIToPlivo(openaiBuffer) {
    // Step 1: Resample from 24kHz to 8kHz
    const pcm8k = resample(openaiBuffer, 24000, 8000)

    // Step 2: Encode PCM16 to μ-law
    const mulaw = encodeMulaw(pcm8k)

    return mulaw
}

/**
 * Convert base64 audio to Buffer
 * @param {string} base64Audio - Base64 encoded audio
 * @returns {Buffer} Audio buffer
 */
export function base64ToBuffer(base64Audio) {
    return Buffer.from(base64Audio, 'base64')
}

/**
 * Convert Buffer to base64
 * @param {Buffer} buffer - Audio buffer
 * @returns {string} Base64 encoded audio
 */
export function bufferToBase64(buffer) {
    return buffer.toString('base64')
}
