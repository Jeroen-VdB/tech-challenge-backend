# Submission

## Init updates
- Updated Dockerfile base to `node:22-alpine`
- Updated compose file to work with `docker buildx bake` for better build performance
- Updated npm packages
- Using `docker compose -f 'docker-compose.yml' up -d --build 'db'` &  `docker compose -f 'docker-compose.yml' up -d --build 'api'` instead of `docker compose up` to prevent DB connection issue

## Added Knex migrations via
- `npx knex migrate:make migration-title --knexfile src/knexfile.ts`

## API Versioning
- All feature endpoints are now under `/v0` prefix (e.g., `/v0/actors`, `/v0/movies`, `/v0/genres`)
- Health check endpoint remains unversioned at `/health`
- OpenAPI documentation available at:
  - `/openapi.yml` - Main API documentation
  - `/v0/openapi.yml` - v0 specific API documentation
- REST client files are organized under `doc/v0/`

## Authentication
Currently using the infra level Google Cloud Run IAM protection.   
- Pros:
   - No custom code needed
   - We know this is secure because it's made by a tech giant
- Cons:
   - No application level control: it's all or nothing
      - Often acceptable for backend services using machine-to-machine client credential flow
      - User-facing apps should have a BFF to authenticate and authorize against
         - The BFF can then use its own credentials to call this backend server
         - On-behalf of could also be an options but then we need more fine grained control in the backend service

### Testing
1. Execute `gcloud auth print-identity-token` to generate a token
2. Put that token in the `.env` file as `GCLOUD_TOKEN=eyJh...`
3. Select the `development` environment in the VS Code REST Client
   - It will automatically use the **GCLOUD_TOKEN** value in the `token` variable.

## Progress
- [x] MG-0002
- [x] MG-0003
- [x] MG-0004
- [x] MG-0005
- [x] MG-0006 (Option 1)
- [x] MG-0007
- [x] Authentication (infra level only for now, no app level)
- [x] Versioning (API v0)
- [x] CI/CD
- [x] Observability

## Progress

# Mobietrain's Tech Challenge for Backend

This exercise will challenge your NodeJS skills. You'll be given a starting point with specific technologies from our stack, which you should use to complete your task.

## Challenge Statement

You'll work on a backend to support a movie gallery web application. This application should allow its users to view and manage movies, actors, and genres, as well as generate some reports to compare and rank actors. To get you started, you'll find an already developed plugin: `/genres` -- *feel free to use as an inspiration, as it is also inspired our current practices*.

## Issues

To complete this challenge, you should implement these following issues:

### MG-0001 Add `Genre` CRUD
*Already implemented*

Genre payload:

```ts
{
  id: number,
  name: string,
}
```

### MG-0002 Add `Movie` CRUD
Movie payload:

```ts
{
  id: number,
  name: string,
  synopsis?: string
  releasedAt: Date,
  runtime: number, // minutes
}
```

### MG-0003 Add `Actor` CRUD
Actor payload:

```ts
{
  id: number,
  name: string,
  bio: string
  bornAt: Date,
}
```


### MG-0004 View Actor's movie appearances

As a user, I want to get a list of movies that a given Actor starred on.

### MG-0005. Select one of the following:

1. View Actor's favorite genre
As a user, I want to get the favorite genre of a given Actor.
Business Rule: the favorite genre is the one with the most appearances.

2. View Actor's number of Movies in Genres
As a user, I want to get the number of movies by genre on an actor profile page.

3. View Actors in a Genre
As a user, I want to get a list of actors for a given Genre ordered by movie appearances.

### MG-0006. View Actor's character names

As a user, I want to get a list of character names of a given Actor.


## Development notes

### Prerequisites

- Node 12
- Docker
- Docker Compose
- MySql 5.7 (a docker image is already provided)
- We recommend
  - VS Code with the *REST Client* plugin
  - nvm
  - direnv

### Installation

Fork this repository into your GitHub workspace and work from there.

### Development flow
First start a database instance by running `$ docker-compose up db`. After that, you can start the service by running `$ npm run local`. This will start a development HTTP server on port TCP 8080, using the environment variables defined in *.env.dev*. You can develop using TDD with `$ npm run test:tdd`. A linter is configured and can be run as `$ npm run lint`.

*Attention: tests are considered part of code and responsibility of the developer.* Unit tests are provided alongside code, on *spec.ts* files. End to end tests are provided on *docs*. We expect the new code will also contain its own new test cases.

### Changes on database
All changes to the database should be made using [Knex Migrations](http://knexjs.org/#Migrations). There is already one migration in *./src/db/migrations*. To clear the database to its original state, run `$ docker-compose rm db`.

### Building
The solution should successfully build using `$ docker-compose build` and should run using `$ docker-compose up`.

## Submitting

You should submit the Fork link.