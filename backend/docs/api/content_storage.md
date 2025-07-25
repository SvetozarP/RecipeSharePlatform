# Content Storage API

This document describes the content storage and file upload functionality for the Recipe Sharing Platform.

## Overview

The content storage system handles image uploads for recipes, including:
- File validation and security checks
- Image processing and optimization
- Automatic thumbnail generation
- Support for multiple image formats

## Configuration

### Supported Formats
- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)  
- WebP (`.webp`)

### File Limits
- Maximum file size: 5MB
- Image quality: 85% (JPEG compression)

### Thumbnail Sizes
- Small: 150x150px
- Medium: 300x300px  
- Large: 800x600px

## API Endpoints

### Upload Recipe Image

**POST** `/api/v1/recipes/{recipe_id}/upload_image/`

Upload or replace an image for a recipe.

**Request:**
- Content-Type: `multipart/form-data`
- Authentication: Required (recipe owner or admin)

**Parameters:**
- `image` (file, required): Image file to upload

**Response:**
```json
{
  "id": "uuid",
  "title": "Recipe Title",
  "images": {
    "original": "http://example.com/media/recipes/images/originals/recipe_uuid_filename.jpg",
    "small": "http://example.com/media/recipes/images/thumbnails/recipe_uuid_filename_small.jpg",
    "medium": "http://example.com/media/recipes/images/thumbnails/recipe_uuid_filename_medium.jpg",
    "large": "http://example.com/media/recipes/images/thumbnails/recipe_uuid_filename_large.jpg"
  },
  "main_image_url": "http://example.com/media/recipes/images/originals/recipe_uuid_filename.jpg",
  "thumbnail_url": "http://example.com/media/recipes/images/thumbnails/recipe_uuid_filename_medium.jpg",
  "has_images": true
}
```

**Error Responses:**
- `400 Bad Request`: Invalid file, file too large, or unsupported format
- `403 Forbidden`: Not authorized to upload image for this recipe
- `404 Not Found`: Recipe not found

### Remove Recipe Image

**DELETE** `/api/v1/recipes/{recipe_id}/remove_image/`

Remove the current image from a recipe.

**Request:**
- Authentication: Required (recipe owner or admin)

**Response:**
```json
{
  "id": "uuid",
  "title": "Recipe Title",
  "images": {},
  "main_image_url": null,
  "thumbnail_url": null,
  "has_images": false
}
```

**Error Responses:**
- `403 Forbidden`: Not authorized to modify this recipe
- `404 Not Found`: Recipe not found

### Get Supported Formats

**GET** `/api/v1/recipes/supported_formats/`

Get list of supported image formats.

**Request:**
- Authentication: Required

**Response:**
```json
{
  "supported_formats": [".jpg", ".jpeg", ".png", ".webp"]
}
```

### Create Recipe with Image

**POST** `/api/v1/recipes/`

Create a new recipe with optional image upload.

**Request:**
- Content-Type: `multipart/form-data`
- Authentication: Required

**Parameters:**
- `title` (string, required): Recipe title
- `description` (string, required): Recipe description
- `prep_time` (integer, required): Preparation time in minutes
- `cook_time` (integer, required): Cooking time in minutes
- `servings` (integer, required): Number of servings
- `difficulty` (string, required): Difficulty level (easy, medium, hard)
- `cooking_method` (string, required): Cooking method
- `ingredients` (array, required): List of ingredients
- `instructions` (array, required): List of instruction steps
- `image` (file, optional): Recipe image file

**Response:**
```json
{
  "id": "uuid",
  "title": "Recipe Title",
  "description": "Recipe description",
  "images": {
    "original": "...",
    "small": "...",
    "medium": "...",
    "large": "..."
  },
  "main_image_url": "...",
  "thumbnail_url": "...",
  "has_images": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Update Recipe with Image

**PUT/PATCH** `/api/v1/recipes/{recipe_id}/`

Update a recipe with optional image upload or removal.

**Request:**
- Content-Type: `multipart/form-data`
- Authentication: Required (recipe owner or admin)

**Parameters:**
- Any recipe fields to update
- `image` (file, optional): New image file
- `remove_image` (boolean, optional): Set to true to remove existing image

## Image Processing

### Automatic Processing
1. **Validation**: File type, size, and content validation
2. **Optimization**: EXIF rotation, format conversion, quality compression
3. **Thumbnails**: Automatic generation of multiple sizes
4. **Storage**: Organized directory structure

### Directory Structure
```
media/
├── recipes/
│   └── images/
│       ├── originals/
│       │   └── recipe_{uuid}_{filename}.jpg
│       └── thumbnails/
│           ├── recipe_{uuid}_{filename}_small.jpg
│           ├── recipe_{uuid}_{filename}_medium.jpg
│           └── recipe_{uuid}_{filename}_large.jpg
```

### Security Features
- File type validation by content, not just extension
- File size limits to prevent abuse
- Unique filename generation to prevent conflicts
- Automatic image optimization to reduce storage

## Integration Examples

### JavaScript/Fetch API
```javascript
// Upload image to existing recipe
const formData = new FormData();
formData.append('image', imageFile);

fetch(`/api/v1/recipes/${recipeId}/upload_image/`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
.then(response => response.json())
.then(data => {
  console.log('Image uploaded:', data.main_image_url);
});
```

### cURL Examples
```bash
# Upload image
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@recipe_photo.jpg" \
  http://localhost:8000/api/v1/recipes/{recipe_id}/upload_image/

# Remove image
curl -X DELETE \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/recipes/{recipe_id}/remove_image/
```

## Error Handling

### Common Error Codes
- `400`: Bad request (invalid file, size too large, unsupported format)
- `401`: Unauthorized (missing or invalid authentication)
- `403`: Forbidden (not recipe owner or admin)
- `404`: Not found (recipe doesn't exist)
- `413`: Payload too large (file exceeds server limits)
- `415`: Unsupported media type

### Error Response Format
```json
{
  "error": "Brief error description",
  "detail": "Detailed error message"
}
```

## Rate Limiting

File uploads are subject to standard API rate limiting. Large files or multiple uploads may be throttled to prevent abuse.

## Performance Considerations

- Images are processed asynchronously when possible
- Thumbnails are generated on upload, not on request
- Original images are optimized but preserved
- Consider using CDN for production deployments 