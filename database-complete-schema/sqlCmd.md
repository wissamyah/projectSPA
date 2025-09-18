Complete Database Structure Export Commands

  1. All Tables with Columns, Types, and Defaults

  -- Get complete table structure
  SELECT
      t.table_name,
      c.column_name,
      c.data_type,
      c.character_maximum_length,
      c.is_nullable,
      c.column_default
  FROM information_schema.tables t
  JOIN information_schema.columns c
      ON t.table_name = c.table_name
  WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
  ORDER BY t.table_name, c.ordinal_position;

  2. All Constraints (Primary Keys, Foreign Keys, Unique)

  -- Get all constraints
  SELECT
      tc.table_name,
      tc.constraint_name,
      tc.constraint_type,
      kcu.column_name,
      ccu.table_name AS foreign_table,
      ccu.column_name AS foreign_column
  FROM information_schema.table_constraints tc
  LEFT JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
  LEFT JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
  WHERE tc.table_schema = 'public'
  ORDER BY tc.table_name, tc.constraint_type;

  3. All RLS Policies

  -- Get all Row Level Security policies
  SELECT
      tablename,
      policyname,
      permissive,
      roles,
      cmd AS action,
      qual AS using_expression,
      with_check AS check_expression
  FROM pg_policies
  WHERE schemaname = 'public'
  ORDER BY tablename, policyname;

  4. All Functions

  -- Get all custom functions
  SELECT
      p.proname AS function_name,
      pg_get_functiondef(p.oid) AS function_definition
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  ORDER BY p.proname;

  5. All Triggers

  -- Get all triggers
  SELECT
      event_object_table AS table_name,
      trigger_name,
      event_manipulation AS trigger_event,
      action_timing,
      action_statement
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
  ORDER BY event_object_table, trigger_name;

  6. All Indexes

  -- Get all indexes
  SELECT
      tablename,
      indexname,
      indexdef
  FROM pg_indexes
  WHERE schemaname = 'public'
  ORDER BY tablename, indexname;

  7. One Combined Query for Everything

  -- Combined overview (run each section separately for clarity)
  WITH table_info AS (
      SELECT
          'TABLE: ' || t.table_name || ' (' ||
          STRING_AGG(
              c.column_name || ' ' || c.data_type ||
              CASE WHEN c.is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END,
              ', ' ORDER BY c.ordinal_position
          ) || ')' AS structure
      FROM information_schema.tables t
      JOIN information_schema.columns c ON t.table_name = c.table_name
      WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
      GROUP BY t.table_name
  )
  SELECT structure FROM table_info
  ORDER BY structure;

  8. Check RLS Status on Tables

  -- Check which tables have RLS enabled
  SELECT
      schemaname,
      tablename,
      rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;

  Run these queries in sequence in your Supabase SQL Editor to get a complete picture of your database structure that you can share with other developers.


  # 1. Install as dev dependency in your project
  npm install --save-dev supabase

  # 2. Login
  npx supabase login

  # 3. Initialize
  npx supabase init

  # 4. Link to remote project
  npx supabase link --project-ref your-project-ref

  # 5. Check status
  npx supabase status

  # 6. Run functions commands
  npx supabase functions list
  npx supabase functions describe send-email
  npx supabase functions download send-email
