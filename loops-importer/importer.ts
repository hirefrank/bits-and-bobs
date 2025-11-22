#!/usr/bin/env node

import { LoopsClient, APIError, RateLimitExceededError } from 'loops';
import * as fs from 'fs';
import csv from 'csv-parser';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// --- Interfaces for Type Safety ---
interface Arguments {
  _: (string | number)[];
  $0: string;
  csv: string;
  emailIndex: number;
  firstNameIndex?: number;
  lastNameIndex?: number;
  customProperty?: string;
  dryRun?: boolean;
  includeHeader?: boolean;
  rateLimit?: number;
  // Add aliases if you want strong types for them too
  c: string;
  e: number;
  f?: number;
  l?: number;
  p?: string;
  d?: boolean;
  h?: boolean;
  r?: number;
  help?: boolean;
}

interface ContactProperties {
  firstName?: string;
  lastName?: string;
  [key: string]: any; // Allow for custom properties
}

// --- Argument Parsing ---
// We cast to unknown first, then to Arguments for stricter type checking with yargs
const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 --csv <filePath> --email-index <index> [options]')
  .option('csv', {
    alias: 'c',
    description: 'Path to the CSV file',
    type: 'string',
    demandOption: true,
  })
  .option('email-index', {
    alias: 'e',
    description: '0-based index of the email column in the CSV',
    type: 'number',
    demandOption: true,
  })
  .option('first-name-index', {
    alias: 'f',
    description: '0-based index of the first name column',
    type: 'number',
  })
  .option('last-name-index', {
    alias: 'l',
    description: '0-based index of the last name column',
    type: 'number',
  })
  .option('custom-property', {
    alias: 'p',
    description: 'Custom property to add/update (format: key:value)',
    type: 'string',
  })
  .option('dry-run', {
    alias: 'd',
    description: 'Run in dry-run mode (no actual API calls will be made)',
    type: 'boolean',
    default: false,
  })
  .option('include-header', {
    alias: 'i',
    description: 'Include the header row in processing (default: skip header row)',
    type: 'boolean',
    default: false,
  })
  .option('rate-limit', {
    alias: 'r',
    description: 'Maximum number of API calls per second (default: 5)',
    type: 'number',
    default: 5,
  })
  .check((argv: any) => {
    if (argv.customProperty && !argv.customProperty.includes(':')) {
      throw new Error('Invalid format for --custom-property. Use key:value.');
    }
    if (argv['email-index'] < 0 ||
        (argv['first-name-index'] !== undefined && argv['first-name-index'] < 0) ||
        (argv['last-name-index'] !== undefined && argv['last-name-index'] < 0)) {
      throw new Error('Column indices cannot be negative.');
    }
    return true;
  })
  .help()
  .alias('help', 'h')
  .strict()
  .argv as unknown as Arguments; // Cast for type safety

// --- Configuration & Initialization ---
const LOOPS_API_KEY = process.env.LOOPS_API_KEY;

if (!LOOPS_API_KEY) {
  console.error('Error: LOOPS_API_KEY environment variable is not set.');
  process.exit(1);
}

// Initialize Loops Client
const loops: LoopsClient = new LoopsClient(LOOPS_API_KEY);

let customPropKey: string | null = null;
let customPropValue: string | null = null;

if (argv.customProperty) {
  [customPropKey, customPropValue] = argv.customProperty.split(':', 2);
}

// --- Rate Limiting ---
// Simple rate limiter to avoid hitting API limits
class RateLimiter {
  private queue: (() => Promise<void>)[] = [];
  private processing = false;
  private lastRequestTime = 0;
  private requestsPerSecond: number;

  constructor(requestsPerSecond: number) {
    this.requestsPerSecond = requestsPerSecond;
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minTimeBetweenRequests = 1000 / this.requestsPerSecond;

    if (timeSinceLastRequest < minTimeBetweenRequests) {
      const delay = minTimeBetweenRequests - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    const fn = this.queue.shift();
    if (fn) {
      this.lastRequestTime = Date.now();
      await fn();
      this.processQueue();
    }
  }
}

// Initialize rate limiter
const rateLimiter = new RateLimiter(argv.rateLimit || 5);

// --- CSV Processing ---
let rowCount: number = 0;
let successCount: number = 0;
let errorCount: number = 0;
let headerSkipped: boolean = false;

console.log(`Starting import from ${argv.csv}...`);
if (argv.dryRun) {
  console.log('DRY RUN MODE: No actual API calls will be made');
}
if (!argv.includeHeader) {
  console.log('Header row will be skipped by default. Use --include-header to process it.');
}
console.log(`Rate limiting: Maximum ${argv.rateLimit} API calls per second`);

fs.createReadStream(argv.csv)
  .pipe(csv({ headers: false })) // Treat rows as arrays
  .on('data', async (row: string[]) => { // Type the row data
    rowCount++;
    const currentProcessingRow = rowCount;

    // Skip the header row by default
    if (!argv.includeHeader && !headerSkipped) {
      headerSkipped = true;
      console.log(`[Row ${currentProcessingRow}] Skipping header row`);
      return;
    }

    const email: string | undefined = row[argv.emailIndex]?.trim();

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      console.warn(`[Row ${currentProcessingRow}] Skipping: Invalid or missing email at index ${argv.emailIndex}`);
      errorCount++;
      return;
    }

    const contactProperties: ContactProperties = {};

    if (argv.firstNameIndex !== undefined && row[argv.firstNameIndex] !== undefined) {
      contactProperties.firstName = row[argv.firstNameIndex].trim();
    }
    if (argv.lastNameIndex !== undefined && row[argv.lastNameIndex] !== undefined) {
      contactProperties.lastName = row[argv.lastNameIndex].trim();
    }
    if (customPropKey && customPropValue !== null) {
      contactProperties[customPropKey] = customPropValue.trim();
    }

    try {
      if (argv.dryRun) {
        // In dry-run mode, simulate a successful response
        console.log(`[Row ${currentProcessingRow}] DRY RUN: Would update/create contact ${email} with properties:`, contactProperties);
        successCount++;
      } else {
        // Use rate limiter to control API call rate
        const resp = await rateLimiter.add(() => loops.updateContact(email, contactProperties));
        if (resp.success && resp.id) { // Check for id which is present on success
          console.log(`[Row ${currentProcessingRow}] Success: Updated/Created contact ${email} (ID: ${resp.id})`);
          successCount++;
        } else {
          console.error(`[Row ${currentProcessingRow}] Failed: Could not update/create contact ${email} (API returned success=false or missing ID)`);
          errorCount++;
        }
      }
    } catch (error: unknown) { // Catch unknown type
      errorCount++;
      if (error instanceof RateLimitExceededError) {
        console.error(`[Row ${currentProcessingRow}] Failed for ${email}: Rate limit exceeded (${error.limit} per second). Consider reducing the rate limit with --rate-limit.`);
      } else if (error instanceof APIError) {
         // Access statusCode and json safely
        const message = error.json?.message ?? JSON.stringify(error.json);
        console.error(`[Row ${currentProcessingRow}] Failed for ${email}: API Error (Status: ${error.statusCode}) - ${message}`);
      } else if (error instanceof Error){ // Handle generic Error
         console.error(`[Row ${currentProcessingRow}] Failed for ${email}: Unexpected Error - ${error.message}`);
      } else {
         console.error(`[Row ${currentProcessingRow}] Failed for ${email}: Unexpected non-error thrown.`);
      }
    }
  })
  .on('end', () => {
    console.log('--- Import Finished ---');
    console.log(`Total rows processed: ${rowCount}`);
    console.log(`Successful updates/creates: ${successCount}`);
    console.log(`Errors/Skipped rows: ${errorCount}`);
    if (argv.dryRun) {
      console.log('This was a dry run. No actual API calls were made.');
    }
  })
  .on('error', (error: Error) => { // Type the error
    console.error('Error reading CSV file:', error);
    process.exit(1);
  });