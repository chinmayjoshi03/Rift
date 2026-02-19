"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from routes.detect import router as detect_router
from routes.detect_enhanced import router as detect_enhanced_router
from utils.error_handlers import (
    http_exception_handler,
    validation_exception_handler,
    fraud_detection_exception_handler,
    general_exception_handler,
    FraudDetectionError
)
import os

app = FastAPI(
    title="Fraud Detection Model Service",
    description="Python-based fraud detection algorithms with enhanced configuration",
    version="2.0.0"
)

# Register custom exception handlers
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(FraudDetectionError, fraud_detection_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(detect_router)  # Original endpoint (unchanged)
app.include_router(detect_enhanced_router)  # Enhanced endpoint with configuration


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "fraud-detection-model"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
