from django.contrib import admin
from .models import User, Store, Product, Order, OrderItem, DailyPlan, DailyPlanStore, Log, StoreMetrics

# Register models
admin.site.register(User)
admin.site.register(Store)
admin.site.register(Product)
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(DailyPlan)
admin.site.register(DailyPlanStore)
admin.site.register(Log)
admin.site.register(StoreMetrics)
