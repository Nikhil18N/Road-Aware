-- SQL to fix the "Database error saving new user" issue

-- 1. Drop the existing trigger to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Drop the existing function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Recreate the function with proper error handling and search_path
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  extracted_role public.user_role;
BEGIN
  -- Default to 'user' if role is missing or invalid
  BEGIN
    IF new.raw_user_meta_data->>'role' IS NULL THEN
      extracted_role := 'user'::public.user_role;
    ELSE
      extracted_role := (new.raw_user_meta_data->>'role')::public.user_role;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If casting fails (e.g. invalid enum value), fallback to 'user'
    extracted_role := 'user'::public.user_role;
  END;
  
  -- Insert into profiles table
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    extracted_role
  );
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Ensure the profiles table has necessary policies (idempotent)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Public profiles are viewable by everyone') THEN
        CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;