-- WAC Private Beta: Pre-Flight Wipe Script
-- ---------------------------------------------------------
-- Description: 
-- This script safely zeroes out all user-generated interaction
-- data (posts, replies, RSVPs, notifications). 
-- 
-- It specifically PRESERVES your profiles, registered businesses, 
-- organizations, and master events so that your community 
-- structure remains perfectly intact for beta testers.
-- ---------------------------------------------------------

BEGIN;

-- 1. Wipe Trust & Safety logs
TRUNCATE TABLE reported_content CASCADE;

-- 2. Wipe Social Feedback/Alerts
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE feed_likes CASCADE;
TRUNCATE TABLE feed_comments CASCADE;

-- 3. Wipe Event Participation state
TRUNCATE TABLE event_rsvps CASCADE;
TRUNCATE TABLE event_questions CASCADE;

-- 4. Wipe Content
TRUNCATE TABLE feed_media CASCADE;
TRUNCATE TABLE feed_posts CASCADE;

-- ---------------------------------------------------------
-- OPTIONAL TEARDOWN (Uncomment if needed)
-- ---------------------------------------------------------
-- If you want to force all beta testers to re-send connection requests:
-- TRUNCATE TABLE connection_requests CASCADE;

-- If you want to delete all pending invites to businesses/orgs:
-- TRUNCATE TABLE entity_invites CASCADE;

COMMIT;
