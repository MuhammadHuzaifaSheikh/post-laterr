// // index.js

// require('dotenv').config()

// const express = require('express');
// const axios = require('axios');
// const cookieParser = require('cookie-parser');
// const qs = require('qs');

// const app = express();
// app.use(express.json());
// app.use(cookieParser());

// // Replace with your Facebook App ID and Secret
// const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
// const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

// // Replace with your LinkedIn Client ID and Secret  
// const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
// const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;

// // In-memory storage for demo purposes (use a database in production)
// let userTokens = {};
// let currentUserId = ''; // This should store the user ID when connecting to an account

// const isProduction = true;
// const Base_Url = isProduction ? 'https://post-latter.vercel.app' : 'http://localhost:3000';

// // ===================== Facebook Authentication ===================== //

// // Step 1: Route to initiate Facebook Login
// app.get('/auth/facebook', (req, res) => {
//     const redirectUri = Base_Url+'/auth/facebook/callback';
//     const scope = [
//         'public_profile',
//         'pages_manage_posts',
//         'pages_show_list',
//         'pages_read_engagement',
//     ].join(',');

//     const authUrl = `https://www.facebook.com/v17.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(
//         redirectUri
//     )}&scope=${scope}&response_type=code&auth_type=rerequest`;

//     res.redirect(authUrl);
// });

// // Step 2: Facebook OAuth Callback
// app.get('/auth/facebook/callback', async (req, res) => {
//     const redirectUri = Base_Url+'/auth/facebook/callback';
//     const { code } = req.query;

//     if (!code) {
//         return res.status(400).send('Authorization code not provided');
//     }

//     try {
//         // Exchange code for a User Access Token
//         const tokenResponse = await axios.get(
//             `https://graph.facebook.com/v17.0/oauth/access_token`,
//             {
//                 params: {
//                     client_id: FACEBOOK_APP_ID,
//                     redirect_uri: redirectUri,
//                     client_secret: FACEBOOK_APP_SECRET,
//                     code,
//                 },
//             }
//         );

//         const userAccessToken = tokenResponse.data.access_token;

//         // Get User ID
//         const userProfile = await axios.get(`https://graph.facebook.com/me`, {
//             params: {
//                 access_token: userAccessToken,
//             },
//         });

//         const userId = userProfile.data.id;
//         currentUserId = userId;

//         // Get Pages Managed by User
//         const pagesResponse = await axios.get(
//             `https://graph.facebook.com/${userId}/accounts`,
//             {
//                 params: {
//                     access_token: userAccessToken,
//                 },
//             }
//         );

//         const pages = pagesResponse.data.data;

//         if (pages.length === 0) {
//             return res.status(400).send('No pages found for this user.');
//         }

//         // For simplicity, select the first page (you can let the user choose)
//         const page = pages[0];

//         // Store the Page Access Token
//         if (!userTokens[userId]) {
//             userTokens[userId] = {};
//         }
//         userTokens[userId].facebook = {
//             pageId: page.id,
//             pageAccessToken: page.access_token,
//         };

//         // Set a cookie to identify the user (use proper authentication in production)
//         res.cookie('userId', userId, { httpOnly: true });

//         res.send(
//             `Facebook authentication successful! Page "${page.name}" connected. You can now make posts.`
//         );
//     } catch (error) {
//         console.error('Error during Facebook OAuth:', error.response?.data || error.message);
//         res.status(500).send('Authentication failed.');
//     }
// });

// // Step 3: POST endpoint to create a Facebook page post
// app.post('/post/facebook', async (req, res) => {
//     if (!userTokens[currentUserId]?.facebook) {
//         return res.status(401).json({ error: 'User not authenticated with Facebook.' });
//     }

//     const { message, link } = req.body;

//     if (!message && !link) {
//         return res.status(400).json({ error: 'Message or link is required.' });
//     }

//     try {
//         const { pageId, pageAccessToken } = userTokens[currentUserId].facebook;

//         const response = await axios.post(
//             `https://graph.facebook.com/${pageId}/feed`,
//             qs.stringify({
//                 message,
//                 link,
//                 access_token: pageAccessToken,
//             }),
//             {
//                 headers: {
//                     'Content-Type': 'application/x-www-form-urlencoded',
//                 },
//             }
//         );

//         return res.status(200).json({
//             success: true,
//             postId: response.data.id,
//         });
//     } catch (error) {
//         console.error('Error posting to Facebook:', error.response?.data || error.message);
//         return res.status(500).json({
//             success: false,
//             error: error.response?.data || error.message,
//         });
//     }
// });

// // ===================== LinkedIn Authentication ===================== //

// // Step 1: Route to initiate LinkedIn Login
// app.get('/auth/linkedin', (req, res) => {
//     const redirectUri = Base_Url+'/auth/linkedin/callback';
//     const scope = 'profile%20openid%20w_member_social%20email';
//     const state = 'DCEeFWf45A53sdfKef424'; // Ideally, generate a random string for security

//     const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(  redirectUri )}&scope=${scope}&state=${state}`;

//     console.log(authUrl)
//     res.redirect(authUrl);
// })

// // Step 2: LinkedIn OAuth Callback
// app.get('/auth/linkedin/callback', async (req, res) => {
//     const redirectUri = Base_Url+'/auth/linkedin/callback';
//     const { code, state } = req.query;

//     if (!code) {
//         return res.status(400).send('Authorization code not provided');
//     }

//     try {
//         // Exchange code for an Access Token
//         const tokenResponse = await axios.post(
//             'https://www.linkedin.com/oauth/v2/accessToken',
//             qs.stringify({
//                 grant_type: 'authorization_code',
//                 code,
//                 redirect_uri: redirectUri,
//                 client_id: LINKEDIN_CLIENT_ID,
//                 client_secret: LINKEDIN_CLIENT_SECRET,
//             }),
//             {
//                 headers: {
//                     'Content-Type': 'application/x-www-form-urlencoded',
//                 },
//             }
//         );

//         const accessToken = tokenResponse.data.access_token;


//         // Get User's LinkedIn ID
//         const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
//             headers: {
//                 Authorization: `Bearer ${accessToken}`,
//             },
//         });

//         const linkedInId = profileResponse.data.sub;
//         currentUserId = linkedInId;

//         // console.log('user data',profileResponse.data)  // you can save linkedin user data in database

//         // // Store the LinkedIn Access Token
//         if (!userTokens[currentUserId]) {
//             userTokens[currentUserId] = {};
//         }
//         userTokens[currentUserId].linkedin = {
//             linkedInId,
//             accessToken,
//         };

//         res.send('LinkedIn authentication successful! You can now make posts.');
//     } catch (error) {
//         console.error('Error during LinkedIn OAuth:', error.response?.data || error.message);
//         res.status(500).send('LinkedIn authentication failed.');
//     }
// });

// // Step 3: POST endpoint to create a LinkedIn post
// app.post('/post/linkedin', async (req, res) => {
//     const { message } = req.body;

//     if (!message) {
//         return res.status(400).json({ error: 'Message is required.' });
//     }

//     if (!userTokens[currentUserId]?.linkedin) {
//         return res.status(401).json({ error: 'User not authenticated with LinkedIn.' });
//     }

//     try {
//         const { linkedInId, accessToken } = userTokens[currentUserId].linkedin;

//         // Post content using new LinkedIn posts API
//         const postResponse = await axios.post(
//             'https://api.linkedin.com/rest/posts',
//             {
//                 author: `urn:li:person:${linkedInId}`,
//                 commentary: message,
//                 visibility: "PUBLIC",
//                 lifecycleState: "PUBLISHED",
//                 distribution: {
//                     feedDistribution: "MAIN_FEED",
//                 },
//             },
//             {
//                 headers: {
//                     Authorization: `Bearer ${accessToken}`,
//                     'Content-Type': 'application/json',
//                     'LinkedIn-Version': '202401',
//                     'X-Restli-Protocol-Version': '2.0.0',
//                 },
//             }
//         );

//         return res.status(200).json({
//             success: true,
//             postId: postResponse.data.id,
//         });
//     } catch (error) {
//         console.error('Error posting to LinkedIn:', error.response?.data || error.message);
//         return res.status(500).json({
//             success: false,
//             error: error.response?.data || error.message,
//         });
//     }
// });



// // ===================== General Routes ===================== //

// // Route to render a simple page with "Connect to Facebook" and "Connect to LinkedIn" buttons
// app.get('/', (req, res) => {
//     res.send(`
//         <h1>Welcome to the Social Media </h1>
//         <a href="/auth/facebook">Connect your Facebook Page</a><br/>
//         <a href="/auth/linkedin">Connect your LinkedIn Account</a>
//     `);
// });


// // Your WordPress site and credentials
// const wordpressSite = 'https://inceptiontoaction.co.uk';
// const username = 'huzaifa';  // Your WordPress username
// const appPassword = 'xSVH Y4s0 d3ls kmr8 5n6g Inls';  // Your WordPress application password
// const postUrl = `${wordpressSite}/wp-json/wp/v2/posts`;

// // Encode credentials in base64
// const credentials = Buffer.from(`${username}:${appPassword}`).toString('base64');

// // Content for your blog post
// const postData = {
//   title: 'Test Blog Post',
//   content: 'This is content generated by AI. <img src="https://your-wordpress-site.com/wp-content/uploads/2024/11/sample-image.jpg" />',
//   status: 'publish',  // You can change this to 'draft' if you want to save it as a draft
// };

// // Axios request to create a post with Basic Authentication
// // axios.post(postUrl, postData, {
// //   headers: {
// //     Authorization: `Basic ${credentials}`,
// //     'Content-Type': 'application/json',
// //   }
// // })
// //   .then(response => {
// //     console.log('Blog post created:', response.data);
// //   })
// //   .catch(error => {
// //     console.error('Error creating blog post:', error.response ? error.response.data : error.message);
// //   });

// // Start the server
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });







// latest

// // index.js

// require('dotenv').config()

// const express = require('express');
// const axios = require('axios');
// const cookieParser = require('cookie-parser');
// const qs = require('qs');

// const app = express();
// app.use(express.json());
// app.use(cookieParser());

// // Replace with your Facebook App ID and Secret
// const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
// const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

// // Replace with your LinkedIn Client ID and Secret  
// const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
// const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;

// // In-memory storage for demo purposes (use a database in production)
// let userTokens = {};
// let currentUserId = ''; // This should store the user ID when connecting to an account

// const isProduction = true;
// const Base_Url = isProduction ? 'https://post-latter.vercel.app' : 'http://localhost:3000';

// // ===================== Facebook Authentication ===================== //

// // Step 1: Route to initiate Facebook Login
// app.get('/auth/facebook', (req, res) => {
//     const redirectUri = Base_Url+'/auth/facebook/callback';
//     const scope = [
//         'public_profile',
//         'pages_manage_posts',
//         'pages_show_list',
//         'pages_read_engagement',
//     ].join(',');

//     const authUrl = `https://www.facebook.com/v17.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(
//         redirectUri
//     )}&scope=${scope}&response_type=code&auth_type=rerequest`;

//     res.redirect(authUrl);
// });

// // Step 2: Facebook OAuth Callback
// app.get('/auth/facebook/callback', async (req, res) => {
//     const redirectUri = Base_Url+'/auth/facebook/callback';
//     const { code } = req.query;

//     if (!code) {
//         return res.status(400).send('Authorization code not provided');
//     }

//     try {
//         // Exchange code for a User Access Token
//         const tokenResponse = await axios.get(
//             `https://graph.facebook.com/v17.0/oauth/access_token`,
//             {
//                 params: {
//                     client_id: FACEBOOK_APP_ID,
//                     redirect_uri: redirectUri,
//                     client_secret: FACEBOOK_APP_SECRET,
//                     code,
//                 },
//             }
//         );

//         const userAccessToken = tokenResponse.data.access_token;

//         // Get User ID
//         const userProfile = await axios.get(`https://graph.facebook.com/me`, {
//             params: {
//                 access_token: userAccessToken,
//             },
//         });

//         const userId = userProfile.data.id;
//         currentUserId = userId;

//         // Get Pages Managed by User
//         const pagesResponse = await axios.get(
//             `https://graph.facebook.com/${userId}/accounts`,
//             {
//                 params: {
//                     access_token: userAccessToken,
//                 },
//             }
//         );

//         const pages = pagesResponse.data.data;

//         if (pages.length === 0) {
//             return res.status(400).send('No pages found for this user.');
//         }

//         // For simplicity, select the first page (you can let the user choose)
//         const page = pages[0];

//         // Store the Page Access Token
//         if (!userTokens[userId]) {
//             userTokens[userId] = {};
//         }
//         userTokens[userId].facebook = {
//             pageId: page.id,
//             pageAccessToken: page.access_token,
//         };

//         // Set a cookie to identify the user (use proper authentication in production)
//         res.cookie('userId', userId, { httpOnly: true });

//         res.send(
//             `Facebook authentication successful! Page "${page.name}" connected. You can now make posts.`
//         );
//     } catch (error) {
//         console.error('Error during Facebook OAuth:', error.response?.data || error.message);
//         res.status(500).send('Authentication failed.');
//     }
// });

// // Step 3: POST endpoint to create a Facebook page post
// app.post('/post/facebook', async (req, res) => {
//     if (!userTokens[currentUserId]?.facebook) {
//         return res.status(401).json({ error: 'User not authenticated with Facebook.' });
//     }

//     const { message, link } = req.body;

//     if (!message && !link) {
//         return res.status(400).json({ error: 'Message or link is required.' });
//     }

//     try {
//         const { pageId, pageAccessToken } = userTokens[currentUserId].facebook;

//         const response = await axios.post(
//             `https://graph.facebook.com/${pageId}/feed`,
//             qs.stringify({
//                 message,
//                 link,
//                 access_token: pageAccessToken,
//             }),
//             {
//                 headers: {
//                     'Content-Type': 'application/x-www-form-urlencoded',
//                 },
//             }
//         );

//         return res.status(200).json({
//             success: true,
//             postId: response.data.id,
//         });
//     } catch (error) {
//         console.error('Error posting to Facebook:', error.response?.data || error.message);
//         return res.status(500).json({
//             success: false,
//             error: error.response?.data || error.message,
//         });
//     }
// });

// // ===================== LinkedIn Authentication ===================== //

// // Step 1: Route to initiate LinkedIn Login
// app.get('/auth/linkedin', (req, res) => {
//     const redirectUri = Base_Url+'/auth/linkedin/callback';
//     const scope = 'profile%20openid%20w_member_social%20email';
//     const state = 'DCEeFWf45A53sdfKef424'; // Ideally, generate a random string for security

//     const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(  redirectUri )}&scope=${scope}&state=${state}`;

//     console.log(authUrl)
//     res.redirect(authUrl);
// })

// // Step 2: LinkedIn OAuth Callback
// app.get('/auth/linkedin/callback', async (req, res) => {
//     const redirectUri = Base_Url+'/auth/linkedin/callback';
//     const { code, state } = req.query;

//     if (!code) {
//         return res.status(400).send('Authorization code not provided');
//     }

//     try {
//         // Exchange code for an Access Token
//         const tokenResponse = await axios.post(
//             'https://www.linkedin.com/oauth/v2/accessToken',
//             qs.stringify({
//                 grant_type: 'authorization_code',
//                 code,
//                 redirect_uri: redirectUri,
//                 client_id: LINKEDIN_CLIENT_ID,
//                 client_secret: LINKEDIN_CLIENT_SECRET,
//             }),
//             {
//                 headers: {
//                     'Content-Type': 'application/x-www-form-urlencoded',
//                 },
//             }
//         );

//         const accessToken = tokenResponse.data.access_token;


//         // Get User's LinkedIn ID
//         const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
//             headers: {
//                 Authorization: `Bearer ${accessToken}`,
//             },
//         });

//         const linkedInId = profileResponse.data.sub;
//         currentUserId = linkedInId;

//         // console.log('user data',profileResponse.data)  // you can save linkedin user data in database

//         // // Store the LinkedIn Access Token
//         if (!userTokens[currentUserId]) {
//             userTokens[currentUserId] = {};
//         }
//         userTokens[currentUserId].linkedin = {
//             linkedInId,
//             accessToken,
//         };

//         res.send('LinkedIn authentication successful! You can now make posts.');
//     } catch (error) {
//         console.error('Error during LinkedIn OAuth:', error.response?.data || error.message);
//         res.status(500).send('LinkedIn authentication failed.');
//     }
// });

// // Step 3: POST endpoint to create a LinkedIn post
// app.post('/post/linkedin', async (req, res) => {
//     const { message } = req.body;

//     if (!message) {
//         return res.status(400).json({ error: 'Message is required.' });
//     }

//     if (!userTokens[currentUserId]?.linkedin) {
//         return res.status(401).json({ error: 'User not authenticated with LinkedIn.' });
//     }

//     try {
//         const { linkedInId, accessToken } = userTokens[currentUserId].linkedin;

//         // Post content using new LinkedIn posts API
//         const postResponse = await axios.post(
//             'https://api.linkedin.com/rest/posts',
//             {
//                 author: `urn:li:person:${linkedInId}`,
//                 commentary: message,
//                 visibility: "PUBLIC",
//                 lifecycleState: "PUBLISHED",
//                 distribution: {
//                     feedDistribution: "MAIN_FEED",
//                 },
//             },
//             {
//                 headers: {
//                     Authorization: `Bearer ${accessToken}`,
//                     'Content-Type': 'application/json',
//                     'LinkedIn-Version': '202401',
//                     'X-Restli-Protocol-Version': '2.0.0',
//                 },
//             }
//         );

//         return res.status(200).json({
//             success: true,
//             postId: postResponse.data.id,
//         });
//     } catch (error) {
//         console.error('Error posting to LinkedIn:', error.response?.data || error.message);
//         return res.status(500).json({
//             success: false,
//             error: error.response?.data || error.message,
//         });
//     }
// });



// // ===================== General Routes ===================== //

// // Route to render a simple page with "Connect to Facebook" and "Connect to LinkedIn" buttons
// app.get('/', (req, res) => {
//     res.send(`
//         <h1>Welcome to the Social Media </h1>
//         <a href="/auth/facebook">Connect your Facebook Page</a><br/>
//         <a href="/auth/linkedin">Connect your LinkedIn Account</a>
//     `);
// });


// // Your WordPress site and credentials
// const wordpressSite = 'https://inceptiontoaction.co.uk';
// const username = 'huzaifa';  // Your WordPress username
// const appPassword = 'xSVH Y4s0 d3ls kmr8 5n6g Inls';  // Your WordPress application password
// const postUrl = `${wordpressSite}/wp-json/wp/v2/posts`;

// // Encode credentials in base64
// const credentials = Buffer.from(`${username}:${appPassword}`).toString('base64');

// // Content for your blog post
// const postData = {
//   title: 'Test Blog Post',
//   content: 'This is content generated by AI. <img src="https://your-wordpress-site.com/wp-content/uploads/2024/11/sample-image.jpg" />',
//   status: 'publish',  // You can change this to 'draft' if you want to save it as a draft
// };

// // Axios request to create a post with Basic Authentication
// // axios.post(postUrl, postData, {
// //   headers: {
// //     Authorization: `Basic ${credentials}`,
// //     'Content-Type': 'application/json',
// //   }
// // })
// //   .then(response => {
// //     console.log('Blog post created:', response.data);
// //   })
// //   .catch(error => {
// //     console.error('Error creating blog post:', error.response ? error.response.data : error.message);
// //   });

// // Start the server
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });




// require('dotenv').config();
// const express = require('express');
// const axios = require('axios');

// // Initialize Express app
// const app = express();
// app.use(express.json()); // Parse incoming JSON requests

// // MongoDB Connection (You should replace with your DB URI)



// // Connect to WordPress API (helper function)

// let user = {

// }
// const connectToWordPress = async (credentials) => {
//     const { siteUrl, username, appPassword } = credentials;
//     const postUrl = `${siteUrl}/wp-json/wp/v2/posts`;

//     try {
//         // Try a simple API request to check if the credentials are valid
//         const response = await axios.get(postUrl, {
//             headers: {
//                 Authorization: `Basic ${Buffer.from(`${username}:${appPassword}`).toString('base64')}`,
//             },
//         });

//         // If successful, save WordPress credentials in the user's record (or update)
//         const wordpress = { siteUrl, username, appPassword };

//         return { success: true, message: 'Connected to WordPress successfully!', wordpress };
//     } catch (error) {
//         return { success: false, message: 'Failed to connect to WordPress. Check credentials.' };
//     }
// };


// // API 1: /connectToWordpress (Connect user's WordPress site)
// app.post('/connectToWordpress', async (req, res) => {
//     const { siteUrl, username, appPassword, title, } = req.body;

//     // Find user in the database

//     // Try connecting to WordPress using the provided credentials
//     const result = await connectToWordPress({ siteUrl, username, appPassword });
//     console.log(result)
//     if (result.success) {
//         user.wordpress = result
//         // Create a new post on WordPress
//         const postUrl = `${siteUrl}/wp-json/wp/v2/posts`;
//         const response = await axios.post(postUrl, {
//             title: title,
//             content: 'This is content generated by AI. <img src="https://your-wordpress-site.com/wp-content/uploads/2024/11/sample-image.jpg" />',
//             status: 'publish', // Publish immediately

// //   if you want to pubish later then change the status to future
//             // status: 'future', // Schedule for later
//             // date: scheduledTime, // Schedule time in 'YYYY-MM-DDTHH:MM:SS'
            
//         }, {
//             headers: {
//                 Authorization: `Basic ${Buffer.from(`${username}:${appPassword}`).toString('base64')}`,
//             },
//         });
//         return res.status(200).json(response.data);
//     } else {
//         return res.status(400).json(result);
//     }
// });

// // API 2: /postBlogImmediate (Publish AI-generated content immediately)

// app.post('/postBlogImmediate', async (req, res) => {
//     const { title, content } = req.body;

//     // Find user in the database

//     // Check if the user has connected their WordPress
//     const { siteUrl, username, appPassword } = user.wordpress;
//     if (!siteUrl || !username || !appPassword) {
//         return res.status(400).json({ message: 'User has not connected their WordPress site.' });
//     }

//     // Generate AI content (using OpenAI)
//     try {

//         // Create a new post on WordPress
//         const postUrl = `${siteUrl}/wp-json/wp/v2/posts`;
//         const response = await axios.post(postUrl, {
//             title: title,
//             content: 'This is content generated by AI. <img src="https://your-wordpress-site.com/wp-content/uploads/2024/11/sample-image.jpg" />',
//             status: 'publish', // Publish immediately
//         }, {
//             headers: {
//                 Authorization: `Basic ${Buffer.from(`${username}:${appPassword}`).toString('base64')}`,
//             },
//         });

//         return res.status(200).json({ message: 'Blog post published successfully', data: response.data });
//     } catch (error) {
//         return res.status(500).json({ message: 'Error publishing blog post', error: error.message });
//     }
// });

// // API 3: /postBlogSchedule (Schedule AI-generated content for later)
// app.post('/postBlogSchedule', async (req, res) => {
//     const { title, content, scheduledTime } = req.body;

//     // Find user in the database
//     const user = user
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     // Check if the user has connected their WordPress
//     const { siteUrl, username, appPassword } = user.wordpress;
//     if (!siteUrl || !username || !appPassword) {
//         return res.status(400).json({ message: 'User has not connected their WordPress site.' });
//     }

//     // Generate AI content
//     try {

//         // Create a new post on WordPress
//         const postUrl = `${siteUrl}/wp-json/wp/v2/posts`;
//         const response = await axios.post(postUrl, {
//             title: title,
//             content: content,
//             status: 'future', // Schedule for later
//             date: scheduledTime, // Schedule time in 'YYYY-MM-DDTHH:MM:SS'
//         }, {
//             headers: {
//                 Authorization: `Basic ${Buffer.from(`${username}:${appPassword}`).toString('base64')}`,
//             },
//         });

//         return res.status(200).json({ message: 'Blog post scheduled successfully', data: response.data });
//     } catch (error) {
//         return res.status(500).json({ message: 'Error scheduling blog post', error: error.message });
//     }
// });



// // // Your WordPress site and credentials
// const wordpressSite = 'https://inceptiontoaction.co.uk';
// const username = 'huzaifa';  // Your WordPress username
// const appPassword = 'xSVH Y4s0 d3ls kmr8 5n6g Inls';  // Your WordPress application password
// const postUrl = `${wordpressSite}/wp-json/wp/v2/posts`;

// // Encode credentials in base64
// const credentials = Buffer.from(`${username}:${appPassword}`).toString('base64');

// // Content for your blog post
// const postData = {
//     title: 'Test Blog Post',
//     content: 'This is content generated by AI. <img src="https://your-wordpress-site.com/wp-content/uploads/2024/11/sample-image.jpg" />',
//     status: 'publish',  // You can change this to 'draft' if you want to save it as a draft
// };

// // Axios request to create a post with Basic Authentication
// // axios.post(postUrl, postData, {
// //   headers: {
// //     Authorization: `Basic ${credentials}`,
// //     'Content-Type': 'application/json',
// //   }
// // })
// //   .then(response => {
// //     console.log('Blog post created:', response.data);
// //   })
// //   .catch(error => {
// //     console.error('Error creating blog post:', error.response ? error.response.data : error.message);
// //   });
// // Start the server
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });
