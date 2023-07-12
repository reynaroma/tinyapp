const express = require("express");
const cookieParser = require('cookie-parser');
const app = express(); // instantiate express as new object
const PORT = 8080; // default port 8080

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Adding routes
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b><body><html>\n");
});

app.get('/urls', (req, res) => {
  const templateVars = {urls: urlDatabase, username: req.cookies['username']};
  res.render('urls_index', templateVars);
});

app.post('/login', (req, res) => {
  const username = req.body.username;
  console.log(`User logged in: ${username}`);
  res.cookie('username', username);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

app.post("/urls", (req, res) => {
  const id = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[id] = longURL;
  res.redirect(`/urls/${id}`);
});

app.get('/urls/new', (req, res) => {
  const templateVars = {
    username: req.cookies['username'],
  };
  res.render('urls_new', templateVars);
});

app.get('/urls/:id', (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    username: req.cookies['username']
  };
  res.render('urls_show', templateVars);
});

app.get('/u/:id', (req, res) => {
  const longURL = urlDatabase[req.params.id];
  console.log('Requested ID:', req.params.id);
  console.log('URL Database:', urlDatabase);
  if (longURL) {
    res.redirect(longURL);
  } else {
    console.log('URL Not Found!');
    res.status(404).send('URL Not Found!');
  }
});


app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

app.post("/urls/:id/edit", (req, res) => {
  const templateVars = {id: req.params.id,
    longURL: urlDatabase[req.params.id],
    username: req.cookies['username']
  };
  // const longURL = req.body.longURL;
  // urlDatabase[req.params.id] = longURL;
  res.render('urls_show', templateVars);
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