# Generated by Django 4.2.7 on 2025-07-25 22:59

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("recipes", "0002_alter_recipe_ingredients_alter_recipe_instructions_and_more"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="recipe",
            name="image_url",
        ),
        migrations.AddField(
            model_name="recipe",
            name="images",
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text="Dictionary containing original and thumbnail image URLs",
            ),
        ),
    ]
