{
    "title": "Reducing Docker image size of a Node.js application",
    "image": "/images/posts/9-reducing-docker-image-size-of-a-node-js-application/docker-image-sizes-logo.png",
    "imagePreview": "/images/posts/9-reducing-docker-image-size-of-a-node-js-application/docker-image-sizes-logo-500.png",
    "metaDescription": "nodejs, docker, docker image size",
    "tags": "nodejs,docker",
    "date": "2018-03-19"
}

<!-- preview -->

Working on a _Node.js_ application I noticed that deploying its image sometimes takes more time then I want it to.
I started digging into the problem and here are two steps to drop _Docker_ image size down from **948MB** to **79MB**!

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

The application _Dockerfile_ before changes (located in the root of application directory):

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
- sets `/usr/app` as application directory
- copies build files to the application directory
- copies required _Node.js_ modules to the application directory.

## Step 1: Replace base _Node.js_ image with a smaller one (948MB to 206MB)

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
_Alpine_ uses _musl libc_ instead of _glibc_ inside, but _Node.js_ usually uses the latter
on a typical developer system.
It may break some libraries you use but there were no issues with my _Express.js_ based application.
Switching to _alpine_:

```docker
# change the first line from:
FROM node:8.10.0

# to:
FROM node:8.10.0-alpine
```

Run `docker build` and in my case, the size of the image drops down to **206MB**, it's **78% less** than
the initial size!

(Read more about pros/cons of _alpine_ image [here](https://github.com/nodejs/docker-node#nodealpine).)

## Step 2: Use NPM `--production` flag (206MB to 79MB)

By default, `npm install` installs all dependencies including `devDependencies`.
There is `--production` flag that makes it possible to install only the `dependencies` section from _package.json_.
I keep build systems, testing utils, and other dev tools in the `devDependencies` section.
I'm used to keeping my _React.js_ libraries and other UI dependencies under the `dependencies`
section in _package.json_, but it doesn't look correct,
because I have _webpack_ to make a bundle of all my UI dependencies.
Hence, the right solution here is to move all dependencies, which are not going to be directly used
on the production server, to the `devDependencies` section.

**The rule is: if the dependency is only needed during the build, move it to the `devDependencies` section.**

I don't make a bundle for server files, so I left all server dependencies in `dependencies` section as they were before.
That means that the working process should contain following steps:
- build UI bundle
- copy UI bundle to the Docker image
- copy server files to the Docker image
- copy _package.json_ to the Docker image
- do `npm install --production` inside the image.

The final version of the _Dockerfile_ I have:

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

Run `docker build` again and in my case, the size of the image drops down to **79MB**
and this time it's **91% less** than the initial size!

## Conclusion

Two simple steps to get image size dropped from **948MB** to **79MB**.
Now container deployment process takes much less time.
Compressed image sizes on [hub.docker.com](https://hub.docker.com/r/nexenta/nedgeui/tags/) look even better:

<center>
![Docker image sizes compressed](/images/posts/9-reducing-docker-image-size-of-a-node-js-application/docker-image-sizes-hub-table.png)
</center>

## Links
- [_Node.js_ _alpine_ image](https://github.com/nodejs/docker-node#nodealpine)
- [Another one solution to the same problem](https://medium.com/@iamnayr/a-multi-part-analysis-of-node-docker-image-sizes-using-yarn-vs-traditional-npm-2c20f034c08f).

Thanks for reading. I'd be glad to get any feedback!
