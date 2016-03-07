!{
    "title": "Build distribution tool for SenchaCMD",
    "image": "/images/posts/5-testing-extjs-with-mocha-js/mocha-extjs-demo.gif",
    "imagePreview": "/images/posts/5-testing-extjs-with-mocha-js/mocha-extjs-logo-300.png",
    "metaDescription": "sencha cmd, extjs, bash",
    "tags": "sencha cmd,extjs,bash",
    "date": "2016-03-05"
}

<!-- preview -->

If your ExtJs application consist of several parts and requires multiply building.
Or your have to build several copyes of one application.

<!-- /preview -->

# Build distribution tool for SenchaCMD

![Principle pic](https://raw.githubusercontent.com/antonfisher/dscmd/docs/images/dscmd-principle.png)

## Result on Jenkins builds chart
![Result](https://raw.githubusercontent.com/antonfisher/dscmd/docs/images/dscmd-jenkins-builds-chart.png)

__Note:__ 3 distributed VMs used instead one master.

## Installation
* Copy `dscmd.sh` script to your Sencha applications workspace;
    * `wget https://raw.githubusercontent.com/antonfisher/dscmd/master/dscmd.sh -O dscmd.sh`
    * `chmod +x dscmd.sh`
* Run `$./dscmd.sh config`.

## Usage

```
$ ./dscmd.sh
Build distribution tool for SenchaCMD v0.1.2 [beta]
Usage:
  ./dscmd.sh config
  ./dscmd.sh applications-list
  ./dscmd.sh add-agent
  ./dscmd.sh remove-agent [--all]
  ./dscmd.sh agents-list
  ./dscmd.sh agents-test
  ./dscmd.sh build [--all] <application1,application2,...>
```

### Add agents (Ubuntu-based host)
* [Copy ssh key](https://www.digitalocean.com/community/tutorials/how-to-set-up-ssh-keys--2) to agent;
* Run `$ ./dscmd.sh add-agent`.

### Run distributed build
* Run `$ ./dscmd.sh build --all` to build all application in applications folder;
* Or run `$ ./dscmd.sh build applicationName1,applicationName2`.

## Under hood
```
for each agents {
    copy ssh key --> ssh --> apt-get install --> install sencha cmd
}

for each applications {
    rsync --> sencha app build --> rsync
}
```

## Links

[GitHub repository](https://github.com/antonfisher/dscmd)
