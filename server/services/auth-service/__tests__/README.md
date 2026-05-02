# Auth Service Unit Tests

Unit tests for the authentication service, covering password reset functionality.

## Test Structure

- `passwordResetService.test.js` - Tests for the password reset business logic
- `PasswordResetController.test.js` - Tests for the password reset HTTP controller

## Running Tests

From the server directory:

```bash
# Run all auth service tests
npm run test:auth

# Run tests with coverage
npm run test:auth:coverage

# Run tests in watch mode
npm run test:auth:watch
```

From the auth-service directory:

```bash
npm test
```

## Test Coverage

### Password Reset Service Tests

- ✅ Email validation (required field)
- ✅ CAPTCHA token validation (required field)
- ✅ CAPTCHA verification with Google API
- ✅ User lookup by email
- ✅ OAuth user detection (prevent reset for social accounts)
- ✅ Password generation and hashing
- ✅ Email sending
- ✅ Error handling for network issues
- ✅ Optional CAPTCHA validation (when env var not set)

### Password Reset Controller Tests

- ✅ Success response (200) with result message
- ✅ Error handling with custom HTTP status codes
- ✅ Validation error responses
- ✅ CAPTCHA error responses
- ✅ User not found (404) responses
- ✅ OAuth user error responses
- ✅ Unexpected error handling (500 fallback)
- ✅ Request body passthrough to service
- ✅ Empty body graceful handling

## Mocked Dependencies

- `crypto` - For password hashing
- `axios` - For Google CAPTCHA verification API
- `db` - For database User model
- `emailService` - For sending password reset emails

## Notes

- Tests use Jest with ESM support
- All external dependencies are mocked to isolate business logic
- Tests cover both happy paths and error scenarios
- Includes edge cases like OAuth users and missing environment variables
