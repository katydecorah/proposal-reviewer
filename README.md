# proposal-reviewer

Review proposals using GitHub issues and emoji reactions.

This script will:

+ Make decisions based on the emoji reactions on each issue (:+1:/:-1:):
  - add a label to proposals with a majority of :-1: votes to sort out proposals your team is not likely to move forward with
  - add a label to proposals with unanimous :+1: votes to sort out proposals your entire team loved
+ Assign your team to issues that still need their emoji vote.

Great for conference proposals or similar submissions that requires a team to review and discuss.

## Workflow

* Each issue in your repo should house a single proposal.
* Your team will vote on the main post of each issue with either :+1: or :-1:.
* [Create labels](https://help.github.com/articles/creating-a-label/) to signify a rejected proposal (ex: `no`) and a unanimously loved proposal (ex: `favorite`).
* Optional: [create a milestone](https://help.github.com/articles/creating-and-editing-milestones-for-issues-and-pull-requests/) to add rejected proposals to.

Once all submissions are in, run this script periodically to allow the script to make decisions and assign your team members to issues they still need to review. :bulb: Run as often as you like, but note that issue assignee email notifications can get noisy.

## Set up

### 1. Install all dependencies

```
npm install
npm link
```

### 2. Set some environment variables

You'll need to set your GitHub access token as an environment variable:

```
echo "export GithubAccessToken=0000ffff0000ffff0000ffff0000ffff0000ffff" >> ~/.bash_profile
```

### 3. Set your preferences in config.js

Update [config.js](config.js) to set information about you and your proposals.

Run `npm test` to validate your config file.

## Review proposals

When ready, run:

```
review-proposals
```
