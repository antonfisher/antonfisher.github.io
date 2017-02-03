{
    "title": "Run Jenkins in Docker container with persistent configuration",
    "image": "/images/posts/8-run-jenkins-in-docker-container-with-persistent-configuration/run-jenkins-in-docker-container-with-persistent-configuration-logo.png",
    "imagePreview": "/images/posts/8-run-jenkins-in-docker-container-with-persistent-configuration/run-jenkins-in-docker-container-with-persistent-configuration-logo-300.png",
    "metaDescription": "jenkins, docker, jenkins in docker container",
    "tags": "jenkins,docker,github",
    "date": "2017-01-16"
}

<!-- preview -->

One day you realised that you lost both disks in the _RAID_ mirror and your _Jenkins_ has gone forever.
And it is a good chance to build new robust _Jenkins_ architecture!

This post is about _Jenkins_, _Docker_ and storing _Jenkins_ configuration on the _GitHub_.

<!-- /preview -->

## Overview

_Jenkins_ can be easily run inside the _Docker_ container.
There are two types of persistent data that you do not want to lose here:
- _Jenkins_ configuration (includes tasks)
- task artifacts or build results.

Usually developers/devops take care about build results,
from other hand they often forget about _CI_ system configuration.
_Jenkins_ team has introduced a _pipeline_ mechanism that allows developer to store a task
configuration directly in the application code (using `Jenkinsfile`).
This helps to reduce amount of things that are stored on _Jenkins_ side.
Allows change build configs directly in the code, as plus you get configuration versioning.

What to do with the remaining _Jenkins_ configuration?
One of ways is to store it in the _SCM_ repository.
In this case we just need to start a pre-configured _Jenkins_ container on a new setup,
Jenkins pulls configuration from repository, and then becomes ready to run its tasks.

Below there is the instructon how to get _Jenkins_ in the _Docker_ container with persistent configuration on _GitHub_.

## Project structure

The simple way to get boilerplates of all files described in the post is to clone
[jenkins-in-docker](https://github.com/antonfisher/jenkins-in-docker) repository.
The repotisory contains `Dockerfiles` for master and agent _Jenkins_ images:
```bash
$ git@github.com:antonfisher/jenkins-in-docker.git
$ cd jenkins-in-docker
```

Steps to get all working:
- generate _RSA_ keys for _GitHub_
- build _Jenkins_ master image
- build _Jenkins_ agent image
- run _Jenkins_ in a container
- configure tasks.

## Generate RSA keys

One key is for _Jenkins_ configuration repository, another one for your application repository.
Go to `keys` folder:

```bash
$ cd keys
```

Now let's generate _RSA_ keys for _Jenkins_ master image.
The first file is `jenkins.config.id_rsa`,
this one will be used to access to _Jenkins_ configuration on _GitHub_:

```bash
$ ssh-keygen -t rsa -b 4096 -C "my@gmail.com"
Generating public/private rsa key pair.
Enter file in which to save the key (/home/af/.ssh/id_rsa): jenkins.config.id_rsa
```

Then create git repository for _Jenkins_ configuration on _GitHub_, in my case it is called `my-jenkins-config`.
Add created key to _GitHub_ (_repository → Settings → Keys_) with write access (!):
<center>
![Add RSA key to Jenkins config GitHub repository](/images/posts/8-run-jenkins-in-docker-container-with-persistent-configuration/add-key-to-github.png)
</center>

The second file is `jenkins.application.id_rsa`,
this one will be used to pull your application code by _Jenkins_ master container from _GitHub_:

```bash
$ ssh-keygen -t rsa -b 4096 -C "my@gmail.com"
Generating public/private rsa key pair.
Enter file in which to save the key (/home/af/.ssh/id_rsa): jenkins.application.id_rsa
```

Add this key to your application repository (_repository → Settings → Keys_).

We should have these files in the `keys` folder:

```bash
$ ls -l
total 16
-rw------- 1 af af 3243 Jan 15 18:39 jenkins.application.id_rsa
-rw-r--r-- 1 af af  743 Jan 15 18:39 jenkins.application.id_rsa.pub
-rw------- 1 af af 3243 Jan 15 18:33 jenkins.config.id_rsa
-rw-r--r-- 1 af af  743 Jan 15 18:33 jenkins.config.id_rsa.pub
```

## Prepare Jenkins master Dockerfile

I used this configuration:

```dockerfile
FROM jenkins:2.32.1
MAINTAINER Anton Fisher <a.fschr@gmail.com>

# root user for Jenkins, need to get access to /var/run/docker.sock (fix this in the future!)
USER root

# Environment
ENV HOME /root
ENV JENKINS_HOME /root/jenkins
ENV JENKINS_VERSION 2.32.1

# GitHub repository to store _Jenkins_ configuration
ENV GITHUB_USERNAME antonfisher
ENV GITHUB_CONFIG_REPOSITORY my-jenkins-config

# Make _Jenkins_ home directory
RUN mkdir -p $JENKINS_HOME

# Install _Jenkins_ plugins
RUN /usr/local/bin/install-plugins.sh \
    scm-sync-configuration:0.0.10 \
    workflow-aggregator:2.4 \
    docker-workflow:1.8

# Set timezone
RUN echo "America/Los_Angeles" > /etc/timezone &&\
    dpkg-reconfigure --frontend noninteractive tzdata &&\
    date

# Copy RSA keys for _Jenkins_ config repository (default keys).
# This public key should be added to:
# https://github.com/%YOUR_JENKINS_CONFIG_REPOSITORY%/settings/keys
COPY keys/jenkins.config.id_rsa     $HOME/.ssh/id_rsa
COPY keys/jenkins.config.id_rsa.pub $HOME/.ssh/id_rsa.pub
RUN chmod 600 $HOME/.ssh/id_rsa &&\
    chmod 600 $HOME/.ssh/id_rsa.pub
RUN echo "    IdentityFile $HOME/.ssh/id_rsa" >> /etc/ssh/ssh_config &&\
    echo "    StrictHostKeyChecking no      " >> /etc/ssh/ssh_config
RUN /bin/bash -c "eval '$(ssh-agent -s)'; ssh-add $HOME/.ssh/id_rsa;"

# Copy RSA keys for your application repository and add
# host 'github.com-application-jenkins' for application code pulls.
# This public key should be added to
# https://github.com/%YOUR_APPLICATION_REPOSITORY%/settings/keys
COPY keys/jenkins.application.id_rsa     $HOME/.ssh/jenkins.application.id_rsa
COPY keys/jenkins.application.id_rsa.pub $HOME/.ssh/jenkins.application.id_rsa.pub
RUN chmod 600 $HOME/.ssh/jenkins.application.id_rsa &&\
    chmod 600 $HOME/.ssh/jenkins.application.id_rsa.pub
RUN touch $HOME/.ssh/config &&\
    echo "Host github.com-application-jenkins                     " >> $HOME/.ssh/config &&\
    echo "    HostName       github.com                           " >> $HOME/.ssh/config &&\
    echo "    User           git                                  " >> $HOME/.ssh/config &&\
    echo "    IdentityFile   $HOME/.ssh/jenkins.application.id_rsa" >> $HOME/.ssh/config &&\
    echo "    IdentitiesOnly yes                                  " >> $HOME/.ssh/config

# Configure git
RUN git config --global user.email "jenkins@container" &&\
    git config --global user.name  "jenkins"

# Clone _Jenkins_ config
RUN cd /tmp &&\
    git clone git@github.com:$GITHUB_USERNAME/$GITHUB_CONFIG_REPOSITORY.git &&\
    cp -r $GITHUB_CONFIG_REPOSITORY/. $JENKINS_HOME &&\
    rm -r /tmp/$GITHUB_CONFIG_REPOSITORY

# _Jenkins_ workspace for sharing between containers
VOLUME $JENKINS_HOME/workspace

# Run init.sh script after container start
COPY src/init.sh /usr/local/bin/init.sh
ENTRYPOINT ["/bin/tini", "--", "/usr/local/bin/init.sh"]
```

Jenkins plugins are listed in the `Dockerfile`:
- `scm-sync-configuration:0.0.10` -- to store _Jenkins_ configuration in any _SCM_
    ([link](https://wiki.jenkins-ci.org/display/JENKINS/SCM+Sync+configuration+plugin))
- `workflow-aggregator:2.4` -- to enable _Jenkins_ pipelines, task configuration
    ([link](https://wiki.jenkins-ci.org/display/JENKINS/Pipeline+Plugin))
- `docker-workflow:1.9` -- to run _Jenkins_ agents in _Docker_ containers
    ([link](https://wiki.jenkins-ci.org/display/JENKINS/CloudBees+Docker+Pipeline+Plugin)).

If you need some other plugins, here is the right place to add them.

We are ready to build _Jenkins_ master container, there is a script to do this.
The script just copies _RSA_ keys to `images/master/keys`
folder to use them during the build (this is Docker restrictions).

```bash
$ cd images/master
$ bin/image-build.sh
```

New _Docker_ image will appear here:

 ```bash
$ docker images
REPOSITORY             TAG            IMAGE ID             CREATED               SIZE
jenkins-master         latest         a8f0c50f9ff6         2 minutes ago         719.3 MB
```

### Run Jenkins

There is a script to run Jenkins:

```bash
$ cd images/master
$ bin/container-run.sh
```

During the first startup _Jenkins_ requires initial setup, it provides temporary password in a console output:

```bash
...
Jenkins initial setup is required. An admin user has been created and a password generated.
Please use the following password to proceed to installation:

805cd12be95149e4b275fd71f6f0fcf1
...
```

Just copy the password and open [http://localhost:8080](http://localhost:8080) in the browser.

<center>
![Jenkins right after start](/images/posts/8-run-jenkins-in-docker-container-with-persistent-configuration/jenkins-after-start.png)
</center>

Go through installation but do NOT install any plugins in _Jenkins_ installation wizard! Just skip this step.
After that open _Jenkins_ settings to configure synchronization with _GitHub_:
[http://localhost:8080/configure](http://localhost:8080/configure) → "_Configure System_".
There is my "_SCM Sync configuration_" section:

<center>
![SCM Sync configuration](/images/posts/8-run-jenkins-in-docker-container-with-persistent-configuration/github-sync-configuration.png)
</center>

After some experiments, I added these files to "_Manual synchronization includes_" to also be synced with _GitHub_:
- `org.jenkinsci.plugins.workflow.flow.FlowExecutionList.xml`
- `com.nirima.jenkins.plugins.docker.DockerPluginConfiguration.xml`
- `nodes/*/config.xml`
- `jobs/**/nextBuildNumber`
- `secrets/jenkins.slaves.JnlpSlaveAgentProtocol.secret`
- `secrets/master.key` (be sure you do not use public repository like me :)

After pressing the "_Save_" button, new commits appears in the configuration repository on _GitHub_:

<center>
![GitHub sync commits](/images/posts/8-run-jenkins-in-docker-container-with-persistent-configuration/github-commits.png)
</center>

### First task

Let's create the first task to check synchronization and if it works after _Jenkins_ restart.
<center>
![Jenkins create new task](/images/posts/8-run-jenkins-in-docker-container-with-persistent-configuration/jenkins-create-new-task.png)
</center>

### Disaster happens

Now is time to simulate disaster, let's imagine we lost the host with _Docker_ containers.
To simulate this just stop master container and remove its image:

```bash
$ docker stop jenkins-master
$ docker rm -f jenkins-master
$ docker rmi -f jenkins-master
```

To be sure do refresh [http://localhost:8080/](http://localhost:8080/) -- nothing is running.

Build image from scratch and run it again:

```bash
$ cd images/master
$ ./bin/image-build.sh
$ ./bin/container-run.sh
```

...open [http://localhost:8080/](http://localhost:8080/), and here is our pre-configured Jenkins,
no installation required:
<center>
![Jenkins works after restart](/images/posts/8-run-jenkins-in-docker-container-with-persistent-configuration/jenkins-works-after-restart.png)
</center>

The same workflow can be used for update _Jenkins_ or its plugins.

## Prepare Jenkins Agent Dockerfile

In my case it is plain agent that is based on _Ubuntu 16.04_, just do some image cleanup:

```dockerfile
FROM ubuntu:16.04
MAINTAINER Anton Fisher <a.fschr@gmail.com>

USER root

# Set timezone
RUN echo "America/Los_Angeles" > /etc/timezone &&\
    dpkg-reconfigure --frontend noninteractive tzdata &&\
    date

# Set locale
RUN locale-gen en_US.UTF-8
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL en_US.UTF-8

# Configure and update apt-get
ENV DEBIAN_FRONTEND "noninteractive"
RUN apt-get -q update &&\
    apt-get -q install -y -o Dpkg::Options::="--force-confnew" apt-utils &&\
    apt-get -q upgrade -y -o Dpkg::Options::="--force-confnew" --no-install-recommends

# Install dependencies
RUN apt-get -q install -y -o Dpkg::Options::="--force-confnew" \
    libltdl-dev \
    libltdl7 \
    sshpass \
    vim

# Clean-up apt-get
RUN apt-get -q autoremove &&\
    apt-get -q clean -y &&\
    rm -rf /var/lib/apt/lists/* &&\
    rm -f /var/cache/apt/*.bin

# Disable StrictHostKeyChecking for ssh
RUN echo "    StrictHostKeyChecking no" >> /etc/ssh/ssh_config

# staying online before force stop container
CMD ["tail", "-f", "/dev/null"]
```

## Configure Jenkins tasks to use container-based agents

As I said above, I use _pipelines_ to keep task configuration in the application code.
You need to create a `Jenkinsfile` in your applications repository and then setup _Jenkins_ to use it:

<center>
![Set Jenkinsfile in configuration](/images/posts/8-run-jenkins-in-docker-container-with-persistent-configuration/jenkins-config-jenkinsfile.png)
</center>

Let's see an example:
```groovy
node('master') {
    docker.withServer('unix:///var/run/docker.sock') {
        stage('Git clone') {
            git 'git@github.com-application-jenkins:antonfisher/node-mocha-extjs.git'
        }
        stage('Build') {
            docker
                .image('jenkins-agent-ubuntu')
                .inside('--volumes-from jenkins-master') {
                    sh "bash ./build.sh;"
                }
        }
        stage('Copy build results') {
            docker
                .image('jenkins-agent-ubuntu')
                .inside('--volumes-from jenkins-master') {
                    sh """
                        sshpass -plol scp \
                            "${WORKSPACE}/build/*.tar.gz" \
                            "backup@1.1.1.1:/buils";
                    """
                }
        }
        stage('UI unit tests') {
            docker
                .image('jenkins-agent-ubuntu')
                .inside('--volumes-from jenkins-master') {
                    sh """
                        cd ./tests;
                        bash ./run.sh;
                    """
                }
        }
    }
}
```

Steps:
- `node('master') {...}` -- use _Jenkins_ master to run task
- `docker.withServer('unix:///var/run/docker.sock') {...}` -- run agent containers on master's host
- `docker.image('jenkins-agent-ubuntu')` -- run "_jenkins-agent-ubuntu_" container
- `.inside('--volumes-from jenkins-master') {...}` -- use master's volume (to share source code)

See [docker in pipelines docs](https://go.cloudbees.com/docs/cloudbees-documentation/cje-user-guide/index.html#docker-workflow) for more information.

Here is how pipelines may look in Jenkins:

<center>
![Jenkins pipelines demo](/images/posts/8-run-jenkins-in-docker-container-with-persistent-configuration/jenkins-pipelines-demo.png)
</center>

## Conclusion

Here was my story of moving to containers, it is awesome technology, flexible and simple to start using.

Store all configs in SCM. Keep synced. Feel safe.

## Links

- [Repository with Jemkins master and agent Dockerfiles](https://github.com/antonfisher/jenkins-in-docker)
- [Jenkins containers](https://hub.docker.com/_/jenkins/)

Thanks for reading. I would be glad to get any feedback!
