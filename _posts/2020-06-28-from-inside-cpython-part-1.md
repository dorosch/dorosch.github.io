---
layout: post
title:  "From inside cpython - part 1"
date:   2020-06-09 09:00:00 +0300
categories: c python
---

## Introduction

And so, you decided to understand how python works, but where to start?


## Assembly

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

Then you need to install `libffi` library:

```bash
cpython $ sudo apt-get install libffi-dev
```

To be sure that everything is going to run correctly, run the tests:

```bash
cpython $ make test
...
Total duration: 10 min 25 sec
Tests result: SUCCESS
```

Check the interpreter assembly:

```bash
cpython $ ./python --version
Python 3.10.0a0
```


## Project structure

After successfully assembling the interpreter, let's understand the structure
of the project cpython. Three dots mean that the directory contains a number of
files or directories. I will not examine in detail directories `Mac`, `PC`,
`PCbuild`, `Programs` and `Tools` since they contain either platform-specific
implementations or scripts (which you can parse and study if you wish).

```
cpython/
    Doc/                - Source for the documentation (on reStructuredText)
        c-api/          - C-api extension documentation
        distutils/      - Package installation system documentation
        library/        - Standard library documentation
        ...

    Grammar/            - The grammar definition
        Grammar         - It's a place for changing grammar
        Tokens          - It's a place for adding new token types
        python.gram     - Parsing expression grammar definition

    Include/            - The header files
        cpython/        - Cpython external headers
        internal/       - Cpython internal headers
        ...

    Lib/                - Standard library modules (on Python)
        asyncio/        - Source code asyncio library
        ctypes/         - Source code ctypes library
        email/          - Source code email library
        ...

    Mac/                - OSX support files

    Misc/               - Various files
        NEWS.d/         - The place where you can see code changes and releases

    Modules/            - Standard library modules (on C)
        _ctypes/        - Source code ctype library
        _io/            - Source code io library
        ...

    Objects/            - Core python types and the object model (on C)
        clinic/         - Source code preprocessor for CPython C files
        stringlib/      - Source code implementation work with strings
        ...

    PC/                 - Windows build files

    PCbuild/            - Windows build files for older Windows

    Parser/             - The parser source code

    Programs/           - Source files for binary executables

    Python/             - The cpython interpreter source code (on C)
        clinic/         - Headers file of preprocessor for CPython C files
        ...

    Tools/              - Python programs that are useful while building Python
        i18n/           - Scripts for working with text internationalization
        ssl/            - Scripts for working with ssl
        ...
```

Not as difficult as it might seem, isn't it?

From the point view of studying the structure of the interpreter, list of
directories will be most interesting for us: `Grammar`, `Include`, `Lib`,
`Modules`, `Objects`, `Parser` and `Python`.
