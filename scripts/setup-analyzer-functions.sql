-- Helper function to execute raw SQL queries
-- This is needed for the analyze-database.js script

CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || query || ') t' INTO result;
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;

-- Helper function to get all tables
CREATE OR REPLACE FUNCTION get_all_tables()
RETURNS TABLE(table_name text, table_schema text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    t.table_name::text,
    t.table_schema::text
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  ORDER BY t.table_name;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_all_tables() TO authenticated;
