-- 1. Create the base Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type text NOT NULL, -- 'rsvp', 'reply', 'mention', 'system'
    actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- who triggered it
    entity_id uuid, -- e.g. the event_id or post_id associated with this notification
    is_read boolean DEFAULT false,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS and create policy
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own notifications' AND tablename = 'notifications') THEN
        CREATE POLICY "Users can view their own notifications" ON notifications
            FOR SELECT TO authenticated USING (recipient_id = auth.uid());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own notifications' AND tablename = 'notifications') THEN
        CREATE POLICY "Users can update their own notifications" ON notifications
            FOR UPDATE TO authenticated USING (recipient_id = auth.uid());
    END IF;
END $$;

-- 2. Trigger for Event RSVPs
CREATE OR REPLACE FUNCTION handle_new_event_rsvp()
RETURNS TRIGGER AS $$
DECLARE
    v_event_creator uuid;
    v_event_title text;
BEGIN
    -- Do not notify if the user is RSVPing to their own event
    SELECT created_by, title INTO v_event_creator, v_event_title 
    FROM events 
    WHERE id = NEW.event_id;

    IF v_event_creator IS NOT NULL AND v_event_creator != NEW.profile_id THEN
        INSERT INTO notifications (recipient_id, type, actor_id, entity_id, metadata)
        VALUES (
            v_event_creator, 
            'rsvp', 
            NEW.profile_id, 
            NEW.event_id, 
            jsonb_build_object('event_title', v_event_title, 'status', NEW.status)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_new_event_rsvp ON event_rsvps;
CREATE TRIGGER on_new_event_rsvp
    AFTER INSERT ON event_rsvps
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_event_rsvp();

-- 3. Trigger for Post Replies (Comments)
CREATE OR REPLACE FUNCTION handle_new_post_comment()
RETURNS TRIGGER AS $$
DECLARE
    v_post_author uuid;
BEGIN
    SELECT submitted_by INTO v_post_author 
    FROM feed_posts 
    WHERE id = NEW.post_id;

    IF v_post_author IS NOT NULL AND v_post_author != NEW.submitted_by THEN
        INSERT INTO notifications (recipient_id, type, actor_id, entity_id)
        VALUES (v_post_author, 'reply', NEW.submitted_by, NEW.post_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_new_post_comment ON feed_comments;
CREATE TRIGGER on_new_post_comment
    AFTER INSERT ON feed_comments
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_post_comment();
