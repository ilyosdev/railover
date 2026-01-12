# Multi-User/Team Backend Support - Implementation Guide

## Overview

Complete multi-user and team collaboration support has been added to Railover VDS PaaS. This enables the VDS owner (Super Admin) to invite team members with role-based access control.

## Features

- **Role-Based Access Control**: 4 user roles (Super Admin, Admin, Developer, Viewer)
- **User Management**: Create, list, update, and delete users
- **Project Collaboration**: Add/remove collaborators to projects with granular permissions
- **Persistent Storage**: All user data stored in `/captain/data/config-captain.json`

## User Roles

### Super Admin (VDS Owner)

- Full system access
- Can manage all users and settings
- Can create, delete, and manage all projects
- Can view all logs and manage databases
- Cannot delete themselves
- Cannot change their own role

### Admin (Team Leads)

- Can manage assigned projects
- Can create and delete projects they own
- Can deploy applications
- Can view logs and manage databases
- Cannot manage users or system settings

### Developer (Team Members)

- Can deploy applications in assigned projects
- Can view logs
- Cannot create or delete projects
- Cannot manage databases or users

### Viewer (Read-Only)

- Can only view logs in assigned projects
- Cannot deploy, create, or delete anything
- Cannot manage any resources

## Architecture

### New Files Created

1. **`src/models/UserDefinition.ts`**

    - User data model with roles and permissions
    - `UserDefinition` interface
    - `UserRole` enum
    - `UserPermissions` interface
    - `UserCollaborator` interface

2. **`src/user/UserManagerExtended.ts`**

    - Core business logic for user management
    - Methods: `createUser`, `listUsers`, `updateUserRole`, `deleteUser`
    - Methods: `addCollaboratorToProject`, `removeCollaboratorFromProject`
    - Methods: `getUserProjects`, `canUserAccessProject`

3. **`src/routes/user/UsersRouter.ts`**
    - REST API endpoints for user management
    - Middleware for authorization checks
    - Routes for user CRUD operations
    - Routes for project collaboration

### Modified Files

1. **`src/models/ProjectDefinition.ts`**

    - Added `ownerId?: string` field
    - Added `collaborators?: UserCollaborator[]` field

2. **`src/datastore/ProjectsDataStore.ts`**

    - Updated `saveProject()` to include new fields
    - Added `updateProject()` method

3. **`src/datastore/DataStore.ts`**

    - Added `saveUser()` method
    - Added `getUser()` method
    - Added `getUserByUsername()` method
    - Added `getAllUsers()` method
    - Added `updateUser()` method
    - Added `deleteUser()` method

4. **`src/routes/user/UserRouter.ts`**
    - Added `UsersRouter` to routes

## API Endpoints

### User Management (Super Admin Only)

#### Create User

```http
POST /api/v2/user/users/create
Authorization: Bearer <token>

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepass123",
  "role": "developer"
}
```

**Response:**

```json
{
  "status": 100,
  "description": "User created successfully",
  "data": {
    "id": "uuid-here",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "developer",
    "permissions": { ... },
    "createdAt": "2025-01-10T..."
  }
}
```

#### List Users

```http
GET /api/v2/user/users/
Authorization: Bearer <token>
```

**Response:**

```json
{
  "status": 100,
  "description": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "id": "uuid-1",
        "username": "admin",
        "email": "admin@example.com",
        "role": "super_admin",
        ...
      },
      {
        "id": "uuid-2",
        "username": "johndoe",
        "role": "developer",
        ...
      }
    ]
  }
}
```

#### Update User Role

```http
PUT /api/v2/user/users/:userId/role
Authorization: Bearer <token>

{
  "role": "admin"
}
```

#### Delete User

```http
DELETE /api/v2/user/users/:userId
Authorization: Bearer <token>
```

### Project Collaboration

#### Add Collaborator to Project

```http
POST /api/v2/user/users/projects/:projectId/collaborators
Authorization: Bearer <token>

{
  "userId": "uuid-here",
  "role": "developer"
}
```

**Roles:** `admin`, `developer`, `viewer`

#### Remove Collaborator from Project

```http
DELETE /api/v2/user/users/projects/:projectId/collaborators/:userId
Authorization: Bearer <token>
```

#### Get User Projects

```http
GET /api/v2/user/users/projects
Authorization: Bearer <token>
```

**Response:**

```json
{
    "status": 100,
    "description": "Projects retrieved successfully",
    "data": {
        "projects": [
            {
                "id": "project-uuid",
                "name": "my-project",
                "ownerId": "owner-uuid",
                "collaborators": [
                    {
                        "userId": "user-uuid",
                        "role": "developer",
                        "addedAt": "2025-01-10T...",
                        "addedBy": "admin-uuid"
                    }
                ]
            }
        ]
    }
}
```

## Permission Matrix

| Action                 | Super Admin | Admin             | Developer | Viewer |
| ---------------------- | ----------- | ----------------- | --------- | ------ |
| Manage Users           | ✅          | ❌                | ❌        | ❌     |
| Manage System Settings | ✅          | ❌                | ❌        | ❌     |
| Create Projects        | ✅          | ✅                | ❌        | ❌     |
| Delete Projects        | ✅          | ✅ (own)          | ❌        | ❌     |
| Deploy Apps            | ✅          | ✅                | ✅        | ❌     |
| View Logs              | ✅          | ✅                | ✅        | ✅     |
| Manage Databases       | ✅          | ✅                | ❌        | ❌     |
| Add Collaborators      | ✅          | ✅ (own projects) | ❌        | ❌     |

## Data Storage

All user data is stored in the configstore JSON file:

- **Location**: `/captain/data/config-captain.json`
- **Key**: `users`
- **Structure**:

```json
{
  "users": {
    "uuid-1": {
      "id": "uuid-1",
      "username": "admin",
      "email": "admin@example.com",
      "passwordHash": "$2a$10$...",
      "role": "super_admin",
      "permissions": { ... },
      "createdAt": "2025-01-10T...",
      "lastLogin": "2025-01-10T..."
    }
  }
}
```

## Security Features

1. **Password Hashing**: bcryptjs with salt rounds = 10
2. **Role Validation**: Middleware checks user role before allowing actions
3. **Self-Protection**: Super Admin cannot delete themselves
4. **Last Admin Protection**: Cannot delete the last Super Admin
5. **Project Isolation**: Users can only access projects they own or collaborate on
6. **Password Requirements**: Minimum 8 characters
7. **Username Validation**: 3+ characters, alphanumeric, underscores, hyphens only
8. **Email Validation**: Standard email format validation

## Testing

### Manual Testing with curl

1. **Start Railover**

```bash
npm start
```

2. **Login as Super Admin** (get auth token)

```bash
curl -X POST http://captain.localhost/api/v2/login \
  -H "Content-Type: application/json" \
  -d '{
    "password": "captain42"
  }'
```

Save the `token` from response.

3. **Create a Developer User**

```bash
curl -X POST http://captain.localhost/api/v2/user/users/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "developer1",
    "email": "dev@example.com",
    "password": "testpass123",
    "role": "developer"
  }'
```

4. **List All Users**

```bash
curl -X GET http://captain.localhost/api/v2/user/users/ \
  -H "Authorization: Bearer <token>"
```

5. **Create a Project** (via existing project API)

```bash
curl -X POST http://captain.localhost/api/v2/user/projects/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-project",
    "description": "Test project for collaboration"
  }'
```

6. **Add Collaborator to Project**

```bash
curl -X POST http://captain.localhost/api/v2/user/users/projects/<project-id>/collaborators \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<developer-user-id>",
    "role": "developer"
  }'
```

7. **Get User Projects**

```bash
curl -X GET http://captain.localhost/api/v2/user/users/projects \
  -H "Authorization: Bearer <token>"
```

### Integration Testing

Create test files in `/tests/` directory:

```typescript
// tests/users.test.ts
import { UserManagerExtended } from '../src/user/UserManagerExtended'
import DataStore from '../src/datastore/DataStore'
import { UserRole } from '../src/models/UserDefinition'

test('Create user as Super Admin', async () => {
    const dataStore = new DataStore('test-namespace')
    const userManager = new UserManagerExtended(dataStore)

    const superAdmin = {
        id: 'admin-1',
        username: 'admin',
        email: 'admin@test.com',
        passwordHash: 'hash',
        role: UserRole.SUPER_ADMIN,
        permissions: { ... },
        createdAt: new Date().toISOString()
    }

    const newUser = await userManager.createUser(superAdmin, {
        username: 'testuser',
        email: 'test@test.com',
        password: 'password123',
        role: UserRole.DEVELOPER
    })

    expect(newUser.username).toBe('testuser')
    expect(newUser.role).toBe(UserRole.DEVELOPER)
})
```

Run tests:

```bash
npm test tests/users.test.ts
```

## Migration Guide

### For Existing Installations

1. **Update Code**: Pull the latest changes
2. **Build**: Run `npm run build`
3. **No Database Migration Needed**: The system automatically creates the `users` key in configstore
4. **First Super Admin**: The existing admin password mechanism remains unchanged
5. **Create Users**: Use the API to create additional users

### Initial Setup

On first deployment, the system has one default admin:

- **Username**: (inherited from existing auth)
- **Password**: `captain42` or environment variable `DEFAULT_PASSWORD`
- **Role**: Super Admin (implicit)

Create additional users via API after first login.

## Best Practices

1. **Change Default Password**: Immediately after deployment
2. **Use Strong Passwords**: Minimum 8 characters, mix of letters/numbers/symbols
3. **Principle of Least Privilege**: Assign minimal necessary role
4. **Regular Audits**: Periodically review user list and remove unused accounts
5. **Project Ownership**: Assign clear owners to projects
6. **Collaborator Management**: Only add necessary collaborators to projects
7. **Backup Users Data**: Include `/captain/data/config-captain.json` in backups

## Troubleshooting

### User Creation Fails

- Check password length (minimum 8 characters)
- Verify username format (alphanumeric, underscores, hyphens only)
- Ensure email is valid format
- Confirm you're logged in as Super Admin

### Cannot Delete User

- Cannot delete yourself
- Cannot delete the last Super Admin
- User must exist in the system

### Collaborator Addition Fails

- Ensure project exists
- Verify you're project owner or Super Admin
- Check user ID is valid
- Confirm role is one of: `admin`, `developer`, `viewer`

### Permission Denied

- Verify your user role
- Check if you're a collaborator on the project
- Confirm the action is allowed for your role
- Re-authenticate if token expired

## Future Enhancements

Potential improvements for future versions:

1. **Email Invitations**: Send email invites to new users
2. **Password Reset**: Self-service password reset via email
3. **2FA Support**: Two-factor authentication for enhanced security
4. **Audit Logs**: Track all user actions for compliance
5. **API Keys**: Per-user API keys for programmatic access
6. **SSO Integration**: SAML/OAuth for enterprise authentication
7. **Teams/Groups**: Organize users into teams with shared permissions
8. **Custom Roles**: Define custom roles with specific permissions
9. **Session Management**: View and revoke active sessions
10. **Usage Quotas**: Limit resources per user or team

## Support

For issues or questions:

- GitHub Issues: https://github.com/your-repo/railover/issues
- Documentation: https://railover.dev/docs/multi-user

## License

Same as Railover main license.
