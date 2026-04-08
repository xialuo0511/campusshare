package com.xialuo.campusshare.module.user.repository;

import com.xialuo.campusshare.entity.UserEntity;
import java.util.Collection;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Repository;

/**
 * 用户内存仓储
 */
@Repository
public class UserMemoryRepository {
    /** 用户ID序列 */
    private final AtomicLong userIdGenerator = new AtomicLong(10000);
    /** 用户主存储 */
    private final Map<Long, UserEntity> userMap = new ConcurrentHashMap<>();
    /** 账号索引 */
    private final Map<String, Long> accountIndexMap = new ConcurrentHashMap<>();
    /** 会话索引 */
    private final Map<String, Long> tokenUserIndexMap = new ConcurrentHashMap<>();

    /**
     * 保存用户
     */
    public UserEntity SaveUser(UserEntity userEntity) {
        if (userEntity.GetUserId() == null) {
            userEntity.SetUserId(userIdGenerator.incrementAndGet());
        }
        userMap.put(userEntity.GetUserId(), userEntity);
        accountIndexMap.put(userEntity.GetAccount(), userEntity.GetUserId());
        return userEntity;
    }

    /**
     * 按用户ID查询
     */
    public UserEntity FindUserById(Long userId) {
        return userMap.get(userId);
    }

    /**
     * 按账号查询
     */
    public UserEntity FindUserByAccount(String account) {
        Long userId = accountIndexMap.get(account);
        if (userId == null) {
            return null;
        }
        return userMap.get(userId);
    }

    /**
     * 判断账号是否存在
     */
    public boolean ExistsByAccount(String account) {
        return accountIndexMap.containsKey(account);
    }

    /**
     * 保存会话
     */
    public void SaveSession(String token, Long userId) {
        tokenUserIndexMap.put(token, userId);
    }

    /**
     * 按令牌查用户ID
     */
    public Long FindUserIdByToken(String token) {
        return tokenUserIndexMap.get(token);
    }

    /**
     * 查询全部用户
     */
    public Collection<UserEntity> FindAllUsers() {
        return userMap.values();
    }
}
