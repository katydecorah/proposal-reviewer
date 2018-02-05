module.exports = {
  github: 'username', // your GitHub handle
  repo: 'repo', // the repo where the proposals/issues live
  reviewers: [
    // GitHub handles of everyone who needs to review the proposals
    'user1',
    'user2'
  ],
  rejectedLabel: 'no', // the label in your repo that you want to apply to rejected proposals
  rejectedMilestone: null, // the milestone number you want to apply to reject proposals, null if none.
  loveLabel: 'favorite' // the label in your repo that you want to apply to favorite proposals
};
