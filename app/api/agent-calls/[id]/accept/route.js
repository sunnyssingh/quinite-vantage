import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request, { params }) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Update agent_calls record
    const { data, error } = await supabase
        .from('agent_calls')
        .update({
            agent_id: user.id,
            outcome: 'in_progress',
            started_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*, lead:leads(*), campaign:campaigns(*)')
        .single();

    if (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, data });
}
