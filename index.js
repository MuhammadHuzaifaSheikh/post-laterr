// index.js

require('dotenv').config()

const express = require('express');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const qs = require('qs');

const app = express();
app.use(express.json());
app.use(cookieParser());

// Replace with your Facebook App ID and Secret
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

// Replace with your LinkedIn Client ID and Secret  
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;

// In-memory storage for demo purposes (use a database in production)
let userTokens = {};
let currentUserId = ''; // This should store the user ID when connecting to an account

// ===================== Facebook Authentication ===================== //

// Step 1: Route to initiate Facebook Login
app.get('/auth/facebook', (req, res) => {
    const redirectUri = 'http://localhost:3000/auth/facebook/callback';
    const scope = [
        'public_profile',
        'pages_manage_posts',
        'pages_show_list',
        'pages_read_engagement',
    ].join(',');

    const authUrl = `https://www.facebook.com/v17.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(
        redirectUri
    )}&scope=${scope}&response_type=code&auth_type=rerequest`;

    res.redirect(authUrl);
});

// Step 2: Facebook OAuth Callback
app.get('/auth/facebook/callback', async (req, res) => {
    const redirectUri = 'http://localhost:3000/auth/facebook/callback';
    const { code } = req.query;

    if (!code) {
        return res.status(400).send('Authorization code not provided');
    }

    try {
        // Exchange code for a User Access Token
        const tokenResponse = await axios.get(
            `https://graph.facebook.com/v17.0/oauth/access_token`,
            {
                params: {
                    client_id: FACEBOOK_APP_ID,
                    redirect_uri: redirectUri,
                    client_secret: FACEBOOK_APP_SECRET,
                    code,
                },
            }
        );

        const userAccessToken = tokenResponse.data.access_token;

        // Get User ID
        const userProfile = await axios.get(`https://graph.facebook.com/me`, {
            params: {
                access_token: userAccessToken,
            },
        });

        const userId = userProfile.data.id;
        currentUserId = userId;

        // Get Pages Managed by User
        const pagesResponse = await axios.get(
            `https://graph.facebook.com/${userId}/accounts`,
            {
                params: {
                    access_token: userAccessToken,
                },
            }
        );

        const pages = pagesResponse.data.data;

        if (pages.length === 0) {
            return res.status(400).send('No pages found for this user.');
        }

        // For simplicity, select the first page (you can let the user choose)
        const page = pages[0];

        // Store the Page Access Token
        if (!userTokens[userId]) {
            userTokens[userId] = {};
        }
        userTokens[userId].facebook = {
            pageId: page.id,
            pageAccessToken: page.access_token,
        };

        // Set a cookie to identify the user (use proper authentication in production)
        res.cookie('userId', userId, { httpOnly: true });

        res.send(
            `Facebook authentication successful! Page "${page.name}" connected. You can now make posts.`
        );
    } catch (error) {
        console.error('Error during Facebook OAuth:', error.response?.data || error.message);
        res.status(500).send('Authentication failed.');
    }
});

// Step 3: POST endpoint to create a Facebook page post
app.post('/post/facebook', async (req, res) => {
    if (!userTokens[currentUserId]?.facebook) {
        return res.status(401).json({ error: 'User not authenticated with Facebook.' });
    }

    const { message, link } = req.body;

    if (!message && !link) {
        return res.status(400).json({ error: 'Message or link is required.' });
    }

    try {
        const { pageId, pageAccessToken } = userTokens[currentUserId].facebook;

        const response = await axios.post(
            `https://graph.facebook.com/${pageId}/feed`,
            qs.stringify({
                message,
                link,
                access_token: pageAccessToken,
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        return res.status(200).json({
            success: true,
            postId: response.data.id,
        });
    } catch (error) {
        console.error('Error posting to Facebook:', error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            error: error.response?.data || error.message,
        });
    }
});

// ===================== LinkedIn Authentication ===================== //

// Step 1: Route to initiate LinkedIn Login
app.get('/auth/linkedin', (req, res) => {
    const redirectUri = 'http://localhost:3000/auth/linkedin/callback';
    const scope = 'profile%20openid%20w_member_social%20email';
    const state = 'DCEeFWf45A53sdfKef424'; // Ideally, generate a random string for security

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(  redirectUri )}&scope=${scope}&state=${state}`;

    console.log(authUrl)
    res.redirect(authUrl);
})

// Step 2: LinkedIn OAuth Callback
app.get('/auth/linkedin/callback', async (req, res) => {
    const redirectUri = 'http://localhost:3000/auth/linkedin/callback';
    const { code, state } = req.query;

    if (!code) {
        return res.status(400).send('Authorization code not provided');
    }

    try {
        // Exchange code for an Access Token
        const tokenResponse = await axios.post(
            'https://www.linkedin.com/oauth/v2/accessToken',
            qs.stringify({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
                client_id: LINKEDIN_CLIENT_ID,
                client_secret: LINKEDIN_CLIENT_SECRET,
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        const accessToken = tokenResponse.data.access_token;


        // Get User's LinkedIn ID
        const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const linkedInId = profileResponse.data.sub;
        currentUserId = linkedInId;

        // console.log('user data',profileResponse.data)  // you can save linkedin user data in database

        // // Store the LinkedIn Access Token
        if (!userTokens[currentUserId]) {
            userTokens[currentUserId] = {};
        }
        userTokens[currentUserId].linkedin = {
            linkedInId,
            accessToken,
        };

        res.send('LinkedIn authentication successful! You can now make posts.');
    } catch (error) {
        console.error('Error during LinkedIn OAuth:', error.response?.data || error.message);
        res.status(500).send('LinkedIn authentication failed.');
    }
});

// Step 3: POST endpoint to create a LinkedIn post
app.post('/post/linkedin', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required.' });
    }

    if (!userTokens[currentUserId]?.linkedin) {
        return res.status(401).json({ error: 'User not authenticated with LinkedIn.' });
    }

    try {
        const { linkedInId, accessToken } = userTokens[currentUserId].linkedin;

        // Post content using new LinkedIn posts API
        const postResponse = await axios.post(
            'https://api.linkedin.com/rest/posts',
            {
                author: `urn:li:person:${linkedInId}`,
                commentary: message,
                visibility: "PUBLIC",
                lifecycleState: "PUBLISHED",
                distribution: {
                    feedDistribution: "MAIN_FEED",
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'LinkedIn-Version': '202401',
                    'X-Restli-Protocol-Version': '2.0.0',
                },
            }
        );

        return res.status(200).json({
            success: true,
            postId: postResponse.data.id,
        });
    } catch (error) {
        console.error('Error posting to LinkedIn:', error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            error: error.response?.data || error.message,
        });
    }
});



// ===================== General Routes ===================== //

// Route to render a simple page with "Connect to Facebook" and "Connect to LinkedIn" buttons
app.get('/', (req, res) => {
    res.send(`
        <h1>Welcome to the Social Media Poster</h1>
        <a href="/auth/facebook">Connect your Facebook Page</a><br/>
        <a href="/auth/linkedin">Connect your LinkedIn Account</a>
    `);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

