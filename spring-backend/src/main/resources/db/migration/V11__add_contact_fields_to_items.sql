-- Add contact information fields to items table
ALTER TABLE items ADD COLUMN contact_phone VARCHAR(50) DEFAULT NULL;
ALTER TABLE items ADD COLUMN contact_email VARCHAR(255) DEFAULT NULL;

-- Add indexes for contact fields to improve query performance
CREATE INDEX idx_items_contact_phone ON items(contact_phone);
CREATE INDEX idx_items_contact_email ON items(contact_email);