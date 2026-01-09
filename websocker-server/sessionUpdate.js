export const createSessionUpdate = (lead, campaign) => {
    return {
        type: "session.update",
        session: {
            turn_detection: {
                type: "server_vad",
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 500
            },
            input_audio_format: "g711_ulaw",
            output_audio_format: "g711_ulaw",
            modalities: ["text", "audio"],
            temperature: 0.8,
            instructions: campaign?.ai_script || `You are a helpful and friendly AI assistant calling on behalf of ${campaign?.organization?.name || 'our company'}. You are speaking with ${lead?.name || 'the customer'}. Be professional, friendly, and concise.`,
            voice: campaign?.ai_voice || 'alloy'
        }
    };
};

export const SessionUpdate = {
    type: "session.update",
    session: {
        turn_detection: {
            type: "server_vad",
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500
        },
        input_audio_format: "g711_ulaw",
        output_audio_format: "g711_ulaw",
        modalities: ["text", "audio"],
        temperature: 0.8,
        instructions: 'You are a helpful and friendly AI assistant.',
        voice: 'alloy'
    }
};
