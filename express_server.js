const express = require("express");
const cookieParser = require('cookie-parser');
const app = express(); // instantiate express as new object
const PORT = 8080; // default port 8080

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  abcdef: {
    id: "abc",
    email: "user@example.com",
    password: "1234"
  },
  defghi: {
    id: "def",
    email: "user@example.com",
    password: "5678"
  },
};

// en email lookup helper function
const getUserByEmail = (email) => {
  for (const u in users) {
    const existingUser = users[u];
    if (existingUser.email === email) {
      return existingUser;
    }
  }
  return null;
};

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Adding routes
app.get("/", (req, res) => {
  return res.send("Hello!");
});

// an route for an endpoint /login GET
app.get('/login', (req, res) => {

  return res.render('login', { user: '' });
});

// a GET /register endpoint
app.get('/register', (req, res) => {
  const id = req.cookies.id;
  const user = users[id];
  return res.render('register', { user });
});

// this endpoint is a Registration Handler /POST /register endpoint
app.post('/register', (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  // new user object to be added in the global users object
  const user = {
    id,
    email,
    password
  };
  // set a user_id cookie containing the user's newly generated ID
  res.cookie('id', user.id);
  // if the e-mail or password are empty strings, send back a response with the 400 status code
  if (!user.email || !user.password) {
    return res.status(400).send('You must provide a username and password');
  }

  // if found send a response
  const foundEmail = getUserByEmail(email);
  if (foundEmail) {
    return res.status(400).send('This email already exists');
  }

  users[id] = user; // add the new user object to global users object
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
  const id = req.cookies.id;
  const user = users[id];
  const templateVars = {urls: urlDatabase, user};
  return res.render('urls_index', templateVars);
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  console.log(`User logged in: ${email}`);
  // res.cookie('username', username);
  return res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('id');
  return res.redirect('/urls');
});

app.post("/urls", (req, res) => {
  const id = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[id] = longURL;
  return res.redirect(`/urls/${id}`);
});

app.get('/urls/new', (req, res) => {
  const templateVars = {
    user: users[req.cookies.id]
  };
  return res.render('urls_new', templateVars);
});

app.get('/urls/:id', (req, res) => {
  const id = req.cookies.id;
  const user = id ? users[id] : null;
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user
  };
  return res.render('urls_show', templateVars);
});

app.get('/u/:id', (req, res) => {
  const longURL = urlDatabase[req.params.id];
  console.log('Requested ID:', req.params.id);
  console.log('URL Database:', urlDatabase);
  if (longURL) {
    return res.redirect(longURL);
  } else {
    console.log('URL Not Found!');
    return res.status(404).send('URL Not Found!');
  }
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  return res.redirect('/urls');
});

app.post("/urls/:id/edit", (req, res) => {
  const templateVars = {id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users[req.cookies.id],
  };
  // const longURL = req.body.longURL;
  // urlDatabase[req.params.id] = longURL;
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