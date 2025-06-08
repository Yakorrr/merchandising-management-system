from django.contrib.auth import authenticate
from rest_framework import serializers

from .models import User, Store


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
    Allows authentication using either username or email, along with password.
    """
    username = serializers.CharField(required=False, allow_blank=True)  # Make username optional
    email = serializers.EmailField(required=False, allow_blank=True)  # Make email optional
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, data):
        """
        Validate user credentials using Django's authenticate function based on username or email.
        Ensures that at least one of username or email is provided.
        :param data: The validated data from the request.
        :return: The validated data, including the authenticated user.
        :raises serializers.ValidationError: If authentication fails or insufficient credentials.
        """
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if not username and not email:
            raise serializers.ValidationError("Must include either 'username' or 'email'.")
        if not password:
            raise serializers.ValidationError("Password is required.")

        user = None
        if username:
            # Try authenticating directly with username
            user = authenticate(request=self.context.get('request'), username=username, password=password)
        elif email:
            # Find user by email first, then attempt authentication with their username
            try:
                # Case-insensitive email lookup
                user_by_email = User.objects.get(email__iexact=email)
                user = authenticate(request=self.context.get('request'), username=user_by_email.username,
                                    password=password)
            except User.DoesNotExist:
                # User not found by email, authentication will fail
                pass

        if not user:
            raise serializers.ValidationError("Invalid credentials. Please try again.")

        data['user'] = user
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


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new user accounts by managers.
    Requires password for new user creation.
    """
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role', 'first_name', 'last_name']
        read_only_fields = ['id']

    def create(self, validated_data):
        """
        Create a new User instance by a manager with hashed password.
        :param validated_data: Dictionary of validated data for user creation.
        :return: Created User instance.
        """
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)  # Hash the password
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating existing user accounts by managers.
    Password update is optional and handled separately.
    """
    password = serializers.CharField(write_only=True, required=False, allow_blank=True,
                                     style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['username', 'email', 'role', 'first_name', 'last_name', 'password', 'date_joined']

    def update(self, instance, validated_data):
        """
        Update an existing User instance.
        Hashes password if a new one is provided.
        :param instance: The User instance to update.
        :param validated_data: Dictionary of validated data for user update.
        :return: Updated User instance.
        """
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance


class StoreSerializer(serializers.ModelSerializer):
    """
    General purpose serializer for Store model.
    Used for displaying store information (read-only contexts).
    """

    class Meta:
        model = Store
        fields = '__all__'  # Include all fields for display
        read_only_fields = ['id', 'created_at', 'updated_at']  # These fields are read-only


class StoreCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new Store instances.
    """

    class Meta:
        model = Store
        # Fields required for creating a new store
        fields = ['id', 'name', 'address', 'latitude', 'longitude', 'contact_person_name', 'contact_person_phone']
        read_only_fields = ['id']


class StoreUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating existing Store instances.
    All fields are optional for partial updates (PATCH).
    """

    class Meta:
        model = Store
        # Fields that can be updated. 'id' is read-only implicitly.
        fields = ['name', 'address', 'latitude', 'longitude', 'contact_person_name', 'contact_person_phone']
        extra_kwargs = {
            'name': {'required': False},
            'address': {'required': False},
            'latitude': {'required': False},
            'longitude': {'required': False},
            'contact_person_name': {'required': False},
            'contact_person_phone': {'required': False},
        }
