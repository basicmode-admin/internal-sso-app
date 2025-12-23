const express = require("express");
const session = require("express-session");
const passport = require("passport");
const OIDCStrategy = require("passport-azure-ad").OIDCStrategy;

const app = express();

app.use(session({
  secret: "secret123",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

passport.use(new OIDCStrategy({
  identityMetadata: "https://login.microsoftonline.com/bc05e369-3c6a-4d93-a2e0-303004a9908c/v2.0/.well-known/openid-configuration",
  clientID: "10f1de31-6648-4c7e-804b-64d2c0aa49a3",
  clientSecret: "5d18a7a0-f426-4320-b743-b75d75587381",
  responseType: "code",
  responseMode: "form_post",
  redirectUrl: "https://internal-sso-app-dch9gmhce5g4gddw.southindia-01.azurewebsites.net/auth/openid/return",
allowHttpForRedirectUrl: false,

  scope: ["profile", "email"]
}, (issuer, sub, profile, done) => {
  return done(null, profile);
}));

app.get("/", (req, res) => {
  res.send(`<h2>Internal App</h2>
    <a href="/login">Login with Microsoft</a>`);
});

app.get("/login",
  passport.authenticate("azuread-openidconnect"));

app.post("/auth/callback",
  passport.authenticate("azuread-openidconnect", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/dashboard");
  });

app.get("/dashboard", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/");
  }
  res.send(`<h3>Welcome ${req.user.displayName}</h3>
    <p>Email: ${req.user._json.preferred_username}</p>
    <a href="/logout">Logout</a>`);
});

app.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
