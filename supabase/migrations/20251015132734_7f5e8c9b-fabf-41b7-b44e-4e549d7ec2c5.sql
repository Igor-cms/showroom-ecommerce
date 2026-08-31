-- Drop unused docouments table that has RLS enabled but no policies
-- This table is not referenced anywhere in the codebase and causes security warnings
DROP TABLE IF EXISTS public.docouments CASCADE;