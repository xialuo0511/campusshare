SET @product_info_exists = (
    SELECT COUNT(1)
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'product_info'
);

SET @sql = IF(
    @product_info_exists = 0,
    'SELECT 1',
    IF(
        (
            SELECT COUNT(1)
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'product_info'
              AND COLUMN_NAME = 'title'
        ) = 0,
        'ALTER TABLE product_info ADD COLUMN title VARCHAR(100) NOT NULL DEFAULT '''' COMMENT ''商品标题'' AFTER resource_id',
        'SELECT 1'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    @product_info_exists = 0,
    'SELECT 1',
    IF(
        (
            SELECT COUNT(1)
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'product_info'
              AND COLUMN_NAME = 'description'
        ) = 0,
        'ALTER TABLE product_info ADD COLUMN description VARCHAR(1000) NULL COMMENT ''商品描述'' AFTER trade_location',
        'SELECT 1'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    @product_info_exists = 0,
    'SELECT 1',
    IF(
        (
            SELECT COUNT(1)
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'product_info'
              AND COLUMN_NAME = 'image_file_ids'
        ) = 0,
        'ALTER TABLE product_info ADD COLUMN image_file_ids VARCHAR(500) NULL COMMENT ''图片文件ID列表'' AFTER description',
        'SELECT 1'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    @product_info_exists = 0,
    'SELECT 1',
    'UPDATE product_info SET title = CONCAT(category, '' #'', product_id) WHERE title IS NULL OR title = '''''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
