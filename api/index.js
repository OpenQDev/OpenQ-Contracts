import express from "express";

import githubAccessTokenController from "./controllers/github-access-token";
import githubUserController from "./controllers/github-user";
import githubRepositoryController from "./controllers/github-repository";
import githubIssueController from "./controllers/github-issue";
import githubIssueByIdController from "./controllers/github-issue-by-id";
import githubPullRequestController from "./controllers/github-pullrequest";

const app = express();

app.use(express.json());

app.post("/github-access-token", githubAccessTokenController);
app.get("/github-user/:username", githubUserController);
app.get("/github-repository/:owner/:repo", githubRepositoryController);
app.get("/github-issue/:owner/:repo/:number", githubIssueController);
app.get("/github-issue-by-id/:issueId", githubIssueByIdController);
app.get("/github-pullrequest/:owner/:repo/:number", githubPullRequestController);

module.exports = {
  path: "/api",
  handler: app
};
