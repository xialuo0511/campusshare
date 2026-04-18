package com.xialuo.campusshare.common.handler;

import com.xialuo.campusshare.common.api.ApiResponse;
import com.xialuo.campusshare.common.enums.BizCodeEnum;
import com.xialuo.campusshare.common.exception.BusinessException;
import com.xialuo.campusshare.common.filter.RequestIdFilter;
import jakarta.servlet.http.HttpServletRequest;
import java.sql.SQLException;
import jakarta.validation.ConstraintViolationException;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 全局异常处理
 */
@RestControllerAdvice
public class GlobalExceptionHandler {
    /** 日志 */
    private static final Logger LOGGER = LoggerFactory.getLogger(GlobalExceptionHandler.class);

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
        if (exception instanceof MethodArgumentNotValidException methodArgumentNotValidException) {
            String message = ResolveMethodArgumentMessage(methodArgumentNotValidException);
            return ApiResponse.Failure(BizCodeEnum.PARAM_INVALID, message, GetRequestId(request));
        }
        if (exception instanceof ConstraintViolationException constraintViolationException) {
            String message = ResolveConstraintViolationMessage(constraintViolationException);
            return ApiResponse.Failure(BizCodeEnum.PARAM_INVALID, message, GetRequestId(request));
        }
        return ApiResponse.Failure(BizCodeEnum.PARAM_INVALID, "请求参数不合法", GetRequestId(request));
    }

    /**
     * 处理数据库访问异常
     */
    @ExceptionHandler(DataAccessException.class)
    public ApiResponse<Object> HandleDataAccessException(DataAccessException exception, HttpServletRequest request) {
        String requestId = GetRequestId(request);
        String requestPath = BuildRequestPath(request);
        Throwable rootCause = ResolveRootCause(exception);
        String sqlState = ResolveSqlState(rootCause);
        Integer errorCode = ResolveSqlErrorCode(rootCause);
        LOGGER.error(
            "Database access exception. requestId={}, method={}, path={}, sqlState={}, errorCode={}, rootCause={}",
            requestId,
            request.getMethod(),
            requestPath,
            sqlState,
            errorCode,
            BuildExceptionMessage(rootCause),
            exception
        );
        return ApiResponse.Failure(BizCodeEnum.SYSTEM_ERROR, "数据库访问异常，请确认数据库与建表脚本已初始化", GetRequestId(request));
    }

    /**
     * 处理未知异常
     */
    @ExceptionHandler(Exception.class)
    public ApiResponse<Object> HandleException(Exception exception, HttpServletRequest request) {
        String requestId = GetRequestId(request);
        String requestPath = BuildRequestPath(request);
        LOGGER.error(
            "Unhandled exception. requestId={}, method={}, path={}, message={}",
            requestId,
            request.getMethod(),
            requestPath,
            BuildExceptionMessage(exception),
            exception
        );
        return ApiResponse.Failure(BizCodeEnum.SYSTEM_ERROR, exception.getMessage(), GetRequestId(request));
    }

    /**
     * 获取请求追踪ID
     */
    private String GetRequestId(HttpServletRequest request) {
        Object requestId = request.getAttribute(RequestIdFilter.REQUEST_ID_ATTRIBUTE);
        return requestId == null ? "" : requestId.toString();
    }

    /**
     * 构建请求路径
     */
    private String BuildRequestPath(HttpServletRequest request) {
        String queryString = request.getQueryString();
        if (queryString == null || queryString.isBlank()) {
            return request.getRequestURI();
        }
        return request.getRequestURI() + "?" + queryString;
    }

    /**
     * 解析根因
     */
    private Throwable ResolveRootCause(Throwable throwable) {
        Throwable currentThrowable = throwable;
        Throwable nextThrowable = currentThrowable == null ? null : currentThrowable.getCause();
        while (nextThrowable != null && nextThrowable != currentThrowable) {
            currentThrowable = nextThrowable;
            nextThrowable = currentThrowable.getCause();
        }
        return currentThrowable;
    }

    /**
     * 解析SQL状态
     */
    private String ResolveSqlState(Throwable throwable) {
        if (throwable instanceof SQLException sqlException) {
            return sqlException.getSQLState() == null ? "" : sqlException.getSQLState();
        }
        return "";
    }

    /**
     * 解析SQL错误码
     */
    private Integer ResolveSqlErrorCode(Throwable throwable) {
        if (throwable instanceof SQLException sqlException) {
            return sqlException.getErrorCode();
        }
        return null;
    }

    /**
     * 构建异常信息
     */
    private String BuildExceptionMessage(Throwable throwable) {
        if (throwable == null) {
            return "";
        }
        String message = throwable.getMessage();
        if (message == null || message.isBlank()) {
            return throwable.getClass().getSimpleName();
        }
        return throwable.getClass().getSimpleName() + ": " + message.trim();
    }

    /**
     * 解析请求体校验信息
     */
    private String ResolveMethodArgumentMessage(MethodArgumentNotValidException exception) {
        List<FieldError> fieldErrorList = exception.getBindingResult().getFieldErrors();
        if (fieldErrorList == null || fieldErrorList.isEmpty()) {
            return "请求参数不合法";
        }
        FieldError notBlankError = fieldErrorList.stream()
            .filter(this::IsNotBlankError)
            .findFirst()
            .orElse(null);
        if (notBlankError != null && notBlankError.getDefaultMessage() != null) {
            return notBlankError.getDefaultMessage();
        }
        FieldError firstError = fieldErrorList.get(0);
        if (firstError.getDefaultMessage() != null && !firstError.getDefaultMessage().isBlank()) {
            return firstError.getDefaultMessage();
        }
        return "请求参数不合法";
    }

    /**
     * 解析参数校验信息
     */
    private String ResolveConstraintViolationMessage(ConstraintViolationException exception) {
        return exception.getConstraintViolations().stream()
            .map(constraintViolation -> constraintViolation.getMessage())
            .filter(message -> message != null && !message.isBlank())
            .findFirst()
            .orElse("请求参数不合法");
    }

    /**
     * 是否为空校验错误
     */
    private boolean IsNotBlankError(FieldError fieldError) {
        if (fieldError == null || fieldError.getCodes() == null) {
            return false;
        }
        for (String code : fieldError.getCodes()) {
            if (code != null && code.contains("NotBlank")) {
                return true;
            }
        }
        return false;
    }
}
