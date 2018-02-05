'use strict';

const utils = require('./utils.js');
const Octokat = require('octokat');
const config = require('./config');

module.exports.review = (event, context, callback) => {
  const octo = new Octokat({
    token: process.env.GithubAccessToken
  }).repos(config.github, config.repo);

  utils
    .fetchAll(octo.issues.fetch) // get all issues (proposals) in the repo
    .then(utils.formatProposals) // format the issues (proposals)
    .then(utils.addReactions) // get reactions
    .then(utils.reviewProposals) // assign anyone who still needs to review, reject proposals with majority -1, flag unanimous +1 as favorites
    .then(res => callback(null, res))
    .catch(err => callback(err));
};
