# GitLab CI Test

Testing GitLab CI pipelines using [gitlab-ci-local](https://github.com/firecow/gitlab-ci-local).

## Warning

This project will use your docker socket to run the pipeline. Using this tool on untrusted pipelines will lead to arbitrary code execution.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Node.js](https://nodejs.org/en/download/)
- Bash 4+ and rsync (or use Docker - see Cross-platform notes)
- `npm install -g gitlab-ci-test`

### Cross-platform notes

- **macOS**: The default Bash is 3.2. This project includes a patch for gitlab-ci-local so it works without Bash 4.
- **Windows**: Run tests from [Git Bash](https://git-scm.com/downloads). Install [rsync for Windows](https://tlundberg.com/installing-rsync-on-windows) (copy to Git install directory). Alternatively, use Docker: pass `shellExecutorNoImage: false` to `runPipeline()` so jobs run in containers.

### Troubleshooting

If tests fail:

1. **Clean reinstall**: `rm -rf node_modules package-lock.json && npm install`
2. **Verify patch applied**: After `npm install`, you should see `gitlab-ci-local@4.60.0 ✔`. If the patch fails, the gitlab-ci-local version is pinned to 4.60.0 for compatibility.
3. **Windows**: Run from Git Bash (not cmd/PowerShell). Ensure `bash` and `rsync` are in PATH.
4. **Use Docker**: Add `shellExecutorNoImage: false` to `runPipeline()` options to run jobs in containers (requires Docker).

## Setup

- Create a folder for your test project
- In the folder, create a `.gitlab-ci.yml` file with the pipeline
- If you want to test a template, it should be stored as `templates/*.yml` in your current working directory and referenced in the pipeline:

```yaml
include:
  - local: templates/template.yml
```

## Usage

### Javascript file

- Create a js file describing your test:

```javascript
// gitlab-ci-test and chai are imported globally
it("My project pipeline is successful", async () => {
  const jobs = await runPipeline("project-path", {
    variables: {
      KEY: "value",
    },
    // shellExecutorNoImage: false  // Use Docker for jobs (helps on Windows)
  })

  assert.ok(isSuccess(jobs))
})
```

- Run `gitlab-ci-test <test-file.js>`

See [test/example.test.js](test/example.test.js) for a complete example.

### Yaml file

- Create a yaml file describing your test:

```yaml
# test definition
description: My project pipeline is successful
project: project-path
asserts:
  - test: "success"
---
# template variables
KEY: VALUE
```

- In the template project root, run `gitlab-ci-test <test-file.yml>`

#### Result object

The context used for assertions has the following structure:

```javascript
{
  success: boolean, // true if the pipeline succeeded
  run_jobs: ["node-build"], // list of jobs that ran
  jobs: { // list of all jobs in the pipeline
    "node-build": {
      stdout: "line\nline", // stdout of the job
      stderr: "line\nline", // stderr of the job
      artifacts: {
        exists: (path) => boolean, // check if an artifact exists
      },
      // many other properties provided by gitlab-ci-local
    },
    // ...
  }
}
```

See all yaml files in [test](test) folder for a complete example.
