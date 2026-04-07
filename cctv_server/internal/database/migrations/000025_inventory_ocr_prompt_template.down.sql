-- 000025_inventory_ocr_prompt_template.down.sql
-- Rollback de templates de OCR para inventario CCTV

DELETE FROM intelligence.prompt_templates 
WHERE name IN (
    'cctv_inventory_extraction',
    'cctv_camera_list_extraction',
    'cctv_inventory_summary'
);
