-- Migration: Allow anonymous (non-authenticated) waitlist signups
-- user_id was already nullable in the original CREATE TABLE (no NOT NULL constraint)
-- We add a UNIQUE constraint on email so anonymous signups can be deduped by email

ALTER TABLE subscription_waitlist
  ADD CONSTRAINT subscription_waitlist_email_key UNIQUE (email);

-- Allow anonymous users to join waitlist by email (user_id must be NULL for anon inserts)
-- Authenticated users already have policies that allow their own inserts
CREATE POLICY "Anyone can join waitlist anonymously"
  ON subscription_waitlist FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);
