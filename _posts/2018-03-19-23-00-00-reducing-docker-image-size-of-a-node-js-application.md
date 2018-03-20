{
    "title": "Reducing Docker image size of a Node.js application",
    "image": "/images/posts/9-reducing-docker-image-size-of-a-node-js-application/docker-image-sizes-logo.png",
    "imagePreview": "/images/posts/9-reducing-docker-image-size-of-a-node-js-application/docker-image-sizes-logo-500.png",
    "metaDescription": "nodejs, docker, docker image size",
    "tags": "nodejs,docker",
    "date": "2018-03-19"
}

<!-- preview -->

Working on a project at work I noticed that pulling and deploying our _Node.js_ application sometimes takes
more time then I want it to.
I started digging into the problem and here are 2 easy steps I've done to compress _Docker_ image size
down from **948MB** to 206MB and then to **79MB**!

<!-- /preview -->

## This is the results of my attempts:

<center>
![Docker image sizes uncompressed](/images/posts/9-reducing-docker-image-size-of-a-node-js-application/docker-image-sizes-console-table.png)
</center>

## Initial configuration

The application is a typical web application that has frontend part (_React.js_) and backend part
(_Node.js_ server on _Express.js_.)
The build process consists of these steps:
```bash
NPM build ---> Run tests ---> Build Docker image ---> Publish to hub.docker.com
```

This is the simple _Dockerfile_ I had before changes (located in the root of my applications directory):

```docker
FROM node:8.10.0

RUN mkdir -p /usr/app/build
WORKDIR /usr/app

COPY ./build /usr/app/build
COPY ./node_modules /usr/app/node_modules
COPY ./package.json /usr/app/package.json

EXPOSE 3000

CMD [ "npm", "run", "start" ]
```

This _Dockerfile_ does several things:
- using `/usr/app` as application directory
- copying build files into the designed application directory
- copying required _Node.js_ modules to the application directory.

## Step 1: Using _alpine_ version of _Node.js_ image (948MB to 206MB)

_Node.js_ images [repository](https://hub.docker.com/_/node/) provides several image tags for each _Node.js_ version.
For example, version _8.10.0_ has 6 different image tags:
- `8.10.0` -- 266MB compressed
- `8.10.0-alpine` -- **23MB compressed**
- `8.10.0-onbuild` -- 266MB compressed
- `8.10.0-slim` -- 92MB compressed
- `8.10.0-stretch` -- 343MB compressed
- `8.10.0-wheezy` -- 202MB compressed.

An interesting thing there is the _alpine_ version.
This is the smallest of available images because it based on [Alpine Linux project](https://alpinelinux.org/).
_Alpine_ uses _musl libc_ instead of _glibc_ inside, but _Node.js_ usually uses the second one on a typical developer system.
Possibly, this may break some libraries you use but there were no issues with my _Express.js_ based application.
Give it a try if it fits you:

```docker
# change the first line from:
FROM node:8.10.0

# to:
FROM node:8.10.0-alpine
```

"Docker build" and in my case, the size of the image drops down to **206MB**, it's **-78%** of the initial size!

(Read more about pros/cons of _alpine_ image [here](https://github.com/nodejs/docker-node#nodealpine).)

## Step 2: Using NPM `--production` flag (206MB to 79MB)

By default, `npm install` installs all dependencies including `devDependencies`.
There is `--production` flag that makes it possible to install only the `dependencies` section from _package.json_.
I keep build systems, testing utils, and other dev stuff in the `devDependencies` section
and I'm used to keeping my _React.js_ libraries and other dependencies (that I actually use only on UI)
under the `dependencies` section in _package.json_.
But this doesn't look like a correct way because I've got _webpack_ to do bundle all my UI dependencies
to the single file.
Hence, the right solution here is to move all dependencies, which are not going to be directly used
by the production server, to the `devDependencies` section.

**The rule is: if the dependency is only needed during the build, move it to the `devDependencies` section.**

I don't do a bundle for server files, so I left all server dependencies in `dependencies` section as they were before.
That means that the working process should contain following steps:

```bash
npm install;                    # install dev + prod deps
# do crazy coding here
npm run build;                  # copy server files and the UI bundle to the `dist` folder
npm test;                       # test the build
docker build -t myapp:latest .  # build a Docker image
```

This is the final version of the _Dockerfile_ I have:

```docker
FROM node:8.10.0-alpine

RUN mkdir -p /usr/app/build
WORKDIR /usr/app

COPY ./build /usr/app/build
COPY ./package.json /usr/app/package.json

RUN cd /usr/app && npm install --production

EXPOSE 3000

CMD [ "npm", "run", "start" ]
```

Again “Docker build” and in my case, the size of the image drops down to **79MB**
and this time it's **-91%** of the initial size!

## Conclusion

Two simple steps to get image size dropped from **948MB** to **79MB**.
Now the process of container updating/re-running takes much less time.
Compression sizes on [hud.docker.com](https://hub.docker.com/r/nexenta/nedgeui/tags/) look even better:

<center>
![Docker image sizes compressed](/images/posts/9-reducing-docker-image-size-of-a-node-js-application/docker-image-sizes-hub-table.png)
</center>

## Links
- [_Node.js_ _alpine_ image](https://github.com/nodejs/docker-node#nodealpine)
- [Another one solution to the same problem](https://medium.com/@iamnayr/a-multi-part-analysis-of-node-docker-image-sizes-using-yarn-vs-traditional-npm-2c20f034c08f)

Thanks for reading. I'd be glad to get any feedback!
