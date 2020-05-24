const express = require('express')
const app = express()
const path = require('path')
const router = express.Router()
const bodyParser = require('body-parser')
const puppeteer = require('puppeteer');
const fs = require('fs');
require('dotenv/config')
const email = process.env.LOGIN
const pass = process.env.PASS

const server = require('http').createServer(app)

app.use(bodyParser.json())

router.get('/', async (req, res) => {
  res.sendFile(path.join(__dirname + '/index.html'))
})

function extractItems() {
  const extractedElements = document.querySelectorAll('._2b06');
  const items = [];
  extractedElements.forEach(name => {
    if (name.innerHTML.indexOf('<div class="_7_cb _3-8m">') == -1) {
      items.push(
        "Nome: " + name.children[0].innerText + " - " + "Comentário: " + name.children[1].innerText + "\n\n"
      )
    }
  })
  return items;
}

function newUrl(url) {
  const newUrl = url.replace("https://www.facebook", "https://m.facebook")
  return newUrl
}


router.post('/sorteio', async (req, res) => {

  const { link } = req.body

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  page.setViewport({ width: 1200, height: 926 });

  await page.goto("https://www.facebook.com/");

  await page.type('#email', email);
  await page.type('#pass', pass);
  try {
    await page.click('#u_0_b');
  } catch (error) {
    await page.click('#u_0_4');
  }

  await page.waitForNavigation();

  await page.goto(newUrl(link));

  let items = []
  let items2 = []
  let next = true

  while (next) {

    items = await page.evaluate(extractItems)

    if ((await page.$('#see_next_553177888913884')) !== null) {
      await page.click('#see_next_553177888913884')

      await page.waitFor(2000)
    }

    items2 = await page.evaluate(extractItems)

    if (items.length >= items2.length) {
      next = false
    }
  }

  const html = []
  items.forEach((item) => {
    html.push(`<div class="item">${item}</div>`)
  })

  fs.writeFileSync('./imprimir/items.html', html.join("\n"));

  await browser.close();

  return res.sendFile(path.join(__dirname + '/imprimir/items.html'))
})

app.use('/', router)

const port = process.env.port || 30000
server.listen(port, () => {
  console.log(`rodando na porta ${port}`);
})