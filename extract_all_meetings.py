import os
import re
from datetime import datetime, date
import csv
from icalendar import Calendar

def extract_all_meetings(ics_file_path, my_email):
    """Extract all meetings with other people from an ICS file."""
    meetings = []

    # Emails to exclude
    excluded_emails = ['nellwyn.thomas@gmail.com', 'thomasn@dnc.org', '']

    # Minimum date filter (2024-01-01)
    min_date = date(2024, 1, 1)

    try:
        with open(ics_file_path, 'rb') as file:
            cal = Calendar.from_ical(file.read())

            # Print the entire file content for debugging
            file.seek(0)  # Go back to start of file
            content = file.read().decode('utf-8', errors='replace')
            print(f"\nFile content sample (first 500 chars):\n{content[:500]}...")

            for component in cal.walk():
                if component.name == "VEVENT":
                    # Get meeting date
                    dtstart = component.get('dtstart')
                    if not dtstart:
                        continue

                    event_date = dtstart.dt

                    # Skip events before 2024-01-01
                    if isinstance(event_date, datetime):
                        event_date_only = event_date.date()
                    else:
                        event_date_only = event_date

                    if event_date_only < min_date:
                        continue

                    # Format the date
                    if isinstance(event_date, datetime):
                        meeting_date = event_date.strftime('%Y%m%d')
                    else:
                        meeting_date = event_date.strftime('%Y%m%d')

                    # Print the raw event for debugging
                    print(f"\nEvent: {component.get('summary', 'No Summary')} on {meeting_date}")
                    for key, value in component.items():
                        print(f"  {key}: {value}")

                    # Get event summary/title
                    summary = str(component.get('summary', 'No Summary'))

                    # First, get the organizer's info
                    organizer_name = "Unknown"
                    organizer_email = "Unknown"

                    organizer = component.get('ORGANIZER', '')
                    if organizer:
                        organizer_str = str(organizer)

                        # Extract organizer email
                        email_match = re.search(r'mailto:([\w\.-]+@[\w\.-]+)', organizer_str)
                        if email_match:
                            organizer_email = email_match.group(1).lower()

                        # Extract organizer name
                        name_match = re.search(r'CN=([^:;]+)', organizer_str)
                        if name_match:
                            organizer_name = name_match.group(1).strip()

                    # Check attendees
                    attendees = component.get('ATTENDEE', [])
                    if not isinstance(attendees, list):
                        attendees = [attendees]

                    # Skip if there are no attendees or only one attendee
                    if len(attendees) <= 1:
                        continue

                    # Create a mapping of email to name from the organizer and attendees
                    email_to_name = {}

                    # Add organizer to the mapping
                    if organizer_email != "Unknown" and organizer_email != my_email.lower() and organizer_email not in excluded_emails:
                        email_to_name[organizer_email] = organizer_name

                    # Process attendees to extract emails and names
                    for attendee in attendees:
                        attendee_str = str(attendee)

                        # Extract email
                        email_match = re.search(r'mailto:([\w\.-]+@[\w\.-]+)', attendee_str)
                        if not email_match:
                            continue

                        email = email_match.group(1).lower()

                        # Skip myself and excluded emails
                        if email == my_email.lower() or email in excluded_emails:
                            continue

                        # Extract name using the specific format from your example
                        # In your example, the format is: ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;CN=name
                        name = None

                        # Try to get the name from params if available
                        if hasattr(attendee, 'params') and 'CN' in attendee.params:
                            name = str(attendee.params['CN'])
                        else:
                            # Try regex patterns
                            name_match = re.search(r';CN=([^;]+);', attendee_str)
                            if name_match:
                                name = name_match.group(1).strip()
                            else:
                                # Try another pattern
                                name_match = re.search(r'CN=([^;:]+)', attendee_str)
                                if name_match:
                                    name = name_match.group(1).strip()

                        # If we found a name, add it to our mapping
                        if name:
                            email_to_name[email] = name
                        # If no name found but we have this email from the organizer, use that name
                        elif email in email_to_name:
                            pass  # Already have a name for this email
                        # Otherwise use email username as fallback
                        else:
                            name = email.split('@')[0]
                            if '.' in name:
                                parts = name.split('.')
                                name = ' '.join(part.capitalize() for part in parts)
                            else:
                                name = name.capitalize()
                            email_to_name[email] = name

                    # Create a meeting entry for each unique attendee
                    for email, name in email_to_name.items():
                        meetings.append({
                            'other_person_name': name,
                            'other_person_email': email,
                            'meeting_date': meeting_date,
                            'summary': summary
                        })

            return meetings

    except Exception as e:
        import traceback
        print(f"Error processing {ics_file_path}: {str(e)}")
        print(traceback.format_exc())
        return []

def extract_info_from_filename(filename):
    """Extract name and email from filename."""
    # Handle group calendar format
    if '@group.calendar.google.com.ics' in filename:
        meeting_type = filename.split('_')[0]
        email = filename.replace('.ics', '')
        name = "Group Calendar"
        return name, email, meeting_type

    # Handle personal calendar format (Name_email.ics)
    match = re.match(r'(.+?)_(.+?)\.ics', filename)
    if match:
        name = match.group(1)
        email = match.group(2)

        # Determine if it's a personal meeting
        meeting_type = "Personal" if "(p)" in name else "Business"

        # Clean up name
        name = name.replace(" (p)", "")

        return name, email, meeting_type

    return "Unknown", "Unknown", "Unknown"

def main():
    # Directory containing the ICS files
    directory = "."  # Current directory

    # Prepare output data
    all_meetings = []

    # Process each ICS file
    for filename in os.listdir(directory):
        if filename.endswith('.ics'):
            file_path = os.path.join(directory, filename)

            # Special handling for group calendar
            if '@group.calendar.google.com.ics' in filename:
                print(f"Processing group calendar: {filename}")
                # For group calendar, use a special email to identify "me"
                my_email = "fcharris@gmail.com"  # Your email address
                meetings = extract_group_calendar_meetings(file_path, my_email)
            else:
                print(f"Processing personal calendar: {filename}")
                # Extract info from filename
                contact_name, contact_email, meeting_type = extract_info_from_filename(filename)
                # Extract all meetings from file content
                meetings = extract_all_meetings(file_path, contact_email)

            print(f"Found {len(meetings)} meetings in {filename}")

            # Add meetings to the list
            for meeting in meetings:
                all_meetings.append({
                    'Other Person Name': meeting['other_person_name'],
                    'Other Person Email': meeting['other_person_email'],
                    'Meeting Date': meeting['meeting_date'],
                    'Summary': meeting['summary']
                })

    # Write to CSV with simplified fields
    csv_file = 'all_meetings.csv'
    with open(csv_file, 'w', newline='', encoding='utf-8') as file:
        fieldnames = ['Other Person Name', 'Other Person Email', 'Meeting Date', 'Summary']
        writer = csv.DictWriter(file, fieldnames=fieldnames)

        writer.writeheader()
        for meeting in all_meetings:
            writer.writerow(meeting)

    print(f"\nData extracted and saved to {csv_file}")
    print(f"Total meetings extracted: {len(all_meetings)}")

def extract_group_calendar_meetings(ics_file_path, my_email):
    """Extract meetings from a group calendar ICS file."""
    meetings = []

    # Emails to exclude
    excluded_emails = ['nellwyn.thomas@gmail.com', 'thomasn@dnc.org',
                      '9redshap1f0kiic9ungqjve5b8@group.calendar.google.com']

    # Minimum date filter (2024-01-01)
    min_date = date(2024, 1, 1)

    try:
        with open(ics_file_path, 'rb') as file:
            cal = Calendar.from_ical(file.read())

            for component in cal.walk():
                if component.name == "VEVENT":
                    # Get meeting date
                    dtstart = component.get('dtstart')
                    if not dtstart:
                        continue

                    event_date = dtstart.dt

                    # Skip events before 2024-01-01
                    if isinstance(event_date, datetime):
                        event_date_only = event_date.date()
                    else:
                        event_date_only = event_date

                    if event_date_only < min_date:
                        continue

                    # Format the date
                    if isinstance(event_date, datetime):
                        meeting_date = event_date.strftime('%Y%m%d')
                    else:
                        meeting_date = event_date.strftime('%Y%m%d')

                    # Get event summary/title
                    summary = str(component.get('summary', 'No Summary'))

                    # Extract names from summary for group calendar
                    # Example: "Catch-up between Frank Harris and Jacob Prall"
                    other_person_name = "Unknown"
                    other_person_email = "Unknown"

                    # Try to extract name from summary
                    if "between Frank Harris and " in summary:
                        name_part = summary.split("between Frank Harris and ")[1]
                        other_person_name = name_part.strip()

                    # Check attendees to find the email
                    attendees = component.get('ATTENDEE', [])
                    if not isinstance(attendees, list):
                        attendees = [attendees]

                    # Process attendees to extract emails
                    for attendee in attendees:
                        attendee_str = str(attendee)

                        # Extract email
                        email_match = re.search(r'mailto:([\w\.-]+@[\w\.-]+)', attendee_str)
                        if not email_match:
                            continue

                        email = email_match.group(1).lower()

                        # Skip myself, group calendar, and excluded emails
                        if (email == my_email.lower() or
                            email in excluded_emails or
                            email.endswith('@group.calendar.google.com')):
                            continue

                        # Extract name from attendee
                        name = None
                        if hasattr(attendee, 'params') and 'CN' in attendee.params:
                            name = str(attendee.params['CN'])
                        else:
                            # Try regex patterns
                            name_match = re.search(r';CN=([^;]+);', attendee_str)
                            if name_match:
                                name = name_match.group(1).strip()
                            else:
                                name_match = re.search(r'CN=([^;:]+)', attendee_str)
                                if name_match:
                                    name = name_match.group(1).strip()

                        # If we found a valid attendee, use their info
                        if name and name != "Unknown":
                            # If we already have a name from the summary, keep the email
                            if other_person_name != "Unknown":
                                other_person_email = email
                                # Only add this meeting once
                                break
                            else:
                                # Otherwise use both name and email from attendee
                                other_person_name = name
                                other_person_email = email
                                # Only add this meeting once
                                break

                    # If we found a person, add the meeting
                    if other_person_name != "Unknown" or other_person_email != "Unknown":
                        meetings.append({
                            'other_person_name': other_person_name,
                            'other_person_email': other_person_email,
                            'meeting_date': meeting_date,
                            'summary': summary
                        })

            return meetings

    except Exception as e:
        import traceback
        print(f"Error processing group calendar {ics_file_path}: {str(e)}")
        print(traceback.format_exc())
        return []

if __name__ == "__main__":
    main()