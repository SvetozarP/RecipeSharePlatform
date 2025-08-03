import gzip
import json
import logging
from django.http import HttpResponse, StreamingHttpResponse
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
import hashlib

logger = logging.getLogger(__name__)


class CompressionMiddleware(MiddlewareMixin):
    """Middleware for compressing API responses."""
    
    def process_request(self, request):
        """Process incoming request."""
        # Check if client accepts gzip compression
        accept_encoding = request.META.get('HTTP_ACCEPT_ENCODING', '')
        request.can_compress = 'gzip' in accept_encoding.lower()
        
        # Check if this is an API request
        request.is_api_request = request.path.startswith('/api/')
        
        return None
    
    def process_response(self, request, response):
        """Process outgoing response with compression."""
        # Only compress API responses
        if not getattr(request, 'is_api_request', False):
            return response
        
        # Only compress if client accepts gzip
        if not getattr(request, 'can_compress', False):
            return response
        
        # Only compress JSON responses
        if not response.get('Content-Type', '').startswith('application/json'):
            return response
        
        # Don't compress small responses
        if len(response.content) < 1024:  # Less than 1KB
            return response
        
        try:
            # Compress the response content
            compressed_content = gzip.compress(response.content)
            
            # Create new response with compressed content
            compressed_response = HttpResponse(
                compressed_content,
                content_type=response.get('Content-Type'),
                status=response.status_code
            )
            
            # Copy headers from original response
            for header, value in response.items():
                compressed_response[header] = value
            
            # Add compression headers
            compressed_response['Content-Encoding'] = 'gzip'
            compressed_response['Content-Length'] = len(compressed_content)
            compressed_response['Vary'] = 'Accept-Encoding'
            
            # Log compression stats
            original_size = len(response.content)
            compressed_size = len(compressed_content)
            compression_ratio = (1 - compressed_size / original_size) * 100
            
            logger.debug(
                f"Response compressed: {original_size} -> {compressed_size} bytes "
                f"({compression_ratio:.1f}% reduction)"
            )
            
            return compressed_response
            
        except Exception as e:
            logger.error(f"Compression error: {e}")
            return response


class ResponseCacheMiddleware(MiddlewareMixin):
    """Middleware for caching API responses."""
    
    def process_request(self, request):
        """Check for cached response."""
        # Only cache GET requests to API endpoints
        if request.method != 'GET' or not request.path.startswith('/api/'):
            return None
        
        # Skip caching for authenticated requests (they might be personalized)
        if request.user.is_authenticated:
            return None
        
        # Generate cache key
        cache_key = self._generate_cache_key(request)
        
        # Try to get cached response
        cached_response = cache.get(cache_key)
        if cached_response:
            logger.debug(f"Cache HIT: {request.path}")
            return cached_response
        
        # Store cache key for later use
        request.cache_key = cache_key
        return None
    
    def process_response(self, request, response):
        """Cache successful API responses."""
        # Only cache GET requests to API endpoints
        if request.method != 'GET' or not request.path.startswith('/api/'):
            return response
        
        # Skip caching for authenticated requests
        if request.user.is_authenticated:
            return response
        
        # Only cache successful responses
        if response.status_code != 200:
            return response
        
        # Only cache JSON responses
        if not response.get('Content-Type', '').startswith('application/json'):
            return response
        
        # Get cache key
        cache_key = getattr(request, 'cache_key', None)
        if not cache_key:
            return response
        
        # Determine cache TTL based on endpoint
        ttl = self._get_cache_ttl(request.path)
        
        try:
            # Cache the response
            cache.set(cache_key, response, ttl)
            logger.debug(f"Response cached: {request.path} (TTL: {ttl}s)")
            
            # Add cache headers
            response['X-Cache'] = 'MISS'
            response['Cache-Control'] = f'public, max-age={ttl}'
            
        except Exception as e:
            logger.error(f"Caching error: {e}")
        
        return response
    
    def _generate_cache_key(self, request):
        """Generate cache key for request."""
        # Include path, query parameters, and headers that affect response
        key_data = {
            'path': request.path,
            'query': request.GET.dict(),
            'accept': request.META.get('HTTP_ACCEPT', ''),
            'accept_language': request.META.get('HTTP_ACCEPT_LANGUAGE', ''),
        }
        
        # Create hash of key data
        key_string = json.dumps(key_data, sort_keys=True)
        return f"api_response:{hashlib.md5(key_string.encode()).hexdigest()}"
    
    def _get_cache_ttl(self, path):
        """Get cache TTL for specific endpoint."""
        # Define TTL for different endpoints
        ttl_map = {
            '/api/recipes/': 300,      # 5 minutes for recipe list
            '/api/categories/': 3600,  # 1 hour for categories
            '/api/search/': 60,        # 1 minute for search results
            '/api/popular-searches/': 1800,  # 30 minutes for popular searches
        }
        
        # Find matching path
        for pattern, ttl in ttl_map.items():
            if path.startswith(pattern):
                return ttl
        
        # Default TTL
        return 60


class ETagMiddleware(MiddlewareMixin):
    """Middleware for ETag support."""
    
    def process_request(self, request):
        """Check ETag for conditional requests."""
        # Only process GET requests to API endpoints
        if request.method != 'GET' or not request.path.startswith('/api/'):
            return None
        
        # Get ETag from request
        if_none_match = request.META.get('HTTP_IF_NONE_MATCH')
        if not if_none_match:
            return None
        
        # Generate ETag for current request
        etag = self._generate_etag(request)
        
        # If ETag matches, return 304 Not Modified
        if if_none_match.strip('"') == etag:
            response = HttpResponse(status=304)
            response['ETag'] = f'"{etag}"'
            return response
        
        return None
    
    def process_response(self, request, response):
        """Add ETag to response."""
        # Only add ETag to GET requests to API endpoints
        if request.method != 'GET' or not request.path.startswith('/api/'):
            return response
        
        # Only add ETag to successful JSON responses
        if response.status_code != 200 or not response.get('Content-Type', '').startswith('application/json'):
            return response
        
        try:
            # Generate ETag
            etag = self._generate_etag(request)
            response['ETag'] = f'"{etag}"'
            
        except Exception as e:
            logger.error(f"ETag generation error: {e}")
        
        return response
    
    def _generate_etag(self, request):
        """Generate ETag for request."""
        # Include path, query parameters, and content hash
        key_data = {
            'path': request.path,
            'query': request.GET.dict(),
        }
        
        # Create hash
        key_string = json.dumps(key_data, sort_keys=True)
        return hashlib.md5(key_string.encode()).hexdigest()


class PerformanceHeadersMiddleware(MiddlewareMixin):
    """Middleware for adding performance-related headers."""
    
    def process_response(self, request, response):
        """Add performance headers to response."""
        # Add timing headers
        if hasattr(request, '_start_time'):
            duration = timezone.now() - request._start_time
            response['X-Response-Time'] = f"{duration.total_seconds():.3f}s"
        
        # Add cache control headers for API responses
        if request.path.startswith('/api/'):
            if request.method == 'GET':
                # Cache GET requests
                response['Cache-Control'] = 'public, max-age=60'
            else:
                # Don't cache other methods
                response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
                response['Pragma'] = 'no-cache'
                response['Expires'] = '0'
        
        # Add security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        
        return response
    
    def process_request(self, request):
        """Record request start time."""
        request._start_time = timezone.now()
        return None


# Middleware configuration
MIDDLEWARE_CLASSES = [
    'core.middleware.compression.CompressionMiddleware',
    'core.middleware.compression.ResponseCacheMiddleware',
    'core.middleware.compression.ETagMiddleware',
    'core.middleware.compression.PerformanceHeadersMiddleware',
] 