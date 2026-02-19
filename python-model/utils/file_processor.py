"""
Optimized file processing for large CSV files.
Based on FastAPI and pandas best practices from Context7.
"""

import pandas as pd
import io
from typing import AsyncIterator, Optional
from fastapi import UploadFile
import logging

logger = logging.getLogger(__name__)


class FileProcessor:
    """Handles file uploads and processing with memory optimization."""
    
    MAX_MEMORY_SIZE = 50 * 1024 * 1024  # 50MB
    CHUNK_SIZE = 10000  # Process 10k rows at a time
    
    @staticmethod
    async def read_upload_file_async(file: UploadFile) -> bytes:
        """
        Asynchronously read uploaded file content.
        Uses FastAPI best practices for async file operations.
        
        Args:
            file: FastAPI UploadFile object
            
        Returns:
            File content as bytes
        """
        # Use async read for better performance
        content = await file.read()
        
        # Log file info
        logger.info(f"Read file: {file.filename}, size: {len(content)} bytes, type: {file.content_type}")
        
        return content
    
    @staticmethod
    def estimate_csv_size(csv_bytes: bytes) -> dict:
        """
        Estimate CSV size and recommend processing strategy.
        
        Args:
            csv_bytes: CSV content as bytes
            
        Returns:
            Dictionary with size info and recommendations
        """
        size_mb = len(csv_bytes) / (1024 * 1024)
        
        # Quick row count estimate (count newlines)
        estimated_rows = csv_bytes.count(b'\n')
        
        return {
            "size_bytes": len(csv_bytes),
            "size_mb": round(size_mb, 2),
            "estimated_rows": estimated_rows,
            "use_chunking": size_mb > 10,  # Use chunking for files > 10MB
            "recommended_chunk_size": 5000 if size_mb > 10 else None
        }
    
    @staticmethod
    def read_csv_optimized(csv_bytes: bytes, use_chunking: bool = False) -> pd.DataFrame:
        """
        Read CSV with memory optimization.
        Uses pandas best practices for large files.
        
        Args:
            csv_bytes: CSV content as bytes
            use_chunking: Whether to use chunked reading
            
        Returns:
            pandas DataFrame
        """
        if use_chunking:
            # For large files, read in chunks and concatenate
            chunks = []
            chunk_iterator = pd.read_csv(
                io.BytesIO(csv_bytes),
                chunksize=FileProcessor.CHUNK_SIZE,
                low_memory=True  # Process in chunks to reduce memory
            )
            
            for chunk in chunk_iterator:
                # Optimize dtypes for each chunk
                chunk = FileProcessor._optimize_dtypes(chunk)
                chunks.append(chunk)
            
            df = pd.concat(chunks, ignore_index=True)
            logger.info(f"Read CSV in {len(chunks)} chunks")
        else:
            # For smaller files, read normally
            df = pd.read_csv(io.BytesIO(csv_bytes))
            df = FileProcessor._optimize_dtypes(df)
        
        return df
    
    @staticmethod
    def _optimize_dtypes(df: pd.DataFrame) -> pd.DataFrame:
        """
        Optimize DataFrame memory usage by downcasting numeric types.
        Based on pandas memory optimization best practices.
        
        Args:
            df: pandas DataFrame
            
        Returns:
            Optimized DataFrame
        """
        # Downcast numeric columns
        for col in df.select_dtypes(include=['float']).columns:
            df[col] = pd.to_numeric(df[col], downcast='float')
        
        for col in df.select_dtypes(include=['int']).columns:
            df[col] = pd.to_numeric(df[col], downcast='integer')
        
        # Convert object columns to category if they have few unique values
        for col in df.select_dtypes(include=['object']).columns:
            if col in ['sender_id', 'receiver_id']:
                # Account IDs might benefit from category type
                num_unique = df[col].nunique()
                num_total = len(df[col])
                if num_unique / num_total < 0.5:  # Less than 50% unique
                    df[col] = df[col].astype('category')
        
        return df
    
    @staticmethod
    def get_memory_usage(df: pd.DataFrame) -> dict:
        """
        Get detailed memory usage information for DataFrame.
        
        Args:
            df: pandas DataFrame
            
        Returns:
            Dictionary with memory usage details
        """
        memory_usage = df.memory_usage(deep=True)
        total_mb = memory_usage.sum() / (1024 * 1024)
        
        return {
            "total_mb": round(total_mb, 2),
            "by_column": {
                col: round(mem / (1024 * 1024), 2)
                for col, mem in memory_usage.items()
            },
            "row_count": len(df),
            "column_count": len(df.columns)
        }


class StreamingCSVProcessor:
    """Process CSV files in streaming fashion for very large files."""
    
    @staticmethod
    async def process_csv_stream(
        file: UploadFile,
        chunk_size: int = 10000
    ) -> AsyncIterator[pd.DataFrame]:
        """
        Stream process CSV file in chunks.
        Useful for very large files that don't fit in memory.
        
        Args:
            file: FastAPI UploadFile object
            chunk_size: Number of rows per chunk
            
        Yields:
            DataFrame chunks
        """
        # Read file content
        content = await file.read()
        
        # Create chunk iterator
        chunk_iterator = pd.read_csv(
            io.BytesIO(content),
            chunksize=chunk_size,
            low_memory=True
        )
        
        for chunk in chunk_iterator:
            # Optimize each chunk
            chunk = FileProcessor._optimize_dtypes(chunk)
            yield chunk
    
    @staticmethod
    def aggregate_chunks(chunks: list) -> pd.DataFrame:
        """
        Aggregate processed chunks into final DataFrame.
        
        Args:
            chunks: List of DataFrame chunks
            
        Returns:
            Combined DataFrame
        """
        if not chunks:
            return pd.DataFrame()
        
        return pd.concat(chunks, ignore_index=True)
