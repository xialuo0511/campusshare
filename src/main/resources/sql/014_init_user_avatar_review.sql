SET @schema_name = DATABASE();

SELECT COUNT(1) INTO @has_avatar_url
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = @schema_name
  AND TABLE_NAME = 'user_info'
  AND COLUMN_NAME = 'avatar_url';
SET @add_avatar_url_sql = IF(
    @has_avatar_url = 0,
    'ALTER TABLE user_info ADD COLUMN avatar_url LONGTEXT NULL COMMENT ''已审核头像'' AFTER point_balance',
    'SELECT 1'
);
PREPARE stmt_add_avatar_url FROM @add_avatar_url_sql;
EXECUTE stmt_add_avatar_url;
DEALLOCATE PREPARE stmt_add_avatar_url;

SELECT COUNT(1) INTO @has_pending_avatar_url
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = @schema_name
  AND TABLE_NAME = 'user_info'
  AND COLUMN_NAME = 'pending_avatar_url';
SET @add_pending_avatar_url_sql = IF(
    @has_pending_avatar_url = 0,
    'ALTER TABLE user_info ADD COLUMN pending_avatar_url LONGTEXT NULL COMMENT ''待审核头像'' AFTER avatar_url',
    'SELECT 1'
);
PREPARE stmt_add_pending_avatar_url FROM @add_pending_avatar_url_sql;
EXECUTE stmt_add_pending_avatar_url;
DEALLOCATE PREPARE stmt_add_pending_avatar_url;

SELECT COUNT(1) INTO @has_avatar_review_status
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = @schema_name
  AND TABLE_NAME = 'user_info'
  AND COLUMN_NAME = 'avatar_review_status';
SET @add_avatar_review_status_sql = IF(
    @has_avatar_review_status = 0,
    'ALTER TABLE user_info ADD COLUMN avatar_review_status VARCHAR(30) NULL COMMENT ''头像审核状态'' AFTER pending_avatar_url',
    'SELECT 1'
);
PREPARE stmt_add_avatar_review_status FROM @add_avatar_review_status_sql;
EXECUTE stmt_add_avatar_review_status;
DEALLOCATE PREPARE stmt_add_avatar_review_status;

SELECT COUNT(1) INTO @has_avatar_review_remark
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = @schema_name
  AND TABLE_NAME = 'user_info'
  AND COLUMN_NAME = 'avatar_review_remark';
SET @add_avatar_review_remark_sql = IF(
    @has_avatar_review_remark = 0,
    'ALTER TABLE user_info ADD COLUMN avatar_review_remark VARCHAR(200) NULL COMMENT ''头像审核备注'' AFTER avatar_review_status',
    'SELECT 1'
);
PREPARE stmt_add_avatar_review_remark FROM @add_avatar_review_remark_sql;
EXECUTE stmt_add_avatar_review_remark;
DEALLOCATE PREPARE stmt_add_avatar_review_remark;

SELECT COUNT(1) INTO @has_avatar_review_submit_time
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = @schema_name
  AND TABLE_NAME = 'user_info'
  AND COLUMN_NAME = 'avatar_review_submit_time';
SET @add_avatar_review_submit_time_sql = IF(
    @has_avatar_review_submit_time = 0,
    'ALTER TABLE user_info ADD COLUMN avatar_review_submit_time DATETIME NULL COMMENT ''头像提交时间'' AFTER avatar_review_remark',
    'SELECT 1'
);
PREPARE stmt_add_avatar_review_submit_time FROM @add_avatar_review_submit_time_sql;
EXECUTE stmt_add_avatar_review_submit_time;
DEALLOCATE PREPARE stmt_add_avatar_review_submit_time;
