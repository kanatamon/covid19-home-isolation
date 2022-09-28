# COVID-19 Home Isolation Service

TODO: Add overview

TODO: Add demo here

## The Problem

TODO: Add description

- Mention about low budget management

TODO: Add list of critical criteria

## The Solution

TODO: Add description

TODO: Add list of brief each of solution on each criteria

## UX workflow

TODO: Add figure

## Netlify Setup

1. Install the [Netlify CLI](https://www.netlify.com/products/dev/):

   ```sh
   npm i -g netlify-cli
   ```

   If you have previously installed the Netlify CLI, you should update it to the latest version:

   ```sh
   npm i -g netlify-cli@latest
   ```

2. Sign up and log in to Netlify:

   ```sh
   netlify login
   ```

3. Create a new site:

   ```sh
   netlify init
   ```

## Development

The Netlify CLI starts your app in development mode, rebuilding assets on file changes.

```sh
npm run dev
```

Open up [http://localhost:3000](http://localhost:3000), and you should be ready to go!

This project is coupling tightly to LINE Front-end Framework (LIFF). Then connection between our
server to LINE's web-service must be established securely, in the other hand HTTPS must be
established. Then we can't stay on _localhost_, so we do need some hack to establish HTTPS during
the development.

You can use any solution to provide HTTPS during the development. But what we using is Caddy server.
Which is basically, instance a reverse proxy server to _localhost:3000_.

```sh
caddy run
```

Open up [https://dev.localhost](https://dev.localhost), and you are good to go over HTTPS!

## Deployment

There are two ways to deploy your app to Netlify, you can either link your app to your git repo and
have it auto deploy changes to Netlify, or you can deploy your app manually. If you've followed the
setup instructions already, all you need to do is run this:

```sh
$ npm run build
# preview deployment
$ netlify deploy

# production deployment
$ netlify deploy --prod
```

## Technical Decisions

TODO: Add tech stacks here

### Prefer Inline CSS

TODO: Add description

### Why Remix ?

TODO: Add description

-

### Why Netlify ?

TODO: Add description

### Why cron-job.org ?

TODO: Add description

- Mention about non-technical user friendly

### Why SQL ?

TODO: Add description

- Project can be growing into the unknown, where relations can be easily extended
- No scaling is needed, then we confidentially go to it

### Why Heroku ?

TODO: Add description

- 10k free rows are enough
- Mention about calculation

### Why Prisma ?

TODO: Add description

- Working with Typescript easily

### Conflict between Remix's dataflow and React useEffect's principle by official

TODO: Add beta doc of useEffect

TODO: Add Remix's dataflow diagram

TODO: Add link to source code related to this example

```ts
const fetcher = useFetcher()

const hasSuccessfullySubmitted = JSON.stringify(fetcher.data) === '{}'

React.useEffect(() => {
  if (hasSuccessfullySubmitted) {
    someEventHandler()
  }
}, [hasSuccessfullySubmitted])
    ^
    eslint-disable-next-line react-hooks/exhaustive-deps
```

### Things to improve

#### `login.tsx` where `useGetLineProfile` should re-design to provide some listener utility

problem

```ts
React.useEffect(
  function autoLogin() {
    if (idToken && formRef.current) {
      submit(formRef.current)
    }
  },
  [idToken],
  ^
  eslintreact-hooks/exhaustive-deps
)
```

user(developer) should be able to use the hook like this?

```ts
const getLineProfile = useGetLineProfile({
  onIdTokenReady: (idToken) => {
    // Do auto login
    if (idToken && formRef.current) {
      submit(formRef.current)
    }
  },
  ...more options...
})
```

#### Missing error tracking

TODO: Add description
