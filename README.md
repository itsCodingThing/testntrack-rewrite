# TestnTrack

> testntrack [website](https://www.testntrack.com/)

TestnTrack backend service

> Entry point of our project is `server.ts` file from where we start the server.

Server deployment folder path "~/tnt_backend"  
TNT Webstie deployment folder path "var/www/html/tnt_site"

# Npm scripts to run

## Install dependenices

it will start 3 services at the same time

- development server using nodemon
- typscript compiler in watch mode to type checking
- swc build server in watch mode

```
npm install
```

## Development server

```
npm run build:dev
```

## Production server (local)

```
npm run build:prod
npm run pm2:prod (pm2 should be installed in global scope)
```

## Eslint

```
npm run lint
```

## Commands for production server

Production server (hosted/e2e)

```
npm run build:prod
npm run pm2:prod
```

# Hosted on

<img src="https://global-uploads.webflow.com/6245406e0235063d5498c765/62a2e6c513e27c48700925ed_E2E-Cloud-Logo%20(1).png" alt="e2e networks" width="100"/>

our server and all the other websites are hosted on e2e networks and all the server credentials can obtained from the department.
