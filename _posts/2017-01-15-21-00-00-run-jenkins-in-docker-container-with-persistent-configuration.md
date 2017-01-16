{
    "title": "Run Jenkins in Docker container with persistent configuration",
    "image": "/images/posts/8-run-jenkins-in-docker-container-with-persistent-configuration/run-jenkins-in-docker-container-with-persistent-configuration-logo.png",
    "imagePreview": "/images/posts/8-run-jenkins-in-docker-container-with-persistent-configuration/run-jenkins-in-docker-container-with-persistent-configuration-logo-300.png",
    "metaDescription": "jenkins, docker, jenkins in docker container",
    "tags": "jenkins,docker,github",
    "date": "2017-01-15"
}

<!-- preview -->

One day you realise that your lost both disk in the RAID mirror and your _Jenkins_ is done forever.
And you will be happy, finally you get a chance to build new robust _Jenkins_ architecture!

This post is about _Jenkins_ + _Docker_ + storing _Jenkins_ configuration on the _Github_. 

<!-- /preview -->

_Jenkins_ can be easily running in the _Docker_ container.
There are two typies of persistens data it has:
- _Jenkins_ configuration (includes tasks)
- Tasks artifacts, or build results.

Always developerts takes care about build results, product versioning, but forgets about configutation of used _CI_.
Jenins has introdused pipeline mechanism which allows developer to store build tasks configuration
in the same repository as applications code. 

What to do with common Jenkins configuration?
One of the way is to store it in the Git repository.
In this case we just need to start pre-configured Jenkins container on new setup,
Jenkins will pull configuration from Git repository,
and then be ready to start builds.

Here above is the instruction how to get Jenkins in the Docker container,
with configuration in Github. 

## Project structure

Simple way to get boilerplates for all files described in the post is to clone my repository:
```bash
$ git@github.com:antonfisher/jenkins-in-docker.git
$ cd jenkins-in-docker
```

Steps to get all working:
- generate RSA keys
- build Jenkins master image
- build Jenkins agent image
- run Jenkins
- configure tasks.

## Generate keys for Jenkins configuration and aplication repositories 

Move to keys folder:
```bash
$ cd keys
```

Now let's generate RSA keys for Jenkins master image.
([https://help.github.com/articles/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent/#generating-a-new-ssh-key](how to generate key)).

The first file is `jenkins.config.id_rsa`, this one will be used to access to Jenkins configuration on Guthub:  
```bash
$ ssh-keygen -t rsa -b 4096 -C "a.fschr@gmail.com"
Generating public/private rsa key pair.
Enter file in which to save the key (/home/af/.ssh/id_rsa): jenkins.config.id_rsa
```

Then create git repository for Jenkins configuration, in my case it was `my-jenkins-config`.
Add created key to GutHub (GitHub repository --> Settigns --> Keys) with write access:
<center>
![Add RSA key to Jenkins config Guthub repository](/images/posts/8-run-jenkins-in-docker-container-with-persistent-configuration/add-key-to-github.png)
</center>

The second file is `jenkins.application.id_rsa`, this one will be used to pull your applications to Jenkins from Guthub:  
```bash
$ ssh-keygen -t rsa -b 4096 -C "a.fschr@gmail.com"
Generating public/private rsa key pair.
Enter file in which to save the key (/home/af/.ssh/id_rsa): jenkins.application.id_rsa
```
Add this key to your application repository keys (GitHub repository --> Settings --> Keys).

Now we shuold have these files in `keys` folder:
```bash
$ ls -l
total 16
-rw------- 1 af af 3243 Jan 15 18:39 jenkins.application.id_rsa
-rw-r--r-- 1 af af  743 Jan 15 18:39 jenkins.application.id_rsa.pub
-rw------- 1 af af 3243 Jan 15 18:33 jenkins.config.id_rsa
-rw-r--r-- 1 af af  743 Jan 15 18:33 jenkins.config.id_rsa.pub
```

## Prepare Jenkins master Dockerfile

```dockerfile
FROM
```

Jenkins plugins are listed in the file:
- `scm-sync-configuration:0.0.10` -- to store Jenkins config in git
- `workflow-aggregator:2.4` -- to enable Jenkins pipelines (tasks)
- `docker-workflow:1.9` -- to run Docker agents.

Now we are ready to build Jenkins master container, there is ther script to do this.
The script just copies RSA keys to `images/master/keys` folder to use them during build (Docker restritions).

```bash
$ cd images/master
$ bin/image-build.sh
```

New Docker image should appear here:

 ```bash
$ docker images
REPOSITORY             TAG            IMAGE ID             CREATED               SIZE
jenkins-master         latest         a8f0c50f9ff6         2 minutes ago         719.3 MB
```

### Run Jenkins

```bash
$ cd images/master
$ bin/container-run.sh
```

During first startup Jenkins requires initial setup, and there is temporary password in the console output:
  
```bash
...
Jenkins initial setup is required. An admin user has been created and a password generated.
Please use the following password to proceed to installation:

805cd12be95149e4b275fd71f6f0fcf1
...
```

Just copy the password and open (http://localhost:8080)[http://localhost:8080] in the browser.

<center>
![Jenkins after start](/images/posts/8-run-jenkins-in-docker-container-with-persistent-configuration/jenkins-after-start.png)
</center>

Don't install plugins on installation wizard! Just spit this step.
After that open Jenkins settings to configure syncronisation with GitHub:
(http://localhost:8080/configure)[http://localhost:8080/configure] --> Configure System.
There edit 'SCM Sync configuration' section:

<center>
![SCM Sync configuration](/images/posts/8-run-jenkins-in-docker-container-with-persistent-configuration/github-sync-configuration.png)
</center>

I add these files to 'Manual synchronization includes' option be synced too:
- org.jenkinsci.plugins.workflow.flow.FlowExecutionList.xml
- com.nirima.jenkins.plugins.docker.DockerPluginConfiguration.xml
- nodes/*/config.xml
- jobs/**/nextBuildNumber
- secrets/jenkins.slaves.JnlpSlaveAgentProtocol.secret
- secrets/master.key (be sure you don't use public repository like me :)

After pressing 'Save' button, new comments should appear in config repository on GitHub:  

<center>
![GitHub sync commits](/images/posts/8-run-jenkins-in-docker-container-with-persistent-configuration/github-commits.png)
</center>

And let's create first task to check synhroization and how it wokrs after restart Jenkins.
<center>
![Jenkins create new task](/images/posts/8-run-jenkins-in-docker-container-with-persistent-configuration/jenkins-create-new-task.png)
</center>

Now is time to simulate disaster, let's imagin we lost host with containsers.
To simulate this just stop container and remove image:
```bash
$ docker stop jenkins-master
$ docker rm -f jenkins-master
$ docker rmi -f jenkins-master
```

Just update (http://localhost:8080/)[http://localhost:8080/] -- nothing is running.

Let's build image from scratch and run it again:

```bash
$ cd images/master
$ ./bin/image-build.sh
$ ./bin/container-run.sh
```

And now open (http://localhost:8080/)[http://localhost:8080/],
there is our pre-configured Jenkins, no installation needed:
<center>
![Jenkins works after restart](/images/posts/8-run-jenkins-in-docker-container-with-persistent-configuration/jenkins-works-after-restart.png)
</center>

The same algoritm can be used for update Jenkins or its plugins.

## Prepare Jenkins Agent Dockerfile
 
In my case agent `Dockerfile` is based on _Ubuntu_ 16.04:

```dockerfile
FROM
```

## Configure Jenkins tasks to use container-based agents

Jenkins team anonced Pipelines, it is a great way to store configurations in the code.
You need to create `Jenkinsfile` in your project repository and then config jeknis to store it:

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
                            "backup@1.1.1.1:/NSVP";
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

There is how it may look in Jenkins (other task):

<center>
![Jenkins pipelines demo](/images/posts/8-run-jenkins-in-docker-container-with-persistent-configuration/jenkins-pipelines-demo.png)
</center>

## Links

- Google Icons:
[https://design.google.com/icons/](https://design.google.com/icons/)
- Good article about using _SVG_ icons:
[https://css-tricks.com/svg-sprites-use-better-icon-fonts/](https://css-tricks.com/svg-sprites-use-better-icon-fonts/).

- https://hub.docker.com/_/jenkins/
- https://wiki.jenkins-ci.org/display/JENKINS/SCM+Sync+configuration+plugin
- https://wiki.jenkins-ci.org/display/JENKINS/Pipeline+Plugin
- https://wiki.jenkins-ci.org/display/JENKINS/CloudBees+Docker+Pipeline+Plugin



Thanks for reading. I will glad to get any feedback!
