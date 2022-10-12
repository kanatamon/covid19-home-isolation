# COVID-19 Home Isolation Service

At the beginning of the year there was another outbreak of COVID-19 across the region within
Thailand. And the government has begun to apply the Home Isolation policy to patients with mild
symptoms. But the policy has been started for the first time, there is still no principle management
tool, which can be utilized by any hospital across the region.

This project is a opinionated management tool, which built for solving the paint-points of staffs
who operated the Home Isolation policy in a local hospital located at Kapang, Nakhon Si Thammarat,
southern of Thailand.

TODO: Add demo here

## Netlify Setup

> 🚨 Netlify must be installed globally, otherwise `npm run dev` won't work.

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

When we're developing locally, we have postgres databases running in a docker container via a simple
`docker-compose.yml`, you can run the following command to start the container.

```sh
docker compose up
```

> 🚨 Make sure that `.env` is fulfilled entirely, you can use `.env.example` as a template. And be
> noticed that `.env.example` is already set
> `DATABASE_URL="postgresql://prisma:prisma@localhost:5433/dev"` for development out of the box.

Then you must make sure the development's database-schema is up-to-date. You must manually execute
the following command.

```sh
npm run db:migrate:dev
```

Finally, the Netlify CLI starts your app in development mode, rebuilding assets on file changes.

```sh
npm run dev
```

Open up [http://localhost:3000](http://localhost:3000), and you should be ready to go!

This project is coupling tightly to LINE Front-end Framework (LIFF). Then connection between our
server to LINE's web-service must be established securely, in the other hand HTTPS must be
established. That make us to can't stay on _localhost_, so we do need some hack to establish HTTPS
during the development.

You can use any solution to provide HTTPS during the development. But what we using is Caddy server.
Which is basically, instance a reverse proxy server to _localhost:3000_.

```sh
caddy run
```

Open up [https://dev.localhost](https://dev.localhost), and you are good to go over HTTPS!

## Testing

The application is tightly coupling to database. And that make a caveat where we can't run tests in
parallel which the default behavior of Jest. Because each test-case might dirty the database while
another one is running. Then caused all test-cases to be inconsistent adn hard to debug. So we need
to avoid inconsistent behavior by running jest with an option `--runInBand` or `-i` for an alias.

```sh
npx dotenv -e .env.test -- jest -i

# or with alias

npm test
```

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

## The Problem

After a few day since beginning of the policy's operation, the hospital was responsible for over 100
patients with increased number of new patients every day. This number spiked the prior day-to-day
workloads immediately. Caused the hospital to commit more staff to handle the operation.

**This high workloads** is the area that our project aimed to solve.

### High workloads on staffs

The following are how their day-to-day are look like;

#### Phase 1: Registration

1. A patient would either call to the hospital via phone or message via LINE official account
1. A staff would give instructions to any patient and if it's possible, asked any patient to join
   the official LINE's channel
1. A staff would request each patient for their location to deliver some medical toolkit

#### Phase 2: Treatment

1. A start would report daily treatment status for each patient one by one
1. A staff would ask each patient for a daily medical data that each one need to send via a LINE's
   image-message
1. A staff would confirm for daily meals delivery

#### Phase 3: Recovery

1. A staff would clarify if a patient got recovered and also give them some personal information,
   medical document and etc.

### Limited technology resources

- There is NO technology's resources available, which means we must run the system by our own.
- Lack of budget to be provided

## The Solution

After discussion with the stakeholder, we decided to spend most of the budget onto the LINE's
web-services. And we need to research more to find out for a list of serverless platforms for
hosting our system, and absolutely free of cost if it's possible.

Let's realized what we did know at the beginning point;

1. We did some basic research, and find out that ~92% of the prior patients get used with LINE, an
   app for instant communications on smartphones, which helps us leverage it to utilize their
   web-services to solve our problems
2. The expectation for a number of infection is almost impossible to figure out, but the stakeholder
   give us roughly by `120 infections/day at peak`, which is calculated roughly based on the prior
   outbreak
3. No technology's resources is not that bad for nowadays, there are a lot of serverless platforms,
   which are also a lot of competition on marketing that offered a bunch of free's tier for us. And
   there is fact that we did NOT need much on scaling, some free's tier serverless gonna suit our
   needs.

Then we could sliced the problem into 3 sub-problems;

### 1. UX for any patient

#### Phase 1.1: General Information Registration

<p align="center">
  <img width="460" height="300" src="assets/ux_phase_register_gen.png">
</p>

#### Phase 1.2: Location Registration

<p align="center">
  <img width="460" height="300" src="assets/ux_phase_register_location.png">
</p>

#### Phase 2 & 3: Treatment and Recovery

<p align="center">
  <img width="460" height="300" src="assets/ux_phase_treatment_and_recovery.png">
</p>

### 2. Data entities

Based on the designed UX, we might needed only 4 entities. But those might be changeable based on
which type of database to be use.

> Those are be changed, the following are what we intentionally show to the reader to notice _How
> the solution are formed on the beginning of the project_, please see the changes which is
> production ready on the topic of **persistent database** below.

```text
type ApplicationForm {
  id: either string or number might be fine
  admittedAt: datetime
  address: Address
  patients: Patient[]
  contact: Contact
}

type Address {
  lat: string
  lng: string
  zone: enum
  address: string
  landmarkNote: string
  phone: string
}

type Contact {
  lineId: string
  lineDisplayName: string
  linePictureUrl: string
}

type Patient {
  id: either string or number might be fine
  applicantId: either string or number might be fine
  name: string
}
```

### 3. Utilize the free's tier if it's possible on any serverless platforms

TODO: Add figure of system design

We prioritized the selected services based on its cost and a specific availability. And we might be
wrong about the prediction on the number of user, that can cause the system to fail and then suffer
us with unknown cost. **This is what we intentionally avoid to be locked within those technology.**

#### 2.1 Serverless functions

In the terms of cost and availability, with the serverless functions are very compromised rather
than a virtual server or container like Amazon App Runner, Google Cloud Run, Heroku, and etc. But
this could be 50/50 when considering about _avoiding to be locked within those technology_, as we
said before. Because, mostly any serverless functions is tightness between the implementation and
the platform's dependencies.

The system we're gonna build as you can see in the figure on the UX-design's figure is including
both back-end and front-end, The front-end including some UIs, which is a static website with simple
forms. Then to be easier in perspective of developer experience, those codebase need to be in the
same repository, mono-repo is needed then more work need to be configured, that's a lot!. This
project is somehow needed to deliver as fast as possible, more works equivalent to more time. To
solve this problem, we gonna need an opinionated framework/template but also support our needs.

At this point, the tool that we needed could be more specific;

1. A framework/template that allow us to maintain both front-end and back-end
2. Both front-end and back-end codebase can be executed via serverless function
3. It should be platform agnostic, the implementation can be able to live in any platform

After the research, we gonna choose either Next.js or Remix.js. And the Remix.js was seem to be more
preferred, because the official mentioned that the deployment can be made across platforms. Even the
tradeoff is risk due to the earliness of the Remix.js itself.

> During the researching, we found out the limitation to utilize any free tier on any platform,
> which is the timeout on each serverless-function execution must be less than 10 seconds, this
> **MUST** be our critical concern, now!

##### How the available invocations is tested

> By searching for **platforms's pricing**, the number of available invocations that is useable on
> any free tier 100-125k invocations / month.

Since we known that `~120 users` could consume our available invocations a day. And we can estimate
how much invocations needed for an user. This can be counted based on _the UX diagram, Phase 1:
Registration_, which each user gonna need `~4 invocations` plus with the invocations that system
need for notifying messages every day, which `6 invocations a day`.

```text
(120 users * 4 invocations + 6 invocations) * 30 days =
14,580 invocations needed a month
```

We need only `15 %` of the minimum available invocations that every platform offered.

#### 2.2 Persistent data

So, to be more conformable to jump from one serverless platform to the another. We ruled to rather
stick with standard technology either SQL or No-SQL. There are variety of platforms to choose. This
made us easy to delist some service like Google's Firebase, Hasura, and etc from our consideration.

The criteria to be most concern are the available memory and the available connections during the
flight. Luckily, those criteria could be possible to test by the following calculations;

##### 2.2.1 How the available connections is tested

> By searching for **platforms's pricing**, the number of available connections that is useable on
> any free tier is between 20-30 connections.

At this point, we known that `~120 users` a day is likely to load into our system. To be honest, we
did think that number is not much to break any free tier database. But, that instinct won't give us
a confident. So, we did decided to use the
[Poisson distribution calculator](https://www.statology.org/poisson-distribution-calculator/) to
test the loads theoretically.

Since the point of failure to our system could be caused when our database run out of connection.
Let's find that possibility.

Each user needs to submit 2 forms at 2 different time;

1. The first form could be submitted once in a period of time between 8 AM ~ 6 PM
2. The last form could be submitted once in a period of time between 6 PM ~ unknown, but let's say
   that every user is in hurry and gonna submit it simultaneously within 5 minutes after the
   notification was fired

The user's behavior on the last form will be more likely to critically load our system. So, we
should use this scenario to test the loads.

> The worse case for any execution on each serverless function could be `10 seconds`.

Our system will be loaded `120 executions` per `5 minutes`. But we need to scale it down to
`10 seconds`. Then the mean gonna be `4 executions` per `10 seconds` after converting. Finally, we
could plot the Probability Mass Function onto it like below;

```python
from scipy.stats import poisson
import numpy as np
import matplotlib.pyplot as plt

# creating a numpy array for x-axis
# using step size as 1
x = np.arange(0, 30, 1)

# poisson distribution data for y-axis
y = poisson.pmf(x, mu=4, loc=0)

plt.plot(x, y)

plt.xlabel('the number of users in 10 seconds')
plt.ylabel('probability')

plt.show()
```

<p align="center">
  <img width="460" height="300" src="assets/poisson_dist_of_loads_test.png">
</p>

The minimum number of available connections from our research is `20 connections`. So, the
possibility while `20 connections` are using simultaneously within any period of `10 seconds` is
almost `0 %` chance to happen. This should give us a confident to use the free tier on any platform.

##### 2.2.2 How the available memory is tested

> By searching for **platforms's pricing**, the number of available memory is measured by 2 metrics
> either _by a number of record with 10k records minimum_ or _by a memory usage with 512 MB
> minimum_.

The number of days that any user needed to live in our system is `10 day`, which defined by the
government, and by multiply to the expected number of infections at peak `120 infections/day`. Then
we can expect `(120 * 10) or 1,200 users` to persistent simultaneously in database.

The question is _How much of storage required for persisting data for `1,200 users`?_. But this is
also depend on what type of database to use. Let's figure out that type of database.

For simplicity as the data entities, we don't think that we need some **special usage** for
database. It just _insert_ and _read_ in _relational_ way. So, we would go for a SQL approach and
PostgreSQL is a good choice of it. But there is a tradeoff by selecting this. By doing some
experimentation with some free tier database and a Prisma client. We found that every database
server will be located in USA and that cost `~ 300 - 700 ms` on a warm start and `~2.5 seconds` on a
cold start for latency.

> 💡 If we would like to solve the latency problem, one option that we found is using
> [Redis Cloud](https://redis.com/redis-enterprise-cloud/overview/) as the data persistent, which
> cost `~50 ms` on any database's request for latency. Using Redis Cloud might be sound good, but
> due the fact that our entities seem to be relational. And we're likely to build some tool and
> abstraction on top of Key/Value database like Redis to be compatible with our relational model
> anyway. Even at the time we're writing this there is a very promising Redis ORM,
> [Redis OM](https://github.com/redis/redis-om-node), but it is still beta. That can cost more time
> to implement by ourself. So, we decided to drop this idea.

Let's back to figure out _How much of storage required ?_ to persisting data on a PostgreSQL server.
To be honest, we sucked! at estimating theoretically for database size. What we did instead is, we
did mock some data and push it into a runtime database(locally via docker container) then check the
memory usage. That resulted only `0.4 MB` for storing `1,200 records` and `42.1 MB` with a instance
of PostgresSQL server. Even with the minimum storage on free tier, it still be enough up to
`32 years`.

Let's consider another approach by using the metric of _number of record_, as you can see in the
data entities, there are 4 entities or in the other hand 4 tables. To storage 1 user data, it
required 4 records. With `1,200 users` will cost `4 * 1,200 = 4,800 records` is our minimum
requirement. And gonna force us to take responsibility for cleanup database every `~20 days` because
we're limited by `10k records`. This approach is seem to be a problem when compare with _the
memory-usage approach_.

And we think that if can survive with _the number-of-records approach_. Then we'll gonna have much
more platforms to alternate. It's gonna be fun to dive deeper seeing whether it's possible ?

To solve the problem caused by lacking of available records. One solution is to reduce the number of
entities or in the other hand _denormalization_. Then it resulted to leave only `2 of 4 entities`.
The following are how it look;

```text
type ApplicationForm {
  id: either string or number might be fine
  admittedAt: datetime
  patients: Patient[]

  # Denormalized from Address's entity
  lat: string
  lng: string
  zone: enum
  address: string
  landmarkNote: string
  phone: string

  # Denormalized from Contact's entity
  lineId: string
  lineDisplayName: string
  linePictureUrl: string
}

type Patient {
  id: either string or number might be fine
  applicantId: either string or number might be fine
  name: string
}
```

Then it will cost `2,400 records` for the minimum requirement and will live for `40 days`. That is
`50 %` improvement. Even it's still cause us to take the responsibility to cleanup. We think that is
fair trade with more alternative platforms to jump. And cleanup database is not much time-consuming
anyways.

## Technical Note

### Why Remix.js ?

As we did mention in the solution's section and the following are the huge win to use;

1. We got used to JavaScript, and especially React, this gonna helps us develope confidently
2. Remix.js exposes their API aligned with the web-standards, even it's early in the public, the API
   itself are what we got used to it
3. Fullstack framework, we run both front-end and back-end on serverless function via the single
   codebase, then the cost of operation more likely to be cheaper than maintaining our own
   server/container
4. The number of platforms that supported the Remix.js is greater than the Next.js, this helps us be
   more platforms agnostic, because we need to stick on the free's tier on any platform, the more
   platform to jump the better

### Why Netlify ?

> By our design, we made our implementation to be platform agnostic. And the Netlify is just one of
> available platforms on earth. Nothing it be special.

This platform is one of the support list by the Remix's official and comes with many pros that
suited our needs. But actually by comparing the plan across platforms, it turned out that most of
platforms can be used. The following are the criteria.

1. The number of available executions of serverless functions, the calculation is by request, which
   we opinionated about the easiness to calculate
2. The available bandwidth, this is also can be calculated based on the number of expected patients

But the limitation is the timeout on each serverless-function execution that be less than 10
seconds, this **MUST** be our critical concern.

Another useful feature is `Netlify Build`, where we can utilize modern CI/CD infrastructure out of
the box.

### Why cron-job.org ?

The cron-job.org is a scheduled execution service, which is entirely FREE of charge. Allowed
none-technical users to configure time of scheduled notification easily via UI. And also support
sending customized HTTP requests, which we can trigger notification securely.

### Limitation of utilizing Prisma on Netlify

Accessing a database from Netlify's serverless function can cause an issue. When a serverless
function is triggered and needs to access a database, the following instructions are triggered;

1. establishes a connection to database
2. submits a query and receives the response from the database
3. the response data is then delivered to the client that invoked the serverless function
4. the database connection is closed and the function is torn down again.

If the number of parallel function invocations is low, there are no issues. However, during traffic
spikes, it can happen that a lot of parallel functions are spawned, each requiring its own database
connection. PostgreSQL have a database connection limit that can easily get exhausted in these
situations. Once the database can't accept any new connections from newly spawned serverless
functions, the requests made by the client applications start to fail.

And due to the fact that Heroku's free-tier offering 20 max connections. Our solution gonna be
limited to serve only 20 users per the exact time, and the later-coming users will be absolutely
rejected.

Another thing to be concerned is as issue of
[slow queries due to cold starts in any serverless function](https://github.com/prisma/prisma/issues/7303).
Any serverless-function's execution is limited for 10 seconds to timeout. The cold starts made it
even worse to waste time for ~2 seconds for some execution. That is likely to happen due to the fact
that our system is theoretically loaded with a few number of request.

### Remix's mutation breaking React's reactivity rules

One of the React's principle is
[reactivity rules, which "You must specify reactive dependencies"](https://beta.reactjs.org/apis/react/useEffect#specifying-reactive-dependencies)
. And you should trigger any event-handler in an event's listener rather than within useEffect().

By design, Remix intentionally exposes API to be along with the web standards. And when you need to
submit a form, in the other hand do a data-mutation within Remix, they offer us the web-standard
API, which allow us to design an UX of none-required JS enabling on any browser, and also many
feature eg. handling optimistic UI, error handling, race condition, automatic data-revalidation, and
more, out of the box. But by respecting that principle, we're gonna lose **the React's reactivity
rules**, that's a tradeoff.
[See the breaking in `useEventFetcher`'s hook.](https://github.com/kanatamon/covid19-home-isolation/blob/main/app/components/home-isolation-form-editor.tsx)

Let's explore some concrete scenario where we did break the rules.

> Suppose that we need a component to trigger a prop of `onSuccess`, which is an event-handler,
> after a POST request is successful.

```ts
// Example: what we normally do
function SomeForm({ onSuccess }: { onSuccess?: () => any }) {
  const onSubmitHandler = async () => {
    const res = await fetch(`https://some.app`, { method: 'POST' })
    const data = await res.json()
    const isSuccess = data === '{}'
    isSuccess && onSuccess?.()
  }

  return <form onSubmit={onSubmitHandler}>...</form>
}

// Example: what we do instead within Remix, which breaking the rules
function SomeForm({ onSuccess }: { onSuccess?: () => any }) {
  const fetcher = useFetcher()
  const isSuccess = fetcher.data === '{}'
  useEffect(() => {
    isSuccess && onSuccess?.()
  }, [isSuccess])
  // ^ eslint-disable-next-line react-hooks/exhaustive-deps

  return <form onSubmit={onSubmitHandler}>...</form>
}
```

### Things to improve

#### No retrying strategy if any of DB query, or LINE web-service are failed

TODO: Mention about the limitation of 10 seconds on each execution's timeout, this make retrying to
be impossible

#### No system failure notification

TODO: Add more

#### Offline local development

TODO: We might need MSW to mock for LINE web-services

#### E2E testing is hard

TODO: Mention the re-design to fix this see
[#1](https://github.com/kanatamon/covid19-home-isolation/issues/1#issue-1391257706)

## References

- [Database access on the Edge with Next.js, Vercel & Prisma Data Proxy](https://www.prisma.io/blog/database-access-on-the-edge-8F0t1s1BqOJE)

- [Isolated Integration Testing with Remix, Vitest, and Prisma](https://www.simplethread.com/isolated-integration-testing-with-remix-vitest-and-prisma/)
