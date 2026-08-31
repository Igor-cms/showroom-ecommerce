-- Drop the existing SELECT policy that requires authentication
DROP POLICY IF EXISTS "Authenticated users can view vault applications" ON vault_applications;

-- Create new policy allowing anyone to view applications
CREATE POLICY "Anyone can view vault applications"
  ON vault_applications
  FOR SELECT
  USING (true);