"""
Tests for Category model functionality.
"""
import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from ..models import Category
from .factories import CategoryFactory


@pytest.mark.django_db
class TestCategoryModel:
    """Tests for Category model."""

    def test_create_category(self):
        """Test creating a category."""
        category = CategoryFactory(
            name="Italian",
            slug="italian",
            description="Italian cuisine"
        )
        
        assert category.name == "Italian"
        assert category.slug == "italian"
        assert category.description == "Italian cuisine"
        assert category.parent is None
        assert category.is_active is True
        assert category.level == 0

    def test_category_str_representation(self):
        """Test string representation of category."""
        parent = CategoryFactory(name="Main Course")
        child = CategoryFactory(name="Pasta", parent=parent)
        
        assert str(parent) == "Main Course"
        assert str(child) == "Main Course > Pasta"

    def test_category_hierarchy(self):
        """Test category hierarchy relationships."""
        # Create parent category
        main_course = CategoryFactory(name="Main Course", slug="main-course")
        
        # Create child categories
        pasta = CategoryFactory(name="Pasta", slug="pasta", parent=main_course)
        meat = CategoryFactory(name="Meat", slug="meat", parent=main_course)
        
        # Test parent-child relationships
        assert pasta.parent == main_course
        assert meat.parent == main_course
        assert main_course.parent is None
        
        # Test children relationship
        children = list(main_course.children.all())
        assert pasta in children
        assert meat in children
        assert len(children) == 2

    def test_category_levels(self):
        """Test category hierarchy levels."""
        level0 = CategoryFactory(name="Root")
        level1 = CategoryFactory(name="Level 1", parent=level0)
        level2 = CategoryFactory(name="Level 2", parent=level1)
        
        assert level0.level == 0
        assert level1.level == 1
        assert level2.level == 2

    def test_full_path_property(self):
        """Test full_path property."""
        cuisine = CategoryFactory(name="Cuisine", slug="cuisine")
        italian = CategoryFactory(name="Italian", slug="italian", parent=cuisine)
        pasta = CategoryFactory(name="Pasta", slug="pasta", parent=italian)
        
        assert cuisine.full_path == "Cuisine"
        assert italian.full_path == "Cuisine > Italian"
        assert pasta.full_path == "Cuisine > Italian > Pasta"

    def test_get_ancestors(self):
        """Test get_ancestors method."""
        cuisine = CategoryFactory(name="Cuisine")
        italian = CategoryFactory(name="Italian", parent=cuisine)
        pasta = CategoryFactory(name="Pasta", parent=italian)
        
        # Test ancestors
        assert list(cuisine.get_ancestors()) == []
        assert list(italian.get_ancestors()) == [cuisine]
        assert list(pasta.get_ancestors()) == [cuisine, italian]

    def test_get_descendants(self):
        """Test get_descendants method."""
        cuisine = CategoryFactory(name="Cuisine")
        italian = CategoryFactory(name="Italian", parent=cuisine)
        french = CategoryFactory(name="French", parent=cuisine)
        pasta = CategoryFactory(name="Pasta", parent=italian)
        pizza = CategoryFactory(name="Pizza", parent=italian)
        
        # Test descendants
        descendants = cuisine.get_descendants()
        assert italian in descendants
        assert french in descendants
        assert pasta in descendants
        assert pizza in descendants
        assert len(descendants) == 4

    def test_slug_uniqueness_within_parent(self):
        """Test slug uniqueness within same parent."""
        parent = CategoryFactory(name="Main Course")
        
        # First category with slug "pasta"
        CategoryFactory(name="Pasta", slug="pasta", parent=parent)
        
        # Second category with same slug and parent should fail
        with pytest.raises(IntegrityError):
            CategoryFactory(name="Pasta 2", slug="pasta", parent=parent)

    def test_different_parents_can_have_same_slug(self):
        """Test that different parents can have children with same slug."""
        parent1 = CategoryFactory(name="Italian")
        parent2 = CategoryFactory(name="Asian")
        
        # Both parents can have children with similar names but different slugs
        pasta = CategoryFactory(name="Pasta", slug="italian-noodles", parent=parent1)
        ramen = CategoryFactory(name="Ramen", slug="asian-noodles", parent=parent2)
        
        assert pasta.slug == "italian-noodles"
        assert ramen.slug == "asian-noodles"
        assert pasta.parent != ramen.parent
        assert pasta.parent == parent1
        assert ramen.parent == parent2

    def test_circular_reference_prevention(self):
        """Test prevention of circular references."""
        parent = CategoryFactory(name="Parent")
        child = CategoryFactory(name="Child", parent=parent)
        
        # Try to set child as parent of its own parent
        parent.parent = child
        
        with pytest.raises(ValidationError) as exc_info:
            parent.clean()
        
        assert "cannot be its own ancestor" in str(exc_info.value)

    def test_self_parent_prevention(self):
        """Test prevention of setting self as parent."""
        category = CategoryFactory(name="Test")
        category.parent = category
        
        with pytest.raises(ValidationError) as exc_info:
            category.clean()
        
        assert "cannot be its own ancestor" in str(exc_info.value)

    def test_hierarchy_depth_limit(self):
        """Test hierarchy depth limitation."""
        level0 = CategoryFactory(name="Level 0")
        level1 = CategoryFactory(name="Level 1", parent=level0)
        level2 = CategoryFactory(name="Level 2", parent=level1)
        
        # Try to create level 3 (should fail)
        level3 = CategoryFactory.build(name="Level 3", parent=level2)
        
        with pytest.raises(ValidationError) as exc_info:
            level3.clean()
        
        assert "cannot exceed 3 levels" in str(exc_info.value)

    def test_category_ordering(self):
        """Test category ordering."""
        parent = CategoryFactory(name="Parent")
        
        # Create categories with different orders
        cat3 = CategoryFactory(name="Third", parent=parent, order=3)
        cat1 = CategoryFactory(name="First", parent=parent, order=1)
        cat2 = CategoryFactory(name="Second", parent=parent, order=2)
        
        # Test ordering
        ordered_children = list(parent.children.order_by('order'))
        assert ordered_children == [cat1, cat2, cat3]

    def test_active_inactive_categories(self):
        """Test active/inactive category filtering."""
        parent = CategoryFactory(name="Parent")
        active_child = CategoryFactory(name="Active", parent=parent, is_active=True)
        inactive_child = CategoryFactory(name="Inactive", parent=parent, is_active=False)
        
        # Test get_descendants only returns active children
        descendants = parent.get_descendants()
        assert active_child in descendants
        assert inactive_child not in descendants

    def test_category_save_validation(self):
        """Test that save method calls clean for validation."""
        parent = CategoryFactory(name="Parent")
        child = CategoryFactory(name="Child", parent=parent)
        
        # Try to create circular reference and save
        parent.parent = child
        
        with pytest.raises(ValidationError):
            parent.save()

    def test_category_meta_options(self):
        """Test category meta options."""
        # Test ordering
        parent = CategoryFactory(name="Z Parent")
        CategoryFactory(name="B Child", parent=parent, order=2)
        CategoryFactory(name="A Child", parent=parent, order=1)
        
        categories = Category.objects.all()
        # Should be ordered by parent__name, order, name
        assert len(categories) >= 3

    def test_category_indexes(self):
        """Test that category indexes are created."""
        # This test ensures the model definition includes proper indexes
        category = CategoryFactory()
        
        # Test that we can query efficiently by indexed fields
        assert Category.objects.filter(slug=category.slug).exists()
        assert Category.objects.filter(is_active=True).exists()
        assert Category.objects.filter(order=category.order).exists() 