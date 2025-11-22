#!/usr/bin/env python
# -*- coding: utf-8 -*-

try:
    from settings_local import *
except ImportError as e:
    from settings import *

from workout import *
from smsuser import *
from timezone import *

from parse_rest.connection import register
from parse_rest.datatypes import Object
from twilio.rest import TwilioRestClient

if __name__ == '__main__':
    register(PARSE['APPLICATION_ID'], PARSE['REST_API_KEY'], master_key=PARSE['MASTER_KEY'])
    client = TwilioRestClient(TWILIO['ACCOUNT'], TWILIO['TOKEN'])

    body = "Okay, everything should be good now! \n\n"
    body += "The last message I sent you is today's workout. Email me at frank@hirefrank.com if you have any questions. Take care, Frank"

    # Get all users that subscribe
    users = SMSUser.Query.all().filter(subscriber=True)
    if users.count() > 0:
        for user in users:
            message = client.messages.create(to=user.phone, from_=TWILIO['NUMBER'], body=body)
