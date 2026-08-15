---
title: Funny pieces of code
date: 2024-03-25 12:00:00 +00:00
tags: [code]
description: A collection of funny pieces of code collected from my practice
---

# Introduction

## Disclaimer

These examples are not intended to offend or humiliate anyone. 
Some of the examples belong to me, others belong to people with whom I worked. 
Treat this as a post of irony.

### Even more serializers

During the development of the application, such incidents happen:
```python
def get_serializer_class(self):
    if self.action == 'list':
        return TeamSerializer
    elif self.action == 'retrieve':
        return TeamSerializer
    elif self.action == 'create':
        return TeamSerializer
```

### Security is our everything

Safety is very important, but sometimes it's so easy to forget about it:
```python
def make_url_by_contract(self, contract_name: str) -> str:
    scheme = 'https' if settings.TAPI_USE_SSL else 'http'
    return f'{schema}://{settings.TAPI_HOST}/call/{contract_name}'
```

### Maybe in a parallel universe

We are very lucky that in our universe there is no such number that is less than zero and greater than 7:
```python
def get_short_description(text) -> str:
    words = text.split()

    return words[:7] if 0 > len(words) > 7 else text
```
