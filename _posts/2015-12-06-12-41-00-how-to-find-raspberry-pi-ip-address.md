{
    "title": "How to find Raspberry Pi IP address (DHCP)",
    "image": "/images/posts/1-how-to-find-raspberry-pi-ip-address/raspberry-pi.png",
    "imagePreview": "/images/posts/1-how-to-find-raspberry-pi-ip-address/raspberry-pi-500.png",
    "metaDescription": "raspberry pi, ip address, bash, nmap",
    "tags": "raspberry pi,ip address,bash,nmap",
    "date": "2015-12-04"
}

<!-- preview -->

I got my first Raspberry Pi.

I do not have a display and a keyboard that make OS installation process simple.
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

I put card to Raspberry and powered it on.
It took about 10-15 minutes to complete installation,
but I still could not connect to it, because I did not know its IP address.

First of all you need to know range of your router's DHCP addresses.
In common case they will be _192.168.1.[0-255]_ or _10.0.0.[0-255]_.
Using _ifconfig_ give me laptop IP address: _10.0.0.172_ on wlan0 interface.
It means my router uses _10.0.0.[0-255]_ range (_10.0.0.0/24_).

My first solution was simple _ping_ all addresses in this subnetwork (one-liner in bash):
 
``` bash
$ for i in {1..254}; do ping -w 1 10.0.0."${i}">/dev/null; if [[ "${?}" == 0 ]] ; then echo "10.0.0.${i}"; fi; done; echo "end";
```

It works, but you need to try _ssh_ connect to all results to identify Raspberry Pi
(by the way, default user/password will be: _pi / raspberry_).
I run it during installation and did not care about performance.

Result:
``` bash
10.0.0.1
10.0.0.151 <--- PI!
10.0.0.172 <--- me
10.0.0.228
end
```

When new address appeared here I used it.
It was Raspberry, but it was very slow...

The __right solution__ is using _nmap_ and 22 port only:

``` bash
$ nmap -sV -p 22 10.0.0.0/24

Starting Nmap 6.40 ( http://nmap.org ) at 2015-12-13 16:11 PST

...

Nmap scan report for 10.0.0.151
Host is up (0.063s latency).
PORT   STATE SERVICE VERSION
22/tcp open  ssh     (protocol 2.0)
1 service unrecognized despite returning data. If you know the service/version, please submit the following fingerprint at http://www.insecure.org/cgi-bin/servicefp-submit.cgi :
SF-Port22-TCP:V=6.40%I=7%D=12/13%Time=566E0957%P=x86_64-pc-linux-gnu%r(NUL
SF:L,22,"SSH-2\.0-OpenSSH_6\.7p1\x20Raspbian-5\r\n"); <--- PI!

...

Service detection performed. Please report any incorrect results at http://nmap.org/submit/ .
Nmap done: 256 IP addresses (4 hosts up) scanned in 9.58 seconds
```

Result presents only available IP addresses without OS type, but it takes only **9.58** seconds!

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

Now official blog explains, how to do this:
[www.raspberrypi.org](https://www.raspberrypi.org/documentation/troubleshooting/hardware/networking/ip-address.md).

_Note: I use Ubuntu._
