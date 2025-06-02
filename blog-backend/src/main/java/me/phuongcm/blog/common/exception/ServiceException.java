package me.phuongcm.blog.common.exception;

import me.phuongcm.blog.common.utils.Error;

public class ServiceException extends RuntimeException {
    private final Error error;

    public ServiceException(Error error) {
        super(error.getMessage());
        this.error = error;
    }
    public Error getError() {
        return error;
    }
}
