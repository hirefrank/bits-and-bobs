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

    if day_of_the_week != "Sunday":
        next = next_workout_obj()
        if next is not None:
            body = 'Today\'s workout:\n' + format_workout(next)

            # Todo: make suggestion contextual
            body += '\n\nReply with "+ YOUR_SCORE" to log the workout. e.g. For an AMRAP workout: "+ 4 rounds"'

            # Get all users that subscribe
            users = SMSUser.Query.all().filter(subscriber=True)
            if users.count() > 0:
                for user in users:
                    message = client.messages.create(to=user.phone, from_=TWILIO['NUMBER'], body=body)

            # Set the workout to sent
            next.sent = True
            next.save()

