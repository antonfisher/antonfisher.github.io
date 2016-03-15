!{
    "title": "Build distribution tool for SenchaCMD",
    "image": "/images/posts/6-sencha-cdm-distrubured-build/dscmd-logo.png",
    "imagePreview": "/images/posts/6-sencha-cdm-distrubured-build/dscmd-logo-300.png",
    "metaDescription": "sencha cmd, extjs, bash",
    "tags": "sencha cmd,extjs,bash",
    "date": "2016-03-13"
}

<!-- preview -->

Building of ExtJs application with SenchaCMD takes about 1 minute on my 4-cores laptop.
In current project we have about 20 ExtJs applications which are built to one main application
(an architectural requirement).
When I am building whole app, I should take 20-minutes coffee break.
Sounds not so bad? Not after 3 cups :)

<!-- /preview -->

It happens when your ExtJs application consist of several parts each of them needs to be builded.
Or you have to build several copies of one application for different environments.
In my case we have several applications in one _workspace_.
First of all I disabled all unimportant build features for me, such like theme's sample.
I wrote small _Bash_ script which helps distribute builds to different VMs:

<center>
![Principle pic](/images/posts/6-sencha-cdm-distrubured-build/dscmd-principle.png)
</center>

This is Jenkins result for 3 distributed VMs used instead one:

<center>
![Result](/images/posts/6-sencha-cdm-distrubured-build/dscmd-jenkins-builds-chart.png)
</center>

Looks cool?

Repository on [GitHub](https://github.com/antonfisher/dscmd).

## Features

* manage build-agents from one master
* add/remove build-agent, install requirements (Java, SenchaCMD, ...)
* getting all applications in folder automatically
* possible to run by Jenkins
* shows build time.

## System requrements
* Linux base system.

## Installation
* Copy `dscmd.sh` script to your Sencha applications workspace;
    * `wget https://raw.githubusercontent.com/antonfisher/dscmd/master/dscmd.sh -O dscmd.sh`
    * `chmod +x dscmd.sh`
* Run `$./dscmd.sh config`.

## Usage
&nbsp;
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


## Agents

In my case I depoyed this list of VMs:
<center>
![VM list](/images/posts/6-sencha-cdm-distrubured-build/vms-list.png)
</center>

Each of them has the same configuration:
<center>
![VM configuration](/images/posts/6-sencha-cdm-distrubured-build/vm-config.png)
</center>

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
