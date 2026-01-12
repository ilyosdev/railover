# Team Management Guide

Manage team access and permissions for your Railover PaaS instance.

## User Roles

### Super Admin

- Full access to all projects
- Can manage users (create, delete, update roles)
- Can manage system settings
- Can view all logs
- Can add/remove project collaborators
- **Who should have this**: VDS owner

### Admin

- Full access to assigned projects
- Can create/delete services in projects
- Can manage project collaborators
- Can view project logs
- Cannot manage other users
- **Who should have this**: Team leads, project managers

### Developer

- Can view assigned projects
- Can deploy services
- Can manage environment variables
- Can view logs
- Cannot delete projects or services
- **Who should have this**: Regular developers

### Viewer

- Read-only access to assigned projects
- Can view services and logs
- Cannot make any changes
- **Who should have this**: Clients, stakeholders

## Managing Team Members

### Adding a Team Member

1. Go to **Team → Team Management**
2. Click **"Add Team Member"**
3. Fill in:
    - **Username**: Login username
    - **Email**: User's email
    - **Password**: Initial password (user can change later)
    - **Role**: Select role (Admin, Developer, Viewer)
4. Click **Create**
5. Share credentials with the team member

### Updating a User Role

1. Go to **Team → Team Management**
2. Find the user
3. Click the **Edit** (pencil) icon
4. Select new role
5. Click **Save**

### Removing a Team Member

1. Go to **Team → Team Management**
2. Find the user
3. Click **Delete** (trash icon)
4. Confirm deletion

⚠️ **Warning**: This immediately revokes all access.

## Project Collaborators

Instead of giving access to ALL projects, you can add users as collaborators to specific projects.

### Adding a Project Collaborator

1. Go to **Projects → [Project Name] → Collaborators** tab
2. Click **"Add Collaborator"**
3. Select user from dropdown (must be existing team member)
4. Select project role:
    - **Project Admin**: Full access to this project only
    - **Developer**: Can deploy and manage services
    - **Viewer**: Read-only access to this project
5. Click **Add**

### Removing a Project Collaborator

1. Go to **Projects → [Project Name] → Collaborators** tab
2. Find the collaborator
3. Click **Remove**
4. Confirm removal

## Security Best Practices

### Password Management

- Change default admin password immediately after install
- Use strong passwords for all team members
- Require team members to change password on first login
- Rotate passwords periodically

### Access Control

- Give minimum required permissions
- Use Viewer role for stakeholders who only need read access
- Remove access immediately when team member leaves
- Audit team membership regularly

### Project Access

- Only add collaborators to projects they need
- Use project-specific roles instead of system-wide roles when possible
- Review project access list regularly

## Troubleshooting

### User can't login

- Check username is correct (case-sensitive)
- Reset password if needed
- Verify user account exists
- Check if user account is not locked

### User can't access project

- Verify user is added as collaborator
- Check project role permissions
- Check if project exists
- Try refreshing the page

### Can't add team member

- Verify you have Super Admin role
- Check if username/email already exists
- Ensure all required fields are filled
