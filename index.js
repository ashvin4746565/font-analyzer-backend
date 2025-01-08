const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/fonts', async (req, res) => {
    const site = req.query.site;
    if (!site) return res.status(400).json({ error: 'No site URL provided' });

    try {
        const response = await fetch(site);
        const html = await response.text();
        const dom = new JSDOM(html);

        const stylesheets = Array.from(dom.window.document.styleSheets).map(sheet => sheet.href);
        const fonts = [];

        stylesheets.forEach(sheet => {
            if (sheet) fonts.push(sheet); // Collect stylesheet URLs
        });

        res.json({ fonts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Unable to analyze the site' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
