import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request, { params }) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { outcome, notes, sentiment_score, interest_level, objections } = body;

    // Update agent_calls record
    const { data, error } = await supabase
        .from('agent_calls')
        .update({
            ended_at: new Date().toISOString(),
            outcome,
            agent_notes: notes,
            sentiment_score,
            interest_level,
            objections: objections || []
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }

    // Auto-create follow-up task if needed
    if (outcome === 'interested' || outcome === 'callback') {
        const dueDate = new Date();
        dueDate.setHours(dueDate.getHours() + (interest_level === 'high' ? 2 : 24));

        await supabase.from('follow_up_tasks').insert({
            organization_id: data.organization_id,
            lead_id: data.lead_id,
            campaign_id: data.campaign_id,
            assigned_to: user.id,
            task_type: 'call',
            title: `Follow up with lead`,
            priority: interest_level === 'high' ? 'urgent' : 'high',
            due_date: dueDate.toISOString(),
            context: `Agent call outcome: ${outcome}`,
            ai_suggestion: notes,
            source: 'ai_auto'
        });
    }

    return Response.json({ success: true, data });
}
