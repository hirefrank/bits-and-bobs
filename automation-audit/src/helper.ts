
export function normalize_name(name: string) {   
    return name
        .toLowerCase()
        .replace("(premium)","")
        .replace("(preview)","")
        .replace("integrations","")
        .replace("(independent publisher)","")
        .replace("(intranet)", "")
        .replace("monday.com", "monday")
        .replace("outlook.com", "outlook")
        .replace("quick base", "quickbase")
        .replace("ring central", "ringcentral")
        .replace("rss by zapier", "rss")
        .replace("ship station", "shipstation")
        .replace("toggl plan", "toggl")
        .replace("webex integration", "webex")
        .replace("wordpress.com", "wordpress")
        .trim()
}

// parent mapping
const conglomerates = {
    "Workbot": "Workato",
    "Gmail": "Google",
    "Google": "Google",
    "Microsoft": "Microsoft",
    "Azure": "Microsoft",
    "AWS": "Amazon",
    "Amazon": "Amazon",
    "Adobe": "Adobe",
    "Facebook": "Meta",
    "Instagram": "Meta",
    "Jira": "Atlassian",
    "Confluence Cloud": "Atlassian",
    "Youtube": "Google",
    "Zoho": "Zoho",
    "Zendesk": "Zendesk",
    "Zapier": "Zapier",
    "ADP ": "ADP",
    "Bitbucket": "Atlassian",
    "Dropbox": "Dropbox",
    "dynamics 365": "Microsoft",
    "Evernote": "Evernote",
    "Excel ": "Microsoft",
    "Workato": "Workato",
    "Basecamp": "Basecamp",
    "magento": "magento",
    "Freshsales": "Freshsales",
    "Github": "Github",
    "Hubspot": "Hubspot",
    "ia-connect": "ia-connect",
    "jobvite": "jobvite",
    "linkedin": "linkedin",
    "mailchimp": "mailchimp",
    "mailerlite": "mailerlite",
    "marketo": "marketo",
    "monday": "monday",
    "netsuite": "oracle",
    "office 365 ": "microsoft",
    "onedrive": "microsoft",
    "onenote": "onenote",
    "openai": "openai",
    "opentext": "opentext",
    "oracle": "oracle",
    "outlook": "microsoft",
    "plumsail": "plumsail",
    "Power Apps for Makers": "Microsoft",
    "power automate": "Microsoft",
    "power bi": "Microsoft",
    "power platform": "Microsoft",
    "priority matrix": "priority matrix",
    "projectwise": "projectwise",
    "propublica": "propublica",
    "quickbooks online": "intuit",
    "redshift": "Amazon",
    "resimpli": "resimpli",
    "reversinglabs": "reversinglabs",
    "ringcentral": "ringcentral",
    "riskiq": "riskiq",
    "salesforce": "salesforce",
    "sap": "sap",
    "seismic": "seismic",
    "sharepoint": "microsoft",
    "shipstation": "shipstation",
    "sigma": "sigma",
    "signl4": "signl4",
    "spoonacular": "spoonacular",
    "sql server": "microsoft",
    "square business": "square",
    "square payments": "square",
    "sugarcrm": "sugarcrm",
    "survalyzer": "survalyzer",
    "taleo": "taleo",
    "teamwork ": "teamwork",
    "telegram ": "telegram",
    "threads": "meta",
    "toggl": "toggl",
    "tyntec": "tyntec",
    "udemy": "udemy",
    "ukg pro": "ukg pro",
    "video indexer": "video indexer",
    "watson ": "ibm",
    "workday": "workday",
    "xero": "xero",
    "xpertdoc": "xpertdoc"
}

export function get_parent(name: string) {
    for (const [key, value] of Object.entries(conglomerates)) {
        if (name.toLowerCase().includes(key.toLowerCase())) return value.toLowerCase();
    }
    return normalize_name(name);
}