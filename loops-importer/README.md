# Loops Importer

A command-line tool to import contacts into Loops from a CSV file.

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/loops-importer.git
cd loops-importer

# Install dependencies
pnpm install
```

## Configuration

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your Loops API key:
   ```
   LOOPS_API_KEY=your_api_key_here
   ```

## Usage

```bash
# Basic usage
pnpm importer --csv path/to/your/file.csv --email-index 0

# With first name and last name columns
pnpm importer --csv path/to/your/file.csv --email-index 0 --first-name-index 1 --last-name-index 2

# With a custom property
pnpm importer --csv path/to/your/file.csv --email-index 0 --custom-property source:newsletter

# Dry run mode (no actual API calls)
pnpm importer --csv path/to/your/file.csv --email-index 0 --dry-run

# Include header row in processing (default: skip header row)
pnpm importer --csv path/to/your/file.csv --email-index 0 --include-header

# Set rate limit (default: 5 requests per second)
pnpm importer --csv path/to/your/file.csv --email-index 0 --rate-limit 3
```

## Options

- `--csv, -c`: Path to the CSV file (required)
- `--email-index, -e`: 0-based index of the email column in the CSV (required)
- `--first-name-index, -f`: 0-based index of the first name column
- `--last-name-index, -l`: 0-based index of the last name column
- `--custom-property, -p`: Custom property to add/update (format: key:value)
- `--dry-run, -d`: Run in dry-run mode (no actual API calls will be made)
- `--include-header, -i`: Include the header row in processing (default: skip header row)
- `--rate-limit, -r`: Maximum number of API calls per second (default: 5)
- `--help, -h`: Show help

## CSV Format

The CSV file should have headers and the email column should be at the specified index. For example:

```
Email,First Name,Last Name
john@example.com,John,Doe
jane@example.com,Jane,Smith
```

In this case, you would use `--email-index 0 --first-name-index 1 --last-name-index 2`.

By default, the importer will skip the header row. If you want to include the header row in processing, use the `--include-header` option.

## Rate Limiting

The importer includes built-in rate limiting to avoid hitting API limits. By default, it limits requests to 5 per second. If you're still hitting rate limits, you can reduce this value using the `--rate-limit` option:

```bash
pnpm importer --csv path/to/your/file.csv --email-index 0 --rate-limit 3
```

This will limit the importer to 3 API calls per second, which should help avoid rate limit errors.