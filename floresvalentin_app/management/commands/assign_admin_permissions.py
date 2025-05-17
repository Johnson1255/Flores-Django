from django.core.management.base import BaseCommand
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth import get_user_model
from floresvalentin_app.models import Profile, Product

class Command(BaseCommand):
    help = 'Assigns product management permissions to users with the admin role.'

    def handle(self, *args, **options):
        User = get_user_model()
        admin_profiles = Profile.objects.filter(role='admin')
        product_content_type = ContentType.objects.get_for_model(Product)

        # Get product permissions
        add_product_permission = Permission.objects.get(
            content_type=product_content_type,
            codename='add_product'
        )
        change_product_permission = Permission.objects.get(
            content_type=product_content_type,
            codename='change_product'
        )
        delete_product_permission = Permission.objects.get(
            content_type=product_content_type,
            codename='delete_product'
        )

        for profile in admin_profiles:
            user = profile.user
            user.user_permissions.add(add_product_permission)
            user.user_permissions.add(change_product_permission)
            user.user_permissions.add(delete_product_permission)
            self.stdout.write(self.style.SUCCESS(f'Assigned product permissions to user: {user.username}'))

        self.stdout.write(self.style.SUCCESS('Successfully assigned admin permissions.'))
