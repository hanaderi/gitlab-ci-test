// gitlab-ci-test and chai are imported globally in all test files

it("Should succeed to print Hello world", async () => {
  const jobs = await runPipeline(import.meta.dirname + "/project")

  assert.ok(isSuccess(jobs))
  const run_jobs = getRunJobs(jobs)
  assert.lengthOf(run_jobs, 1)
  const job = run_jobs[0]
  assert.equal(job.name, "job")
  assert.include(getStdout(job), "Hello world")
  assert.ok(artifactExists(job, "output.txt"))
})

it("Should use variable", async () => {
  const jobs = await runPipeline(import.meta.dirname + "/project", {
    variables: { VARIABLE: "GitLab" },
    silent: true,
  })

  assert.include(getStdout(jobs[0]), "Hello GitLab")
})

it("Should fail with invalid pipeline", async () => {
  const jobs = await runPipeline(import.meta.dirname + "/invalid")

  assert.isEmpty(jobs)
})
