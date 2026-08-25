# JobSearch

AI-assisted international job search and application preparation.

## Run locally with Docker

Requirements: Docker Desktop and `curl`.

```bash
cp .env.example .env
# Review .env and set a strong SESSION_SECRET
./re-run-local.sh
```

The script stops any previous JobSearch containers, then builds and starts JobSearch at `http://localhost:3020` and PostgreSQL at `localhost:5433`. It preserves database data in a Docker volume and does not delete volumes during normal updates.

To stop the services without deleting data:

```bash
docker compose down
```

The guided SDLC documentation is in [ai-assisted-website-learning](ai-assisted-website-learning/README.md).
