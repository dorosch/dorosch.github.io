---
title: Eat, Pray, Terraform - AWS to GCP Migration
date: 2026-09-13 12:00:00 +00:00
tags: [terraform, aws, gcp]
description: Migrate terraform infrastructure from AWS to GCP
---

# Eat, Pray, Terraform: AWS to GCP Migration

## Motivation

I’ve used `AWS` as my primary cloud provider for over 8 years. I used to 
recommend it to all my clients whenever they needed a simple and reliable 
solution. But ever since `AI` came into our lives, `AWS` decided it’s a 
brilliant idea to shove it everywhere [^1] [^2] [^3] [^4] [^5].

The `AWS Console` has gotten noticeably worse - you often have to wait 5 to 10 
seconds just for basic service pages to load. Instead of getting actual 
support, you're forced to deal with an unhelpful `AI` chatbot with no quick way 
to reach an actual human [^6]. And, of course, prices keep going up [^7].

After years of sticking with `AWS`, I finally took the plunge and migrated to 
`GCP` (and let’s be honest, `Azure` was never an option - I’m just a hater of 
`Microsoft` products).

I won't turn this post into an architectural debate or a deep dive into `GCP’s` 
feature set. Instead, I want to keep things strictly practical: this is a 
simple guide on how to migrate your `Terraform` resources from `AWS` to `GCP`.

Just to be clear: this isn't a sponsored post, and I’m definitely not a `GCP` 
fanboy. Google Cloud has its own fair share of flaws, weird quirks, and 
questionable decisions. I don't think it's a perfect provider by any means - 
it’s simply turned out to be the lesser of two evils for me right now.

### Prerequisites

Before we start refactoring `Terraform` code, make sure your local setup is 
ready to talk to Google Cloud. Nothing exotic here - just the standard tooling:

* [terraform][1]
* [gcloud][2]

Run gcloud init to initialize the `gcloud` CLI:

```shell
gcloud init
```

Terraform must authenticate to Google Cloud to create infrastructure:
```shell
gcloud auth application-default login
```

You can also find useful information in the official guides; I recommend 
checking them out:

* [HashiCorp's GCP Getting Started][3]
* [Google's Terraform documentation][4]

## Networking

The biggest mental leap when moving from `AWS` to GCP is that AWS VPCs are 
regional, while `GCP` _VPCs_ are global by default.

---

## References

[^1]: [Revealing the Cascading Impacts of the AWS Outage](https://www.ookla.com/articles/aws-outage-q4-2025)
[^2]: [54 Internet Outage Statistics (2026)](https://www.demandsage.com/internet-outage-statistics/)
[^3]: [That Massive AWS Outage Explained](https://www.cnet.com/tech/services-and-software/amazon-web-services-outage-october-20-2025/)
[^4]: [Amazon Reviews AI Coding Practices After Outages Draw Scrutiny](https://www.fintechweekly.com/news/amazon-ai-coding-outage-review)
[^5]: [Amazon imposes 90 day ‘code safety reset’ after outages](https://www.thesafetymag.com/ca/news/general/amazon-imposes-90-day-code-safety-reset-after-outages/547354)
[^6]: [Amazon unveils Q, an AI-powered chatbot for businesses at AWS](https://techcrunch.com/2023/11/28/amazon-unveils-q-an-ai-powered-chatbot-for-businesses/)
[^7]: [AWS: IPv4 addresses cost too much, so you’re going to pay](https://www.theregister.com/on-prem/2023/07/31/aws-to-charge-customers-for-public-ipv4-addresses-from-2024/1195424)


[1]: https://developer.hashicorp.com/terraform/install
[2]: https://docs.cloud.google.com/sdk/docs/install-sdk
[3]: https://developer.hashicorp.com/terraform/tutorials/gcp-get-started
[4]: https://docs.cloud.google.com/docs/terraform
