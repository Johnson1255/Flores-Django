from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from floresvalentin_app.models import Product

class Command(BaseCommand):
    help = 'Deletes ALL products from the database after confirmation.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--no-input',
            '--noinput',
            action='store_true',
            dest='no_input',
            help='Do NOT prompt the user for confirmation before deleting.',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        no_input = options['no_input']
        product_count = Product.objects.count()

        if product_count == 0:
            self.stdout.write(self.style.SUCCESS("No products found in the database. Nothing to delete."))
            return

        self.stdout.write(
            self.style.WARNING(f"This command will permanently delete {product_count} products.")
        )

        if not no_input:
            confirm = input("Are you sure you want to delete all products? Type 'yes' to confirm: ")
            if confirm.lower() != 'yes':
                self.stdout.write(self.style.ERROR("Deletion cancelled."))
                return

        try:
            self.stdout.write(f"Deleting {product_count} products...")
            # The delete() method on a queryset returns the number of objects deleted
            # and a dictionary with the number of deletions per object type.
            num_deleted, _ = Product.objects.all().delete()
            self.stdout.write(self.style.SUCCESS(f"Successfully deleted {num_deleted} products."))
        except Exception as e:
            raise CommandError(f"Error deleting products: {e}")
