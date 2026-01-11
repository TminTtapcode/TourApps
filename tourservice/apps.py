# tourservice/apps.py
from django.apps import AppConfig

class TourserviceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'tourservice'

    def ready(self):
        import tourservice.signals
