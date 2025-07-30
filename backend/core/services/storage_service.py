"""
Content storage service for handling file uploads and image processing.
"""
import os
import uuid
from io import BytesIO
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import InMemoryUploadedFile
from PIL import Image, ImageOps


class StorageService:
    """Service for handling file storage and image processing."""
    
    def __init__(self):
        self.storage_config = getattr(settings, 'CONTENT_STORAGE', {})
        self.recipe_images_path = self.storage_config.get('RECIPE_IMAGES_UPLOAD_PATH', 'recipes/images/')
        self.allowed_extensions = self.storage_config.get('ALLOWED_IMAGE_EXTENSIONS', ['.jpg', '.jpeg', '.png', '.webp'])
        self.max_file_size = self.storage_config.get('MAX_IMAGE_SIZE', 5 * 1024 * 1024)
        self.image_quality = self.storage_config.get('IMAGE_QUALITY', 85)
        self.thumbnail_sizes = self.storage_config.get('THUMBNAIL_SIZES', {})

    def validate_image_file(self, file) -> None:
        """
        Validate uploaded image file.
        
        Args:
            file: Uploaded file object
            
        Raises:
            ValidationError: If file is invalid
        """
        if not file:
            raise ValidationError("No file provided")
            
        # Check file size
        if file.size > self.max_file_size:
            max_size_mb = self.max_file_size / (1024 * 1024)
            raise ValidationError(f"File size exceeds {max_size_mb}MB limit")
            
        # Check file extension
        file_extension = Path(file.name).suffix.lower()
        if file_extension not in self.allowed_extensions:
            raise ValidationError(f"File type not allowed. Allowed types: {', '.join(self.allowed_extensions)}")
            
        # Validate image content
        try:
            # Reset file pointer to beginning
            file.seek(0)
            with Image.open(file) as img:
                img.verify()  # Verify it's a valid image
            file.seek(0)  # Reset pointer again
        except Exception as e:
            raise ValidationError(f"Invalid image file: {str(e)}")

    def generate_unique_filename(self, original_filename: str, prefix: str = "") -> str:
        """
        Generate a unique filename to avoid conflicts.
        
        Args:
            original_filename: Original file name
            prefix: Optional prefix for the filename
            
        Returns:
            Unique filename
        """
        file_extension = Path(original_filename).suffix.lower()
        unique_id = str(uuid.uuid4())
        
        if prefix:
            return f"{prefix}_{unique_id}{file_extension}"
        return f"{unique_id}{file_extension}"

    def optimize_image(self, image: Image.Image, quality: Optional[int] = None) -> Image.Image:
        """
        Optimize image for web use.
        
        Args:
            image: PIL Image object
            quality: JPEG quality (1-100)
            
        Returns:
            Optimized PIL Image object
        """
        if quality is None:
            quality = self.image_quality
            
        # Convert RGBA to RGB if saving as JPEG
        if image.mode in ('RGBA', 'LA', 'P'):
            # Create white background
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
            image = background
            
        # Auto-rotate image based on EXIF data
        image = ImageOps.exif_transpose(image)
        
        return image

    def create_thumbnail(self, image: Image.Image, size: Tuple[int, int]) -> Image.Image:
        """
        Create thumbnail from image.
        
        Args:
            image: PIL Image object
            size: Tuple of (width, height)
            
        Returns:
            Thumbnail PIL Image object
        """
        # Create thumbnail maintaining aspect ratio
        thumbnail = image.copy()
        thumbnail.thumbnail(size, Image.Resampling.LANCZOS)
        return thumbnail

    def save_image_with_thumbnails(self, file, recipe_id: str) -> Dict[str, str]:
        """
        Save image and create thumbnails.
        
        Args:
            file: Uploaded file object
            recipe_id: Recipe UUID string
            
        Returns:
            Dictionary with image URLs
        """
        self.validate_image_file(file)
        
        # Generate unique filename
        filename = self.generate_unique_filename(file.name, f"recipe_{recipe_id}")
        
        # Open and process image
        with Image.open(file) as img:
            optimized_img = self.optimize_image(img)
            
            results = {}
            
            # Save original (optimized) image
            original_path = os.path.join(self.recipe_images_path, 'originals', filename)
            original_buffer = BytesIO()
            optimized_img.save(original_buffer, format='JPEG', quality=self.image_quality, optimize=True)
            original_content = ContentFile(original_buffer.getvalue())
            
            saved_path = default_storage.save(original_path, original_content)
            original_url = default_storage.url(saved_path)
            # Ensure we return full URLs for Azure blob storage
            results['original'] = self._ensure_absolute_url(original_url)
            
            # Create and save thumbnails
            for size_name, dimensions in self.thumbnail_sizes.items():
                thumbnail = self.create_thumbnail(optimized_img, dimensions)
                
                # Save thumbnail
                thumb_filename = f"{Path(filename).stem}_{size_name}{Path(filename).suffix}"
                thumb_path = os.path.join(self.recipe_images_path, 'thumbnails', thumb_filename)
                
                thumb_buffer = BytesIO()
                thumbnail.save(thumb_buffer, format='JPEG', quality=self.image_quality, optimize=True)
                thumb_content = ContentFile(thumb_buffer.getvalue())
                
                saved_thumb_path = default_storage.save(thumb_path, thumb_content)
                thumb_url = default_storage.url(saved_thumb_path)
                # Ensure we return full URLs for Azure blob storage
                results[size_name] = self._ensure_absolute_url(thumb_url)
                
        return results

    def delete_recipe_images(self, image_urls: Dict[str, str]) -> None:
        """
        Delete recipe images and thumbnails.
        
        Args:
            image_urls: Dictionary with image URLs to delete
        """
        for size_name, url in image_urls.items():
            if url and default_storage.exists(url):
                try:
                    default_storage.delete(url)
                except Exception:
                    # Log error but don't fail the operation
                    pass

    def _ensure_absolute_url(self, url: str) -> str:
        """
        Ensure URL is absolute for Azure blob storage.
        
        Args:
            url: URL that might be relative
            
        Returns:
            Absolute URL
        """
        from django.conf import settings
        
        # If URL is already absolute, return as-is
        if url.startswith(('http://', 'https://')):
            return url
            
        # If using Azure storage, construct full URL
        azure_account = getattr(settings, 'AZURE_STORAGE_ACCOUNT_NAME', None)
        azure_container = getattr(settings, 'AZURE_STORAGE_CONTAINER_NAME', 'media')
        
        if azure_account and url.startswith('/'):
            # Remove leading slash and construct Azure URL
            return f"https://{azure_account}.blob.core.windows.net/{azure_container}{url}"
        
        return url

    def get_supported_formats(self) -> List[str]:
        """
        Get list of supported image formats.
        
        Returns:
            List of supported file extensions
        """
        return self.allowed_extensions.copy()


# Service instance
storage_service = StorageService() 