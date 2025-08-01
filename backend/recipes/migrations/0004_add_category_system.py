# Generated by Django 4.2.23 on 2025-07-25 23:34

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    dependencies = [
        ("recipes", "0003_remove_recipe_image_url_recipe_images"),
    ]

    operations = [
        migrations.CreateModel(
            name="Category",
            fields=[
                (
                    "created_at",
                    models.DateTimeField(
                        auto_now_add=True, help_text="When this record was created"
                    ),
                ),
                (
                    "updated_at",
                    models.DateTimeField(
                        auto_now=True, help_text="When this record was last updated"
                    ),
                ),
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        help_text="Unique identifier for this category",
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("name", models.CharField(help_text="Category name", max_length=100)),
                (
                    "description",
                    models.TextField(blank=True, help_text="Category description"),
                ),
                (
                    "slug",
                    models.SlugField(
                        help_text="URL-friendly category identifier",
                        max_length=100,
                        unique=True,
                    ),
                ),
                (
                    "icon",
                    models.CharField(
                        blank=True,
                        help_text="Icon class or identifier for the category",
                        max_length=50,
                    ),
                ),
                (
                    "color",
                    models.CharField(
                        blank=True,
                        help_text="Hex color code for category (e.g., #FF5733)",
                        max_length=7,
                    ),
                ),
                (
                    "order",
                    models.PositiveIntegerField(
                        default=0, help_text="Display order within parent category"
                    ),
                ),
                (
                    "is_active",
                    models.BooleanField(
                        default=True,
                        help_text="Whether this category is active and visible",
                    ),
                ),
                (
                    "parent",
                    models.ForeignKey(
                        blank=True,
                        help_text="Parent category for hierarchy",
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="children",
                        to="recipes.category",
                    ),
                ),
            ],
            options={
                "verbose_name": "category",
                "verbose_name_plural": "categories",
                "ordering": ["parent__name", "order", "name"],
            },
        ),
        migrations.AddField(
            model_name="recipe",
            name="categories",
            field=models.ManyToManyField(
                blank=True,
                help_text="Categories this recipe belongs to",
                related_name="recipes",
                to="recipes.category",
            ),
        ),
        migrations.AddIndex(
            model_name="category",
            index=models.Index(fields=["slug"], name="recipes_cat_slug_178eca_idx"),
        ),
        migrations.AddIndex(
            model_name="category",
            index=models.Index(
                fields=["parent"], name="recipes_cat_parent__ccf416_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="category",
            index=models.Index(
                fields=["is_active"], name="recipes_cat_is_acti_c66f7a_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="category",
            index=models.Index(fields=["order"], name="recipes_cat_order_87d5a2_idx"),
        ),
        migrations.AlterUniqueTogether(
            name="category",
            unique_together={("parent", "slug")},
        ),
    ]
