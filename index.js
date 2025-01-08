const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const { JSDOM } = require("jsdom");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/fonts", async (req, res) => {
  const site = req.query.site;
  if (!site) {
    return res.status(400).json({ error: "No site URL provided" });
  }

  try {
    const response = await fetch(site);
    const html = await response.text();
    const dom = new JSDOM(html);

    const elements = Array.from(dom.window.document.body.querySelectorAll("*"));
    const fontUsage = {};

    elements.forEach((el) => {
      const computedStyle = dom.window.getComputedStyle(el);
      const fontFamily = computedStyle.getPropertyValue("font-family");
      if (fontFamily) {
        const normalizedFont = fontFamily.split(",")[0].trim().replace(/['"]/g, "");
        fontUsage[normalizedFont] = (fontUsage[normalizedFont] || 0) + 1;
      }
    });

    const totalElements = elements.length;
    const fontPercentages = Object.entries(fontUsage).map(([font, count]) => ({
      font,
      percentage: ((count / totalElements) * 100).toFixed(2),
    }));

    res.json({ fonts: fontPercentages });
  } catch (error) {
    console.error("Error analyzing site:", error);
    res.status(500).json({ error: "Unable to analyze the site" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
