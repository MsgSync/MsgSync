class MsgSyncError(Exception):
    """Base exception for MsgSync SDK"""
    pass

class MsgSyncAPIError(MsgSyncError):
    """Exception raised for errors returned by the MsgSync API"""
    def __init__(self, message: str, status_code: int = None):
        super().__init__(message)
        self.status_code = status_code
