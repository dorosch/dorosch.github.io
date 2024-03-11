# Photon Lockdown

## Challenge description

We've located the adversary's location and must now secure access to their Optical Network Terminal to disable their internet connection. Fortunately, we've obtained a copy of the device's firmware, which is suspected to contain hardcoded credentials. Can you extract the password from it?

## Solution

After downloading the task archive, we see the files inside:
```bash
$ ls -l
total 10688
-rw-r--r-- 1 user user        6 Oct 11 13:39 fwu_ver
-rw-r--r-- 1 user user        3 Oct 11 13:39 hw_ver
-rw-r--r-- 1 user user 10936320 Oct  1 10:02 rootfs

$ file rootfs 
rootfs: Squashfs filesystem, little endian, version 4.0, zlib compressed, 10936182 bytes, 910 inodes, blocksize: 131072 bytes, created: Sun Oct  1 07:02:43 2023
```

Let's mount the file system:
```bash
$ sudo mount rootfs /mnt
```

First we need to inspect the user directories:
```bash
/mnt$ tree -a home/
home/
└── .41fr3d0
    └── s.txt

1 directory, 1 file

/mnt$ cat home/.41fr3d0/s.txt
almost there
```

Almost, but no. Let's try to look for mentions of the user in the files:
```bash
/mnt$ grep -rn '.41fr3d0' .
./etc/version_info:2:Working Copy Root Path: /home/41fr3d0/9607C/290_CKD/sdk
./etc/version_info:7:Last Changed Author:41fr3d0 
```

There is nothing interesting in this file, however only two files in etc were changed almost in the same time:
```bash
/mnt$ ls -l etc/
total 149
...
-rwxrwxr-x 1 root root 50538 Oct  1 09:48 config_default.xml
...
-rw-rw-r-- 1 root root   659 Oct  1 09:42 version_info
```

And in file `config_default.xml` we find our flag:
```bash
/mnt$ cat etc/config_default.xml`
...
<Value Name="SUSER_PASSWORD" Value="HTB{*****************}"/>
...
```

There was also a hint in the task: "Can you extract the `password` from it?". And if you search for the password right away, the flag will be found faster:
```bash
/mnt$ grep -rn 'password' .
...
# Out file with the flag
./etc/config_default.xml:253:<Value Name="CWMP_ACS_PASSWORD" Value="password"/>
```
