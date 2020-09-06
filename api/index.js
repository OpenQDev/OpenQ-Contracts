import express from "express";

import githubAccessTokenController from "./controllers/github-access-token";
import githubUserController from "./controllers/github-user";

const app = express();

app.use(express.json());

app.post("/github-access-token", githubAccessTokenController);
app.get("/github-user/:username", githubUserController);

module.exports = {
  path: "/api",
  handler: app
};
