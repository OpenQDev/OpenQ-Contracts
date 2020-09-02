import express from "express";

import githubAccessTokenController from "./controllers/github-access-token";

const app = express();

app.use(express.json());

app.post("/github-access-token", githubAccessTokenController);

module.exports = {
  path: "/api",
  handler: app
};
