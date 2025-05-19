-- Assign admin role to Jospen Wolongwo through the user_roles join table

-- First, get the admin role ID
DO $$
DECLARE
  admin_role_id uuid;
BEGIN
  -- Get the admin role ID
  SELECT id INTO admin_role_id FROM public.roles WHERE name = 'admin';
  
  -- Insert into user_roles join table (if not exists)
  INSERT INTO public.user_roles (user_id, role_id)
  VALUES ('d8f39eaf-8b77-4e5a-93a4-11980e857611', admin_role_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;
  
  RAISE NOTICE 'Admin role assigned to user Jospen Wolongwo';
END
$$;
