import dotenv from 'dotenv';  // ✅ Load .env variables
import dotenvExpand from 'dotenv-expand';  // ✅ Load .env variables with expansion
import express from 'express';
import session from 'express-session';
import axios from 'axios';

dotenvExpand.expand(dotenv.config());  // ✅ Expand environment variables

const app = express();

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

// ✅ Home route
app.get('/', (req, res) => {
  if (req.session.user) {
    res.send(`
      <h1>👋 Hello, ${req.session.user.email}!</h1>
      <p>Signed in via <strong>Microsoft Entra ID → Amazon Cognito</strong></p>
      <p><a href="/logout">Sign Out</a></p>
    `);
  } else {
    const params = new URLSearchParams({
      client_id: process.env.CLIENT_ID,
      response_type: 'code',
      scope: process.env.SCOPE,
      redirect_uri: process.env.REDIRECT_URI,      
      identity_provider: process.env.IDENTITY_PROVIDER  // ✅ Use env variable for flexibility
    });

    const loginUrl = `${process.env.COGNITO_DOMAIN}/oauth2/authorize?${params}`;
    console.log('Login URL:', loginUrl);   // ✅ Debug — check this in terminal
    res.redirect(loginUrl);
  }
});


// ✅ Callback route
app.get('/callback', async (req, res) => {
  console.log('Callback parameters:', req.query);
  const { code, error, error_description } = req.query;

  // ✅ Catch errors returned directly in callback URL
  if (error) {
    console.error('Callback error:', error, error_description);
    return res.status(400).send(`Login failed: ${error_description}`);
  }

  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      redirect_uri: process.env.REDIRECT_URI,
      code
    });

    console.log('Token request params:', params.toString()); // ✅ Debug log

    const tokenResponse = await axios.post(
      `${process.env.COGNITO_DOMAIN}/oauth2/token`,
      params,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token } = tokenResponse.data;
    const userInfo = await axios.get(
      `${process.env.COGNITO_DOMAIN}/oauth2/userInfo`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    req.session.user = userInfo.data;
    res.redirect('/');
  } catch (err) {
    console.error('Full error:', JSON.stringify(err.response?.data, null, 2));
    res.status(500).send('Authentication failed');
  }
});


// ✅ Logout route
app.get('/logout', (req, res) => {
  console.log('Logging out user:', req.session.user);
  req.session?.destroy();

   // Build Cognito logout URL
  const logoutUrl = new URLSearchParams({
    client_id: process.env.CLIENT_ID,
    logout_uri: `${process.env.APP_DOMAIN}/loggedout`  // ✅ Must match allowed sign-out URL
  });
  
  const url = `${process.env.COGNITO_DOMAIN}/logout?${logoutUrl.toString()}`;
  console.log('Redirecting to Cognito logout URL:', url);
  res.redirect(url);
});

app.get('/loggedout', (req, res) => {
  res.send('✅ You have been signed out. <a href="/">Login again</a>');
});

const server = app.listen(process.env.PORT, () => {
  console.log(`✅ Hello World SSO App running at ${process.env.APP_DOMAIN}`);
});

// Keep alive check
server.on('error', (err) => {
  console.error('❌ Server error:', err.message);
});

