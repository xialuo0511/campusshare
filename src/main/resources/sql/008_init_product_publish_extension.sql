ALTER TABLE product_info
    ADD COLUMN IF NOT EXISTS title VARCHAR(100) NOT NULL DEFAULT '' COMMENT '商品标题' AFTER resource_id,
    ADD COLUMN IF NOT EXISTS description VARCHAR(1000) NULL COMMENT '商品描述' AFTER trade_location,
    ADD COLUMN IF NOT EXISTS image_file_ids VARCHAR(500) NULL COMMENT '图片文件ID列表' AFTER description;

UPDATE product_info
SET title = CONCAT(category, ' #', product_id)
WHERE title IS NULL OR title = '';

