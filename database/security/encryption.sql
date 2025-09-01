-- Data Encryption Functions

-- Function to encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_sensitive_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Encrypt password hash if provided
  IF NEW.password_hash IS NOT NULL AND NEW.password_hash != OLD.password_hash THEN
    NEW.password_hash = crypt(NEW.password_hash, gen_salt('bf'));
  END IF;
  
  -- Update timestamp
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply encryption trigger to users table
CREATE TRIGGER encrypt_user_data
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION encrypt_sensitive_data();

-- Function to verify passwords
CREATE OR REPLACE FUNCTION verify_password(email_input TEXT, password_input TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT password_hash INTO stored_hash
  FROM users
  WHERE email = email_input AND is_active = true;
  
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN stored_hash = crypt(password_input, stored_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
