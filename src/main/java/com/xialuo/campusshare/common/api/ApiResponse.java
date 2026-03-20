package com.xialuo.campusshare.common.api;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.xialuo.campusshare.common.enums.BizCodeEnum;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

/**
 * 统一响应模型
 */
public class ApiResponse<T> {
    /** 业务码 */
    private Integer code;
    /** 响应消息 */
    private String message;
    /** 响应数据 */
    private T data;
    /** 请求追踪ID */
    private String requestId;
    /** 响应时间 */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ssXXX")
    private OffsetDateTime timestamp;

    /**
     * 成功响应
     */
    public static <T> ApiResponse<T> Success(T data, String requestId) {
        ApiResponse<T> response = new ApiResponse<>();
        response.code = BizCodeEnum.SUCCESS.GetCode();
        response.message = BizCodeEnum.SUCCESS.GetMessage();
        response.data = data;
        response.requestId = requestId;
        response.timestamp = OffsetDateTime.now(ZoneOffset.ofHours(8));
        return response;
    }

    /**
     * 失败响应
     */
    public static <T> ApiResponse<T> Failure(BizCodeEnum bizCodeEnum, String message, String requestId) {
        ApiResponse<T> response = new ApiResponse<>();
        response.code = bizCodeEnum.GetCode();
        response.message = message == null || message.isBlank() ? bizCodeEnum.GetMessage() : message;
        response.data = null;
        response.requestId = requestId;
        response.timestamp = OffsetDateTime.now(ZoneOffset.ofHours(8));
        return response;
    }

    /**
     * 获取业务码
     */
    public Integer GetCode() {
        return code;
    }

    /**
     * 获取响应消息
     */
    public String GetMessage() {
        return message;
    }

    /**
     * 获取响应数据
     */
    public T GetData() {
        return data;
    }

    /**
     * 获取请求追踪ID
     */
    public String GetRequestId() {
        return requestId;
    }

    /**
     * 获取响应时间
     */
    public OffsetDateTime GetTimestamp() {
        return timestamp;
    }
}
