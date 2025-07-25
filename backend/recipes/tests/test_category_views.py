"""
Tests for Category API views and endpoints.
"""
import pytest
import json
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from ..models import Category, Recipe
from .factories import CategoryFactory, RecipeFactory

User = get_user_model()


@pytest.mark.django_db
class TestCategoryViewSet:
    """Tests for CategoryViewSet API endpoints."""

    def setup_method(self):
        """Set up test data."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='adminpass123',
            is_staff=True
        )

    def test_list_categories_anonymous(self):
        """Test listing categories as anonymous user."""
        # Create test categories
        CategoryFactory(name="Active Category", is_active=True)
        CategoryFactory(name="Inactive Category", is_active=False)
        
        url = reverse('category-list')
        response = self.client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        # CategoryViewSet uses ModelViewSet with pagination
        if 'results' in response.data:
            assert len(response.data['results']) == 1  # Only active category should be visible
            assert response.data['results'][0]['name'] == "Active Category"
        else:
            assert len(response.data) == 1  # Only active category should be visible
            assert response.data[0]['name'] == "Active Category"

    def test_list_categories_authenticated(self):
        """Test listing categories as authenticated user."""
        CategoryFactory(name="Active Category", is_active=True)
        CategoryFactory(name="Inactive Category", is_active=False)
        
        self.client.force_authenticate(user=self.user)
        url = reverse('category-list')
        response = self.client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        # CategoryViewSet uses ModelViewSet with pagination
        if 'results' in response.data:
            assert len(response.data['results']) == 1  # Only active category should be visible
        else:
            assert len(response.data) == 1  # Only active category should be visible

    def test_list_categories_admin(self):
        """Test listing categories as admin user."""
        CategoryFactory(name="Active Category", is_active=True)
        CategoryFactory(name="Inactive Category", is_active=False)
        
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('category-list')
        response = self.client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        # CategoryViewSet uses ModelViewSet with pagination
        if 'results' in response.data:
            assert len(response.data['results']) == 2  # Admin should see all categories
        else:
            assert len(response.data) == 2  # Admin should see all categories

    def test_retrieve_category_by_slug(self):
        """Test retrieving a category by slug."""
        category = CategoryFactory(name="Test Category", slug="test-category")
        
        url = reverse('category-detail', kwargs={'slug': category.slug})
        response = self.client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == "Test Category"
        assert response.data['slug'] == "test-category"

    def test_create_category_anonymous(self):
        """Test creating category as anonymous user."""
        url = reverse('category-list')
        data = {
            'name': 'New Category',
            'description': 'A new category',
            'slug': 'new-category'
        }
        
        response = self.client.post(url, data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_category_authenticated(self):
        """Test creating category as authenticated user."""
        self.client.force_authenticate(user=self.user)
        
        url = reverse('category-list')
        data = {
            'name': 'New Category',
            'description': 'A new category',
            'slug': 'new-category',
            'icon': 'utensils',
            'color': '#FF5733'
        }
        
        response = self.client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        
        # Verify category was created
        category = Category.objects.get(slug='new-category')
        assert category.name == 'New Category'
        assert category.icon == 'utensils'
        assert category.color == '#FF5733'

    def test_create_category_auto_slug(self):
        """Test creating category with auto-generated slug."""
        self.client.force_authenticate(user=self.user)
        
        url = reverse('category-list')
        data = {
            'name': 'Auto Slug Category',
            'description': 'Category with auto-generated slug'
        }
        
        response = self.client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        
        # Verify slug was auto-generated
        category = Category.objects.get(name='Auto Slug Category')
        assert category.slug == 'auto-slug-category'

    def test_create_category_with_parent(self):
        """Test creating child category."""
        parent = CategoryFactory(name="Parent Category")
        self.client.force_authenticate(user=self.user)
        
        url = reverse('category-list')
        data = {
            'name': 'Child Category',
            'slug': 'child-category',
            'parent': str(parent.id)
        }
        
        response = self.client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        
        child = Category.objects.get(slug='child-category')
        assert child.parent == parent
        assert child.level == 1

    def test_update_category(self):
        """Test updating category."""
        category = CategoryFactory(name="Original Name")
        self.client.force_authenticate(user=self.user)
        
        url = reverse('category-detail', kwargs={'slug': category.slug})
        data = {
            'name': 'Updated Name',
            'description': 'Updated description',
            'color': '#00FF00'
        }
        
        response = self.client.patch(url, data)
        assert response.status_code == status.HTTP_200_OK
        
        category.refresh_from_db()
        assert category.name == 'Updated Name'
        assert category.description == 'Updated description'
        assert category.color == '#00FF00'

    def test_delete_category(self):
        """Test deleting category."""
        category = CategoryFactory(name="To Delete")
        self.client.force_authenticate(user=self.user)
        
        url = reverse('category-detail', kwargs={'slug': category.slug})
        response = self.client.delete(url)
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Category.objects.filter(id=category.id).exists()

    def test_category_tree_endpoint(self):
        """Test category tree endpoint."""
        # Create hierarchy
        root1 = CategoryFactory(name="Root 1", order=1)
        root2 = CategoryFactory(name="Root 2", order=2)
        child1 = CategoryFactory(name="Child 1", parent=root1, order=1)
        child2 = CategoryFactory(name="Child 2", parent=root1, order=2)
        grandchild = CategoryFactory(name="Grandchild", parent=child1)
        
        url = reverse('category-tree')
        response = self.client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2  # Two root categories
        
        # Check tree structure
        root1_data = next(item for item in response.data if item['name'] == 'Root 1')
        assert len(root1_data['children']) == 2
        
        child1_data = next(item for item in root1_data['children'] if item['name'] == 'Child 1')
        assert len(child1_data['children']) == 1
        assert child1_data['children'][0]['name'] == 'Grandchild'

    def test_category_recipes_endpoint(self):
        """Test getting recipes for a category."""
        category = CategoryFactory(name="Test Category")
        recipe1 = RecipeFactory(title="Recipe 1", is_published=True)
        recipe2 = RecipeFactory(title="Recipe 2", is_published=True)
        recipe3 = RecipeFactory(title="Recipe 3", is_published=False)  # Unpublished
        
        # Add recipes to category
        recipe1.categories.add(category)
        recipe2.categories.add(category)
        recipe3.categories.add(category)
        
        url = reverse('category-recipes', kwargs={'slug': category.slug})
        response = self.client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2  # Only published recipes
        
        recipe_titles = [recipe['title'] for recipe in response.data]
        assert "Recipe 1" in recipe_titles
        assert "Recipe 2" in recipe_titles
        assert "Recipe 3" not in recipe_titles

    def test_category_recipes_with_descendants(self):
        """Test getting recipes from category and its descendants."""
        parent = CategoryFactory(name="Parent")
        child = CategoryFactory(name="Child", parent=parent)
        
        parent_recipe = RecipeFactory(title="Parent Recipe", is_published=True)
        child_recipe = RecipeFactory(title="Child Recipe", is_published=True)
        
        parent_recipe.categories.add(parent)
        child_recipe.categories.add(child)
        
        # Test without descendants
        url = reverse('category-recipes', kwargs={'slug': parent.slug})
        response = self.client.get(url, {'include_descendants': 'false'})
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['title'] == "Parent Recipe"
        
        # Test with descendants
        response = self.client.get(url, {'include_descendants': 'true'})
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
        
        titles = [recipe['title'] for recipe in response.data]
        assert "Parent Recipe" in titles
        assert "Child Recipe" in titles

    def test_reorder_categories_admin(self):
        """Test reordering categories as admin."""
        parent = CategoryFactory(name="Parent")
        cat1 = CategoryFactory(name="Cat 1", parent=parent, order=1)
        cat2 = CategoryFactory(name="Cat 2", parent=parent, order=2)
        cat3 = CategoryFactory(name="Cat 3", parent=parent, order=3)
        
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse('category-reorder', kwargs={'slug': parent.slug})
        data = {
            'orders': [
                {'id': str(cat3.id), 'order': 1},
                {'id': str(cat1.id), 'order': 2},
                {'id': str(cat2.id), 'order': 3}
            ]
        }
        
        response = self.client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        
        # Verify order was updated
        cat1.refresh_from_db()
        cat2.refresh_from_db()
        cat3.refresh_from_db()
        
        assert cat3.order == 1
        assert cat1.order == 2
        assert cat2.order == 3

    def test_reorder_categories_non_admin(self):
        """Test reordering categories as non-admin user."""
        parent = CategoryFactory(name="Parent")
        self.client.force_authenticate(user=self.user)
        
        url = reverse('category-reorder', kwargs={'slug': parent.slug})
        data = {'orders': []}
        
        response = self.client.post(url, data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_search_categories(self):
        """Test searching categories."""
        CategoryFactory(name="Italian Cuisine", description="Traditional Italian food")
        CategoryFactory(name="Asian Cuisine", description="Traditional Asian food")
        CategoryFactory(name="Desserts", description="Sweet treats")
        
        url = reverse('category-list')
        response = self.client.get(url, {'search': 'Italian'})
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['name'] == "Italian Cuisine"

    def test_filter_categories_by_parent(self):
        """Test filtering categories by parent."""
        parent = CategoryFactory(name="Main Course")
        child1 = CategoryFactory(name="Pasta", parent=parent)
        child2 = CategoryFactory(name="Meat", parent=parent)
        CategoryFactory(name="Dessert")  # No parent
        
        url = reverse('category-list')
        response = self.client.get(url, {'parent': str(parent.id)})
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
        
        names = [cat['name'] for cat in response.data]
        assert "Pasta" in names
        assert "Meat" in names

    def test_validation_errors(self):
        """Test validation errors in category creation."""
        self.client.force_authenticate(user=self.user)
        
        # Test duplicate slug within same parent
        parent = CategoryFactory(name="Parent")
        CategoryFactory(name="Existing", slug="existing", parent=parent)
        
        url = reverse('category-list')
        data = {
            'name': 'Duplicate',
            'slug': 'existing',
            'parent': str(parent.id)
        }
        
        response = self.client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'slug' in response.data

    def test_circular_reference_validation(self):
        """Test circular reference validation."""
        parent = CategoryFactory(name="Parent")
        child = CategoryFactory(name="Child", parent=parent)
        
        self.client.force_authenticate(user=self.user)
        
        # Try to update parent to be child of its own child
        url = reverse('category-detail', kwargs={'slug': parent.slug})
        data = {'parent': str(child.id)}
        
        response = self.client.patch(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'parent' in response.data 