import express from "express";

import githubAccessTokenController from "./controllers/github-access-token";
import githubUserController from "./controllers/github-user";
import oracleRegisterController from "./controllers/oracle/register"
import oracleClaimController from "./controllers/oracle/claim"

const app = express();

app.use(express.json());

app.post("/github-access-token", githubAccessTokenController);
app.get("/github-user/:username", githubUserController);

app.get("/oracle/register/:githubUser/:ethAddress", oracleRegisterController)
app.get("/oracle/claim/:githubUser/:prId", oracleClaimController)

module.exports = {
  path: "/api",
  handler: app
};
