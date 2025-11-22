#!/usr/bin/env python
# -*- coding: utf-8 -*-

# Common abbreviations to help reduce the text message length.
# Todo: Should probably move these to collections to preserve ordering
ABBREVIATIONS = {
    'minutes': 'min',
    'seconds': 'sec',
    'meters': 'm',
    'Chest-to-Bar': 'CTB',
    'Chest to Bar': 'CTB',
    'Pull-Ups': 'PU',
    'Pull Ups': 'PU',
    'as many rounds and reps as possible': 'AMRAP',
    'as many rounds as possible': 'AMRAP',
    'as many reps as possible': 'AMRAP',
    'back squat': 'BS',
    'hang squat clean': 'HSC',
    'hang clean': 'HC',
    'clean and jerk': 'C&J',
    'every minute on the minute': 'EMOM',
    'front squat': 'FS',
    'hand stand push up': 'HSPU',
    'knees to elbow': 'KTE',
    'muscle ups': 'MU',
    'overhead squat': 'OHS',
    'power clean': 'PC',
    'push press': 'PP',
    'push-press': 'PP',
    'push jerk': 'PJ',
    'power snatch': 'PSN',
    'squat clean': 'SC',
    'sumo deadlift high pull': 'SDHP',
    'toes to bar': 'TTB',
    'push-ups': 'PU',
    'snatch': 'SN',
    'squat': 'SQ',
    'kettlebell': 'KB',
    'clean': 'CLN',
    'deadlift': 'DL',
    ' one': ' 1',
    ' two': ' 2',
    ' three': ' 3',
    ' four': ' 4',
    ' five': ' 5',
    'rounds for time of': 'RFT',
    'rounds for time': 'RFT',
    'alternating': 'alt',
    'sit-ups': 'SU',
    'Sit-Ups': 'SU',
    'Double-Unders': 'DU',
    }

# This is ugly. I should do this better.
# Todo: Actually learn about encoding.
SPECIAL_CHARS = {
    '’': "'",
    '‘': "'",
    '“': '"',
    '”': '"',
    '…': '...',
    '\xc2\xa0' : ' ',
    '–': '-',
    ' - ': ', ',
    }

# Possible headers
# Todo: Should probably move these to collections to preserve ordering
HEADERS = {
    'Open Workout:': 'Experienced Workout:',
    'Experienced Level:': 'Open Level:',
    'Experienced/Open': None,
    'Workout:': None,
    }

# List of positive reinforcement salutations
# Todo: Add support for emoji, http://apps.timwhitlock.info/emoji/tables/unicode
SALUTATIONS = [
    'Nice work!',
    'Boom!',
    'Not too shabby!'
    ]

# List of available commands
COMMANDS = {
    '6': ['Subscribe','Renable receiving the workout every morning at 6am.'],
    '5': ['Stop','Quit receiving the workout every morning.'],
    '4': ['WOD','Send today\'s workout right now.'],
    '1': ['+ YOUR_SCORE','Log your score from today\'s workout. e.g. For an AMRAP workout: "+ 4 rounds"'],
    '2': ['MOVEMENT: YOUR_RESULT','Log a PR for a movement or activity. e.g. "Clean 1RM: 135lbs"'],
    '3': ['? MOVEMENT_SEARCH','Search your PRs for a movement or activity. e.g. "? Clean 1RM"'],
    '7': ['Tip: YOUR_FEEDBACK','Give feedback on how to make the app better.'],
    }

# List of reserved words
RESERVED_WORDS = [
    'subscribe',
    'stop',
    'wod',
    'help',
    ]
