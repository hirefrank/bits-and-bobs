#!/usr/bin/env python
# -*- coding: utf-8 -*-

try:
    from settings_local import *
except ImportError as e:
    from settings import *

from parse_rest.connection import register
from parse_rest.datatypes import Object

register(PARSE['APPLICATION_ID'], PARSE['REST_API_KEY'], master_key=PARSE['MASTER_KEY'])

# Daily workouts
class Workout(Object):
    pass

def format_workout(obj):
    if obj.experienced.strip() == obj.open.strip():
        return obj.open.strip()
    else:
        return 'Open:\n' + obj.open.strip() + '\n\n' + 'Experienced:\n' + obj.experienced.strip()

# Returns the latest workout object
def latest_workout_obj():
    latest = Workout.Query.all().filter(sent=True).order_by("-createdAt").limit(1)
    if latest.count() > 0:
        return latest[0]
    else:
        return None

# Returns the next workout object
def next_workout_obj():
    next = Workout.Query.all().filter(sent=False).order_by("-createdAt").limit(1)
    if next.count() > 0:
        return next[0]
    else:
        return None
