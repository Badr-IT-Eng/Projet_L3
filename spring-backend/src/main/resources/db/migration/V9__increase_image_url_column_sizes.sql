-- Migration to increase column sizes for base64 image URLs
-- Base64 encoded images can be very large (several MB), so we need LONGTEXT

-- Update items table to support large base64 images
ALTER TABLE items MODIFY COLUMN image_url LONGTEXT;

-- Update detected_objects table to support large base64 snapshot images  
ALTER TABLE detected_objects MODIFY COLUMN snapshot_url LONGTEXT;

-- Update search_requests table to support large base64 search images
ALTER TABLE search_requests MODIFY COLUMN search_image_url LONGTEXT;

-- Update users table to support large base64 avatar images
ALTER TABLE users MODIFY COLUMN avatar_url LONGTEXT;

-- Add index on items.category for faster queries (optional optimization)
CREATE INDEX idx_items_category ON items(category);

-- Add index on detected_objects.category for faster queries (optional optimization)  
CREATE INDEX idx_detected_objects_category ON detected_objects(category);

-- Add index on detected_objects.tracking_id for faster lookups (optional optimization)
CREATE INDEX idx_detected_objects_tracking_id ON detected_objects(tracking_id);