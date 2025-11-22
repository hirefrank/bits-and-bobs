#!/usr/bin/env python
# -*- coding: utf-8 -*-

try:
    from settings_local import *
except ImportError as e:
    from settings import *

from parse_rest.connection import register
from parse_rest.datatypes import Object

register(PARSE['APPLICATION_ID'], PARSE['REST_API_KEY'], master_key=PARSE['MASTER_KEY'])

# Users
class SMSUser(Object):
    pass