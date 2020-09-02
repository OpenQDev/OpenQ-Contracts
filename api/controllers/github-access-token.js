import axios from "axios";

require("dotenv").config();

export default (req, res) => {
  let code = req.body.code;
  axios
    .post("https://github.com/login/oauth/access_token", {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      accept: "application/json"
    })
    .then(response => {
      const urlParams = new URLSearchParams(response.data);
      const accessToken = urlParams.get("access_token");
      res.json({ accessToken });
    });
};
