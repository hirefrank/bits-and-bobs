#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os

PARSE = {
    'APPLICATION_ID': os.environ.get('PARSE_APPLICATION_ID', None),
    'REST_API_KEY': os.environ.get('PARSE_REST_API_KEY', None),
    'MASTER_KEY': os.environ.get('PARSE_MASTER_KEY', None),
}

TWILIO = {
    'ACCOUNT': os.environ.get('TWILIO_ACCOUNT', None),
    'TOKEN': os.environ.get('TWILIO_TOKEN', None),
    'NUMBER': os.environ.get('TWILIO_NUMBER', None),
}

MAILGUN = {
    'API_KEY': os.environ.get('MAILGUN_API_KEY', None),
    'DOMAIN': os.environ.get('MAILGUN_DOMAIN', None),
    'FROM_EMAIL': os.environ.get('MAILGUN_FROM_EMAIL', None)
}

ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', None)
