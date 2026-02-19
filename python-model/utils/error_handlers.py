"""
Comprehensive error handling for fraud detection API.
Based on FastAPI and pandas best practices.
"""

from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging
from typing import Union
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FraudDetectionError(Exception):
    """Base exception for fraud detection errors."""
    def __init__(self, message: str, error_code: str = "DETECTION_ERROR"):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)


class DataValidationError(FraudDetectionError):
    """Raised when input data validation fails."""
    def __init__(self, message: str, issues: list = None):
        super().__init__(message, "DATA_VALIDATION_ERROR")
        self.issues = issues or []


class DataProcessingError(FraudDetectionError):
    """Raised when data processing fails."""
    def __init__(self, message: str, details: str = None):
        super().__init__(message, "DATA_PROCESSING_ERROR")
        self.details = details


class ConfigurationError(FraudDetectionError):
    """Raised when configuration is invalid."""
    def __init__(self, message: str):
        super().__init__(message, "CONFIGURATION_ERROR")


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    Custom handler for HTTP exceptions.
    Logs the error and returns a structured JSON response.
    """
    logger.error(f"HTTP {exc.status_code} error at {request.url}: {exc.detail}")
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": str(exc.detail),
                "path": str(request.url.path)
            }
        }
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Custom handler for request validation errors.
    Returns detailed validation error information.
    """
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(loc) for loc in error['loc']),
            "message": error['msg'],
            "type": error['type']
        })
    
    logger.warning(f"Validation error at {request.url}: {errors}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed",
                "details": errors,
                "path": str(request.url.path)
            }
        }
    )


async def fraud_detection_exception_handler(request: Request, exc: FraudDetectionError):
    """
    Custom handler for fraud detection specific errors.
    """
    logger.error(f"Fraud detection error at {request.url}: {exc.message}")
    
    content = {
        "error": {
            "code": exc.error_code,
            "message": exc.message,
            "path": str(request.url.path)
        }
    }
    
    # Add additional details for specific error types
    if isinstance(exc, DataValidationError) and exc.issues:
        content["error"]["validation_issues"] = exc.issues
    elif isinstance(exc, DataProcessingError) and exc.details:
        content["error"]["details"] = exc.details
    
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content=content
    )


async def general_exception_handler(request: Request, exc: Exception):
    """
    Catch-all handler for unexpected exceptions.
    Logs the full traceback and returns a generic error message.
    """
    logger.error(f"Unexpected error at {request.url}: {str(exc)}")
    logger.error(traceback.format_exc())
    
    # In production, don't expose internal error details
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred during processing",
                "path": str(request.url.path),
                # Only include details in development
                # "details": str(exc) if os.getenv("DEBUG") == "true" else None
            }
        }
    )


def safe_parse_datetime(df, column_name: str = 'timestamp'):
    """
    Safely parse datetime column with proper error handling.
    
    Args:
        df: pandas DataFrame
        column_name: name of the datetime column
        
    Returns:
        DataFrame with parsed datetime column
        
    Raises:
        DataProcessingError: if datetime parsing fails
    """
    import pandas as pd
    
    try:
        # Try to parse with errors='coerce' to handle invalid dates
        df[column_name] = pd.to_datetime(df[column_name], errors='coerce')
        
        # Check for NaT (Not a Time) values
        nat_count = df[column_name].isna().sum()
        if nat_count > 0:
            raise DataProcessingError(
                f"Found {nat_count} invalid datetime values in column '{column_name}'",
                details=f"Please ensure all timestamps are in a valid format (e.g., '2024-01-01T10:00:00Z')"
            )
        
        return df
        
    except Exception as e:
        if isinstance(e, DataProcessingError):
            raise
        raise DataProcessingError(
            f"Failed to parse datetime column '{column_name}'",
            details=str(e)
        )


def safe_read_csv(csv_bytes: bytes):
    """
    Safely read CSV with comprehensive error handling.
    
    Args:
        csv_bytes: CSV file content as bytes
        
    Returns:
        pandas DataFrame
        
    Raises:
        DataValidationError: if CSV reading or validation fails
    """
    import pandas as pd
    import io
    
    try:
        # Try to read CSV
        df = pd.read_csv(io.BytesIO(csv_bytes))
        
        if df.empty:
            raise DataValidationError(
                "CSV file is empty",
                issues=["No data rows found in the CSV file"]
            )
        
        return df
        
    except pd.errors.EmptyDataError:
        raise DataValidationError(
            "CSV file is empty or contains no data",
            issues=["The uploaded file contains no parseable data"]
        )
    except pd.errors.ParserError as e:
        raise DataValidationError(
            "Failed to parse CSV file",
            issues=[f"CSV parsing error: {str(e)}"]
        )
    except UnicodeDecodeError:
        raise DataValidationError(
            "Invalid file encoding",
            issues=["File must be UTF-8 encoded CSV"]
        )
    except Exception as e:
        raise DataValidationError(
            "Failed to read CSV file",
            issues=[f"Unexpected error: {str(e)}"]
        )


def validate_required_columns(df, required_columns: list):
    """
    Validate that all required columns exist in DataFrame.
    
    Args:
        df: pandas DataFrame
        required_columns: list of required column names
        
    Raises:
        DataValidationError: if required columns are missing
    """
    missing_columns = [col for col in required_columns if col not in df.columns]
    
    if missing_columns:
        raise DataValidationError(
            f"Missing required columns: {', '.join(missing_columns)}",
            issues=[
                f"Required columns: {', '.join(required_columns)}",
                f"Found columns: {', '.join(df.columns.tolist())}",
                f"Missing: {', '.join(missing_columns)}"
            ]
        )


def validate_data_types(df):
    """
    Validate data types and values in DataFrame.
    
    Args:
        df: pandas DataFrame with transaction data
        
    Raises:
        DataValidationError: if data validation fails
    """
    import pandas as pd
    
    issues = []
    
    # Check for null values
    null_counts = df[['transaction_id', 'sender_id', 'receiver_id', 'amount', 'timestamp']].isnull().sum()
    for col, count in null_counts.items():
        if count > 0:
            issues.append(f"Column '{col}' has {count} null/missing values")
    
    # Check amount column
    try:
        amounts = pd.to_numeric(df['amount'], errors='coerce')
        invalid_amounts = amounts.isna().sum()
        if invalid_amounts > 0:
            issues.append(f"Found {invalid_amounts} non-numeric values in 'amount' column")
        
        if (amounts <= 0).any():
            negative_count = (amounts <= 0).sum()
            issues.append(f"Found {negative_count} negative or zero amounts")
    except Exception as e:
        issues.append(f"Failed to validate 'amount' column: {str(e)}")
    
    # Check for duplicate transaction IDs
    duplicates = df['transaction_id'].duplicated().sum()
    if duplicates > 0:
        issues.append(f"Found {duplicates} duplicate transaction IDs")
    
    # Check for self-transactions
    self_tx = (df['sender_id'] == df['receiver_id']).sum()
    if self_tx > 0:
        issues.append(f"Found {self_tx} self-transactions (sender = receiver)")
    
    if issues:
        raise DataValidationError(
            "Data validation failed",
            issues=issues
        )
