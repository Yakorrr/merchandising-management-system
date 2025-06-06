from rest_framework import serializers
from django.contrib.auth import authenticate  # Used for login validation
from .models import User


class UserRegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    Includes fields for username, email, password, and role.
    """
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'role', 'first_name', 'last_name']
        extra_kwargs = {'password': {'write_only': True}}

    def validate(self, data):
        """
        Validate passwords match and username is unique.
        :param data: The validated data from the request.
        :return: The validated data.
        :raises serializers.ValidationError: If passwords do not match.
        """
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        """
        Create a new User instance after validation.
        :param validated_data: The validated data from the request.
        :return: The created User instance.
        """
        # Remove password2 as it's not a model field
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),  # email is optional for AbstractUser
            password=validated_data['password'],
            role=validated_data.get('role', 'merchandiser'),  # Default to merchandiser if not specified
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user


class UserLoginSerializer(serializers.Serializer):
    """
    Serializer for user login.
    Includes fields for username and password for authentication.
    """
    username = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, data):
        """
        Validate user credentials using Django's authenticate function.
        :param data: The validated data from the request.
        :return: The validated data, including the authenticated user.
        :raises serializers.ValidationError: If authentication fails.
        """
        username = data.get('username')
        password = data.get('password')

        if username and password:
            user = authenticate(request=self.context.get('request'), username=username, password=password)
            if not user:
                raise serializers.ValidationError("Invalid credentials. Please try again.")
        else:
            raise serializers.ValidationError("Must include 'username' and 'password'.")

        data['user'] = user  # Attach the authenticated user to the validated data
        return data


class UserSerializer(serializers.ModelSerializer):
    """
    General purpose serializer for User model.
    Used to display user information after successful login or registration.
    """

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'first_name', 'last_name', 'date_joined']
        read_only_fields = ['id', 'username', 'email', 'role',
                            'date_joined']  # These fields are read-only when displaying user data
