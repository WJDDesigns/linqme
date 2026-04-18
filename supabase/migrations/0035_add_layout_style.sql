-- Add layout_style to partner_forms for controlling client-facing form layout
ALTER TABLE partner_forms
ADD COLUMN layout_style text NOT NULL DEFAULT 'default'
CHECK (layout_style IN ('default', 'top-nav', 'no-nav', 'conversation'));
