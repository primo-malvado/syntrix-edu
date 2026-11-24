# Syntrix Edu

An English-language, multi-page course covering formal languages, regular expressions,
automata, lexers, grammars, LL and LR parsing, semantic actions, diagnostics and
testing. Each module includes editable examples and an interactive lab.

## Run

Requires Node.js `^22.22.3`, `^24.15.0` or `>=26.0.0`, according to Angular's requirements. For development, place a compatible Syntrix checkout in `../syntrix` alongside this project.

```sh
npm ci
npm install --no-save --package-lock=false syntrix@file:../syntrix
npm start
```

Open the address displayed by Angular. The second command replaces the installed
registry package with the local checkout without changing the manifest or lockfile.
Run `npm test` to test against the currently installed library. Run the second
command again after `npm ci` to restore the local development link.

For a production build, restore the locked npm dependencies first:

```sh
npm ci
npm test
npm run build
```

The build bundles Syntrix into the site; the browser does not download the npm
package at runtime. Running `npm ci` replaces the local development link.

## Publishing to GitHub Pages

In the `syntrix-edu` repository settings, set **Pages → Build and deployment →
Source** to **GitHub Actions**. A push to `master`, or a manual run of the
Publish Syntrix Edu workflow, checks out the course, installs the locked
Syntrix package from npm, runs tests, builds with the Pages base path and
deploys `dist/browser`.

**Release prerequisite:** npm version `0.0.2` does not export the public
automata APIs (`regexToNfa` and `determinize`) required by this course, so a
production build using that version fails. Publish a compatible Syntrix release
to npm, then run `npm install --save-exact syntrix@<version>` in this project
and commit both `package.json` and `package-lock.json`. The workflow uses the
locked version; publishing Syntrix alone does not trigger or update a course
deployment.

The expected project-site URL is https://primo-malvado.github.io/syntrix-edu/.
GitHub Pages must be available and enabled for the repository.

Labs use the Syntrix public API to generate automata, lexers and parsers.
Each module links the relevant Syntrix APIs and distinguishes library features
from the additional teaching analyses provided by Syntrix Edu. See the
[Syntrix documentation](https://github.com/primo-malvado/syntrix#readme) for
installation and API examples.
The foundations lab explores string and alphabet membership; the next module
shows the automata construction in detail.
Each module includes learning outcomes, progressive explanations, a worked
example that can be loaded into its editable lab, and linked further reading.
The grammar module focuses on EBNF lowering, while the predictive module adds
FIRST/FOLLOW and LL(1) tables. LR parsing focuses on states and tables; semantic
actions focus on the resulting AST. The final module runs editable acceptance
and rejection test cases and reports lexical and syntax errors.
NFA, DFA and LR state diagrams use Dagre for graph layout.
The regex lab derives its alphabet from the NFA and displays up to 64 symbols.
FIRST/FOLLOW and LL(1) analysis operate on the productions produced by Syntrix's
EBNF lowering; generated helper rules are shown explicitly. LR tables and
deterministic shift/reduce traces use Syntrix's generated parser tables.

Examples execute in a worker with a ten-second timeout. Parser grammars can
contain JavaScript semantic actions: run only trusted input, since a worker is
not a security sandbox. Lesson drafts remain in memory while navigating and
reset when the page is reloaded.
