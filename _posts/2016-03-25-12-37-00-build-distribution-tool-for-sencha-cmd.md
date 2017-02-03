{
    "title": "Build distribution tool for SenchaCMD",
    "image": "/images/posts/6-sencha-cdm-distrubured-build/dscmd-logo.png",
    "imagePreview": "/images/posts/6-sencha-cdm-distrubured-build/dscmd-logo-300.png",
    "metaDescription": "sencha cmd, extjs, bash",
    "tags": "sencha cmd,extjs,bash",
    "date": "2016-03-25"
}

<!-- preview -->

Building _ExtJS_ application with _SenchaCMD_ takes about one minute on my 4-cores laptop.
In current project we have about 20 _ExtJS_ applications that are included into one main application
(an architectural requirement).
So, when I am building whole app, I should take 20-minutes coffee break.
Sounds not so bad? Not after third cup :)

<!-- /preview -->

It happens when your _ExtJS_ application consist of several parts and each of them needs to be builded separatly.
Or you have to build several copies of one application for different environments.
In my case we have several applications in one _SenchaCMD workspace_.
First of all I disabled unimportant build features, such like theme's sampling.
I wrote small _bash_ script that helps distribute builds to different VMs:

<center>
![Principle pic](/images/posts/6-sencha-cdm-distrubured-build/dscmd-principle.png)
</center>

This is _Jenkins_ result for 3 distributed VMs used instead one:

<center>
![Result](/images/posts/6-sencha-cdm-distrubured-build/dscmd-jenkins-builds-chart.png)
</center>

Looks cool?

Repository on [GitHub](https://github.com/antonfisher/dscmd).

## Features

* Distributing builds _ExtJS_ applications
* Manage build-agents from one master
* Add/remove build-agent, install requirements (_Java_, _SenchaCMD_, ...)
* Getting list of all applications in folder automatically
* Possible to run by _Jenkins_
* Shows build time and build progress.

## System requrements

* Debian-based system (_Ubuntu_).

## Installation

For start working with this script we do not have to clone whole repository, just copy the main bash script.  
Copy `dscmd.sh` script to __your Sencha applications workspace folder__ with the following command:

```bash
$ wget https://raw.githubusercontent.com/antonfisher/dscmd/master/dscmd.sh -O dscmd.sh
```

Next, apply execution privileges to the file:

```bash
$ chmod +x dscmd.sh
```

And run configuration process:

```bash
$ ./dscmd.sh config
```

During configuration we define an application folder, and a path to _SenchaCMD_ on agents (can use default):

```bash
$ ./dscmd.sh config
Build distribution tool for SenchaCMD v0.1.3 [beta]
Master initialization.

Enter path to applications folder (default: 'pages' or previous uses '') [ENTER]: apps/
Found applications in 'apps': app-about,app-dashboard,app-setting

Enter path to SenchaCMD on agents (default: ~/bin/Sencha/Cmd/sencha or previous uses) [ENTER]: 

Saved to .dscmd-config:
APPS_PATH=apps
CMD_PATH=~/bin/Sencha/Cmd/sencha
```

## Usage

To get usage help just run `./dscmd.sh` without parameters:

```
$ ./dscmd.sh
Build distribution tool for SenchaCMD v0.1.3 [beta]
Usage:
  ./dscmd.sh config
  ./dscmd.sh applications-list
  ./dscmd.sh add-agent
  ./dscmd.sh remove-agent [--all]
  ./dscmd.sh agents-list
  ./dscmd.sh agents-test
  ./dscmd.sh build [--all] <application1,application2,...>
```

### Add agents

A build-agent needs to be a Debian-based host (_Ubuntu_).
First of all we need to [copy ssh key](https://www.digitalocean.com/community/tutorials/how-to-set-up-ssh-keys--2)
to each agent.
And then run `add-agent` command and follow instructions:
```bash
$ ./dscmd.sh add-agent
Build distribution tool for SenchaCMD v0.1.3 [beta]
Add agent wizard.

Enter agent ip or host (use ',' to add few agents with same username) [ENTER]: 10.3.3.101,10.3.3.102
Enter agent username (default: root) [ENTER]: root
Enter path to SenchaCMD installation script [ENTER]: ~/Downloads/SenchaCmd-6.0.2.14-linux-amd64.sh 
Copy ssh key to agent using ssh-copy-id (Y/n) [ENTER]: 
Apt-get update and upgrade agent (Y/n) [ENTER]: n
Install Java and Ruby (Y/n) [ENTER]: n
Start...

### PART OF INSTALATION PROCESS BELOW ###

Create 'dscmd' folder on root@10.3.3.101...
Connection to 10.3.3.101 closed.
Copy SenchaCMD installation script (/home/af/Downloads/SenchaCmd-6.0.2.14-linux-amd64.sh) to root@10.3.3.101:~/dscmd ...
SenchaCmd-6.0.2.14-linux-amd64.sh                                                          100%   53MB   7.6MB/s   00:07    
Run SenchaCMD installation script on root@10.3.3.101...
Starting Installer ...
This will install Sencha Cmd on your computer.

...

Setup has finished installing Sencha Cmd on your computer.
Finishing installation ...
Connection to 10.3.3.101 closed.
Syncronize directory with root@10.3.3.101:/dscmd...

...

Done.
```

### Run distributed build

Our agents are ready, let's try to build:

* Run `$ ./dscmd.sh build --all` to build all application in applications folder;
* Or run `$ ./dscmd.sh build applicationName1,applicationName2`.

To show the applications list which will be used in case of `--all` option, use `applications-list` commad:
```
$ ./dscmd.sh applications-list
Build distribution tool for SenchaCMD v0.1.3 [beta]
Applicaitons list will be used for build:
about,gettingStarted,actionEdit,accessControl,actionDelete,actionDeleteDS,settings,summary
```

Build output:
```bash
$ ./dscmd.sh build --all
Build distribution tool for SenchaCMD v0.1.3 [beta]
Build applications:

[build   1/19: about         ] run build 'about' on root@10.3.3.101
[build   3/19: gettingStarted] run build 'gettingStarted' on root@10.3.3.103
[build   6/19: actionEdit    ] run build 'actionEdit' on root@10.3.3.106
[build   1/19: about         ] Syncronize local directory with agent...
[build   6/19: actionEdit    ] Syncronize local directory with agent...
[build   2/19: accessControl ] run build 'accessControl' on root@10.3.3.102
[build   2/19: accessControl ] Syncronize local directory with agent...
[build   5/19: actionDeleteDS] run build 'actionDeleteDS' on root@10.3.3.105
[build   3/19: gettingStarted] Syncronize local directory with agent...
[build   4/19: actionDelete  ] run build 'actionDelete' on root@10.3.3.104
[build   4/19: actionDelete  ] Syncronize local directory with agent...
[build   5/19: actionDeleteDS] Syncronize local directory with agent...
[build   6/19: actionEdit    ] Sencha Cmd v6.0.2.14
[build   5/19: actionDeleteDS] Sencha Cmd v6.0.2.14
```

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

Simple diagrams what is happening under hood:

```
Install agent:
    copy ssh key --> ssh --> apt-get install --> install sencha cmd --> initial rsync

Build application:
    rsync --> sencha app build --> rsync
```

## Conclusion

We have 6 build-agents and now build takes about __6 minutes instead of 20 minutes__ for 18 applications.
It is not bad.

Feel free to ask me any questions.
