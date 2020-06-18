# Felony

Framework for lazy developers with security in mind that promotes good project structure and code segregation.

HTTP Server is wrapper around [ExpressJS](https://expressjs.com/) framework with preloaded security defaults.

## Requirements

Felony has been written with node v14 in mind, it might not work with older versions of node.
It assumes your are writing your application as ESM module, you will have to specify that in your `package.json`:

```json
{ 
  "type": "module"
}
```

## Installation

Install Felony as a dependency of your project:

```shell script
npm install --save felony
```

Create `index.js` file:
```js
import { app as Felony } from "felony";
Felony.commit();
```

And that's it, you will now have access to Felony right away, give it a try:

```shell script
node index.js
```

Without any passed arguments, you will just get `console.dir(Felony)` back that will display all the loaded modules.

To start HTTP server simply pass the `http` argument to `index.js`:

```shell script
node index.js http
```

## ExpressJS

As already mentioned, Felony lifts Express as HTTP(s) server with security plugins already enabled and added by default.

We have included:

- *HPP* (HTTP Parameter Pollution) protection (default: enabled)
- *Helmet* package that includes:
  - *contentSecurityPolicy* for setting Content Security Policy	(default: disabled)
  - *crossdomain* for handling Adobe products' crossdomain requests	(default: disabled)
  - *dnsPrefetchControl* controls browser DNS prefetching (default: enabled)
  - *expectCt* for handling Certificate Transparency (default: disabled)
  - *frameguard* to prevent clickjacking (default: enabled)
  - *hidePoweredBy* to remove the X-Powered-By header (default: enabled)
  - *hsts* for HTTP Strict Transport Security (default: enabled)
  - *ieNoOpen* sets X-Download-Options for IE8+ (default: enabled)
  - *noSniff* to keep clients from sniffing the MIME type (default: enabled)
  - *referrerPolicy* to hide the Referer header (default: disabled)
  - *xssFilter* adds some small XSS protections (default: enabled)
- *Cors* (default: enabled, but lax)

If you don't configure any of them, they will use default configurations, we strongly encourage you to research those options,
and configure them for your project and needs. It will not make your application bulletproof, but will help you fend off
most of the script-kiddie hackers.

- https://www.npmjs.com/package/hpp
- https://www.npmjs.com/package/helmet
- https://www.npmjs.com/package/cors

## Configuration

Felony will automatically load configuration files that are placed in `config/` directory of your project:

To configure HTTP server, you will create `config/server.js` file:

```js
export default {
  port: 5445,

  // https://expressjs.com/en/4x/api.html#express.router
  router: {
    caseSensitive: false,
    mergeParams: false,
    strict: false,
  },

  // https://helmetjs.github.io/
  helmet: {},
}
```

To modify default cors configurations for your server, add `config/cors.js` file:

```js
export default {
  origin: "*",
  preflightContinue: false,
  optionsSuccessStatus: 204,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  headers: [
    "user-agent",
    "content-type",
    "accept-language",
    "x-forwarded-for",
  ],
}
```

All the configurations will be then available on `Felony.config` in your application.

### Environment specific configurations

Felony will recognize if your export `NODE_ENV` before you run it and it will be stored in `Felony.environment` property.
This property will be used to load configuration files from `config/environments/{YOUR_ENV}/any-config.js`.

This means, if, for example you want to override cors configurations for your production application, 
you would create `config/environments/production/cors.js`, that would automatically override 
`config/cors.js`

then run your application with NODE_ENV set:

```shell script
NODE_ENV=production node index.js
```

## Running, helpers and application

Felony comes with integrated commands that will help you in building your project, to show what commands are available run:

```shell script
node index.js commands
```

The commands offered as integrated will help you generate your own commands, databases, routes, middleware, events and listeners.

## Routes

To create route, simply run:
```shell script
node index.js command=make:route name=GetVersion.js method=GET path=/version
```

This will create empty route file under `routes/GetVersion.js`, modify it:

```js
import Route from "felony/base/Route.js";
import { promises as fs } from "fs";
export default class GetVersion extends Route {
  method = "GET";
  path = "/version";
  description = "";
  middleware = [];
  async handle(request, response) {
    const file = await fs.readFile("./package.json", "utf-8");
    const pkg = JSON.parse(file.toString());
    response.status(200).send({ version: pkg.version });
  }
}

```

Start the application with:

```shell script
node index.js http
```

...and open in your browser: http://localhost:5445/version

Thats it!

## Middleware

As you have noticed, route has property `middleware = []` in that array you can put paths to any middleware you create:

```shell script
node index.js command=make:middleware name=LogRequest.js
```

Your middleware will be created under `middleware/LogRequest.js`:

```js
import Middleware from "felony/base/Middleware.js";
export default class LogRequest extends Middleware {
  async handle(request, response, next) {
    next();
  }
}

```

*IMPORTANT*: You absolutely have to call `next()` or return response in every middleware, otherwise your server will hang once the route is called!

To add this middleware to your route, edit the route and add the path to it in `middleware` array:

```js
import Route from "felony/base/Route.js";
import { promises as fs } from "fs";
export default class GetVersion extends Route {
  method = "GET";
  path = "/version";
  description = "";
  middleware = ["../middleware/LogRequest.js"]; // Note that the path is relative from routes directory
  async handle(request, response) {
    const file = await fs.readFile("./package.json", "utf-8"); // unlike fs that works from the application root where node was started
    const pkg = JSON.parse(file.toString());
    response.status(200).send({ version: pkg.version });
  }
}

```

## Commands

Commands are useful tools that can enable you to run certain tasks for your application, and are designed to run from CLI, but can also be called from
within your application.

To get started, simply use the included helper command to create one:

```shell script
node index.js command=make:command name=ExampleCommand.js signature=example
```

Command will be created under `commands/ExampleCommand.js`.

Within the command you'll get `async handle() {}` method where you should put the command logic, and then you'll be able to simply run it:

```shell script
node index.js command=example
```

In the command, all the arguments passed will be available in the payload object: `this.payload`.

## Database

You can create configuration file that will hold the connection settings, for example: `config/database.js`:

```js
export default {
  redis: {
    host: "localhost",
    port: 6379,
  }
}
```

...and this will be available under `Felony.config.database`

Felony, does not come with any database preferences, instead, we provide you with easy database setup:

```shell script
node index.js command=make:database name=Redis.js
```

This will create `databases/Redis.js` where you will have two methods to use `async handle() {}` and `async close() {}`

Use the `handle` method to connect and setup the connection to any database or database ORM you wish and simply place it on the `client` property.

This will then automatically load on the `Felony` object, and you will be able to access it: `Felony.db.Redis.client`.

```js
import Database from "felony/base/Database.js";
import Redisng from "redisng";

export default class Redis extends Database {
  client = null;
  async handle() {
    this.client = new Redisng();
    await this.client.connect(Felony.config.database.redis.host, Felony.config.database.redis.port);
  }
  async close() {
    await this.client.close();
  }
}
```

## Events

Felony has its own kind of events called `FelonyEvent` that can be raised on any occasion within your application,
this allows you to later extend the features and actions of your application without having to dig through the code.

To create an event, you can simply run:

```shell script
node index.js command=make:event name=Hello.js
```

This will create simple class:

```js
import FelonyEvent from "felony/base/FelonyEvent.js";
export default class Hello extends FelonyEvent {}
```

You can modify it to accept whatever payload you want when you construct the event:

```js
import FelonyEvent from "felony/base/FelonyEvent.js";
export default class Hello extends FelonyEvent {
  payload = null;
  constructor(payload) {
    super();
    this.payload = payload;
  }
}
```

...and then, anywhere in your application you can raise this event:

```js
await Felony.event.raise(new Hello({ value: true }));
```

Felony raises a lot of events during its runtime, you can create listeners for those events,
take a look in `support/events/` directory to see if there is anything you might need to listen for.

*IMPORTANT*: In order to not get unexpected behaviour, events must have unique name.

## Listeners

Listeners are listening (go figure) for raised events, create a listener by running:

```shell script
node index.js command=make:listener name=HelloListener.js
```

```js
import Listener from "felony/base/Listener.js";
export default class HelloListener extends Listener {
  static listen = [];
  async handle() {}
}

```

This listener like this won't do much since its not listening to anything, to get it to listen for an event, add name of the event class
you want it to listen, and then once the event is raised, Felony will call this listener and pass it the raised event:

```js
import Listener from "felony/base/Listener.js";
export default class HelloListener extends Listener {
  static listen = [
      "Hello"
  ];
  async handle() {
    console.log("We got event: ", this.event); // We got event: Hello {}
  }
}
```

## Jobs and queue

Felony comes equipped with async queue and workers for longer running or memory heavy jobs.

Premise of the worker is that you will have multiple instances of your (same) application running, one (main) would be for listening HTTP requests:

```shell script
node index.js http
```

And then you would have additional worker instances:

```shell script
node index.js queue=example-queue
``` 

Let's say that you have some API endpoint where users can request export of their entire data they have in your database, this is something that would 
probably require you to make multiple database calls, format that data, pretty it up, and it lasts longer then a regular request would last.

So you make a plan to create a Job `jobs/ExportUserData.js` that would handle that export, and then later it would .zip the data and send it via email:

```shell script
node index.js command=make:job name=ExportUserData.js
```

You will end up with something like this:

```js
import Job from "felony/base/Job.js";
export default class ExportUserData extends Job {
  queueOn = null;
  async handle() {}
  async retryStrategy() {
    return true;
  }
}
```
So you start editing the Job and finally you get something like this:

```js
import Job from "felony/base/Job.js";
export default class ExportUserData extends Job {
  queueOn = "long-execution-queue";
  async handle() {
    const userId = this.payload.userId;
    // Here we gather Users data...
    // Pretty it up and prepare it for zip...
    // Zip it in a file...
    // Email the file...
  }
  // This will trigger if handle method throws an error
  async retryStrategy() {    
    if (this.error === "Some error that means we cannot retry") {
      return false;
    }
    
    return true;
  }
}
```

Armed with this job, you create new route where users can request the data:

```js
// POST /get-all-my-data
async handle(request, response) {
  await Felony.queue.dispatch("ExportUserData.js", { userId: request.body.userId });

  response.status(200).send({ message: "Your data will be compiled, and sent to you by email shortly." });
}
```

HTTP Instance will receive this request and will dispatch the Job onto queue, Queue instance will pick it up from Redis and will instantiate the same job
give it the payload you sent to it, and work on it in a separate process without making user wait for the response to come back.

### Important notes for queues

- Queue workers use redis, and you'll have to configure it: see example below
- When you dispatch a Job, payload you pass to it will be JSON stringified, meaning you can send only what will survive that process.
- Queues execute ONE JOB AT THE TIME, this is a good way to make them reliable, but if you want speed, you might need to add more listeners for the same queue.
- Theoretically, your application queue workers don't have to be on the same server as your main app, they just need to have access to same Redis.

### Configuring queue

Create a file in `config/queue.js` or `config/{YOUR_NODE_ENV}/queue.js`:

```js
export default {
  connection: {
    host: "localhost", // Redis host
    port: 6379, // Redis port
    db: 1, // Redis db where to store jobs
  }  
}
```

# Additional documentation

We believe that the best documentation for code is code itself, there for we encourage you to dig through our code and inspect what is happening there,
we suggest that you start with the `base/` directory that holds classes each of the objects extends, they have a lot of comments and might help you understand a lot more then this readme.
