const test = require('blue-tape');
const utils = require('../utils.js');
const issues = require('./fixtures/issues.json');
const formatted = require('./fixtures/formatted.json');
const reactions = require('./fixtures/reactions.json');
const reactionsFormatted = require('./fixtures/reactions-formatted.json');
const reactionsAdded = require('./fixtures/reactions-added.json');
const reactionsMocked = require('./fixtures/reactions-added-mocked.json');

test('[formatProposals]', assert => {
  return utils.formatProposals(issues).then(d => {
    assert.deepEqual(d, [
      {
        number: 3,
        labels: ['no'],
        milestone: 1,
        assignees: [],
        reactions: [],
        reviewed: [],
        needToReview: []
      },
      {
        number: 2,
        labels: ['favorite'],
        milestone: null,
        assignees: [],
        reactions: [],
        reviewed: [],
        needToReview: []
      },
      {
        number: 1,
        labels: [],
        milestone: null,
        assignees: ['elaconfbot', 'fontbot'],
        reactions: [],
        reviewed: [],
        needToReview: []
      }
    ]);
  });
});

test('[formatReactions]', assert => {
  assert.deepEqual(utils.formatReactions(reactions), {
    '1': [
      {
        issue: 1,
        count: '+1',
        reviewer: 'katydecorah'
      }
    ],
    '2': [
      {
        issue: 2,
        count: '+1',
        reviewer: 'elaconfbot'
      },
      {
        issue: 2,
        count: '+1',
        reviewer: 'fontbot'
      },
      {
        issue: 2,
        count: '+1',
        reviewer: 'katydecorah'
      }
    ],
    '3': [
      {
        issue: 3,
        count: '-1',
        reviewer: 'elaconfbot'
      },
      {
        issue: 3,
        count: '-1',
        reviewer: 'fontbot'
      },
      {
        issue: 3,
        count: '-1',
        reviewer: 'katydecorah'
      }
    ]
  });
  assert.end();
});

test('[evaluateReactions]', assert => {
  assert.deepEqual(
    utils.evaluateReactions(formatted, reactionsFormatted, [
      'katydecorah',
      'elaconfbot',
      'fontbot'
    ]),
    [
      {
        number: 3,
        labels: ['no'],
        milestone: 1,
        assignees: [],
        reactions: {
          no: 3
        },
        reviewed: ['elaconfbot', 'fontbot', 'katydecorah'],
        needToReview: []
      },
      {
        number: 2,
        labels: ['favorite'],
        milestone: null,
        assignees: [],
        reactions: {
          yes: 3
        },
        reviewed: ['elaconfbot', 'fontbot', 'katydecorah'],
        needToReview: []
      },
      {
        number: 1,
        labels: [],
        milestone: null,
        assignees: ['elaconfbot', 'fontbot'],
        reactions: {
          yes: 1
        },
        reviewed: ['katydecorah'],
        needToReview: ['elaconfbot', 'fontbot']
      }
    ]
  );
  assert.end();
});

test('[addReactions]', assert => {
  return utils.addReactions(formatted).then(d => {
    assert.deepEqual(d, [
      {
        number: 3,
        labels: ['no'],
        milestone: 1,
        assignees: [],
        reactions: {
          no: 3
        },
        reviewed: ['elaconfbot', 'fontbot', 'katydecorah'],
        needToReview: []
      },
      {
        number: 2,
        labels: ['favorite'],
        milestone: null,
        assignees: [],
        reactions: {
          yes: 3
        },
        reviewed: ['elaconfbot', 'fontbot', 'katydecorah'],
        needToReview: []
      },
      {
        number: 1,
        labels: [],
        milestone: null,
        assignees: ['elaconfbot', 'fontbot'],
        reactions: {
          yes: 1
        },
        reviewed: ['katydecorah'],
        needToReview: ['elaconfbot', 'fontbot']
      }
    ]);
  });
});

test('[filterAssignees]', assert => {
  assert.deepEqual(utils.filterAssignees(reactionsMocked), [
    {
      number: 3,
      labels: [],
      milestone: 1,
      assignees: ['elaconfbot'],
      reactions: { no: 3 },
      reviewed: ['fontbot', 'katydecorah'],
      needToReview: []
    }
  ]);
  assert.end();
});

test('[filterRejected]', assert => {
  assert.deepEqual(utils.filterRejected(reactionsMocked), [
    {
      number: 3,
      labels: [],
      milestone: 1,
      assignees: ['elaconfbot'],
      reactions: { no: 3 },
      reviewed: ['fontbot', 'katydecorah'],
      needToReview: []
    }
  ]);
  assert.end();
});

test('[filterFavorites]', assert => {
  assert.deepEqual(utils.filterFavorites(reactionsMocked), [
    {
      number: 2,
      labels: [],
      milestone: null,
      assignees: [],
      reactions: { yes: 3 },
      reviewed: ['elaconfbot', 'fontbot', 'katydecorah'],
      needToReview: []
    }
  ]);
  assert.end();
});

test('[reviewProposals] nothing to update', assert => {
  return utils.reviewProposals(reactionsAdded).then(d => {
    assert.deepEqual(d, 'Nothing to update.');
  });
});

test('[reviewProposals] updates', assert => {
  return utils.reviewProposals(reactionsMocked).then(d => {
    assert.deepEqual(
      d,
      'Updated assignees for #3\nMade the decision to reject #3\nMade the decision to favorite #2'
    );
  });
});
