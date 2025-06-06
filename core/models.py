# core/models.py

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator


class User(AbstractUser):
    """
    Represents a user in the system (merchandiser or manager).
    Extends Django's AbstractUser for built-in authentication features
    like username, password hashing, email, first/last name, etc.
    Adds a 'role' field to differentiate user types.
    """
    ROLE_CHOICES = (
        ('merchandiser', 'Merchandiser'),
        ('manager', 'Manager'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='merchandiser')

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        """
        Returns the string representation of the User object, which is their username.
        """
        return self.username


class Store(models.Model):
    """
    Represents a retail store where confectionery products are delivered.
    Includes geographical coordinates for map visualization.
    """
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    # latitude and longitude are nullable as they might not be available for all stores initially
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    contact_person_name = models.CharField(max_length=100, blank=True, null=True)
    contact_person_phone = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Store"
        verbose_name_plural = "Stores"

    def __str__(self):
        """
        Returns the name of the store as its string representation.
        """
        return self.name


class Product(models.Model):
    """
    Represents a confectionery product available from the factory.
    """
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Product"
        verbose_name_plural = "Products"

    def __str__(self):
        """
        Returns the name of the product as its string representation.
        """
        return self.name


class Order(models.Model):
    """
    Represents an order placed by a merchandiser for a specific store.
    """
    STATUS_CHOICES = (
        ('created', 'Created'),
        ('processed', 'Processed'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    )
    # Foreign key to the Store model, an order belongs to one store.
    # If a store is deleted, its orders are also deleted (CASCADE).
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='orders')
    # Foreign key to the User model (merchandiser).
    # If a merchandiser is deleted, their placed orders are also deleted (CASCADE).
    merchandiser = models.ForeignKey(User, on_delete=models.CASCADE, related_name='placed_orders')
    order_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='created')
    # total_amount can be calculated from OrderItems, but storing it for convenience or pre-calculation.
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True,
                                       validators=[MinValueValidator(0)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Order"
        verbose_name_plural = "Orders"

    def __str__(self):
        """
        Returns a string representation of the order, including its ID, store name, and merchandiser username.
        """
        return f"Order #{self.id} for {self.store.name} by {self.merchandiser.username}"

    def calculate_total_amount(self):
        """
        Calculates and updates the total amount of the order based on its OrderItems.
        This method should be called when order items are added or changed.
        """
        total = sum(item.quantity * item.price_per_unit for item in self.items.all())
        self.total_amount = total
        self.save()


class OrderItem(models.Model):
    """
    Represents a specific product and its quantity within an Order.
    This creates a many-to-many relationship between Orders and Products.
    """
    # Foreign key to the Order model, an order item belongs to one order.
    # If an order is deleted, its items are also deleted (CASCADE).
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    # Foreign key to the Product model.
    # If a product is deleted, order items referencing it are also deleted (CASCADE).
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    # Stores the price at the time of the order to ensure historical accuracy,
    # as product prices might change over time.
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Order Item"
        verbose_name_plural = "Order Items"

    def __str__(self):
        """
        Returns a string representation of the order item, showing quantity, product name, and parent order ID.
        """
        return f"{self.quantity} x {self.product.name} in Order #{self.order.id}"


class DailyPlan(models.Model):
    """
    Represents a daily visit plan assigned to a merchandiser,
    listing the stores they are supposed to visit on a specific date.
    """
    # Foreign key to the User model (merchandiser) who owns this plan.
    merchandiser = models.ForeignKey(User, on_delete=models.CASCADE, related_name='daily_plans')
    plan_date = models.DateField()
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Daily Plan"
        verbose_name_plural = "Daily Plans"
        # Ensures that a merchandiser can only have one daily plan for a given date.
        unique_together = ('merchandiser', 'plan_date')

    def __str__(self):
        """
        Returns a string representing the daily plan, including the merchandiser's username and the plan date.
        """
        return f"Plan for {self.merchandiser.username} on {self.plan_date}"


class DailyPlanStore(models.Model):
    """
    Represents a specific store visit scheduled within a DailyPlan.
    Defines the sequence of visits and tracks completion status and actual visit time.
    """
    # Foreign key to the DailyPlan it belongs to.
    daily_plan = models.ForeignKey(DailyPlan, on_delete=models.CASCADE, related_name='stores')
    # Foreign key to the Store to be visited.
    store = models.ForeignKey(Store, on_delete=models.CASCADE)
    visit_order = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    visited_at = models.DateTimeField(blank=True, null=True)
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Daily Plan Store"
        verbose_name_plural = "Daily Plan Stores"
        # Orders visits by their sequence in the plan.
        ordering = ['visit_order']
        # Ensures that within a single daily plan, each visit order number is unique.
        unique_together = ('daily_plan', 'visit_order')
        # Consider adding: unique_together = ('daily_plan', 'store') to prevent adding the same store twice to a plan.

    def __str__(self):
        """
        Returns a string representation of the planned store visit,
        indicating the visit order and the store name.
        """
        return f"Visit {self.visit_order} in plan for {self.store.name}"


class Log(models.Model):
    """
    Records significant user actions for auditing purposes,
    tracking who did what and when.
    """
    # Foreign key to the User who performed the action.
    # Set to null if the user is deleted, keeping the log entry.
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='logs')
    action = models.CharField(max_length=255)  # A brief description of the action
    # JSONField allows storing flexible, structured details about the action,
    # e.g., {'order_id': 123, 'old_status': 'created', 'new_status': 'processed'}
    details = models.JSONField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Log"
        verbose_name_plural = "Logs"
        # Orders log entries by the newest first.
        ordering = ['-timestamp']

    def __str__(self):
        """
        Returns a string representation of the log entry,
        including the user, action, and timestamp.
        """
        user_info = self.user.username if self.user else 'Unknown User'
        return f"{user_info} - {self.action} at {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"


class StoreMetrics(models.Model):
    """
    Stores pre-calculated performance metrics for a specific store on a given date.
    This helps in quickly retrieving performance data without recalculating every time.
    """
    # Foreign key to the Store for which the metrics are calculated.
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='metrics')
    date = models.DateField()
    total_orders_count = models.PositiveIntegerField(default=0)
    total_quantity_ordered = models.PositiveIntegerField(default=0)
    average_order_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True,
                                               validators=[MinValueValidator(0)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Store Metric"
        verbose_name_plural = "Store Metrics"
        # Ensures only one set of metrics per store per day.
        unique_together = ('store', 'date')
        # Orders metrics by the newest date first.
        ordering = ['-date']

    def __str__(self):
        """
        Returns a string representation of the store metrics,
        indicating the store name and the date for which metrics were calculated.
        """
        return f"Metrics for {self.store.name} on {self.date}"
