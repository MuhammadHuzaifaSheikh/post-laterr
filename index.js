
// require('dotenv').config()

// const express = require('express');
// const axios = require('axios');
// const cookieParser = require('cookie-parser');
// const qs = require('qs');

// const app = express();
// app.use(express.json());
// app.use(cookieParser());



// // Replace with your LinkedIn Client ID and Secret  
// const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
// const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;



// const isProduction = false;
// const Base_Url = isProduction ? 'https://post-latter.vercel.app' : 'http://localhost:3000';



// // ===================== LinkedIn Authentication ===================== //

// // Step 1: Route to initiate LinkedIn Login
// app.get('/auth/linkedin', (req, res) => {

//   const redirectUri = Base_Url + '/auth/linkedin/callback';
//   const scope = 'profile%20openid%20email';
//   const state = 'DCEeFWf45A53sdfKef424'; // Ideally, generate a random string for security

//   const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;

//   res.redirect(authUrl);
// })

// // Step 2: LinkedIn OAuth Callback
// app.get('/auth/linkedin/callback', async (req, res) => {
//   const redirectUri = Base_Url + '/auth/linkedin/callback';
//   const { code, state } = req.query;
//   const frontendUrl = 'https://app.inceptiontoaction.co.uk'


//   if (!code) {
//     return res.status(400).send('Authorization code not provided');
//   }

//   try {
//     // Exchange code for an Access Token
//     const tokenResponse = await axios.post(
//       'https://www.linkedin.com/oauth/v2/accessToken',
//       qs.stringify({
//         grant_type: 'authorization_code',
//         code,
//         redirect_uri: redirectUri,
//         client_id: LINKEDIN_CLIENT_ID,
//         client_secret: LINKEDIN_CLIENT_SECRET,
//       }),
//       {
//         headers: {
//           'Content-Type': 'application/x-www-form-urlencoded',
//         },
//       }
//     );

//     const accessToken = tokenResponse.data.access_token;

//     console.log('accessToken',accessToken)

//     // Get User's LinkedIn ID
//     const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
//       headers: {
//         Authorization: `Bearer ${accessToken}`,
//       },
//     });

//     const linkedInId = profileResponse.data.sub;
//     let userTokens = {
//       accessToken,
//       linkedInId
//     }

//     console.log('profileResponse',profileResponse)

//     // try {
//     //   const saveUserLinkedInToken = async (req, res) => {
//     //     const email = linkedinEmail


//     //     // res.status(200).json({email:email ,userToken:userToken});

//     //     try {

//     //       await User.findOneAndUpdate(
//     //         { email },
//     //         {
//     //           userLinkedInToken: userTokens
//     //         },
//     //         {
//     //           new: true,
//     //         }
//     //       );

//     //     } catch (error) {
//     //       console.log(error);

//     //     }
//     //   };

//     //   saveUserLinkedInToken()

//     // } catch (error) {

//     // }
//     // console.log(userTokens);


//     // console.log('user data',profileResponse.data)  // you can save linkedin user data in database

//     // // Store the LinkedIn Access Token


//     // res.redirect(`${frontendUrl}/authstatus?status=success`);

//     res.send('success')

//   } catch (error) {
//     console.error('Error during LinkedIn OAuth:', error.response?.data || error.message);
//     // res.redirect(`${frontendUrl}/authstatus?status=error`);
//     res.send('error')

//   }
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


// // Start the server
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });-




const express = require('express');
const session = require('express-session');
const axios = require('axios');

const app = express();

const INSTAGRAM_CLIENT_ID = '515169714623407';
const INSTAGRAM_CLIENT_SECRET = '21051d5b74d919d623350c914a881f93';
const INSTAGRAM_CALLBACK_URL = 'https://post-latter.vercel.app/instagram/callback';


let accessToken = null; // Global variable to store access token

app.use(express.json());


app.get('/', (req, res) => {
  const loginUrl = `https://www.instagram.com/oauth/authorize?client_id=${INSTAGRAM_CLIENT_ID}&redirect_uri=${INSTAGRAM_CALLBACK_URL}&response_type=code&scope=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish,instagram_business_manage_insights`;
  
  res.send(`
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Instagram Business</title>
      </head>
      <body>
        <h1>Instagram Business Login</h1>
        <a href="${loginUrl}"><button>Login with Instagram</button></a>
      </body>
    </html>
  `);
});

app.get('/instagram/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('Authorization code not found');
  }
  
  try {
    const response = await axios.post('https://api.instagram.com/oauth/access_token', null, {
      params: {
        client_id: INSTAGRAM_CLIENT_ID,
        client_secret: INSTAGRAM_CLIENT_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: INSTAGRAM_CALLBACK_URL,
        code: code
      }
    });
    
    accessToken = response.data.access_token;
    res.redirect('/profile');
  } catch (error) {
    console.error('Error fetching access token:', error.response?.data || error.message);
    res.status(500).send('Failed to get access token');
  }
});

app.get('/profile', (req, res) => {
  if (!accessToken) {
    return res.redirect('/');
  }
  res.send(`
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Profile</title>
      </head>
      <body>
        <h1>Instagram Access Token</h1>
        <p>${accessToken}</p>
        <a href="/logout">Logout</a>
      </body>
    </html>
  `);
});

app.get('/logout', (req, res) => {
  accessToken = null;
  res.redirect('/');
});

app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});
