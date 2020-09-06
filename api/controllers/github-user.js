import axios from "axios";

require("dotenv").config();

export default (req, res) => {
  let username = req.params.username;
  axios
    .post(
      "https://api.github.com/graphql",
      {
        query: `query {
                  user(login: "${username}") {
                    id,
                    createdAt,
                    updatedAt,
                    login,
                    url,
                    avatarUrl,
                    location,
                    name,
                    twitterUsername
                  }
                }`
      },
      {
        headers: {
          Authorization: "bearer " + process.env.GITHUB_APP_ACCESS_TOKEN
        }
      }
    )
    .then(data => {
      res.json(data.data.data.user);
    });
};
