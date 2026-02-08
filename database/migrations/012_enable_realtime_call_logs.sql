-- Enable Supabase Realtime on calling tables
-- This migration enables real-time subscriptions for the live call monitor

-- Enable realtime on call_logs table
ALTER PUBLICATION supabase_realtime ADD TABLE call_logs;

-- Enable realtime on call_queue table
ALTER PUBLICATION supabase_realtime ADD TABLE call_queue;

-- Enable realtime on campaigns table (for live metrics)
ALTER PUBLICATION supabase_realtime ADD TABLE campaigns;

-- Enable realtime on agent_calls table (for agent availability)
ALTER PUBLICATION supabase_realtime ADD TABLE agent_calls;
