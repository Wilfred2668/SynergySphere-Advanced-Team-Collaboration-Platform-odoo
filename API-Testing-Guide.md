# SynergySphere API Testing Guide

This guide provides comprehensive instructions for testing the SynergySphere backend API using Postman.

## 📋 Prerequisites

1. **Postman installed** (Desktop app or web version)
2. **SynergySphere backend running** on `http://localhost:8000`
3. **Database set up** with migrations applied
4. **Admin user created** using the management command

## 🚀 Setup Instructions

### 1. Import Postman Collection

1. Open Postman
2. Click "Import" button
3. Select the file: `SynergySphere-Postman-Collection.json`
4. Click "Import"

### 2. Import Environment

1. In Postman, click the gear icon (Manage Environments)
2. Click "Import"
3. Select the file: `SynergySphere-Environment.json`
4. Click "Import"
5. Select "SynergySphere Development" as your active environment

### 3. Verify Backend is Running

```bash
# Make sure your Django server is running
cd backend/synergysphere
python manage.py runserver
```

## 🧪 Testing Workflow

### Step 1: Authentication Testing

#### Test Admin Login
1. Go to `Authentication > Login Admin`
2. The request body should have:
   ```json
   {
       "email": "admin@admin.com",
       "password": "admin123"
   }
   ```
3. Send the request
4. ✅ **Expected**: 200 OK with access and refresh tokens
5. The tokens will be automatically saved to environment variables

#### Test User Registration
1. Go to `Authentication > Register User`
2. Modify the email if needed to avoid conflicts:
   ```json
   {
       "email": "testuser@example.com",
       "password": "testpassword123",
       "first_name": "Test",
       "last_name": "User",
       "role": "member"
   }
   ```
3. Send the request
4. ✅ **Expected**: 201 Created with user details

#### Test User Login
1. Go to `Authentication > Login User`
2. Use the same credentials from registration
3. Send the request
4. ✅ **Expected**: 200 OK with tokens

### Step 2: User Management Testing

#### Get User Profile
1. Ensure you're logged in (have valid access token)
2. Go to `Users > Get User Profile`
3. Send the request
4. ✅ **Expected**: 200 OK with user profile data

#### Update User Profile
1. Go to `Users > Update User Profile`
2. Modify the request body as needed
3. Send the request
4. ✅ **Expected**: 200 OK with updated user data

### Step 3: Project Management Testing

#### Create Project
1. Go to `Projects > Create Project`
2. Send the request
3. ✅ **Expected**: 201 Created
4. Project ID will be automatically saved for subsequent tests

#### List Projects
1. Go to `Projects > List Projects`
2. Send the request
3. ✅ **Expected**: 200 OK with list of projects

#### Get Project Details
1. Go to `Projects > Get Project Details`
2. Ensure `projectId` is set in environment
3. Send the request
4. ✅ **Expected**: 200 OK with project details

#### Add Project Member
1. Go to `Projects > Add Project Member`
2. Send the request
3. ✅ **Expected**: 201 Created

### Step 4: Task Management Testing

#### Create Task
1. Go to `Tasks > Create Task`
2. Ensure the project ID is valid
3. Send the request
4. ✅ **Expected**: 201 Created
5. Task ID will be saved automatically

#### List Tasks
1. Go to `Tasks > List Tasks`
2. Send the request
3. ✅ **Expected**: 200 OK with task list

#### Update Task
1. Go to `Tasks > Update Task`
2. Send the request
3. ✅ **Expected**: 200 OK with updated task

#### Filter Tasks
1. Try `Tasks > Filter Tasks by Project`
2. Try `Tasks > Filter Tasks by Status`
3. ✅ **Expected**: 200 OK with filtered results

### Step 5: Discussion Testing

#### Create Discussion
1. Go to `Discussions > Create Discussion`
2. Send the request
3. ✅ **Expected**: 201 Created

#### Add Comment
1. Go to `Discussions > Add Comment to Discussion`
2. Send the request
3. ✅ **Expected**: 201 Created

### Step 6: Notification Testing

#### List Notifications
1. Go to `Notifications > List User Notifications`
2. Send the request
3. ✅ **Expected**: 200 OK (may be empty initially)

## 🔧 Advanced Testing

### Testing Error Scenarios

1. **Unauthorized Access**:
   - Clear the `accessToken` from environment
   - Try any protected endpoint
   - ✅ **Expected**: 401 Unauthorized

2. **Invalid Data**:
   - Send invalid JSON or missing required fields
   - ✅ **Expected**: 400 Bad Request with validation errors

3. **Token Refresh**:
   - Use `Authentication > Refresh Token` when access token expires
   - ✅ **Expected**: New access token

### Automated Testing

The collection includes test scripts that:
- Automatically save tokens and IDs
- Validate response times
- Log response details for debugging

## 📊 Response Status Codes

| Code | Meaning | When to Expect |
|------|---------|----------------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Backend error |

## 🐛 Troubleshooting

### Common Issues

1. **"Connection refused" error**:
   - Ensure Django server is running on localhost:8000
   - Check if `DEBUG=True` in .env file

2. **401 Unauthorized**:
   - Check if access token is set in environment
   - Try refreshing the token or logging in again

3. **Database errors**:
   - Ensure migrations are applied: `python manage.py migrate`
   - Create admin user: `python manage.py create_admin_user`

4. **CORS errors** (if testing from browser):
   - Ensure `CORS_ALLOWED_ORIGINS` includes your frontend URL

### Debug Tips

1. **Check Console**: Postman console shows request/response details
2. **Environment Variables**: Verify tokens are being saved correctly
3. **Response Body**: Always check error messages in response
4. **Django Logs**: Check terminal where Django is running for server errors

## 📝 Test Scenarios Checklist

### Authentication ✓
- [ ] Admin login works
- [ ] User registration works  
- [ ] User login works
- [ ] Token refresh works
- [ ] Logout works

### User Management ✓
- [ ] Get user profile
- [ ] Update user profile
- [ ] List users (admin only)

### Project Management ✓
- [ ] Create project
- [ ] List projects
- [ ] Get project details
- [ ] Update project
- [ ] Add project members
- [ ] List project members

### Task Management ✓
- [ ] Create task
- [ ] List tasks
- [ ] Get task details
- [ ] Update task
- [ ] Assign task
- [ ] Filter tasks by project
- [ ] Filter tasks by status

### Discussions ✓
- [ ] Create discussion
- [ ] List discussions
- [ ] Get discussion details
- [ ] Add comments
- [ ] List comments

### Notifications ✓
- [ ] List notifications
- [ ] Mark as read
- [ ] Mark all as read

## 🎯 Performance Testing

Use the collection to test:
- Response times (< 2000ms target)
- Concurrent requests
- Large data sets
- Pagination

## 📚 API Documentation

While testing, also check:
- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **API Schema**: http://localhost:8000/api/v1/schema/

## 🔐 Security Testing

Test these security aspects:
- Authentication required for protected endpoints
- Users can only access their own data
- Admin-only endpoints are protected
- Input validation works correctly
- SQL injection protection

## 📈 Next Steps

After basic testing:
1. Test with larger datasets
2. Test concurrent user scenarios  
3. Test file upload functionality
4. Test real-time features (if implemented)
5. Performance testing with load testing tools

## 💡 Tips for Effective Testing

1. **Test in sequence**: Authentication → Users → Projects → Tasks → Discussions
2. **Use meaningful test data**: Real-looking names, descriptions, dates
3. **Test edge cases**: Empty fields, very long text, special characters
4. **Clean up**: Delete test data or use separate test database
5. **Document issues**: Note any bugs or unexpected behavior
