-- Drop the existing UPDATE policy that requires authentication
DROP POLICY IF EXISTS "Authenticated users can update vault applications" ON vault_applications;

-- Create new policy allowing anyone to update applications
CREATE POLICY "Anyone can update vault applications"
  ON vault_applications
  FOR UPDATE
  USING (true)
  WITH CHECK (true);