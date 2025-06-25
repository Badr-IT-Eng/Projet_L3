-- Add latitude and longitude columns to items table for map functionality
ALTER TABLE items ADD COLUMN latitude DOUBLE DEFAULT NULL;
ALTER TABLE items ADD COLUMN longitude DOUBLE DEFAULT NULL;

-- Add indexes for better performance when querying by coordinates
CREATE INDEX idx_items_latitude ON items(latitude);
CREATE INDEX idx_items_longitude ON items(longitude);
CREATE INDEX idx_items_coordinates ON items(latitude, longitude);

-- Set default coordinates for existing items (Marseille, France)
UPDATE items SET 
    latitude = 43.2965,
    longitude = 5.3698 
WHERE latitude IS NULL AND longitude IS NULL;