"""Initial migration for core module."""

from django.db import migrations


class Migration(migrations.Migration):
    """
    Initial migration for core module.
    Since BaseModel is abstract, no actual database changes are needed.
    """

    initial = True

    dependencies = []

    operations = [] 