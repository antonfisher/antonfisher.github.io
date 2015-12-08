{
    "title": "How to find Raspberry Pi IP address (DHCP)",
    "image": "https://dl.dropboxusercontent.com/s/xjuflro0gilf6gm/2015-12-06-12-41-00-how-to-find-raspberry-pi-ip-address.jpeg",
    "imagePreview": "https://dl.dropboxusercontent.com/s/pda5ooao85jsh6k/2015-12-06-12-41-00-how-to-find-raspberry-pi-ip-address-300.jpeg",
    "date": "2015-12-04"
}

<!-- preview -->

I got my first Raspberry Pi.

But I do not have a display and a keyboard which make OS installation process simple.
After some search, I found
[solution](http://raspberrypi.stackexchange.com/questions/15192/installing-raspbian-from-noobs-without-display)
which uses preconfigured SD card using a laptop. Used _NOOBS v1.5.0_ with changed _recovery.cmdline_ file.

<!-- /preview -->


Before:

``` bash
runinstaller quiet ramdisk_size=32768 root=/dev/ram0 init=/init vt.cur_default=1 elevator=deadline
```

After:

``` bash
runinstaller quiet ramdisk_size=32768 root=/dev/ram0 init=/init vt.cur_default=1 elevator=deadline silentinstall
```

I put card to Raspberry and power it.
It takes about 10-15 minutes to complete installation.
But I still could not connect to it, because I did not know its IP address.

First of all you need to know range of your router's DHCP addresses.
In common case they will be _192.168.1.[0-255]_ or _10.0.0.[0-255]_.
Using _ifconfig_ give me laptop IP address: _10.0.0.172_ on wlan0 interface.
It means my router uses _10.0.0.[0-255]_ range (_10.0.0.0/24_).

My first solution was simple _ping_ all addresses in this subnetwork (oneliner in bash):
 
``` bash
$ for i in {1..255}; do ping -w 1 10.0.0."${i}">/dev/null; if [[ "${?}" == 0 ]] ; then echo "10.0.0.${i}"; fi; done; echo "end";
```

It works, but you need to try _ssh_ connect to all results to identify Raspberry Pi
(by the way, default user/password will be: _pi_/_raspberry_).
I run it during installation and did not care about performance.

Result:
``` bash
10.0.0.1
10.0.0.151 <--- PI!
10.0.0.172 <--- me
10.0.0.228
Do you want to ping broadcast? Then -b
end
```

When new address appears here I used it.
It was Raspberry, but it was very slow...

The right solution is:

``` bash
$ nmap -sn 10.0.0.0/24

Starting Nmap 6.40 ( http://nmap.org ) at 2015-12-06 01:31 PST
Nmap scan report for 10.0.0.1
Host is up (0.0080s latency).
Nmap scan report for 10.0.0.151 <--- PI!
Host is up (0.095s latency).
Nmap scan report for 10.0.0.172 <--- me
Host is up (0.00010s latency).
Nmap scan report for 10.0.0.228
Host is up (0.040s latency).
Nmap done: 256 IP addresses (4 hosts up) scanned in 3.33 seconds
```

Result presents only available IP addresses without OS type, but it takes only **3.33** seconds!

``` bash
$ ssh -Ct pi@10.0.0.151
pi@10.0.0.151's password: 

The programs included with the Debian GNU/Linux system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Debian GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent
permitted by applicable law.
Last login: Sat Dec  5 11:17:11 2015
pi@raspberrypi:~ $
```

How official blog advises how to do see here:
[www.raspberrypi.org](https://www.raspberrypi.org/documentation/troubleshooting/hardware/networking/ip-address.md).

_Note: I use Ubuntu._
