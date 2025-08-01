# Generated by Django 4.2.23 on 2025-08-01 20:09

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("recipes", "0008_alter_rating_review"),
    ]

    operations = [
        migrations.CreateModel(
            name="RecipeView",
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
                        help_text="Unique identifier for this view",
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "ip_address",
                    models.GenericIPAddressField(
                        blank=True, help_text="IP address of the viewer", null=True
                    ),
                ),
                (
                    "user_agent",
                    models.TextField(
                        blank=True, help_text="User agent string of the viewer"
                    ),
                ),
                (
                    "session_key",
                    models.CharField(
                        blank=True,
                        help_text="Session key for anonymous users",
                        max_length=40,
                    ),
                ),
                (
                    "view_duration_seconds",
                    models.PositiveIntegerField(
                        blank=True,
                        help_text="How long the user spent viewing the recipe (in seconds)",
                        null=True,
                    ),
                ),
                (
                    "recipe",
                    models.ForeignKey(
                        help_text="Recipe that was viewed",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="views",
                        to="recipes.recipe",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        blank=True,
                        help_text="User who viewed the recipe (null for anonymous views)",
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="recipe_views",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "recipe view",
                "verbose_name_plural": "recipe views",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="UserFavorite",
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
                        help_text="Unique identifier for this favorite",
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "recipe",
                    models.ForeignKey(
                        help_text="Recipe that was favorited",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="favorited_by",
                        to="recipes.recipe",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        help_text="User who favorited the recipe",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="favorites",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "user favorite",
                "verbose_name_plural": "user favorites",
                "ordering": ["-created_at"],
                "indexes": [
                    models.Index(
                        fields=["user"], name="recipes_use_user_id_34e820_idx"
                    ),
                    models.Index(
                        fields=["recipe"], name="recipes_use_recipe__c06051_idx"
                    ),
                    models.Index(
                        fields=["created_at"], name="recipes_use_created_2f0499_idx"
                    ),
                ],
            },
        ),
        migrations.AddConstraint(
            model_name="userfavorite",
            constraint=models.UniqueConstraint(
                fields=("user", "recipe"), name="unique_user_recipe_favorite"
            ),
        ),
        migrations.AddIndex(
            model_name="recipeview",
            index=models.Index(fields=["user"], name="recipes_rec_user_id_1a9e9d_idx"),
        ),
        migrations.AddIndex(
            model_name="recipeview",
            index=models.Index(
                fields=["recipe"], name="recipes_rec_recipe__6796c1_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="recipeview",
            index=models.Index(
                fields=["created_at"], name="recipes_rec_created_13f467_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="recipeview",
            index=models.Index(
                fields=["ip_address"], name="recipes_rec_ip_addr_96e0d0_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="recipeview",
            index=models.Index(
                fields=["session_key"], name="recipes_rec_session_1ab7a0_idx"
            ),
        ),
    ]
