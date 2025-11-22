import { createPlaywrightRouter} from 'crawlee';
import { workato_adapters, datasets, zapier_premium } from './main.js';
import { get_parent, normalize_name } from './helper.js';

export const router = createPlaywrightRouter();

router.addDefaultHandler(async ({ request, page, enqueueLinks, log }) => {
    log.info(`enqueueing new URLs`);
    const url = request.url;
    
    if (url.includes("learn.microsoft.com")) {
        await enqueueLinks({
            selector: 'table[aria-label="Table 1"] a',
            label: 'pa-detail',
        });
    }

    if (url.includes("zapier.com")) {

        // premium integrations
        await enqueueLinks({
            urls: zapier_premium,
            label: 'zapier',
        });

        // the number of times you want to click "load more"
        const maxPages = 41;
        for (let i=0; i<maxPages; i++) {
            await page.pause();
            await page.waitForSelector('div[class$="-CategoryAppTable__loadMore"]'); 
            await page.locator('text=Load more').click()
        }

        await enqueueLinks({
            selector: 'a[data-testid="category-app-card--item"]',
            label: 'zapier',
        });

        await enqueueLinks({
            selector: 'a[data-testid="category-app-row--item"]',
            label: 'zapier',
        });
    }

    if (url.includes("workato.com")) {
        await enqueueLinks({
            selector: 'a[class="adapter-list__item-link"]',
            label: 'workato',
        });
    };

});


router.addHandler('zapier', async ({ request, page, log }) => {
    const service = 'zapier';
    await page.pause();

    let name: string | null = await page.locator('h1[class$="Heading-AppHeader__appNames"]').textContent();
    const url = request.loadedUrl;

    log.info(`${name}`, { url: url });

    const is_builtin: boolean = name?.includes("Zapier") || false;
    const categories = await page.locator('span[data-testid="v3-app-container__categories"] a').allTextContents();
    const description = await page.locator('div[class$="-AppDetails__appDescription"]').innerText();
    const partner = get_parent(name as string);
    const normalized_name = normalize_name(name as string);

    // check to see if tags exists
    let tag: string | null = null; 
    try {
        tag = (await page.getByTestId('explore-app-header__tags').textContent()) || null;
    } catch (error) {}
    
    if (tag !== null) name = `${name} (${tag})`; 

    const is_premium = (name?.includes("Premium")) ? true : false; 
    
    // extract pairs with from templates
    // // only grabbing the first 9; first page
    // const pairsWith = (await page.locator('div[class$="-AppIntegrationBrowser__gridWrapper"] h3[class$="-AppIntegrationSummary__appNameBase-AppIntegrationSummary__appNameClamped"]').allTextContents()).slice(0,9);
    
    // templates
    // max 3 pages of templates
    const maxTP = 3
    let tp = 0;
    while (await page.locator('div[class$="-ZapTemplateList__loadMore"]').getByRole('button').isVisible()) {
        if (tp < maxTP) {
            await page.pause();
            await page.locator('div[class$="-ZapTemplateList__loadMore"]').click();
            tp++;
        } else {
            break;
        }
    } 

    const templates_css_id = 'div[data-testid="ZapCard__inner"]'
    const num_templates = await page.locator(templates_css_id).count();
    log.info(`${name}`, { num_templates });
    
    for (let i=0; i<num_templates; i++) {
        const title = await page.locator(`${templates_css_id} h1`).nth(i).textContent();
        // const author = await page.locator(`${templates_css_id} span[class$="-ZapCard__authorName"]`).nth(i).textContent();
        const integrations = await page.locator(`${templates_css_id} div[class$="-ZapCard__metaInfoArea"]`).nth(i).textContent();
        let norm_integrations: string[] = [];
        integrations?.split(' + ').forEach(async (row: any) => {
            norm_integrations.push(normalize_name(row))
        });

        await datasets.templates.pushData({
            service,
            title,
            description: null,
            author: 'Zapier',
            type: null,
            count: 0,
            integrations: norm_integrations
        });

    }

    // triggers
    await page.locator('button[aria-label="Triggers"]').click()
    while (await page.locator('div[class$="TriggerActionList__loadMore"]').getByRole('button').isVisible()) {
        await page.pause();
        await page.locator('div[class$="TriggerActionList__loadMore"]').click();
    } 

    const triggers = await page.locator('div[class$="-TriggerActionList__appActionGrid"] h2').allTextContents();
    const num_triggers = Object.keys(triggers).length;
    log.info(`${name}`, { num_triggers });

    triggers.forEach(async (item: any) => {
        const title = item.trim();
        await datasets.connectors.pushData({
            partner,
            normalized_name,
            service,
            is_builtin,
            is_premium,
            name,
            type: 'triggers',
            title,
            description: null
        });
    });

    // actions
    await page.locator('button[aria-label="Actions"]').click()
    while (await page.locator('div[class$="TriggerActionList__loadMore"]').getByRole('button').isVisible()) {
        await page.pause();
        await page.locator('div[class$="TriggerActionList__loadMore"]').click();
    } 

    const actions = await page.locator('div[class$="-TriggerActionList__appActionGrid"] h2').allTextContents();
    const num_actions = Object.keys(actions).length;
    log.info(`${name}`, { num_actions });

    actions.forEach(async (item: any) => {
        const title = item.trim();
        await datasets.connectors.pushData({
            partner,
            normalized_name,
            service,
            is_builtin,
            is_premium,
            name,
            type: 'steps',
            title,
            description: null
        });
    });


    await datasets.service.pushData({
        partner,
        normalized_name,        
        service,
        is_builtin,
        is_premium,
        name,
        categories,
        description,
        url
    });
});

router.addHandler('pa-detail', async ({ request, page, log }) => {
    const service = 'power-automate';
    const url = request.loadedUrl;
    const title = await page.title();
    log.info(`${title}`, { url: url });

    let name: string = await page.locator('h1').first().innerText();
    const description: string | null = (await page.locator('div[class="summary"]').textContent())?.trim() ?? "";
    const app_name = (url?.split('/').at(-2)) ?? "";
    const partner = get_parent(name as string);
    const normalized_name = normalize_name(name as string);

    const type = await page.locator(`table[aria-label="${name}"] td`).nth(4).textContent() ?? "Standard";
    if (type == "Premium") name = `${name} (Premium)`;

    const is_premium = (name?.includes("Premium")) ? true : false; 
    const is_builtin = false;

    await datasets.service.pushData({
        partner,
        normalized_name,
        service,
        is_builtin,
        is_premium,
        name,
        categories: [],
        description,
        url,
    });

    const headers = await page.locator('div[data-heading-level="h2"]').allInnerTexts();
    const actions_position = headers.indexOf("Actions");
    const triggers_position = headers.indexOf("Triggers");

    const tables = await page.locator('div[data-heading-level="h2"] + table tbody');
    let actions = null;
    let triggers = null;

    if (actions_position) {
        actions = await tables.nth(0).locator('tr').allInnerTexts();
        if (triggers_position) triggers = await tables.nth(1).locator('tr').allInnerTexts();
    } else if (triggers_position) {
        triggers = await tables.nth(0).locator('tr').allInnerTexts();
    }
    
    actions?.forEach(async (row: any) => {
        const data = (row.split("\n")).filter((elm: any) => elm);;
        const title = data[0].trim();
        const description = data[1].trim();
        
        await datasets.connectors.pushData({
            partner,
            normalized_name,
            service,
            is_builtin,
            is_premium,
            name,
            type: 'steps',
            title,
            description
        });
    });

    triggers?.forEach(async (row: any) => {
        const data = (row.split("\n")).filter((elm: any) => elm);;
        const title = data[0].trim();
        const description = data[1].trim();
        
        await datasets.connectors.pushData({
            partner,
            normalized_name,
            service,
            is_builtin,
            is_premium,
            name,
            type: 'triggers',
            title,
            description
        });
    });

    const response = await fetch(`https://powerautomate.microsoft.com/en-us/api/connector/templates/?connectorName=shared_${app_name}`);
    const templates = await response.json();

    let k: keyof typeof templates.value;
    for (k in templates.value) {
        const item = templates.value[k];

        const title = item.Title.trim() ?? "";
        const description = item.Description.trim() ?? "";
        const author = item.Author.trim() ?? "";
        const type = item.TemplateType.trim() ?? "";
        const count = item.UsageCount ?? 0;
        let integrations: string[] = [];
        (item.Icons).forEach((app: any) => {
            try {
                integrations.push(normalize_name(app.Name));
            } catch (error) {}
        })

        await datasets.templates.pushData({
            service,
            title,
            description,
            author,
            type,
            count,
            integrations
        });
    }
});

router.addHandler('workato', async ({ request, page, log }) => {
    const service = 'workato';
    const url = request.loadedUrl;
    const title = await page.title();
    log.info(`${title}`, { url: url });

    const name = (await page.locator('h1.apps-page__head-title').innerText())?.replace(' integrations and automations', '') as string;
    const description = await page.locator('meta[name="description"]').getAttribute('content') ?? null;
    const is_builtin: boolean = (name?.includes("Workato") || name?.includes("Workbot")) || false;
    const partner = get_parent(name as string);
    const normalized_name = normalize_name(name as string);
    const is_premium = false;

    // integrations
    await datasets.service.pushData({
        partner,
        normalized_name,
        service,
        is_builtin,
        is_premium,
        name,
        categories: [],
        description,
        url
    });

    // connectors
    const app_name = (url?.split('/').at(-1)) ?? "";
    const triggers = workato_adapters[app_name]["triggers"] || [];
    const actions = workato_adapters[app_name]["actions"] || [];

    triggers.forEach(async (item: any) => {
        const title = item.title.trim().replace(/(<([^>]+)>)/gi, "") ?? "";
        const description = item.description.trim().replace(/(<([^>]+)>)/gi, "") ?? "";

        await datasets.connectors.pushData({
            partner,
            normalized_name,
            service,
            is_builtin,
            is_premium,
            name,
            type: 'triggers',
            title,
            description
        });
    });

    actions.forEach(async (item: any) => {
        const title = item.title.trim().replace(/(<([^>]+)>)/gi, "") ?? "";
        const description = item.description.trim().replace(/(<([^>]+)>)/gi, "") ?? "";

        await datasets.connectors.pushData({
            partner,
            normalized_name,
            service,
            is_builtin,
            is_premium,
            name,
            type: 'steps',
            title,
            description
        });
    });

    // fetch templates
    const response = await fetch(`https://app.workato.com/lists/fetch?page=1&per_page=8&context=search_flows&context_id=app:"${name}"`);
    const templates = await response.json();

    const res = templates.items; 
    res.forEach(async (item: any) => {
        const title = item.name.trim() ?? "";
        const description = item.description.trim() ?? "";
        const author = item.user_id ?? "";
        const type = item.TemplateType ?? "";
        let integrations: string[] = [];
        (item.applications).forEach((app: any) => {
            integrations.push(normalize_name(app));
        })
        const count = item.copy_count ?? 0;
    
        await datasets.templates.pushData({
            service,
            title,
            description,
            author,
            type,
            count,
            integrations
        });
    });
});
