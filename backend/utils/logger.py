"""
Logger Utility

Configures structured logging for the backend application.
"""

import sys
import logging
from backend.config import settings


def setup_logger(name: str = "enterprise_rag") -> logging.Logger:
    """
    Configure and return a structured logger.
    """
    logger = logging.getLogger(name)

    if not logger.handlers:
        logger.setLevel(logging.DEBUG if settings.DEBUG else logging.INFO)

        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            "[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    return logger


logger = setup_logger()
