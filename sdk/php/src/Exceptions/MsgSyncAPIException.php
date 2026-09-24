<?php

namespace MsgSync\Exceptions;

class MsgSyncAPIException extends MsgSyncException {
    protected $errorResponse;

    public function __construct($message, $code = 0, $errorResponse = null) {
        parent::__construct($message, $code);
        $this->errorResponse = $errorResponse;
    }

    public function getErrorResponse() {
        return $this->errorResponse;
    }
}
