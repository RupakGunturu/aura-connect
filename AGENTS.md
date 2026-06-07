# Project Context

## Secrets Management
- `.env` and `backend/.env` are in `.gitignore`
- These files were previously committed to git history (3 commits) but have been purged via `git filter-branch` and force-pushed
- A pre-commit hook (`.git/hooks/pre-commit`) blocks accidental commits of `.env` files or secret patterns

## Environment Variables (backend/.env)
Do NOT write or display the actual values. Use placeholders when referencing.

## Still Needs Manual Rotation (User Action Required)
The following credentials were exposed in git history and the user must rotate them in their respective dashboards:
- **MongoDB Atlas** password for user `guntururupak18_db_user` — change at https://cloud.mongodb.com
- **TURN credentials** — regenerate at https://metered.ca dashboard
- JWT secrets and cookie secret were already regenerated (see backend/.env)

## Verification
- Run `git log --all --diff-filter=A -- ".env" "backend/.env"` to verify no `.env` files exist in history
