-- Add sample data for demonstration

-- Add sample user
INSERT IGNORE INTO users (username, email, password, first_name, last_name, phone, role, created_at) VALUES 
('demo_user', 'demo@recovr.com', '$2a$10$kgycQa9RbtLBmto2nsQivuxqUxqIExGTW0nxUCQF29vkNtxb.Dboy', 'Demo', 'User', '+1234567890', 'USER', NOW());

-- Link demo user with user role
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id 
FROM users u, roles r 
WHERE u.username = 'demo_user' AND r.name = 'ROLE_USER';

-- Add sample items
INSERT IGNORE INTO items (id, name, description, category, status, location, latitude, longitude, image_url, reported_by_id, reported_at, created_at, updated_at) VALUES 
(1, 'Black Laptop', 'MacBook Pro 13-inch with charger, found in Library', 'ELECTRONICS', 'FOUND', 'Main Library - Study Area B', 40.7831, -73.9712, '/placeholder.svg', 1, NOW(), NOW(), NOW()),
(2, 'Blue Backpack', 'Large blue backpack with books and notebooks inside', 'BAGS', 'FOUND', 'Student Center - 2nd Floor', 40.7829, -73.9713, '/placeholder.svg', 1, NOW(), NOW(), NOW()),
(3, 'iPhone 14', 'White iPhone 14 with blue case, cracked screen', 'ELECTRONICS', 'FOUND', 'Cafeteria - Near Entrance', 40.7833, -73.9710, '/placeholder.svg', 1, NOW(), NOW(), NOW()),
(4, 'Red Wallet', 'Leather wallet with ID cards visible', 'ACCESSORIES', 'FOUND', 'Gym - Locker Room', 40.7825, -73.9715, '/placeholder.svg', 1, NOW(), NOW(), NOW()),
(5, 'Golden Watch', 'Expensive-looking gold watch, possibly Rolex', 'JEWELRY', 'FOUND', 'Parking Lot C - Level 2', 40.7820, -73.9720, '/placeholder.svg', 1, NOW(), NOW(), NOW()),
(6, 'Keys with Keychain', 'Car keys with Honda logo and house keys', 'KEYS', 'FOUND', 'Main Entrance Hall', 40.7835, -73.9708, '/placeholder.svg', 1, NOW(), NOW(), NOW()),
(7, 'Purple Umbrella', 'Compact purple umbrella, automatic open/close', 'ACCESSORIES', 'FOUND', 'Bus Stop Area', 40.7828, -73.9714, '/placeholder.svg', 1, NOW(), NOW(), NOW()),
(8, 'Textbook: Calculus', 'Mathematics textbook with notes and highlighting', 'BOOKS', 'FOUND', 'Lecture Hall 101', 40.7832, -73.9711, '/placeholder.svg', 1, NOW(), NOW(), NOW()),
(9, 'Wireless Headphones', 'Sony WH-1000XM4 noise-canceling headphones', 'ELECTRONICS', 'FOUND', 'Computer Lab - Room 205', 40.7830, -73.9712, '/placeholder.svg', 1, NOW(), NOW(), NOW()),
(10, 'Student ID Card', 'University student ID for John Smith', 'DOCUMENTS', 'FOUND', 'Library - Information Desk', 40.7831, -73.9712, '/placeholder.svg', 1, NOW(), NOW(), NOW());

-- Add sample detection sessions
INSERT IGNORE INTO detection_sessions (id, session_id, camera_id, camera_location, model_version, start_time, is_active, confidence_threshold, total_detections, abandoned_objects_count, created_at, updated_at) VALUES 
(1, 'session_001', 'cam_01', 'Main Entrance', 'yolov8n', NOW() - INTERVAL 2 HOUR, false, 0.6, 15, 3, NOW() - INTERVAL 2 HOUR, NOW()),
(2, 'session_002', 'cam_02', 'Library', 'yolov8n', NOW() - INTERVAL 1 HOUR, true, 0.7, 8, 1, NOW() - INTERVAL 1 HOUR, NOW()),
(3, 'session_003', 'cam_03', 'Cafeteria', 'yolov8n', NOW() - INTERVAL 30 MINUTE, true, 0.6, 5, 2, NOW() - INTERVAL 30 MINUTE, NOW());

-- Add sample detected objects
INSERT IGNORE INTO detected_objects (id, tracking_id, category, confidence_score, first_detected, last_seen, stationary_duration, is_abandoned, abandon_threshold, camera_location, bounding_box_x, bounding_box_y, bounding_box_width, bounding_box_height, snapshot_url, frame_timestamp, status, detection_session_id, linked_item_id, created_at, updated_at) VALUES 
(1, 'obj_001', 'BAGS', 0.92, NOW() - INTERVAL 2 HOUR, NOW() - INTERVAL 1 HOUR, 3600, true, 1800, 'Main Entrance', 120, 150, 100, 120, '/placeholder.svg', NOW() - INTERVAL 2 HOUR, 'ABANDONED', 1, 2, NOW() - INTERVAL 2 HOUR, NOW()),
(2, 'obj_002', 'ELECTRONICS', 0.88, NOW() - INTERVAL 1 HOUR, NOW() - INTERVAL 30 MINUTE, 1800, true, 1800, 'Library', 320, 220, 80, 60, '/placeholder.svg', NOW() - INTERVAL 1 HOUR, 'ABANDONED', 2, 1, NOW() - INTERVAL 1 HOUR, NOW()),
(3, 'obj_003', 'KEYS', 0.75, NOW() - INTERVAL 30 MINUTE, NOW() - INTERVAL 10 MINUTE, 1200, false, 1800, 'Cafeteria', 450, 180, 40, 30, '/placeholder.svg', NOW() - INTERVAL 30 MINUTE, 'TRACKING', 3, 6, NOW() - INTERVAL 30 MINUTE, NOW());