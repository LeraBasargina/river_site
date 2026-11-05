const { chromium } = require("playwright");
const fs = require("node:fs");
(async () => {
  const b = await chromium.launch({
    executablePath:
      process.env.CHROMIUM_PATH ||
      (fs.existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
    headless: true,
    args: ["--no-sandbox"],
  });
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.addInitScript(() => {
    localStorage.setItem(
      "river-field-plan",
      JSON.stringify({
        selected: { bad: true },
        date: "2026-02-30",
        observations: { A: { note: { bad: true }, status: {} } },
      }),
    );
    localStorage.setItem("river-theme", "invalid");
  });
  await p.goto(process.env.BASE_URL || "http://127.0.0.1:5173");
  await p.getByRole("heading", { level: 1 }).waitFor();
  if ((await p.getByLabel("Дата выезда").inputValue()) !== "")
    throw Error("Bad date restored");
  if (
    !["light", "dark"].includes(
      await p.locator("html").getAttribute("data-theme"),
    )
  )
    throw Error("Bad theme restored");
  await p.getByLabel("Заметка для бригады").fill("Заметка участка A");
  const route = p.getByRole("group", { name: "Контрольные точки облёта" });
  await route.getByRole("button", { name: /Обзор излучины/ }).click();
  if (await p.getByLabel("Заметка для бригады").inputValue())
    throw Error("Note leaked A to B");
  await p.getByLabel("Заметка для бригады").fill("Заметка участка B");
  await route.getByRole("button", { name: /Начало облёта/ }).click();
  if (
    (await p.getByLabel("Заметка для бригады").inputValue()) !==
    "Заметка участка A"
  )
    throw Error("Draft A lost");
  const broken = await p.evaluate(() =>
    [...document.querySelectorAll('a[href^="#"]')]
      .map((a) => a.getAttribute("href"))
      .filter((h) => h.length > 1 && !document.getElementById(h.slice(1))),
  );
  if (broken.length) throw Error("Broken anchors " + broken);
  const imgs = await p
    .locator("img")
    .evaluateAll((imgs) =>
      imgs.filter((i) => i.complete && !i.naturalWidth).map((i) => i.src),
    );
  if (imgs.length) throw Error("Broken images " + imgs);
  for (const width of [320, 390, 768, 1440]) {
    await p.setViewportSize({ width, height: 900 });
    if (
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)
    )
      throw Error("Overflow " + width);
  }
  if (errors.length) throw Error(errors.join(";"));
  console.log(
    "PASS: corrupted stored plan recovery, invalid theme recovery, independent A/B drafts, internal links, image loading, 320/390/768/1440 layouts, no JS errors",
  );
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
