#!/usr/bin/env python
# -*- coding: utf-8 -*-

try:
    from settings_local import *
except ImportError as e:
    from settings import *

import sys
import twilio.twiml
import random
import collections

from workout import *
from smsuser import *
from constants import *
from timezone import *
from emailer import *

from parse_rest.connection import register
from parse_rest.datatypes import Object, ACL, Pointer
register(PARSE['APPLICATION_ID'], PARSE['REST_API_KEY'], master_key=PARSE['MASTER_KEY'])

from flask import Flask, request, redirect
app = Flask(__name__)

# User's PRs
class PRLog(Object):
    pass

# User's workout results
class WorkoutLog(Object):
    pass

# SMS logs
class SMSLog(Object):
    pass

def list_of_commands():
    content = ''
    od = collections.OrderedDict(sorted(COMMANDS.items()))
    for key, value in od.iteritems():
        content += value[0] + '\n # ' + value[1] + '\n\n'
    return content

@app.route('/')
def hello_world():
    return 'Hello World!'

# All Twilio routing should be sent to /sms
@app.route("/sms", methods=['GET', 'POST'])
def sms():
    # Only continue if a POST request
    if request.method == 'POST':

        # Remove whitespace
        message = request.form['Body'].strip()

        # Sender's phone number. Save for later.
        phone = request.form['From'].strip()

        # Does user exist?
        user_exist = SMSUser.Query.all().filter(phone=phone).limit(1)

        print 'User_exist obj:', user_exist
        print 'User_exist count:', user_exist.count()

        if user_exist.count() == 0:

            # Check for reserved list of words
            if message.lower() in RESERVED_WORDS:
                reply = 'Easy there, first text your name.'
                u = None

            else:
                new_user = SMSUser(name=message, phone=phone, admin=False, subscriber=True, ACL=ACL({}))
                new_user.save()
                u = new_user

                # Send email when a user signs up
                email_subject = 'New user!'
                email_body = u.name + ', ' + u.phone
                simple_email(email_subject, email_body)

                # Welcome reply message
                # Only return first name
                reply = 'Hi ' + message.split(" ")[0] + ', welcome to Bowery SMS! We\'ll send you the workout every morning.\n\nText "Help" for a list of other stuff you can do.'
        else:
            # Lowercase the inbound message
            message = message.lower()

            user_object = list(user_exist)
            u = user_object[0]

            # Subscribe to daily wod reminders
            if message == 'subscribe':
                # Has the user subscribed?
                if u.subscriber is False:
                    u.subscriber = True
                    u.save()
                    reply = 'You are now subscribed. Reply "Stop" to quit receiving the workout every morning.'
                else:
                    # They already exist
                    reply = 'You already subscribed!'

            # Get today's wod
            elif message == 'wod':
                if day_of_the_week == "Sunday":
                    reply = "Open gym!"
                else:
                    latest = latest_workout_obj()
                    if latest is not None:
                        reply = 'Today\'s workout:\n' + format_workout(latest)

                        # Todo: make suggestion contextual
                        reply += '\n\nReply with "+ YOUR_SCORE" to log the workout. e.g. For an AMRAP workout: "+ 4 rounds"'

            # Get a list of commands
            elif message == 'help':
                reply = 'Commands:\n' + list_of_commands()

            # Tips for improving the SMS app
            elif message[0:4] == 'tip:':

                # Send email with user's tip
                email_subject = 'Tip!'
                email_body = message[4:].strip() + '\n\n' + '-' + u.name + ', ' + u.phone
                simple_email(email_subject, email_body)

                reply = 'Thanks for the feedback! We\'ll look into it.'

            # Log today's workout
            elif message[0] == '+':
                result = message[1:].strip()
                w = latest_workout_obj()

                # Does workout log exist?
                workout_log_exist = WorkoutLog.Query.all().filter(SMSUser=u).filter(Workout=w).limit(1)
                if workout_log_exist.count() == 0:
                    workout_log = WorkoutLog(result=result, ACL=ACL({}))
                    workout_log.SMSUser = Pointer(u)
                    workout_log.Workout = Pointer(w)
                    workout_log.save()
                    reply = random.choice(SALUTATIONS) + " We've recorded " + result + " for today's workout."

                else:
                    workout_object = list(workout_log_exist)
                    workout_log = workout_object[0]
                    workout_log.result = result
                    workout_log.save()
                    reply = random.choice(SALUTATIONS) + " We've updated your workout result to " + result + "."

                # Todo: make suggestion contextual
                reply += '\n\nHit a PR? Reply with "MOVEMENT: YOUR_RESULT". e.g. "Clean 1RM: 135lbs"'

            # Search for a movement
            elif message[0] == '?':
                # Get query from message
                query = message[1:].strip()

                # Search over user's PRs
                search_results = PRLog.Query.all().filter(SMSUser=u).order_by("-updatedAt")
                if search_results.count() > 0:
                    reply = ""
                    for item in search_results:
                        print item.activity
                        if query in item.activity:
                            reply += '* ' + item.activity + ': ' + item.result + item.updatedAt.strftime(" (%m/%d/%y)") + '\n\n'

                    if reply != "":
                        reply = 'Results for "' + query + '":\n' + reply
                    else:
                        reply = 'Whoops, can\'t find any results for "' + query + '".'

            # Log a particular movement
            elif len(message.split(":",1)) > 1:
                activity = message.split(":",1)[0].strip()
                result = message.split(":",1)[1].strip()

                # Check to see if their is an existing result for the activity
                pr_log = PRLog(activity=activity, result=result, ACL=ACL({}))
                pr_log.SMSUser = Pointer(u)
                pr_log.save()
                reply = random.choice(SALUTATIONS) + " We've recorded " + result + " for " + activity + "."

            elif message == 'stop':
                # Is the user subscribed?
                if u.subscriber is True:
                    u.subscriber = False
                    u.save()
                    reply = 'You\'ve unsubscribed.'
                else:
                    reply = 'You haven\'t subscribed.'
            else:
                reply = "Say what? Text 'Help' for a list of commands."

                # Send email if the user tries an unknown command
                email_subject = 'Unknown command'
                email_body = message + '\n\n' + '-' + u.name + ', ' + u.phone
                simple_email(email_subject, email_body)

        # Log SMS exchange
        print 'From:', phone
        print 'Message:', message
        print 'Response:', reply

        sms_log = SMSLog(message=message, response=reply, ACL=ACL({}))
        if u is not None:
            sms_log.SMSUser = Pointer(u)
        sms_log.save()

        # Create response object to send back
        resp = twilio.twiml.Response()
        resp.message(reply)
        return str(resp)
