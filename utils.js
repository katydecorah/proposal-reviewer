const queue = require('d3-queue').queue;
const request = require('request');
const _ = require('underscore');
const config = require('./config');

module.exports.fetchAll = (fn, args) => {
  let acc = [];
  let p = new Promise((resolve, reject) => {
    fn(args).then(val => {
      acc = acc.concat(val);
      if (val.nextPage) {
        return module.exports.fetchAll(val.nextPage).then(val2 => {
          acc = acc.concat(val2);
          resolve(acc);
        }, reject);
      } else {
        resolve(acc);
      }
    }, reject);
  });
  return p;
};

module.exports.formatProposals = res => {
  return new Promise(resolve => {
    const proposals = res[0].items;
    const formatted = proposals.reduce((arr, proposal) => {
      // get labels
      const labels = proposal.labels.reduce((arr, label) => {
        arr.push(label.name);
        return arr;
      }, []);
      // get current assignees
      const assignees = proposal.assignees.reduce((arr, assign) => {
        arr.push(assign.login);
        return arr;
      }, []);
      arr.push({
        number: parseInt(proposal.number),
        labels: labels,
        milestone: proposal.milestone ? proposal.milestone.number : null,
        assignees: assignees,
        reactions: [],
        reviewed: [],
        needToReview: []
      });
      return arr;
    }, []);
    resolve(formatted);
  });
};

module.exports.addReactions = proposals => {
  const q = queue(1);
  proposals.forEach(proposal => {
    q.defer(module.exports.getReactions, proposal.number);
  });
  return new Promise((resolve, reject) => {
    q.awaitAll((err, res) => {
      if (err) return reject(err);
      // format reactions
      const reactions = module.exports.formatReactions(res);
      // combine proposal with reactions
      resolve(
        module.exports.evaluateReactions(proposals, reactions, config.reviewers)
      );
    });
  });
};

module.exports.formatReactions = reactions => {
  return _.groupBy(_.flatten(reactions), 'issue');
};

module.exports.getReactions = (issue, callback) => {
  const opts = {
    url: `https://api.github.com/repos/${config.github}/${
      config.repo
    }/issues/${parseInt(issue)}/reactions`,
    method: 'GET',
    headers: {
      'User-Agent': config.github,
      Authorization: `token ${process.env.GithubAccessToken}`,
      Accept: 'application/vnd.github.squirrel-girl-preview+json'
    }
  };

  request(opts, (err, resp, body) => {
    if (err) return callback(err);
    if (resp.statusCode !== 200)
      return callback(
        new Error(`Got HTTP status ${resp.statusCode} from GitHub`)
      );
    const response = JSON.parse(body);
    let reactions = [];
    if (response.length > 0) {
      reactions = response.reduce((arr, reaction) => {
        if (reaction.content == '+1' || reaction.content == '-1') {
          arr.push({
            issue: issue,
            count: reaction.content,
            reviewer: reaction.user.login
          });
        }
        return arr;
      }, []);
    }
    callback(null, reactions);
  });
};

module.exports.evaluateReactions = (proposals, reactions, reviewers) => {
  proposals.forEach(item => {
    // if there are reactions, add it to the proposal
    if (reactions[item.number]) {
      // count reactions with +1/yes, -1/no
      item.reactions = _.countBy(reactions[item.number], reaction => {
        return reaction.count == '-1' ? 'no' : 'yes';
      });
      // who has reviewed so far:
      const reviewed = _.pluck(reactions[item.number], 'reviewer');
      item.reviewed = reviewed;
      // who needs to review:
      item.needToReview = reviewers.filter(r => {
        if (reviewed.indexOf(r) == -1) return r;
      });
    } else {
      // if no reactions, then everyone needs to review
      item.needToReview = config.reviewers;
    }
  });
  return proposals;
};

module.exports.reviewProposals = proposals => {
  const q = queue(3);

  // ASSIGN REVIEWERS
  // assign reviewers who still need to review the proposal
  module.exports.filterAssignees(proposals).forEach(proposal => {
    q.defer(
      module.exports.assignReviewers,
      proposal.number,
      proposal.needToReview
    );
  });

  // REJECT MAJORITY -1
  // add label to tickets with majority -1 votes
  module.exports.filterRejected(proposals).forEach(proposal => {
    q.defer(
      module.exports.makeDecisions,
      proposal.number,
      proposal.labels,
      'reject'
    );
  });

  // FLAG FAVORITES
  // add label to proposals with 100% +1 votes
  module.exports.filterFavorites(proposals).forEach(proposal => {
    q.defer(
      module.exports.makeDecisions,
      proposal.number,
      proposal.labels,
      'favorite'
    );
  });

  return new Promise((resolve, reject) => {
    q.awaitAll((err, res) => {
      if (err) return reject(err);
      resolve(res.length > 0 ? res.join('\n') : 'Nothing to update.');
    });
  });
};

module.exports.assignReviewers = (issue, assignees, callback) => {
  const opts = {
    url: `https://api.github.com/repos/${config.github}/${
      config.repo
    }/issues/${issue}`,
    method: 'PATCH',
    body: JSON.stringify({
      assignees: assignees
    }),
    headers: {
      'User-Agent': config.github,
      Authorization: `token ${process.env.GithubAccessToken}`
    }
  };
  request(opts, (err, resp) => {
    if (err) return callback(err);
    if (resp.statusCode !== 200) {
      return callback(
        new Error(`Got HTTP status ${resp.statusCode} from GitHub`)
      );
    }
    return callback(
      null,
      `Updated assignees ${
        assignees.length > 0 ? `to ${assignees.join(', ')}` : ''
      }for #${issue}`
    );
  });
};

module.exports.makeDecisions = (issue, currentLabels, decision, callback) => {
  let labels = currentLabels;
  let message = {};

  if (decision == 'reject') {
    if (config.rejectedMilestone) message.milestone = config.rejectedMilestone;
    labels.push(config.rejectedLabel);
  }

  if (decision == 'favorite') {
    labels.push(config.loveLabel);
  }

  message.labels = labels;

  const opts = {
    url: `https://api.github.com/repos/${config.github}/${
      config.repo
    }/issues/${issue}`,
    method: 'PATCH',
    body: JSON.stringify(message),
    headers: {
      'User-Agent': config.github,
      Authorization: `token ${process.env.GithubAccessToken}`
    }
  };

  request(opts, (err, resp) => {
    if (err) return callback(err);
    if (resp.statusCode !== 200) {
      return callback(
        new Error(`Got HTTP status ${resp.statusCode} from GitHub`)
      );
    }
    return callback(null, `Made the decision to ${decision} #${issue}`);
  });
};

module.exports.arraysEqual = (a, b) => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;

  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

module.exports.filterAssignees = proposals => {
  const assignees = proposals.filter(
    proposal =>
      !module.exports.arraysEqual(proposal.assignees, proposal.needToReview) &&
      proposal.labels.indexOf('no') == -1
  );
  return assignees;
};

module.exports.filterRejected = proposals => {
  const reject = proposals.filter(
    proposal =>
      proposal.reactions &&
      proposal.reactions.no > Math.round(config.reviewers.length / 2) &&
      proposal.labels.indexOf(config.rejectedLabel) == -1
  );
  return reject;
};

module.exports.filterFavorites = proposals => {
  const favorites = proposals.filter(
    proposal =>
      proposal.reactions &&
      proposal.reactions.yes == config.reviewers.length &&
      proposal.labels.indexOf(config.loveLabel) == -1
  );
  return favorites;
};
