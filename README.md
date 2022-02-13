# renovate-autoclose-action

GitHub Actions to close Renovate failed pull requests automatically

## Motivation

By enabling [automerge](https://docs.renovatebot.com/configuration-options/#automerge) and [platformAutomerge](https://docs.renovatebot.com/configuration-options/#platformautomerge), you can merge Renovate pull requests automatically and quickly.
But there would be some pull requests which can't be merged automatically.
The number of pull requests which Renovate can create is limited by [prConcurrentLimit](https://docs.renovatebot.com/configuration-options/#prconcurrentlimit) and [branchConcurrentLimit](https://docs.renovatebot.com/configuration-options/#branchconcurrentlimit).
So if pull requests are kept open, the number of pull requests which Renovate can create would be decreased.
This isn't inconvenient if you want to update many dependencies automatically.

By running this action periodically,
pull requests which are kept open would be closed and their branches are removed automatically then you can update many dependencies efficiently.

## Example

```yaml
name: Close Renovate pull requests

on:
  workflow_dispatch:
    inputs: {}
  schedule:
    # The "*" (#42, asterisk) character has special semantics in YAML, so this
    # string has to be quoted.
    - cron: '0/15 * * * *'
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: suzuki-shunsuke/renovate-autoclose-action@main
```

## Inputs

### Required Inputs

Nothing.

### Opitonal Inputs

name | default | description
--- | --- | ---
renovate_login | `app/renovate` | pull request author. If you use Self Hosted Renovate, please change.
github_token | `${{ github.token }}` | GitHub Access Token
additional_filter | '' | Addtional Query
created_before_minutes | `10` | Pull Request which were created before over `created_before_minutes` were closed. By default, pull requests which were created before over 10 minutes were closed

About `additional_filter`, please see [Searching issues and pull requests](https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests) too.

#### `addtional_filter`

By default, the following query is run.

```
type: ISSUE, last: 100, query: "is:open is:pr author:app/renovate repo:<$GITHUB_REPOSITORY> created:<=<CREATED_DATE>"
```

You can add filter by `additional_filter`.

e.g.

```yaml
additiona_filter: '-label:skip-autoclose'
```

#### `github_token`'s required permission

* pull requests - read and write (search and close pull requests)
* contents - write (delete branches)
* issues - read (filter pull requests with labels)

### Outputs

Nothing.

## LICENSE

[MIT](LICENSE)
