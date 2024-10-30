# Facebook Page Poster

This is a Node.js application that allows users to authenticate via Facebook, connect their Facebook Page, and post messages or links directly to their Facebook Page. The app uses OAuth 2.0 for authentication and the Facebook Graph API to interact with Facebook Pages.

## Prerequisites

Before running the app, ensure you have the following:

- **Node.js**: Download and install [Node.js](https://nodejs.org/) (version 12+ recommended).
- **Facebook Developer Account**: Create a Facebook app in the [Facebook Developer Dashboard](https://developers.facebook.com/).
- **App ID and App Secret**: After creating your Facebook app, you will need the `APP_ID` and `APP_SECRET` to connect the application with Facebook.

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/facebook-page-poster.git
   cd facebook-page-poster

Install dependencies:
npm install


Replace your_facebook_app_id and your_facebook_app_secret with your actual credentials from the Facebook Developer dashboard.

start the server 
npm run dev


How to Use
Step 1: Connect Your Facebook Account
Open your browser and go to http://localhost:3000/.
Click on "Connect your Facebook Page" to start the Facebook login process.
After logging in, the app will request permission to manage your pages and make posts.
Step 2: Posting to Your Facebook Page
After authentication:

Use Postman or any HTTP client to make a POST request to http://localhost:3000/post.

Provide a JSON body with either a message or a link to post:

{
  "message": "Hello, this is my first post from the Facebook Page Poster!"
}

OR
{
  "message": "Check out this amazing link!",
  "link": "https://www.example.com"
}

If successful, the server will respond with the postId of the post made on your page.

Step 3: View the Post
Once posted, navigate to your Facebook page to view the post.


Code Overview
Key Routes
GET /auth/facebook: Redirects the user to Facebook to authenticate and authorize the app to manage their pages.
GET /auth/facebook/callback: Handles the callback from Facebook after authentication, exchanges the authorization code for a user access token, and retrieves the Facebook Pages the user manages.
POST /post: Allows the user to create a post on the connected Facebook Page by sending a message or link in the request body.
Dependencies
express: A minimal Node.js framework for building web applications.
axios: A promise-based HTTP client used for making requests to the Facebook Graph API.
cookie-parser: Parses cookies attached to the client request object.
qs: Used to serialize request data in application/x-www-form-urlencoded format.
Key Variables
APP_ID: Your Facebook App ID.
APP_SECRET: Your Facebook App Secret.
userTokens: An in-memory store that keeps track of user tokens (in production, this should be replaced with database storage).
currentUserId: The ID of the current user who is authenticated with Facebook.
Known Limitations
In-Memory Token Storage: Currently, user tokens are stored in memory. For a production app, store the tokens in a database like MongoDB or PostgreSQL.
Page Selection: The app automatically selects the first page the user manages. You can extend the app to allow the user to choose which page to post to.
Future Improvements
Add database integration to persist user tokens.
Add functionality to let users choose between different Facebook Pages.
Implement a more robust authentication system for user sessions

