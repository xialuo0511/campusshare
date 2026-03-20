package com.xialuo.campusshare.common.handler;

import com.xialuo.campusshare.common.api.ApiResponse;
import com.xialuo.campusshare.common.enums.BizCodeEnum;
import com.xialuo.campusshare.common.exception.BusinessException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 全局异常处理
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 处理业务异常
     */
    @ExceptionHandler(BusinessException.class)
    public ApiResponse<Object> HandleBusinessException(BusinessException exception, HttpServletRequest request) {
        return ApiResponse.Failure(exception.GetBizCodeEnum(), exception.getMessage(), GetRequestId(request));
    }

    /**
     * 处理参数校验异常
     */
    @ExceptionHandler({MethodArgumentNotValidException.class, ConstraintViolationException.class})
    public ApiResponse<Object> HandleValidationException(Exception exception, HttpServletRequest request) {
        return ApiResponse.Failure(BizCodeEnum.PARAM_INVALID, exception.getMessage(), GetRequestId(request));
    }

    /**
     * 处理未知异常
     */
    @ExceptionHandler(Exception.class)
    public ApiResponse<Object> HandleException(Exception exception, HttpServletRequest request) {
        return ApiResponse.Failure(BizCodeEnum.SYSTEM_ERROR, exception.getMessage(), GetRequestId(request));
    }

    /**
     * 获取请求追踪ID
     */
    private String GetRequestId(HttpServletRequest request) {
        Object requestId = request.getAttribute("requestId");
        return requestId == null ? "" : requestId.toString();
    }
}
