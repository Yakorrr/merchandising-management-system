from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        """
        This method is called when the Django application is ready.
        It imports the signals module to ensure signal handlers are registered.
        """
        import core.signals  # noqa
