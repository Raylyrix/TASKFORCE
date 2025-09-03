# OAuth Credentials Setup Guide

## Quick Setup

To use TASK FORCE, you need to provide your Google OAuth credentials. Here are the steps:

### Option 1: Use the provided credentials.json file
1. Copy the `mailer.json` file from your downloads folder
2. Rename it to `credentials.json`
3. Place it in the TASK FORCE application directory
4. The application will automatically detect and use it

### Option 2: Set environment variable
1. Set the environment variable `TF_DEFAULT_OAUTH_JSON` to point to your credentials file
2. Example: `set TF_DEFAULT_OAUTH_JSON=C:\path\to\your\credentials.json`

### Option 3: Use the credentials.json file in the app directory
1. Create a file named `credentials.json` in the TASK FORCE directory
2. Copy your OAuth credentials into it
3. The application will automatically load it

## Credentials Format

Your credentials file should look like this:

```json
{
  "installed": {
    "client_id": "your-client-id.apps.googleusercontent.com",
    "project_id": "your-project-id",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "your-client-secret",
    "redirect_uris": ["http://localhost"]
  }
}
```

## Getting Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API and Google Sheets API
4. Go to "Credentials" and create OAuth 2.0 Client ID
5. Set application type to "Desktop application"
6. Download the JSON file and use it as described above

## Security Note

Never commit your credentials.json file to version control. Keep it secure and private.