const test = require('blue-tape');
const config = require('../config.js');

test('[config]', assert => {
  assert.ok(config.github, 'enter your `github` handle');
  assert.equal(typeof config.github, 'string', '`github` must be a string');
  assert.ok(config.repo, 'enter your `repo` name');
  assert.equal(typeof config.repo, 'string', '`repo` must be a string');
  assert.ok(
    config.reviewers,
    'enter an array of github handles for `reviewers`'
  );
  assert.equal(
    typeof config.reviewers,
    'object',
    '`reviewers` must be an array'
  );
  assert.ok(config.rejectedLabel, 'enter the `rejectedLabel` name');
  assert.equal(
    typeof config.rejectedLabel,
    'string',
    '`rejectedLabel` must be a string'
  );
  if (config.rejectedMilestone)
    assert.equal(
      typeof config.rejectedMilestone,
      'number',
      '`rejectedMilestone` must be a number'
    );
  assert.ok(config.loveLabel, 'enter the `loveLabel` name');
  assert.equal(
    typeof config.loveLabel,
    'string',
    '`loveLabel` must be a string'
  );
  assert.end();
});
