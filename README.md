# Meeting Data Extraction Tool

This tool extracts and processes meeting information from various calendar sources, including Google Calendar ICS files and personal calendar exports.

## Overview

This project provides utilities to extract meeting data from calendar files (ICS format) and consolidate the information into a CSV format for further analysis or reporting.

## Files in the Project

- `extract_all_meetings.py`: Main script to extract meetings from multiple calendar sources
- `all_meetings.csv`: Consolidated output file containing all extracted meeting information

## Usage

1. Export your calendar data in ICS format
2. Place the ICS files in the project folder (supports both group calendars and individual/personal calendars)
3. Run the extraction script:

```bash
python extract_all_meetings.py
```

4. The script will process all ICS files in the directory and generate `all_meetings.csv` with the consolidated data

## Requirements

- Python 3.x
- Required Python packages (install via `pip install -r requirements.txt`):
  - icalendar
  - pandas
  - python-dateutil
  - pytz
  - numpy

## Contributing

Feel free to submit issues or pull requests to improve the functionality of this tool.

## License

[MIT License](LICENSE)