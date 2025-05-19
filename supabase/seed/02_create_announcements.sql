-- Create sample announcements
INSERT INTO communications (id, title, content, priority, category, is_published, published_at, expires_at, created_by, created_at, updated_at)
VALUES
  -- Urgent announcement
  (
    '11111111-1111-1111-1111-111111111111',
    'URGENT: Security Protocol Updates',
    'All personnel are required to update their security protocols immediately. New guidelines have been issued by Command and must be implemented by end of day. Failure to comply may result in security access restrictions. Details can be found in the attached security bulletin.',
    'urgent',
    'Security',
    true,
    NOW(),
    NOW() + INTERVAL '30 days',
    'd8f39eaf-8b77-4e5a-93a4-11980e857611',
    NOW(),
    NOW()
  ),
  
  -- High priority announcement
  (
    '22222222-2222-2222-2222-222222222222',
    'Training Exercise Schedule Changes',
    'The upcoming training exercises scheduled for next week have been modified. Please review the attached schedule for your unit''s updated time slots. All personnel must confirm attendance through the standard channels by tomorrow at 1800 hours.',
    'high',
    'Training',
    true,
    NOW() - INTERVAL '2 days',
    NOW() + INTERVAL '14 days',
    'd8f39eaf-8b77-4e5a-93a4-11980e857611',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  ),
  
  -- Normal priority announcement
  (
    '33333333-3333-3333-3333-333333333333',
    'Monthly Equipment Maintenance Reminder',
    'This is your monthly reminder to complete all required equipment maintenance checks as specified in Regulation 7-42. Documentation must be submitted through the appropriate channels by the end of the month. Contact the logistics office if you require additional supplies or support.',
    'normal',
    'Maintenance',
    true,
    NOW() - INTERVAL '5 days',
    NOW() + INTERVAL '25 days',
    'd8f39eaf-8b77-4e5a-93a4-11980e857611',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days'
  ),
  
  -- Low priority announcement
  (
    '44444444-4444-4444-4444-444444444444',
    'Base Recreation Facilities Updates',
    'The base recreation center will be upgrading its facilities next month. New fitness equipment and expanded hours will be available starting from the 15th. Sign up sheets for the new classes will be posted in the main hall next week.',
    'low',
    'Facilities',
    true,
    NOW() - INTERVAL '7 days',
    NOW() + INTERVAL '60 days',
    'd8f39eaf-8b77-4e5a-93a4-11980e857611',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days'
  ),
  
  -- Draft announcement (not published)
  (
    '55555555-5555-5555-5555-555555555555',
    '[DRAFT] Upcoming Inspection Notice',
    'There will be an inspection of all units on the 25th of next month. Details of the inspection requirements will be provided in a subsequent announcement. This notice is currently in draft form and will be updated with complete information soon.',
    'normal',
    'Administration',
    false,
    NULL,
    NOW() + INTERVAL '90 days',
    'd8f39eaf-8b77-4e5a-93a4-11980e857611',
    NOW(),
    NOW()
  );

-- Create communication recipients (assign all announcements to all users in auth.users)
INSERT INTO communication_recipients (communication_id, user_id, created_at)
SELECT 
  c.id as communication_id,
  u.id as user_id,
  NOW() as created_at
FROM 
  communications c
CROSS JOIN
  auth.users u
WHERE 
  c.is_published = true;

-- Mark some communications as read for certain users
UPDATE communication_recipients
SET read_at = NOW() - INTERVAL '1 day'
WHERE 
  communication_id IN ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333')
  AND user_id = 'd8f39eaf-8b77-4e5a-93a4-11980e857611';

-- Mark some communications as acknowledged for certain users
UPDATE communication_recipients
SET 
  acknowledged_at = NOW() - INTERVAL '12 hours',
  read_at = COALESCE(read_at, NOW() - INTERVAL '1 day')
WHERE 
  communication_id = '33333333-3333-3333-3333-333333333333'
  AND user_id = 'd8f39eaf-8b77-4e5a-93a4-11980e857611';
