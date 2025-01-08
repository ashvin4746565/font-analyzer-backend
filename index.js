const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');

const app = express();
app.use(cors());
app.use(express.json());

async function fetchCSS(url) {
    try {
        const response = await fetch(url);
        if (response.ok) {
            return await response.text();
        }
    } catch (error) {
        console.error(`Error fetching CSS: ${error}`);
    }
    return '';
}

app.get('/fonts', async (req, res) => {
    const site = req.query.site;
    if (!site) return res.status(400).json({ error: 'No site URL provided' });

    try {
        const response = await fetch(site);
        const html = await response.text();
        const dom = new JSDOM(html);

        const styleLinks = Array.from(dom.window.document.querySelectorAll('link[rel="stylesheet"]'));
        const inlineStyles = Array.from(dom.window.document.querySelectorAll('style'));

        const fonts = new Set();

        // Check external stylesheets
        for (const link of styleLinks) {
            const href = link.href;
            if (href) {
                const cssContent = await fetchCSS(href);
                const fontMatches = cssContent.match(/@font-face\s*{[^}]*}/gi) || [];
                fontMatches.forEach(match => {
                    const fontName = match.match(/font-family:\s*['"]?([^;'"]+)['"]?/i);
                    if (fontName) fonts.add(fontName[1]);
                });
            }
        }

        // Check inline styles
        inlineStyles.forEach(style => {
            const cssContent = style.textContent;
            const fontMatches = cssContent.match(/@font-face\s*{[^}]*}/gi) || [];
            fontMatches.forEach(match => {
                const fontName = match.match(/font-family:\s*['"]?([^;'"]+)['"]?/i);
                if (fontName) fonts.add(fontName[1]);
            });
        });

        res.json({ fonts: Array.from(fonts) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Unable to analyze the site' });
    }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
