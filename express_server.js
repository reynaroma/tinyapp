const express = require("express");
const { getUserByEmail } = require('./helper');
// const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const app = express(); // instantiate express as new object
const PORT = 3000; // default port 8080

const urlDatabase = {
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "b2xVn2"
  },
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const urlsForUser = (id) => {
  let userUrls = {};
  for (const urls in urlDatabase) {
    if (urlDatabase[urls].userID === id) {
      userUrls[urls] = urlDatabase[urls];
    }
  }
  return userUrls;
};

const users = {
  abcdef: {
    id: "abcdef",
    email: "user1@example.com",
    password: "1234"
  },
  defghi: {
    id: "defghi",
    email: "user2@example.com",
    password: "5678"
  },
};

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.use(cookieSession({
  name: 'session',
  keys: ['iamsecretkeys'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(express.urlencoded({ extended: true }));

// Adding routes
app.get("/", (req, res) => {
  return res.send("Hello!");
});

// an route for an endpoint /login GET
app.get('/login', (req, res) => {
  const id = req.session.id;
  if (id && users[id]) {
    return res.redirect('/urls');
  }
  return res.render('login', { user: '' });
});

// a GET /register endpoint
app.get('/register', (req, res) => {
  const id = req.session.id;
  const user = users[id];

  if (id && user) {
    return res.redirect('/urls');
  }
  return res.render('register', { user });
});

// this endpoint is a Registration Handler /POST /register endpoint
app.post('/register', (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  // hash the password using bcrypt
  const hashedPassword = bcrypt.hashSync(password, 10);
  // new user object to be added in the global users object
  const user = {
    id,
    email,
    password: hashedPassword
  };

  // if the e-mail or password are empty strings, send back a response with the 400 status code
  if (!user.email || !user.password) {
    return res.status(400).render('You must provide a username and password');
  }

  // if found send a response
  const foundEmail = getUserByEmail(email);
  if (foundEmail) {
    return res.status(400).render('This email already exists');
  }

  users[id] = user; // add the new user object to global users object
  // set a user_id cookie containing the user's newly generated ID
  req.session.id = user.id;
  console.log(users); // checker
  return res.redirect('/urls');
});

app.get("/urls.json", (req, res) => {
  return res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  return res.send("<html><body>Hello <b>World</b><body><html>\n");
});

app.get('/urls', (req, res) => {
  const userId = req.session.id;
  const user = users[userId];
  
  // Check if the user is logged in
  if (!user) {
    return res.render('login', { user: null });
  }
  
  // Get the URLs specific to the logged-in user
  const userUrls = urlsForUser(userId);
  
  // Pass the userUrls object to the template vars
  const templateVars = {
    urls: userUrls,
    user: users[userId]
  };
  
  return res.render('urls_index', templateVars);
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = getUserByEmail(email);
  if (!user) {
    return res.status(403).send('Invalid email or password!');
  }

  bcrypt.compare(password, user.password, (err, result) => {
    if (err || !result) {
      return res.status(403).send('Invalid email or password!');
    }
    req.session.id = user.id;
    return res.redirect('/urls');
  });
});

app.post('/logout', (req, res) => {
  req.session = null;
  return res.redirect('/login');
});

app.post("/urls", (req, res) => {
  const id = generateRandomString();
  const longURL = req.body.longURL;
  const userId = req.session.id;
  // check if the user has logged int
  if (!userId || !users[userId]) {
    const errorMessage = 'You must be logged in to shorten URLs.';
    return res.status(401).render('error', { errorMessage });
  }

  const newUrl = {
    longURL,
    userID: userId
  };
  urlDatabase[id] = newUrl;
  return res.redirect(`/urls/${id}`);
});

app.get('/urls/new', (req, res) => {
  const id = req.session.id;
  const templateVars = {
    user: users[id]
  };
  if (id && templateVars.user) {
    return res.render('urls_new', templateVars);
  }
  return res.redirect('/login');
});

app.get('/urls/:id', (req, res) => {
  const userId = req.session.id;
  const urlId = req.params.id;
  const user = users[userId];
  // const user = id ? users[id] : null;
  if (!user) {
    return res.render('login', { user: null });
  }

  const userUrls = urlsForUser(userId);
  if (!userUrls[urlId]) {
    const errorMessage = 'The URL does not belong to you.';
    return res.status(400).render('error', { errorMessage });
  }

  const templateVars = {
    longURL: userUrls[urlId].longURL,
    id: urlId,
    user: users[userId]
  };

  return res.render('urls_show', templateVars);
});

// app.get('/u/:id', (req, res) => {
//   const longURL = urlDatabase[req.params.id];
//   console.log('Requested ID:', req.params.id);
//   console.log('URL Database:', urlDatabase);
//   if (longURL) {
//     return res.redirect(longURL);
//   } else {
//     console.log('URL Not Found!');
//     const errorMessage = 'You must be logged in to shorten URLs.';
//     return res.status(401).render('error', { errorMessage });
//     // return res.status(404).send('URL Not Found!');
//   }
// });
app.get('/u/:id', (req, res) => {
  const shortURL = req.params.id;
  const url = urlDatabase[shortURL];

  if (url) {
    return res.redirect(url.longURL);
  } else {
    console.log('URL Not Found!');
    const errorMessage = 'Short URL Not Found!';
    return res.status(404).render('error', { errorMessage });
  }
});

app.post("/urls/:id/delete", (req, res) => {
  const userId = req.session.id;
  const urlId = req.params.id;
  const user = users[userId];
  // check if the user has logged in
  if (!user) {
    return res.render('login', { user: null });
  }
  // check if the url belongs to the user
  const userUrls = urlsForUser(userId);
  if (!userUrls[urlId]) {
    const errorMessage = 'The URL does not belong to you.';
    return res.status(403).render('error', { errorMessage });
  }
  delete urlDatabase[req.params.id];
  return res.redirect('/urls');
});

app.post("/urls/:id/edit", (req, res) => {
  const userId = req.session.id;
  const urlId = req.params.id;
  const user = users[userId];
  // check if user has logged in
  if (!user) {
    return res.render('login', { user: null });
  }
  // check if the url belongs to the user
  const userUrls = urlsForUser(userId);
  if (!userUrls[urlId]) {
    const errorMessage = 'The URL does not belong to you.';
    return res.status(403).render('error', { errorMessage });
  }
  const templateVars = {
    id: urlId,
    longURL: urlDatabase[urlId].longURL,
    user: user
  };
  return res.render('urls_show', templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const generateRandomString = () => {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};