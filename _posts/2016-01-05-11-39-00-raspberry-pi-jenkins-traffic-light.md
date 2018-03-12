{
    "title": "Make Raspberry Pi Jenkins traffic light",
    "image": "/images/posts/3-make-raspberry-pi-jenkins-traffic-light/traffic-light-demo.gif",
    "imagePreview": "/images/posts/3-make-raspberry-pi-jenkins-traffic-light/light-before-close-500.png",
    "metaDescription": "raspberry pi, traffic light, leds, nodejs",
    "tags": "raspberry pi,traffic light,leds,nodejs,js",
    "date": "2016-01-05"
}

<!-- preview -->

It is the simple instruction for javascript developers how to make physical Jenkins traffic light.
This device can be good first experience with the Raspberry Pi and it is useful for controlling your build's health!

<!-- /preview -->

## Hardware

![Hardware](/images/posts/3-make-raspberry-pi-jenkins-traffic-light/parts-unpackage.jpg)

Necessary hardware:
- Raspberry Pi with AC and flash-card (x1)
- USB WiFi for Raspberry Pi (for wireless usage)
- Traffic light toy (x1)
- White or color LEDs (x27)
- Resistors (x3 or x27)
- Circuit boards
- Wires.

Raspberry Pi has digital outputs used for turn on lights, motors, or something else.
Outputs are realised as GPIO (General Purpose Input/Output) connection pins header.
I used only GPIO pins power, so they were limited only in 3v3.
But this solution does not require additional transistors or power source.
Raspberry Pi 2 has 40-pins header, arranged by 20 pins in 2 lines.

<center>
![Rasbperry Pi 2 pins schema](/images/posts/3-make-raspberry-pi-jenkins-traffic-light/rpi-pins-schema.png)
</center>

The GPIO has 17 pins in total.
For more information see [here](http://elinux.org/RPi_Low-level_peripherals).

I used these pins: __15__ -- red color, __11__ -- yellow color, __7__ -- green, __39__ -- ground.

Connection schema:
<center>
![Simple connection schema](/images/posts/3-make-raspberry-pi-jenkins-traffic-light/schema-simple.png)
</center>

But it not good idea to use pins voltage for turning on leds.
Better solution should turn on leds with _0_ level on pin, so connection should be like:

```
GPIO pin (3v3 or 0v) --- resistor --- led --- 3v3 pin
```

If you feel more power use this schema (thanks Nikolay!):
<center>
![Advanced connection schema](/images/posts/3-make-raspberry-pi-jenkins-traffic-light/schema-advanced.png)
</center>

List of available pins is [here](http://elinux.org/RPi_BCM2835_GPIOs).

After some time I got the first prototype:
![first prototype](/images/posts/3-make-raspberry-pi-jenkins-traffic-light/check-prototype-1.jpg)

It worked properly, but was not bright enough.
After consultation with my brother I ordered new 3v3 brighter leds with clear white plastic lens: 
![new brighter leds](/images/posts/3-make-raspberry-pi-jenkins-traffic-light/new-leds-pack.jpg)

They does not look excellent but much better than colored.
And more important they have identical bright level unlike colored, because my color leds use different voltage.

I tried mount leds on the part of layout board, but it looks weird and was not symmetric:
![Layout board](/images/posts/3-make-raspberry-pi-jenkins-traffic-light/layout-board.jpg)

So, I bought an electronic circuit board and cut it for appropriate size for my traffic light:
![Cut curcuit boards](/images/posts/3-make-raspberry-pi-jenkins-traffic-light/cut-circuit-boards.jpg)

After 2 evenings and fun experiments with a soldering iron I got this:
![Curcuit boards with wires](/images/posts/3-make-raspberry-pi-jenkins-traffic-light/boards-with-wires.jpg)

And the final version under hood:
![Mounted board](/images/posts/3-make-raspberry-pi-jenkins-traffic-light/mounted-board.jpg)

After testing I improved color depth by using colored films: 
![](/images/posts/3-make-raspberry-pi-jenkins-traffic-light/add-films.jpg)

Ok, it is fit:
![](/images/posts/3-make-raspberry-pi-jenkins-traffic-light/light-before-close.jpg)


## Software

I used _Node.js v5_ and my own module:
[https://github.com/antonfisher/rpi-jenkins-light](https://github.com/antonfisher/rpi-jenkins-light).
But first of all [install Raspberrian](/posts/2015/12/04/how-to-find-raspberry-pi-ip-address-dhcp/).

### NodeJs v5 installation
* SSH to _Raspberry Pi_
* `$ sudo su` (need for install _Node.js_)
* Install _Node.js_: `$ curl -sL https://deb.nodesource.com/setup_5.x | sudo -E bash -`
* Run `$ apt-get install nodejs`.

### Installation Jenkins Light Module
* SSH to _Raspberry Pi_
* `$ sudo su` (need for install GPIO module)
* From _GitHub_ sources:
    * Clone repository: `$ git clone https://github.com/antonfisher/rpi-jenkins-light.git`
    * `$ cd rpi-jenkins-light`
    * Install dependencies: `$ npm install`
* From _NPM_:
    * `$ npm install rpi-jenkins-light`.

### Configure
Edit `$ vim configs/config.js` file:

``` javascript
module.exports = {
    rpi: {                          // Raspberry Pi sub-config
        gpio: {                     // GPIO [General Purpose Input Output] config
            color: {
                red: 15,            // pin # for red color
                yellow: 11,         // pin # for yellow color
                green: 7            // pin # for green color
            },
            outputLevel: {
                on: true,  // 3v3   // led turn on output level
                off: false // 0v    // led turn off output level
            }
        }
    },
    jenkins: {                      // Jenkins sub-config
        interval: 5 * 1000,         // requests interval
        host: '10.0.0.1',
        port: '8080',
        view: 'JenkinsLight',       // http://localhost:8080/view/%VIEW_NAME%/
        demoMode: true              // demo turn on red-yellow-green lights
    }
};
```

### Configure Jenkins
* Open _Jenkins_ main page
* Create new list view called `JenkinsLight`
* Add monitored tasks to this view.

![Jenkins View](/images/posts/3-make-raspberry-pi-jenkins-traffic-light/create-jenkins-view.png)

The colors indicate (by priority):
* Blinks yellow -- at least one build is running
* Red -- at least one build is failed
* Green -- all builds are OK.

### Run
* `$ sudo su` (need for GPIO module)
* From _GitHub_ sources:
    * `$ node run.js`
* From _NPM_:
    * `$ node ./node_modules/rpi-jenkins-light/run.js`.

### Autorun application after reboot
* `$ sudo su` (need for global modules)
* `$ npm install pm2 -g`
* `$ pm2 startup`
* `$ pm2 start run.js`
* `$ pm2 save`.

Thanks for reading!