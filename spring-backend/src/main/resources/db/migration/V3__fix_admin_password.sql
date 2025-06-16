-- Fix admin password with valid BCrypt hash
-- Password: admin123
-- Hash: $2a$10$kgycQa9RbtLBmto2nsQivuxqUxqIExGTW0nxUCQF29vkNtxb.Dboy

UPDATE users 
SET password = '$2a$10$kgycQa9RbtLBmto2nsQivuxqUxqIExGTW0nxUCQF29vkNtxb.Dboy',
    first_name = 'Admin', 
    last_name = 'User'
WHERE username = 'admin';