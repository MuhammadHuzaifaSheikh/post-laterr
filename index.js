
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
const passport = require('passport');
const InstagramStrategy = require('passport-instagram').Strategy;
require('dotenv').config();

const app = express();

// Add headers middleware
app.use((req, res, next) => {
  // Set custom User-Agent and ngrok warning skip header
  req.headers['user-agent'] = 'instagram-login-app';
  req.headers['ngrok-skip-browser-warning'] = 'true';
  
  // Response headers
  res.setHeader('ngrok-skip-browser-warning', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'ngrok-skip-browser-warning, Origin, Content-Type, Accept, User-Agent');
  res.setHeader('User-Agent', 'instagram-login-app');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Helper function to get base URL
const getBaseUrl = (req) => {
  return `${req.protocol}://${req.get('host')}`;
};

// Instagram API Verification Endpoint
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.INSTAGRAM_VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// Deauthorize callback endpoint
app.post('/instagram/deauthorize', (req, res) => {
  // Handle user deauthorization
  console.log('User deauthorized the app:', req.body);
  // Here you would typically remove user data from your database
  res.status(200).send('Deauthorization successful');
});

// Data deletion request endpoint
app.post('/instagram/data-deletion', (req, res) => {
  // Handle data deletion request
  console.log('Data deletion request received:', req.body);
  // Here you would typically implement user data deletion logic
  res.status(200).json({
    message: 'Data deletion request received',
    status: 'success',
    url: 'https://your-confirmation-url.com' // Replace with your actual confirmation URL
  });
});

// Configure Passport session setup.
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Configure dynamic Instagram Strategy
app.use((req, res, next) => {
  const baseUrl = getBaseUrl(req);
  passport.use(new InstagramStrategy({
      clientID: process.env.INSTAGRAM_CLIENT_ID,
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
      callbackURL: `${baseUrl}/auth/instagram/callback`,
      scope: [
        'instagram_business_basic',
        'instagram_business_manage_messages',
        'instagram_business_manage_comments',
        'instagram_business_content_publish',
        'instagram_business_manage_insights'
      ]
    },
    function(accessToken, refreshToken, profile, done) {
      profile.accessToken = accessToken;
      profile.refreshToken = refreshToken;
      return done(null, profile);
    }
  ));
  next();
});

app.use(express.json()); // For parsing application/json
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Home route with Instagram business login button
app.get('/', (req, res) => {
  const baseUrl = getBaseUrl(req);
  const loginUrl = `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${encodeURIComponent(baseUrl + '/auth/instagram/callback')}&response_type=code&scope=${encodeURIComponent('instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish,instagram_business_manage_insights')}`;
  
  res.send(`
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <title>Instagram Business Login</title>
        <script>
          // Add headers to all requests
          const originalFetch = window.fetch;
          window.fetch = function(url, options = {}) {
            if (!options.headers) {
              options.headers = {};
            }
            options.headers['ngrok-skip-browser-warning'] = 'true';
            options.headers['user-agent'] = 'instagram-login-app';
            return originalFetch(url, options);
          };

          // Add headers to XHR requests
          const originalXHR = window.XMLHttpRequest;
          window.XMLHttpRequest = function() {
            const xhr = new originalXHR();
            const originalOpen = xhr.open;
            xhr.open = function() {
              const result = originalOpen.apply(xhr, arguments);
              xhr.setRequestHeader('ngrok-skip-browser-warning', 'true');
              xhr.setRequestHeader('user-agent', 'instagram-login-app');
              return result;
            };
            return xhr;
          };
        </script>
      </head>
      <body>
        <h1>Instagram Business Login Demo</h1>
        <p>Current callback URL: ${baseUrl}/auth/instagram/callback</p>
        <a href="${loginUrl}">
          <button>Login with Instagram Business</button>
        </a>
      </body>
    </html>
  `);
});

// OAuth callback URL.
app.get('/auth/instagram/callback', 
  passport.authenticate('instagram', { failureRedirect: '/' }),
  (req, res) => {
    // Successful authentication, redirect to profile.
    res.redirect('/profile');
  }
);

// A protected route to display user profile information.
app.get('/profile', (req, res) => {
  if (!req.user) {
    return res.redirect('/');
  }
  res.send(`
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <title>Profile - Instagram Business</title>
        <script>
          // Add headers to all requests
          const originalFetch = window.fetch;
          window.fetch = function(url, options = {}) {
            if (!options.headers) {
              options.headers = {};
            }
            options.headers['ngrok-skip-browser-warning'] = 'true';
            options.headers['user-agent'] = 'instagram-login-app';
            return originalFetch(url, options);
          };

          // Add headers to XHR requests
          const originalXHR = window.XMLHttpRequest;
          window.XMLHttpRequest = function() {
            const xhr = new originalXHR();
            const originalOpen = xhr.open;
            xhr.open = function() {
              const result = originalOpen.apply(xhr, arguments);
              xhr.setRequestHeader('ngrok-skip-browser-warning', 'true');
              xhr.setRequestHeader('user-agent', 'instagram-login-app');
              return result;
            };
            return xhr;
          };
        </script>
      </head>
      <body>
        <h1>Hello, ${req.user.username || 'Business User'}</h1>
        <pre>${JSON.stringify(req.user, null, 2)}</pre>
        <a href="/logout">Logout</a>
      </body>
    </html>
  `);
});

// Logout route.
app.get('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});

// Start the server.
app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
  console.log('Make sure you have set up your .env file with the required credentials');
  console.log('\nIMPORTANT: Use your ngrok URL in the Instagram Developer Console:');
  console.log('- OAuth redirect URI: [ngrok-url]/auth/instagram/callback');
  console.log('- Deauthorize Callback URL: [ngrok-url]/instagram/deauthorize');
  console.log('- Data Deletion Request URL: [ngrok-url]/instagram/data-deletion');
});
