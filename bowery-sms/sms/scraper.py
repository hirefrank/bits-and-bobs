#!/usr/bin/env python
# -*- coding: utf-8 -*-

# Scrape the daily workouts from Bowery CrossFit blog's sitemap.
DOMAIN = 'http://www.flipsidecf.com'
URL = DOMAIN + '/bcf-wod'

try:
    from settings_local import *
except ImportError as e:
    from settings import *

import requests
import bs4
import re
import unicodedata

from workout import *
from constants import *
from emailer import *

from HTMLParser import HTMLParser

from parse_rest.connection import register
from parse_rest.datatypes import Object, ACL, Pointer

class MLStripper(HTMLParser):
    def __init__(self):
        self.reset()
        self.fed = []
    def handle_data(self, d):
        self.fed.append(d)
    def get_data(self):
        return ''.join(self.fed)

def strip_tags(html):
    s = MLStripper()
    s.feed(html)
    return s.get_data()

def get_programming_urls():
    response = requests.get(URL)
    soup = bs4.BeautifulSoup(response.text)

    urls = []
    content = soup.select('a.u-url')
    for item in content:
        urls.append("{0}{1}".format(DOMAIN, item['href']))

    return reversed(urls)

def has_wod(content):
    lower_content = content.lower()
    if not "open gym" in lower_content:
        return True
    else:
        return False

def clean_content(content):
    # Loop through each possible header
    match = False
    for key in HEADERS:
        if key in content:
            match = True
            # If testing week
            if 'Testing week!' in content:
                clean = re.sub('Testing week!.*?' + key,'', strip_tags(content.replace("</p>", "</p> ")), flags=re.DOTALL)
            else:
                clean = re.sub('Recommended content:.*?' + key,'', strip_tags(content.replace("</p>", "</p> ")), flags=re.DOTALL)
            break

    if match == False:
        clean = re.sub('Recommended content:.*?:','', strip_tags(content.replace("</p>", "</p> ")), flags=re.DOTALL)

    return clean

def condensed_content(content):
    for key in SPECIAL_CHARS:
        content = content.replace(key, SPECIAL_CHARS[key])

    content = content.replace('\n \n','\n')
    content = content.replace('\n\n','\n')
    content = re.sub(' +',' ', content)
    content = content.replace(' :', ':')

    for key in ABBREVIATIONS:
        content = content.replace(key, ABBREVIATIONS[key])
        content = content.replace(key.capitalize(), ABBREVIATIONS[key])

    return content.strip()

def save_workout(slug, raw, condensed):
    workout = {}
    workouts = []
    print 'Slug: ', slug
    print 'Raw: ', raw
    print 'Condensed: ', condensed

    # Split the workout for open and experiencd tracks
    for key in HEADERS:
        if HEADERS[key] is not None and HEADERS[key] in condensed:
            workouts = condensed.split(HEADERS[key])
            dict_key = HEADERS[key].split(" ")[0].lower()
            other_dict_key = 'experienced' if dict_key == 'open' else 'open'

            workout[dict_key] = workouts[1].replace(HEADERS[key] + "\n", "")
            workout[other_dict_key] = workouts[0].replace(key + " \n", "")
            break

        # Not split workouts
        elif key in condensed:
            workout['open'] = condensed.replace(key, "")
            workout['experienced'] = condensed.replace(key, "")
            break

    # If split, set variables
    if len(workout) == 2:
        open_workout = workout['open']
        experienced_workout = workout['experienced']
    else:
        open_workout = condensed
        experienced_workout = condensed

    print 'Open: ', open_workout
    print 'Experienced: ', experienced_workout

    workout = Workout(slug=slug, raw=raw, open=open_workout, experienced=experienced_workout, sent=False, ACL=ACL({}))
    workout.save()

    # Send email to admin when new workout is added
    email_subject = 'Just added: ' + slug
    email_body = 'Open:\n' + open_workout + '\n\n' + 'Experienced:\n' + experienced_workout
    simple_email(email_subject, email_body)

    return True

if __name__ == '__main__':
    register(PARSE['APPLICATION_ID'], PARSE['REST_API_KEY'], master_key=PARSE['MASTER_KEY'])

    # Get most recent blog programming posts
    blog_posts = get_programming_urls()

    # For each blog post...
    for post in blog_posts:
        response = requests.get(post)
        text = response.text

        soup = bs4.BeautifulSoup(text)

        # Get content for each post
        content = str(soup.select('div.entry-content')).strip('[]')
        content = re.sub(r"</?p>|<br>|<br/?>", "\n", content)

        # If the post contains a WOD
        if has_wod(content):

            # Get slug from the URL
            slug = post.replace(URL, "").strip("/")

            # Does the slug already exist?
            slug_exist = Workout.Query.all().filter(slug=slug).limit(1)

            if slug_exist.count() == 0:
                # If not, save the workout
                raw = clean_content(content)
                condensed = condensed_content(raw)
                save_workout(slug, raw, condensed)
            else:
                print 'No new workouts.'



