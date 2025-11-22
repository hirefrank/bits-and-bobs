// For more information, see https://crawlee.dev/
import { PlaywrightCrawler, Dataset } from 'crawlee';
import { router } from './routes.js';


const dataset_names = {
    service: 'integrations',
    templates: 'templates',
    connectors: 'triggers_actions'
}

export const datasets = {
    service: await Dataset.open(dataset_names.service),
    templates: await Dataset.open(dataset_names.templates),
    connectors: await Dataset.open(dataset_names.connectors)
}

// get workato adapters (triggers and actions)
const response = await fetch('https://www.workato.com/_content/adapters-operations');
export const workato_adapters = await response.json();

const crawler = new PlaywrightCrawler({
    // proxyConfiguration: new ProxyConfiguration({ proxyUrls: ['...'] }),
    requestHandler: router,
    headless: true,
    requestHandlerTimeoutSecs: 180,
    navigationTimeoutSecs: 180,
});

export const zapier_premium = [
    'https://zapier.com/apps/webhook/integrations',
    'https://zapier.com/apps/facebook-lead-ads/integrations',
    'https://zapier.com/apps/salesforce/integrations',
    'https://zapier.com/apps/twitter/integrations',
    'https://zapier.com/apps/shopify/integrations',
    'https://zapier.com/apps/quickbooks/integrations',
    'https://zapier.com/apps/zoho-crm/integrations',
    'https://zapier.com/apps/linkedin-ads/integrations',
    'https://zapier.com/apps/zendesk/integrations',
    'https://zapier.com/apps/xero/integrations',
    'https://zapier.com/apps/keap-max-classic/integrations',
    'https://zapier.com/apps/paypal/integrations',
    'https://zapier.com/apps/mysql/integrations',
    'https://zapier.com/apps/facebook-custom-audiences/integrations',
    'https://zapier.com/apps/postgresql/integrations',
    'https://zapier.com/apps/pinterest/integrations',
    'https://zapier.com/apps/sql-server/integrations',
    'https://zapier.com/apps/pardot/integrations',
    'https://zapier.com/apps/bamboohr/integrations',
    'https://zapier.com/apps/amazon-s3/integrations',
    'https://zapier.com/apps/microsoft-dynamics-crm/integrations',
    'https://zapier.com/apps/marketo/integrations',
    'https://zapier.com/apps/gotowebinar/integrations',
    'https://zapier.com/apps/google-bigquery/integrations',
    'https://zapier.com/apps/amazon-seller-central/integrations',
    'https://zapier.com/apps/quickbase/integrations',
    'https://zapier.com/apps/bigcommerce/integrations',
    'https://zapier.com/apps/magento-v2/integrations',
    'https://zapier.com/apps/google-groups/integrations',
    'https://zapier.com/apps/aws-lambda/integrations',
    'https://zapier.com/apps/ai/integrations',
    'https://zapier.com/apps/sharepoint/integrations',
    'https://zapier.com/apps/amazon-sns/integrations',
    'https://zapier.com/apps/sugarcrm7/integrations',
    'https://zapier.com/apps/chargify/integrations',
    'https://zapier.com/apps/amazon-ses/integrations',
    'https://zapier.com/apps/instagram-lead-ads/integrations',
    'https://zapier.com/apps/greenhouse/integrations',
    'https://zapier.com/apps/amazon-sqs/integrations',
    'https://zapier.com/apps/sugarcrm/integrations',
    'https://zapier.com/apps/magento/integrations',
    'https://zapier.com/apps/snowflake/integrations',
    'https://zapier.com/apps/servicenow/integrations',
    'https://zapier.com/apps/dynamodb/integrations',
    'https://zapier.com/apps/expensify/integrations',
    'https://zapier.com/apps/solve360/integrations',
    'https://zapier.com/apps/evernote-business/integrations',
    'https://zapier.com/apps/moodle/integrations',
    'https://zapier.com/apps/amazon-cloudwatch/integrations',
    'https://zapier.com/apps/amazon-ec2/integrations',
    'https://zapier.com/apps/whmcs/integrations',
    'https://zapier.com/apps/upwork/integrations',
    'https://zapier.com/apps/amazon-polly/integrations',
    'https://zapier.com/apps/namely/integrations',
    'https://zapier.com/apps/call-drip/integrations',
    'https://zapier.com/apps/amazon-redshift/integrations',
    'https://zapier.com/apps/azure-active-directory/integrations',
    'https://zapier.com/apps/instagram-custom-audiences/integrations'
]

const startUrls = [
    'https://www.workato.com/integrations',
    'https://zapier.com/apps',
    'https://learn.microsoft.com/en-us/connectors/connector-reference/connector-reference-powerautomate-connectors'
];

await crawler.run(startUrls);

await datasets.service.exportToCSV(dataset_names.service);
await datasets.templates.exportToCSV(dataset_names.templates);
await datasets.connectors.exportToCSV(dataset_names.connectors);