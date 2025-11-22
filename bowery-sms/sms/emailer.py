#!/usr/bin/env python
# -*- coding: utf-8 -*-

try:
    from settings_local import *
except ImportError as e:
    from settings import *

import requests

def simple_email(subject, body, to=ADMIN_EMAIL):
    return requests.post(
        "https://api.mailgun.net/v3/" + MAILGUN['DOMAIN'] + "/messages",
        auth=("api", MAILGUN['API_KEY']),
        data={"from": MAILGUN['FROM_EMAIL'],
              "to": to,
              "subject": subject,
              "text": body})
