-- Données initiales pour test système RECOVR

-- Utilisateur de démonstration
INSERT IGNORE INTO users (username, email, password, first_name, last_name, phone, role, created_at) VALUES 
('user_test', 'contact@systeme-recovr.local', '$2a$10$kgycQa9RbtLBmto2nsQivuxqUxqIExGTW0nxUCQF29vkNtxb.Dboy', 'Utilisateur', 'Test', '+33123456789', 'USER', NOW());

-- Association rôle utilisateur
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id 
FROM users u, roles r 
WHERE u.username = 'user_test' AND r.name = 'ROLE_USER';

-- Objets test du système
INSERT IGNORE INTO items (id, name, description, category, status, location, latitude, longitude, image_url, reported_by_id, reported_at, created_at, updated_at) VALUES 
(1, 'Ordinateur Portable', 'Appareil informatique avec chargeur, trouvé espace étude', 'ELECTRONICS', 'FOUND', 'Bibliothèque Centrale - Zone B', 48.8566, 2.3522, '/uploads/test-laptop.svg', 1, NOW(), NOW(), NOW()),
(2, 'Sac Bleu', 'Cartable contenant documents et matériel scolaire', 'BAGS', 'FOUND', 'Centre Étudiant - 2ème étage', 48.8567, 2.3523, '/uploads/test-bag.svg', 1, NOW(), NOW(), NOW()),
(3, 'Téléphone Mobile', 'Smartphone avec coque protectrice', 'ELECTRONICS', 'FOUND', 'Cafétéria - Entrée principale', 48.8568, 2.3521, '/uploads/test-phone.svg', 1, NOW(), NOW(), NOW()),
(4, 'Portefeuille Rouge', 'Porte-monnaie en cuir avec documents', 'ACCESSORIES', 'FOUND', 'Salle de sport - Vestiaires', 48.8565, 2.3524, '/uploads/test-wallet.svg', 1, NOW(), NOW(), NOW()),
(5, 'Montre Dorée', 'Accessoire de poignet métallique', 'JEWELRY', 'FOUND', 'Parking C - Niveau 2', 48.8564, 2.3525, '/uploads/test-watch.svg', 1, NOW(), NOW(), NOW()),
(6, 'Trousseau de Clés', 'Clés véhicule et habitation avec porte-clés', 'KEYS', 'FOUND', 'Hall d\'entrée principal', 48.8569, 2.3520, '/uploads/test-keys.svg', 1, NOW(), NOW(), NOW()),
(7, 'Parapluie Violet', 'Parapluie compact automatique', 'ACCESSORIES', 'FOUND', 'Arrêt de bus campus', 48.8567, 2.3523, '/uploads/test-umbrella.svg', 1, NOW(), NOW(), NOW()),
(8, 'Manuel Mathématiques', 'Livre de cours avec annotations personnelles', 'BOOKS', 'FOUND', 'Amphithéâtre 101', 48.8568, 2.3521, '/uploads/test-book.svg', 1, NOW(), NOW(), NOW()),
(9, 'Casque Audio', 'Équipement audio sans fil avec réduction de bruit', 'ELECTRONICS', 'FOUND', 'Salle informatique - 205', 48.8567, 2.3522, '/uploads/test-headphones.svg', 1, NOW(), NOW(), NOW()),
(10, 'Carte Étudiant', 'Document d\'identification universitaire', 'DOCUMENTS', 'FOUND', 'Accueil bibliothèque', 48.8566, 2.3522, '/uploads/test-id.svg', 1, NOW(), NOW(), NOW());

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