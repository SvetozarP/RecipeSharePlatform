"""
Recipe search service for advanced search and filtering capabilities.
"""
from typing import List, Dict, Any, Optional, Tuple
from django.db.models import Q, Count, Avg, F, Case, When, IntegerField, Value
from django.core.cache import cache
from django.db import models, connection
import re
from collections import Counter

from ..models import Recipe, Category
from accounts.models import User

# Check if PostgreSQL is available for full-text search
try:
    from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
    HAS_POSTGRES_SEARCH = True
except ImportError:
    HAS_POSTGRES_SEARCH = False


class RecipeSearchService:
    """
    Advanced search service for recipes with full-text search, 
    filtering, ranking, and autocomplete capabilities.
    """
    
    def __init__(self):
        self.search_cache_timeout = 300  # 5 minutes
    
    def full_text_search(
        self, 
        query: str, 
        filters: Optional[Dict[str, Any]] = None,
        order_by: str = 'relevance'
    ) -> models.QuerySet:
        """
        Perform full-text search on recipes with PostgreSQL full-text search or fallback.
        
        Args:
            query: Search query string
            filters: Additional filtering options
            order_by: Ordering method ('relevance', 'created_at', 'rating', etc.)
            
        Returns:
            QuerySet of recipes ordered by relevance or specified field
        """
        if not query:
            return Recipe.objects.none()
        
        # Base queryset with published recipes
        queryset = Recipe.objects.select_related('author').prefetch_related(
            'categories', 'ratings'
        ).filter(is_published=True)
        
        # Use PostgreSQL full-text search if available, otherwise fallback to basic search
        if HAS_POSTGRES_SEARCH and connection.vendor == 'postgresql':
            # Create search vector for multiple fields with different weights
            search_vector = (
                SearchVector('title', weight='A') +
                SearchVector('description', weight='B') +
                SearchVector('tags', weight='C') +
                SearchVector('categories__name', weight='D')
            )
            
            # Create search query
            search_query = SearchQuery(query)
            
            # Apply full-text search
            queryset = queryset.annotate(
                search=search_vector,
                rank=SearchRank(search_vector, search_query)
            ).filter(search=search_query)
        else:
            # Fallback to basic text search for SQLite/MySQL
            queryset = self._apply_text_search(queryset, query)
            
            # Add a basic relevance score based on title matches
            queryset = queryset.annotate(
                rank=Case(
                    When(title__icontains=query, then=Value(1.0)),
                    When(description__icontains=query, then=Value(0.8)),
                    When(tags__icontains=query, then=Value(0.6)),
                    default=Value(0.4),
                    output_field=models.FloatField()
                )
            )
        
        # Apply additional filters
        if filters:
            queryset = self._apply_filters(queryset, filters)
        
        # Apply ordering
        queryset = self._apply_ordering(queryset, order_by)
        
        return queryset.distinct()
    
    def advanced_search(
        self,
        query: Optional[str] = None,
        ingredients: Optional[List[str]] = None,
        exclude_ingredients: Optional[List[str]] = None,
        categories: Optional[List[str]] = None,
        difficulty: Optional[str] = None,
        cooking_method: Optional[str] = None,
        max_prep_time: Optional[int] = None,
        max_cook_time: Optional[int] = None,
        max_total_time: Optional[int] = None,
        min_servings: Optional[int] = None,
        max_servings: Optional[int] = None,
        dietary_restrictions: Optional[List[str]] = None,
        author: Optional[str] = None,
        min_rating: Optional[float] = None,
        has_nutrition_info: Optional[bool] = None,
        tags: Optional[List[str]] = None,
        order_by: str = 'relevance'
    ) -> models.QuerySet:
        """
        Perform advanced search with multiple filter criteria.
        
        Args:
            query: Text search query
            ingredients: Required ingredients
            exclude_ingredients: Ingredients to exclude
            categories: Category slugs or names
            difficulty: Recipe difficulty level
            cooking_method: Cooking method
            max_prep_time: Maximum preparation time in minutes
            max_cook_time: Maximum cooking time in minutes
            max_total_time: Maximum total time in minutes
            min_servings: Minimum servings
            max_servings: Maximum servings
            dietary_restrictions: Dietary restrictions (vegetarian, vegan, gluten-free, etc.)
            author: Author username or ID
            min_rating: Minimum average rating
            has_nutrition_info: Whether recipe has nutrition information
            tags: Required tags
            order_by: Ordering method
            
        Returns:
            QuerySet of filtered recipes
        """
        # Start with published recipes
        queryset = Recipe.objects.select_related('author').prefetch_related(
            'categories', 'ratings'
        ).filter(is_published=True)
        
        # Text search
        if query:
            queryset = self._apply_text_search(queryset, query)
        
        # Ingredient filtering
        if ingredients:
            queryset = self._filter_by_ingredients(queryset, ingredients, include=True)
        
        if exclude_ingredients:
            queryset = self._filter_by_ingredients(queryset, exclude_ingredients, include=False)
        
        # Category filtering
        if categories:
            queryset = self._filter_by_categories(queryset, categories)
        
        # Basic field filtering
        filters = {
            'difficulty': difficulty,
            'cooking_method': cooking_method,
            'author': author,
            'has_nutrition_info': has_nutrition_info,
        }
        queryset = self._apply_filters(queryset, {k: v for k, v in filters.items() if v is not None})
        
        # Time filtering
        if max_prep_time:
            queryset = queryset.filter(prep_time__lte=max_prep_time)
        
        if max_cook_time:
            queryset = queryset.filter(cook_time__lte=max_cook_time)
        
        if max_total_time:
            queryset = queryset.annotate(
                total_time_calc=F('prep_time') + F('cook_time')
            ).filter(total_time_calc__lte=max_total_time)
        
        # Servings filtering
        if min_servings:
            queryset = queryset.filter(servings__gte=min_servings)
        
        if max_servings:
            queryset = queryset.filter(servings__lte=max_servings)
        
        # Dietary restrictions
        if dietary_restrictions:
            queryset = self._filter_by_dietary_restrictions(queryset, dietary_restrictions)
        
        # Rating filtering
        if min_rating:
            queryset = queryset.annotate(
                _min_rating_filter=Avg('ratings__rating')
            ).filter(_min_rating_filter__gte=min_rating)
        
        # Tags filtering
        if tags:
            queryset = self._filter_by_tags(queryset, tags)
        
        # Apply ordering
        queryset = self._apply_ordering(queryset, order_by)
        
        return queryset.distinct()
    
    def get_search_suggestions(self, query: str, limit: int = 10) -> Dict[str, List[str]]:
        """
        Get search suggestions for autocomplete functionality.
        
        Args:
            query: Partial search query
            limit: Maximum number of suggestions per category
            
        Returns:
            Dictionary with suggestion categories and lists
        """
        cache_key = f"search_suggestions_{query.lower()}_{limit}"
        cached_result = cache.get(cache_key)
        if cached_result:
            return cached_result
        
        suggestions = {
            'recipes': [],
            'ingredients': [],
            'categories': [],
            'tags': [],
            'authors': []
        }
        
        if len(query) < 2:
            return suggestions
        
        # Recipe title suggestions
        recipe_titles = Recipe.objects.filter(
            is_published=True,
            title__icontains=query
        ).values_list('title', flat=True)[:limit]
        suggestions['recipes'] = list(recipe_titles)
        
        # Ingredient suggestions (search in JSON field)
        ingredients = self._get_ingredient_suggestions(query, limit)
        suggestions['ingredients'] = ingredients
        
        # Category suggestions
        categories = Category.objects.filter(
            name__icontains=query,
            is_active=True
        ).values_list('name', flat=True)[:limit]
        suggestions['categories'] = list(categories)
        
        # Tag suggestions
        tags = self._get_tag_suggestions(query, limit)
        suggestions['tags'] = tags
        
        # Author suggestions
        authors = User.objects.filter(
            Q(username__icontains=query) | Q(first_name__icontains=query) | Q(last_name__icontains=query),
            recipes__is_published=True
        ).distinct().values_list('username', flat=True)[:limit]
        suggestions['authors'] = list(authors)
        
        # Cache the results
        cache.set(cache_key, suggestions, self.search_cache_timeout)
        
        return suggestions
    
    def get_popular_searches(self, limit: int = 10) -> List[str]:
        """
        Get list of popular search terms based on recipe content analysis.
        
        Args:
            limit: Maximum number of popular searches to return
            
        Returns:
            List of popular search terms
        """
        cache_key = f"popular_searches_{limit}"
        cached_result = cache.get(cache_key)
        if cached_result:
            return cached_result
        
        # Get most common ingredients
        common_ingredients = self._get_common_ingredients(limit // 2)
        
        # Get most popular categories
        popular_categories = Category.objects.annotate(
            recipe_count=Count('recipes', filter=Q(recipes__is_published=True))
        ).filter(
            is_active=True,
            recipe_count__gt=0
        ).order_by('-recipe_count').values_list('name', flat=True)[:limit // 2]
        
        popular_searches = common_ingredients + list(popular_categories)
        
        # Cache for 1 hour
        cache.set(cache_key, popular_searches, 3600)
        
        return popular_searches
    
    def _apply_text_search(self, queryset: models.QuerySet, query: str) -> models.QuerySet:
        """Apply text search to queryset."""
        return queryset.filter(
            Q(title__icontains=query) |
            Q(description__icontains=query) |
            Q(tags__icontains=query) |
            Q(categories__name__icontains=query)
        )
    
    def _filter_by_ingredients(
        self, 
        queryset: models.QuerySet, 
        ingredients: List[str], 
        include: bool = True
    ) -> models.QuerySet:
        """Filter recipes by ingredients (include or exclude)."""
        for ingredient in ingredients:
            ingredient_filter = Q(ingredients__icontains=ingredient.lower())
            if include:
                queryset = queryset.filter(ingredient_filter)
            else:
                queryset = queryset.exclude(ingredient_filter)
        return queryset
    
    def _filter_by_categories(self, queryset: models.QuerySet, categories: List[str]) -> models.QuerySet:
        """Filter recipes by categories (slug or name)."""
        category_filter = Q()
        for category in categories:
            category_filter |= Q(categories__slug=category) | Q(categories__name__icontains=category)
        return queryset.filter(category_filter)
    
    def _filter_by_dietary_restrictions(
        self, 
        queryset: models.QuerySet, 
        restrictions: List[str]
    ) -> models.QuerySet:
        """Filter recipes by dietary restrictions."""
        dietary_map = {
            'vegetarian': ['vegetarian', 'veggie'],
            'vegan': ['vegan'],
            'gluten-free': ['gluten-free', 'gluten free', 'gf'],
            'dairy-free': ['dairy-free', 'dairy free', 'lactose-free'],
            'nut-free': ['nut-free', 'nut free'],
            'low-carb': ['low-carb', 'low carb', 'keto'],
            'paleo': ['paleo'],
            'keto': ['keto', 'ketogenic'],
        }
        
        for restriction in restrictions:
            if restriction.lower() in dietary_map:
                terms = dietary_map[restriction.lower()]
                restriction_filter = Q()
                for term in terms:
                    restriction_filter |= (
                        Q(tags__icontains=term) |
                        Q(description__icontains=term) |
                        Q(categories__name__icontains=term)
                    )
                queryset = queryset.filter(restriction_filter)
        
        return queryset
    
    def _filter_by_tags(self, queryset: models.QuerySet, tags: List[str]) -> models.QuerySet:
        """Filter recipes by tags."""
        for tag in tags:
            queryset = queryset.filter(tags__icontains=tag.lower())
        return queryset
    
    def _apply_filters(self, queryset: models.QuerySet, filters: Dict[str, Any]) -> models.QuerySet:
        """Apply basic field filters to queryset."""
        for field, value in filters.items():
            if value is not None:
                if field == 'author':
                    # Handle author by username or ID
                    if isinstance(value, str) and not value.isdigit():
                        queryset = queryset.filter(author__username=value)
                    else:
                        queryset = queryset.filter(author__id=value)
                elif field == 'has_nutrition_info':
                    if value:
                        queryset = queryset.exclude(nutrition_info__isnull=True)
                    else:
                        queryset = queryset.filter(nutrition_info__isnull=True)
                else:
                    queryset = queryset.filter(**{field: value})
        return queryset
    
    def _apply_ordering(self, queryset: models.QuerySet, order_by: str) -> models.QuerySet:
        """Apply ordering to queryset."""
        if order_by == 'relevance':
            # Check if queryset has rank annotation
            try:
                return queryset.order_by('-rank', '-created_at')
            except Exception:
                # Fallback to created_at if rank is not available
                return queryset.order_by('-created_at')
        elif order_by == 'rating':
            from django.db.models.functions import Coalesce
            from django.db.models import Value
            return queryset.annotate(
                _avg_rating_sort=Coalesce(Avg('ratings__rating'), Value(0.0)),
                _rating_count_sort=Count('ratings')
            ).order_by('-_avg_rating_sort', '-_rating_count_sort', '-created_at')
        elif order_by == 'popularity':
            return queryset.annotate(
                _rating_count_sort=Count('ratings')
            ).order_by('-_rating_count_sort', '-created_at')
        elif order_by == 'newest':
            return queryset.order_by('-created_at')
        elif order_by == 'oldest':
            return queryset.order_by('created_at')
        elif order_by == 'title':
            return queryset.order_by('title')
        elif order_by == 'cook_time':
            return queryset.order_by('cook_time')
        elif order_by == 'prep_time':
            return queryset.order_by('prep_time')
        elif order_by == 'total_time':
            return queryset.annotate(
                _total_time_sort=F('prep_time') + F('cook_time')
            ).order_by('_total_time_sort')
        else:
            return queryset.order_by('-created_at')
    
    def _get_ingredient_suggestions(self, query: str, limit: int) -> List[str]:
        """Get ingredient suggestions from recipe data."""
        # Get all ingredients from published recipes
        recipes = Recipe.objects.filter(is_published=True).values_list('ingredients', flat=True)
        
        all_ingredients = []
        for recipe_ingredients in recipes:
            if isinstance(recipe_ingredients, list):
                for ingredient in recipe_ingredients:
                    if isinstance(ingredient, str):
                        # Extract ingredient name (remove quantities)
                        cleaned = self._clean_ingredient_name(ingredient)
                        if query.lower() in cleaned.lower():
                            all_ingredients.append(cleaned)
        
        # Get most common matching ingredients
        ingredient_counts = Counter(all_ingredients)
        return [ingredient for ingredient, count in ingredient_counts.most_common(limit)]
    
    def _get_tag_suggestions(self, query: str, limit: int) -> List[str]:
        """Get tag suggestions from recipe data."""
        recipes = Recipe.objects.filter(is_published=True).values_list('tags', flat=True)
        
        all_tags = []
        for recipe_tags in recipes:
            if isinstance(recipe_tags, list):
                for tag in recipe_tags:
                    if isinstance(tag, str) and query.lower() in tag.lower():
                        all_tags.append(tag)
        
        tag_counts = Counter(all_tags)
        return [tag for tag, count in tag_counts.most_common(limit)]
    
    def _get_common_ingredients(self, limit: int) -> List[str]:
        """Get most commonly used ingredients."""
        recipes = Recipe.objects.filter(is_published=True).values_list('ingredients', flat=True)
        
        all_ingredients = []
        for recipe_ingredients in recipes:
            if isinstance(recipe_ingredients, list):
                for ingredient in recipe_ingredients:
                    if isinstance(ingredient, str):
                        cleaned = self._clean_ingredient_name(ingredient)
                        all_ingredients.append(cleaned)
        
        ingredient_counts = Counter(all_ingredients)
        return [ingredient for ingredient, count in ingredient_counts.most_common(limit)]
    
    def _clean_ingredient_name(self, ingredient: str) -> str:
        """Clean ingredient name by removing quantities and measurements."""
        # Remove common measurements and numbers
        cleaned = re.sub(r'\d+', '', ingredient)  # Remove numbers
        cleaned = re.sub(r'\b(cups?|tbsp|tsp|oz|lbs?|grams?|kg|ml|liters?)\b', '', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'\b(chopped|diced|sliced|minced|grated)\b', '', cleaned, flags=re.IGNORECASE)
        cleaned = cleaned.strip(' ,-')
        return cleaned.title()


# Create a singleton instance
search_service = RecipeSearchService() 