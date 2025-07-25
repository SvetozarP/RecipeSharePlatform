"""
Tests for content storage functionality.
"""
import os
import tempfile
from io import BytesIO
from unittest.mock import patch, MagicMock

from django.test import TestCase, override_settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.exceptions import ValidationError
from PIL import Image

from core.services.storage_service import StorageService, storage_service
from ..models import Recipe
from .factories import RecipeFactory
from accounts.tests.factories import UserFactory


class StorageServiceTest(TestCase):
    """Test cases for StorageService."""

    def setUp(self):
        """Set up test data."""
        self.service = StorageService()
        self.user = UserFactory()

    def create_test_image(self, width=100, height=100, format='JPEG', mode='RGB'):
        """Create a test image file."""
        image = Image.new(mode, (width, height), color='red')
        image_io = BytesIO()
        image.save(image_io, format=format)
        image_io.seek(0)
        return SimpleUploadedFile(
            f"test.{format.lower()}",
            image_io.getvalue(),
            content_type=f"image/{format.lower()}"
        )

    def test_validate_image_file_valid(self):
        """Test validating a valid image file."""
        image_file = self.create_test_image()
        
        # Should not raise any exception
        self.service.validate_image_file(image_file)

    def test_validate_image_file_no_file(self):
        """Test validation with no file provided."""
        with self.assertRaises(ValidationError) as cm:
            self.service.validate_image_file(None)
        
        self.assertIn("No file provided", str(cm.exception))

    def test_validate_image_file_too_large(self):
        """Test validation with file too large."""
        # Create a large file (mock size)
        image_file = self.create_test_image()
        image_file.size = 10 * 1024 * 1024  # 10MB
        
        with self.assertRaises(ValidationError) as cm:
            self.service.validate_image_file(image_file)
        
        self.assertIn("File size exceeds", str(cm.exception))

    def test_validate_image_file_wrong_extension(self):
        """Test validation with wrong file extension."""
        image_file = SimpleUploadedFile(
            "test.txt",
            b"fake content",
            content_type="text/plain"
        )
        
        with self.assertRaises(ValidationError) as cm:
            self.service.validate_image_file(image_file)
        
        self.assertIn("File type not allowed", str(cm.exception))

    def test_validate_image_file_invalid_content(self):
        """Test validation with invalid image content."""
        fake_image = SimpleUploadedFile(
            "test.jpg",
            b"fake image content",
            content_type="image/jpeg"
        )
        
        with self.assertRaises(ValidationError) as cm:
            self.service.validate_image_file(fake_image)
        
        self.assertIn("Invalid image file", str(cm.exception))

    def test_generate_unique_filename(self):
        """Test unique filename generation."""
        filename1 = self.service.generate_unique_filename("test.jpg")
        filename2 = self.service.generate_unique_filename("test.jpg")
        
        # Should be different
        self.assertNotEqual(filename1, filename2)
        
        # Should preserve extension
        self.assertTrue(filename1.endswith('.jpg'))
        self.assertTrue(filename2.endswith('.jpg'))

    def test_generate_unique_filename_with_prefix(self):
        """Test unique filename generation with prefix."""
        filename = self.service.generate_unique_filename("test.jpg", "recipe_123")
        
        self.assertTrue(filename.startswith("recipe_123_"))
        self.assertTrue(filename.endswith(".jpg"))

    def test_optimize_image_rgba_to_rgb(self):
        """Test image optimization for RGBA images."""
        # Create RGBA image
        rgba_image = Image.new('RGBA', (100, 100), (255, 0, 0, 128))
        
        optimized = self.service.optimize_image(rgba_image)
        
        self.assertEqual(optimized.mode, 'RGB')
        self.assertEqual(optimized.size, (100, 100))

    def test_create_thumbnail(self):
        """Test thumbnail creation."""
        image = Image.new('RGB', (800, 600), 'red')
        
        thumbnail = self.service.create_thumbnail(image, (150, 150))
        
        # Should maintain aspect ratio and fit within bounds
        self.assertLessEqual(thumbnail.width, 150)
        self.assertLessEqual(thumbnail.height, 150)

    @patch('core.services.storage_service.default_storage')
    def test_save_image_with_thumbnails(self, mock_storage):
        """Test saving image with thumbnails."""
        mock_storage.save.return_value = 'saved/path/test.jpg'
        mock_storage.url.return_value = 'http://example.com/media/saved/path/test.jpg'
        
        image_file = self.create_test_image()
        recipe_id = "test-recipe-id"
        
        result = self.service.save_image_with_thumbnails(image_file, recipe_id)
        
        # Should return URLs for original and thumbnails
        self.assertIn('original', result)
        self.assertIn('small', result)
        self.assertIn('medium', result)
        self.assertIn('large', result)
        
        # Should have called storage save multiple times
        self.assertEqual(mock_storage.save.call_count, 4)  # 1 original + 3 thumbnails

    @patch('core.services.storage_service.default_storage')
    def test_delete_recipe_images(self, mock_storage):
        """Test deleting recipe images."""
        mock_storage.exists.return_value = True
        
        image_urls = {
            'original': 'http://example.com/media/original.jpg',
            'small': 'http://example.com/media/small.jpg',
            'medium': 'http://example.com/media/medium.jpg',
            'large': 'http://example.com/media/large.jpg'
        }
        
        self.service.delete_recipe_images(image_urls)
        
        # Should check existence and delete each file
        self.assertEqual(mock_storage.exists.call_count, 4)
        self.assertEqual(mock_storage.delete.call_count, 4)

    def test_get_supported_formats(self):
        """Test getting supported formats."""
        formats = self.service.get_supported_formats()
        
        self.assertIsInstance(formats, list)
        self.assertIn('.jpg', formats)
        self.assertIn('.png', formats)


class RecipeImageUploadTest(TestCase):
    """Test cases for recipe image upload functionality."""

    def setUp(self):
        """Set up test data."""
        self.user = UserFactory()
        self.recipe = RecipeFactory(author=self.user)

    def create_test_image(self, format='JPEG'):
        """Create a test image file."""
        image = Image.new('RGB', (100, 100), color='red')
        image_io = BytesIO()
        image.save(image_io, format=format)
        image_io.seek(0)
        return SimpleUploadedFile(
            f"test.{format.lower()}",
            image_io.getvalue(),
            content_type=f"image/{format.lower()}"
        )

    def test_recipe_main_image_url_property(self):
        """Test recipe main image URL property."""
        # No images
        self.assertIsNone(self.recipe.main_image_url)
        
        # With images
        self.recipe.images = {'original': 'http://example.com/image.jpg'}
        self.recipe.save()
        
        self.assertEqual(self.recipe.main_image_url, 'http://example.com/image.jpg')

    def test_recipe_thumbnail_url_property(self):
        """Test recipe thumbnail URL property."""
        # No images
        self.assertIsNone(self.recipe.thumbnail_url)
        
        # With images
        self.recipe.images = {'medium': 'http://example.com/thumb.jpg'}
        self.recipe.save()
        
        self.assertEqual(self.recipe.thumbnail_url, 'http://example.com/thumb.jpg')

    def test_recipe_has_images_method(self):
        """Test recipe has_images method."""
        # No images
        self.assertFalse(self.recipe.has_images())
        
        # Empty images dict
        self.recipe.images = {}
        self.assertFalse(self.recipe.has_images())
        
        # With images
        self.recipe.images = {'original': 'http://example.com/image.jpg'}
        self.assertTrue(self.recipe.has_images())

    def test_recipe_save_version_increment(self):
        """Test that recipe version increments on content changes."""
        original_version = self.recipe.version
        
        # Change content
        self.recipe.title = "Updated Title"
        self.recipe.save()
        
        self.assertEqual(self.recipe.version, original_version + 1)

    def test_recipe_save_no_version_increment_for_image_only(self):
        """Test that version doesn't increment for image-only changes."""
        original_version = self.recipe.version
        
        # Change only images
        self.recipe.images = {'original': 'http://example.com/new.jpg'}
        self.recipe.save()
        
        # Version should not increment for image changes
        self.assertEqual(self.recipe.version, original_version)


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class RecipeViewImageUploadTest(TestCase):
    """Test cases for recipe view image upload endpoints."""

    def setUp(self):
        """Set up test data."""
        self.user = UserFactory()
        self.recipe = RecipeFactory(author=self.user)
        self.client.force_login(self.user)

    def create_test_image(self):
        """Create a test image file."""
        image = Image.new('RGB', (100, 100), color='red')
        image_io = BytesIO()
        image.save(image_io, format='JPEG')
        image_io.seek(0)
        return SimpleUploadedFile(
            "test.jpg",
            image_io.getvalue(),
            content_type="image/jpeg"
        )

    def test_upload_image_endpoint(self):
        """Test the upload image endpoint."""
        url = f'/api/v1/recipes/{self.recipe.id}/upload_image/'
        image_file = self.create_test_image()
        
        response = self.client.post(url, {'image': image_file}, format='multipart')
        
        self.assertEqual(response.status_code, 200)
        
        # Refresh recipe from DB
        self.recipe.refresh_from_db()
        self.assertTrue(self.recipe.has_images())

    def test_upload_image_no_permission(self):
        """Test upload image without permission."""
        other_user = UserFactory()
        self.client.force_login(other_user)
        
        url = f'/api/v1/recipes/{self.recipe.id}/upload_image/'
        image_file = self.create_test_image()
        
        response = self.client.post(url, {'image': image_file}, format='multipart')
        
        self.assertEqual(response.status_code, 403)

    def test_upload_image_no_file(self):
        """Test upload image without file."""
        url = f'/api/v1/recipes/{self.recipe.id}/upload_image/'
        
        response = self.client.post(url, {}, format='multipart')
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('No image file provided', response.data['error'])

    def test_remove_image_endpoint(self):
        """Test the remove image endpoint."""
        # Add image first
        self.recipe.images = {'original': 'http://example.com/test.jpg'}
        self.recipe.save()
        
        url = f'/api/v1/recipes/{self.recipe.id}/remove_image/'
        
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, 200)
        
        # Refresh recipe from DB
        self.recipe.refresh_from_db()
        self.assertFalse(self.recipe.has_images())

    def test_supported_formats_endpoint(self):
        """Test the supported formats endpoint."""
        url = '/api/v1/recipes/supported_formats/'
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('supported_formats', response.data)
        self.assertIsInstance(response.data['supported_formats'], list) 