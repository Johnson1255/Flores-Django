import random
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from faker import Faker
from floresvalentin_app.models import Product, Category

class Command(BaseCommand):
    help = 'Populates the database with sample products.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--number',
            type=int,
            help='Number of products to create',
            default=100,
        )

    def handle(self, *args, **options):
        number_of_products = options['number']
        # Use Spanish locale for potentially more relevant fake data
        fake = Faker('es_CO')

        self.stdout.write(f"Creating {number_of_products} sample products...")

        # Ensure some categories exist
        categories = list(Category.objects.all())
        if not categories:
            self.stdout.write("No categories found, creating default categories...")
            default_categories = ['Rosas', 'Tulipanes', 'Orquídeas', 'Girasoles', 'Lirios']
            for cat_name in default_categories:
                category, created = Category.objects.get_or_create(
                    name=cat_name,
                    defaults={'slug': slugify(cat_name)}
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f"Created category: {cat_name}"))
                categories.append(category)

        products_to_create = []
        for i in range(number_of_products):
            category = random.choice(categories)
            name = f"{fake.word().capitalize()} {category.name.rstrip('es').rstrip('as')} {fake.color_name()}"
            description = fake.paragraph(nb_sentences=3)
            # Generate price between 50000 and 300000 COP, rounded to 2 decimal places
            price = Decimal(random.uniform(50000, 300000)).quantize(Decimal("0.01"))
            stock = random.randint(0, 100)
            # Most products available, some not
            available = random.choices([True, False], weights=[0.9, 0.1], k=1)[0]

            product = Product(
                category=category,
                name=name,
                description=description,
                price=price,
                stock=stock,
                available=available,
                # image field is left blank/null
            )
            products_to_create.append(product)

            if (i + 1) % 50 == 0:
                self.stdout.write(f"Generated {i + 1}/{number_of_products} products...")

        # Use bulk_create for efficiency
        try:
            Product.objects.bulk_create(products_to_create)
            self.stdout.write(self.style.SUCCESS(f"Successfully created {len(products_to_create)} products."))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Error creating products: {e}"))
