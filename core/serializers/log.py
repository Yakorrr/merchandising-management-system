from rest_framework import serializers

from core.models import Log


class LogSerializer(serializers.ModelSerializer):
    """
    Serializer for Log model.
    Used to display user action logs.
    """
    username = serializers.CharField(source='user.username', read_only=True, allow_null=True)

    class Meta:
        model = Log
        fields = ['id', 'user', 'username', 'action', 'details', 'timestamp']
        read_only_fields = ['id', 'user', 'username', 'action', 'details', 'timestamp']
