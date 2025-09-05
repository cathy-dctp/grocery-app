# Grocery App API Documentation

Complete REST API documentation for the Grocery List Manager application.

## Base URLs

- **Local Development**: `http://localhost:8000/api/`
- **Production**: `https://grocery-app-production-bc43.up.railway.app/api/`

## Authentication

All API endpoints except authentication endpoints require a valid token in the Authorization header:
```
Authorization: Token your_token_here
```

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|----------------------|
| POST | `/api/auth/login/` | Login with username/password -> returns token | No |
| POST | `/api/auth/logout/` | Logout and invalidate token | Yes |
| POST | `/api/auth/register/` | Register new user account | No |
| GET | `/api/auth/me/` | Get current authenticated user info | Yes |

### Categories

| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|----------------------|
| GET | `/api/categories/` | List all categories | Yes |
| POST | `/api/categories/` | Create new category | Yes |
| GET | `/api/categories/{id}/` | Get specific category | Yes |
| PUT | `/api/categories/{id}/` | Update category | Yes |
| PATCH | `/api/categories/{id}/` | Partial update category | Yes |
| DELETE | `/api/categories/{id}/` | Delete category | Yes |

### Items

| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|----------------------|
| GET | `/api/items/` | List all items with search support | Yes |
| POST | `/api/items/` | Create new item | Yes |
| GET | `/api/items/{id}/` | Get specific item | Yes |
| PUT | `/api/items/{id}/` | Update item | Yes |
| PATCH | `/api/items/{id}/` | Partial update item | Yes |
| DELETE | `/api/items/{id}/` | Delete item | Yes |

### Grocery Lists

| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|----------------------|
| GET | `/api/grocery-lists/` | List user's grocery lists | Yes |
| POST | `/api/grocery-lists/` | Create new grocery list | Yes |
| GET | `/api/grocery-lists/{id}/` | Get specific grocery list | Yes |
| PUT | `/api/grocery-lists/{id}/` | Update grocery list | Yes |
| PATCH | `/api/grocery-lists/{id}/` | Partial update grocery list | Yes |
| DELETE | `/api/grocery-lists/{id}/` | Delete grocery list | Yes |

#### Grocery Lists Custom Actions

| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|----------------------|
| POST | `/api/grocery-lists/{id}/add_item/` | Add item to list | Yes |
| POST | `/api/grocery-lists/{id}/share_with/` | Share list with user | Yes |
| POST | `/api/grocery-lists/{id}/remove_user/` | Remove user from shared list | Yes |

### Grocery List Items

| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|----------------------|
| GET | `/api/grocery-list-items/` | List items (filtered by list_id param) | Yes |
| POST | `/api/grocery-list-items/` | Create new list item | Yes |
| GET | `/api/grocery-list-items/{id}/` | Get specific list item | Yes |
| PUT | `/api/grocery-list-items/{id}/` | Update list item | Yes |
| PATCH | `/api/grocery-list-items/{id}/` | Partial update list item | Yes |
| DELETE | `/api/grocery-list-items/{id}/` | Delete list item | Yes |

#### Grocery List Items Custom Actions

| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|----------------------|
| POST | `/api/grocery-list-items/{id}/toggle_checked/` | Toggle item checked status | Yes |

### Users

| Method | Endpoint | Description | Authentication Required |
|--------|----------|-------------|----------------------|
| GET | `/api/users/` | Search users (?search=username) | Yes |
| GET | `/api/users/{id}/` | Get specific user profile | Yes |

## Example API Usage

### 1. Authentication Flow

```bash
# Login and get token
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "john_doe", "password": "password123"}'

# Response: {"user": {...}, "token": "abc123xyz..."}
```

### 2. Using Authentication Token

Replace `your_token_here` with the actual token from login response:

```bash
TOKEN="your_token_here"

# Get user profile
curl -H "Authorization: Token $TOKEN" \
  http://localhost:8000/api/auth/me/
```

### 3. Grocery Lists Operations

```bash
# Get user's grocery lists
curl -H "Authorization: Token $TOKEN" \
  http://localhost:8000/api/grocery-lists/

# Create new grocery list
curl -X POST http://localhost:8000/api/grocery-lists/ \
  -H "Authorization: Token $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Weekly Shopping"}'

# Get specific grocery list
curl -H "Authorization: Token $TOKEN" \
  http://localhost:8000/api/grocery-lists/1/

# Share list with another user
curl -X POST http://localhost:8000/api/grocery-lists/1/share_with/ \
  -H "Authorization: Token $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id": 2}'
```

### 4. Items and Categories

```bash
# Get all categories
curl -H "Authorization: Token $TOKEN" \
  http://localhost:8000/api/categories/

# Search for items
curl -H "Authorization: Token $TOKEN" \
  "http://localhost:8000/api/items/?search=banana"

# Create new item
curl -X POST http://localhost:8000/api/items/ \
  -H "Authorization: Token $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Organic Apples", "category": 1, "default_unit": "lbs"}'
```

### 5. Managing List Items

```bash
# Add item to grocery list (list_id=1, item_id=5)
curl -X POST http://localhost:8000/api/grocery-lists/1/add_item/ \
  -H "Authorization: Token $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"item_id": 5, "quantity": 2, "unit": "lbs"}'

# Get items for a specific list
curl -H "Authorization: Token $TOKEN" \
  "http://localhost:8000/api/grocery-list-items/?list_id=1"

# Toggle item as checked/unchecked
curl -X POST http://localhost:8000/api/grocery-list-items/1/toggle_checked/ \
  -H "Authorization: Token $TOKEN"

# Update item quantity
curl -X PATCH http://localhost:8000/api/grocery-list-items/1/ \
  -H "Authorization: Token $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 3}'
```

### 6. User Search and Sharing

```bash
# Search for users to share with
curl -H "Authorization: Token $TOKEN" \
  "http://localhost:8000/api/users/?search=jane"

# Get specific user profile
curl -H "Authorization: Token $TOKEN" \
  http://localhost:8000/api/users/2/
```

### 7. Logout

```bash
# Logout (invalidates token)
curl -X POST http://localhost:8000/api/auth/logout/ \
  -H "Authorization: Token $TOKEN"
```

## Error Responses

### Authentication Errors

```bash
# Test unauthenticated access (should return 401/403 error)
curl http://localhost:8000/api/grocery-lists/

# Response: {"detail": "Authentication credentials were not provided."}
```

### Common HTTP Status Codes

- `200 OK` - Successful GET, PATCH, PUT requests
- `201 Created` - Successful POST requests
- `204 No Content` - Successful DELETE requests
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication credentials not provided
- `403 Forbidden` - Permission denied
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error
