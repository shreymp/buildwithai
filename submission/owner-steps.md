# What's left for you (the owner)

The agent built, tested, deployed and drafted everything it could. It did **not** submit, post, upload or publish anything, and it didn't spend money. These steps need you. The deadline is **Sun Oct 26 2026, 5:00 pm EDT** ⚠. That date comes from search snippets of the rules page, which the agent couldn't open; check it on the hackathon page.

## Already true (checked by the agent on 2026-10-22)

| Item | Evidence |
|---|---|
| Repo `shreymp/buildwithai` is **public** | GitHub API: `visibility: public` |
| OSS license detected by GitHub | GitHub API: `license: MIT` (`LICENSE` file) |
| Default branch is the work branch `claude/gifted-hypatia-gz8ol7`, so judges see the latest code | GitHub API: `default_branch` |
| `devpost/scope.md`, `prd.md`, `spec.md` present with `status: approved` | `tests.json` C10 |
| Setup instructions in README, followed by a fresh agent from a clean clone | `tests.json` C1 |
| Live app deployed on GitHub Pages | Actions run 39801492120 succeeded for commit 6a06bb1. The agent's sandbox can't open github.io, so **open https://shreymp.github.io/buildwithai/ yourself** and click one example |

## Your steps, in order

1. **Open the live app** on your phone and laptop. Click **Remote data entry offer**, then press **Show the next message** to the end. If anything looks broken, tell the agent before recording.
2. **Read `submission/devpost-text.md` and make it yours.**
   - The Skill Pack's ship step says the learner writes the project name, short description and other answers themselves. You told the agent to draft them, so it did, and it labeled the text as agent-drafted. Change anything that isn't how you'd say it.
   - Keep the **AI use disclosure** section.
   - Check the three ⚠ items at the end of that file. The most important is the FTC $501M figure: open the FTC press release linked in the README and confirm it, or delete the sentence.
3. **Record the demo video** (under 3 minutes) with `submission/demo-script.md`.
   - Time it with a stopwatch. The script runs about 2:45; if you're over 2:50, cut the highlight segment.
   - Check that no personal tabs, bookmarks or notifications are visible.
   - If a live take keeps failing, `submission/backup-video/tipoff-demo-silent.webm` is a captioned silent fallback (about 1:35). A narrated video is better.
4. **Upload the video** to YouTube or Vimeo (public or unlisted, as the form allows), and copy the link into `devpost-text.md` → Links.
5. **Fill in the Devpost form**:
   - project name **Tipoff**
   - tagline and story sections from `devpost-text.md`
   - "Built with" tags
   - links: live app, repo `https://github.com/shreymp/buildwithai`, video
   - Use the form's actual fields. If it asks for something the draft doesn't cover, write it yourself.
6. **Confirm the eligibility and team questions on the form.** The agent only saw a second-hand note that entrants must be 18+ / of age of majority and that some countries are excluded. Read the official rules. The agent doesn't know your age, country or team, and didn't guess.
7. **Complete the exit survey**, if the form has one.
8. **Optional: recreate the version tags on GitHub.** The agent's version tags exist only in its temporary sandbox, because it can't push tags from there. The commits they point to are pushed and listed in `PROGRESS.md` → Tags. From your own clone:
   ```bash
   git fetch origin
   git tag v1.0 53e8272 && git tag v1.1 a4598c4 && git tag v1.2 6a06bb1
   git push origin --tags
   ```
   Add any later tags listed in `PROGRESS.md` the same way. They're nice to have, not required.
9. **Submit** on Devpost, before the deadline. Only you can do this.

## If something breaks after you submit

`npm run deploy` (needs push access) republishes the site from the current branch. Don't change the code after the deadline unless the rules allow it.
