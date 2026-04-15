UPDATE user_info
SET
    user_role = 'ADMINISTRATOR',
    user_status = 'ACTIVE',
    update_time = NOW()
WHERE account = '24251104209'
  AND deleted = 0;
