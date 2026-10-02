# ServerDevTools NestJS Smoke Test

Minimal NestJS consumer app for exercising the installed `server-devtools` package with:

- HTTP request and error capture
- PostgreSQL and MySQL2 database spans
- Mongoose and MongoDB spans
- Outbound `fetch()` capture
- Sensitive-data encryption
- Mock current-user metadata

## Setup

Create `.env` in this directory:

```env
MONGODB_URI=mongodb://localhost:27017
# Use REDIS_URL, or provide REDIS_HOST/REDIS_PORT/REDIS_USER/REDIS_PASSWORD/REDIS_DB_INDEX.
SERVER_DEVTOOLS_ENCRYPTION_KEY=<32-byte-base64-key>
```

Generate a key with:

```sh
node -e 'console.log(require("crypto").randomBytes(32).toString("base64"))'
```

Install dependencies:

```sh
npm install
```

## Run

Build and run the compiled application with the ServerDevTools preload:

```sh
npm run build
npm start
```

Development watch mode:

```sh
npm run start:dev
```

The app listens on `http://localhost:4000`.

## Routes

- `GET /hello`
- `POST /users`
- `GET /slow`
- `GET /not-found`
- `GET /external`
- `GET /mongo-test`
- `GET /sensitive-test`
- `GET /error`
- `GET /redis/string`
- `GET /redis/missing`
- `GET /redis/hash`
- `GET /redis/list`
- `GET /redis/set`
- `GET /redis/sorted-set`
- `GET /redis/pipeline`
- `GET /redis/transaction`
- `GET /redis/expired`
- `GET /redis/failed`
- `GET /redis/wrong-type`
- `GET /_devtools`

Example:

```sh
curl http://localhost:4000/hello
curl http://localhost:4000/users
curl http://localhost:4000/postgres-users
curl http://localhost:4000/mysql-users
curl http://localhost:4000/mongo-test
curl http://localhost:4000/sensitive-test
curl http://localhost:4000/error
```

Redis smoke tests use unique keys under `serverdevtools:smoke:` and clean up
after each request. They use `REDIS_URL` when present, otherwise the Redis
component variables (`REDIS_HOST`, `REDIS_PORT`, `REDIS_USER`,
`REDIS_PASSWORD`, and `REDIS_DB_INDEX`). Without either configuration, the
default is `redis://localhost:6379`.

```sh
curl http://localhost:4000/redis/string
# {"value":"hello"}
curl http://localhost:4000/redis/missing
# {"value":null}
curl http://localhost:4000/redis/hash
# {"value":{"field":"value"}}
curl http://localhost:4000/redis/list
# {"value":["first","second"]}
curl http://localhost:4000/redis/set
# {"value":["one","two"]}
curl http://localhost:4000/redis/sorted-set
# {"value":["one","1","two","2"]}
curl http://localhost:4000/redis/pipeline
# {"value":["OK","pipeline-value",1]}
curl http://localhost:4000/redis/transaction
# {"value":["OK","transaction-value",1]}
curl http://localhost:4000/redis/expired
# {"value":null}
curl -i http://localhost:4000/redis/failed
# HTTP/1.1 500 Internal Server Error
curl -i http://localhost:4000/redis/wrong-type
# HTTP/1.1 500 Internal Server Error
```
