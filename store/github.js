export const state = () => ({
  user: null, // steemconnect user
  accessToken: null // steemconnect access token
});

export const getters = {
  user(state) {
    return state.user;
  },
  accessToken(state) {
    return state.accessToken;
  }
};

export const mutations = {
  login(state, user) {
    state.user = user;
  },
  logout(state) {
    state.user = null;
  },
  setAccessToken(state, accessToken) {
    state.accessToken = accessToken;
  }
};

export const actions = {
  login({ commit, dispatch, state }) {
    return new Promise((resolve, reject) => {
      // don't do anything if user data is already set
      if (!state.user) {
        // in that case we look for an access token in localStorage
        const accessToken = localStorage.getItem("github_access_token");
        if (accessToken) {
          // try to fetch user object
          this.$axios
            .$get("https://api.github.com/user", {
              params: { access_token: accessToken }
            })
            .then(response => {
              // save user object in store
              commit("login", response);
              commit("setAccessToken", accessToken);
              resolve();
            })
            .catch(e => reject(e));
        } else {
          resolve();
        }
      } else {
        resolve();
      }
    });
  },
  logout({ commit }) {
    // remove access token and unset user in store
    localStorage.removeItem("github_access_token");
    commit("logout");
    commit("setAccessToken", null);
  }
};
