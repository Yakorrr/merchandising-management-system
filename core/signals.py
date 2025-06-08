from django.db.models.signals import post_migrate
from django.dispatch import receiver

from .models import User


@receiver(post_migrate)
def create_initial_users(sender, **kwargs):
    """
    Signal handler to create initial users (admin and regular user)
    after database migrations are applied.
    This runs only if the current process is not a "reloader" (e.g., during runserver restarts).
    """

    print("Checking for initial users...")
    # Create 'admin' user with manager role
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser(username='admin', email='admin@example.com', password='admin', role='manager')
        print("Created initial admin user (username: admin, password: admin).")

    # Create 'user' with merchandiser role
    if not User.objects.filter(username='user').exists():
        User.objects.create_user(username='user', email='user@example.com', password='user', role='merchandiser')
        print("Created initial merchandiser user (username: user, password: user).")
