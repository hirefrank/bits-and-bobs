#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import time
import dateutil.tz
import datetime

# Set timezone, offset
os.environ['TZ'] = 'EST+05EDT,M4.1.0,M10.5.0'
time.tzset()
day_of_the_week = time.strftime('%A')
