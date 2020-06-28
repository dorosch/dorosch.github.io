---
layout: post
title:  "From inside cpython - part 1"
date:   2020-06-09 09:00:00 +0300
categories: c python
---

And so, you decided to understand how python works, but where to start?

First of all, you need to get the latest version of the interpreter source code:

```bash
$ git clone https://github.com/python/cpython
```

Next, you can use the assembly instructions:

```
https://devguide.python.org/setup/
```

But let's see how exactly this process happens. First you need to configure
the assembly file for our system. The configuration flags are available to us:

```
cpython $ ./configure --help
```

You can find some interesting flags, for example:

```
--enable-shared            enable building a shared Python library
--enable-profiling         enable C-level code profiling with gprof
--enable-optimizations     enable expensive, stable optimizations (PGO, etc.)
--with-pydebug             build with Py_DEBUG defined
--with-trace-refs          enable tracing references for debugging purpose
--with-assertions          build with C assertions enabled
--with-cxx-main[=COMPILER] compile main() and link Python executable with C++
compiler specified in COMPILER
```

Let's configure our build file:

```bash
cpython $ ./configure --enable-profiling --enable-optimizations --with-pydebug
```

When the assembly file is being configured, we are warned that the default
compiler `g++` is used, this can be overridden with flag `--with-cxx-main=gcc`.

Also, after compiler assembly, if you need to install it on the machine,
command `make install` which will install it by default in directory
`/usr/local/`. This can also be redefined when configuring `--prefix=YOUR_DIR`.

The configuration was successful and as a result `Makefile` was created. If you
have any configuration errors, you can see a detailed configuration log
`config.log`.

```bash
cpython $ make -j $(nproc --all)
...
Python build finished successfully!
```

If after assembly you had a message:

```
Failed to build these modules:
_ctypes
```

Then you need to install 'libffi' library:

```bash
cpython $ sudo apt-get install libffi-dev
```

To be sure that everything is going to run correctly, run the tests:

```bash
cpython $ make test
```

Check the interpreter assembly:

```bash
cpython $ ./python --version
Python 3.10.0a0
```
