class apiError extends Error{
    constructor(statusCode, message = "something went wrong",errors =[]){
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.success = false;
        this.message = message;
        Error.captureStackTrace(this, this.constructor);


    }
}

export {apiError}; 