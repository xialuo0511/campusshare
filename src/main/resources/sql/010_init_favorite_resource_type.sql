SET @schema_name = DATABASE();

SELECT COUNT(1)
INTO @has_resource_type
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = @schema_name
  AND TABLE_NAME = 'favorite_info'
  AND COLUMN_NAME = 'resource_type';

SET @add_resource_type_sql = IF(
    @has_resource_type = 0,
    'ALTER TABLE favorite_info ADD COLUMN resource_type VARCHAR(30) NOT NULL DEFAULT ''PRODUCT'' COMMENT ''资源类型'' AFTER resource_id',
    'SELECT 1'
);
PREPARE stmt_add_resource_type FROM @add_resource_type_sql;
EXECUTE stmt_add_resource_type;
DEALLOCATE PREPARE stmt_add_resource_type;

UPDATE favorite_info
SET resource_type = 'PRODUCT'
WHERE resource_type IS NULL
   OR resource_type = '';

SELECT COUNT(1)
INTO @has_old_unique_index
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = @schema_name
  AND TABLE_NAME = 'favorite_info'
  AND INDEX_NAME = 'uk_favorite_user_resource';

SET @drop_old_unique_index_sql = IF(
    @has_old_unique_index > 0,
    'ALTER TABLE favorite_info DROP INDEX uk_favorite_user_resource',
    'SELECT 1'
);
PREPARE stmt_drop_old_unique_index FROM @drop_old_unique_index_sql;
EXECUTE stmt_drop_old_unique_index;
DEALLOCATE PREPARE stmt_drop_old_unique_index;

SELECT COUNT(1)
INTO @has_new_unique_index
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = @schema_name
  AND TABLE_NAME = 'favorite_info'
  AND INDEX_NAME = 'uk_favorite_user_resource_type';

SET @add_new_unique_index_sql = IF(
    @has_new_unique_index = 0,
    'ALTER TABLE favorite_info ADD UNIQUE KEY uk_favorite_user_resource_type (user_id, resource_type, resource_id)',
    'SELECT 1'
);
PREPARE stmt_add_new_unique_index FROM @add_new_unique_index_sql;
EXECUTE stmt_add_new_unique_index;
DEALLOCATE PREPARE stmt_add_new_unique_index;

SELECT COUNT(1)
INTO @has_resource_type_index
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = @schema_name
  AND TABLE_NAME = 'favorite_info'
  AND INDEX_NAME = 'idx_favorite_resource_type';

SET @add_resource_type_index_sql = IF(
    @has_resource_type_index = 0,
    'ALTER TABLE favorite_info ADD KEY idx_favorite_resource_type (resource_type)',
    'SELECT 1'
);
PREPARE stmt_add_resource_type_index FROM @add_resource_type_index_sql;
EXECUTE stmt_add_resource_type_index;
DEALLOCATE PREPARE stmt_add_resource_type_index;
