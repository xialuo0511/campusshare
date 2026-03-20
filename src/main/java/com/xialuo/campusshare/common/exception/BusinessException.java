package com.xialuo.campusshare.common.exception;

import com.xialuo.campusshare.common.enums.BizCodeEnum;

/**
 * 业务异常
 */
public class BusinessException extends RuntimeException {
    /** 业务码 */
    private final BizCodeEnum bizCodeEnum;

    public BusinessException(BizCodeEnum bizCodeEnum, String message) {
        super(message);
        this.bizCodeEnum = bizCodeEnum;
    }

    /**
     * 获取业务码
     */
    public BizCodeEnum GetBizCodeEnum() {
        return bizCodeEnum;
    }
}
