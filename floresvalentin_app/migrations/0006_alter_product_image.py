# Generated by Django 5.1.7 on 2025-05-20 00:05

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('floresvalentin_app', '0005_comment'),
    ]

    operations = [
        migrations.AlterField(
            model_name='product',
            name='image',
            field=models.URLField(blank=True, max_length=500, null=True),
        ),
    ]
