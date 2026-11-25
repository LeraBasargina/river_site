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
  const hero = p.locator(".hero-visual");
  const demo = p.locator("#demo");
  if (await hero.getByRole("button", { name: /Объект №/ }).count() !== 22)
    throw Error("Homepage did not use the 22 report points");
  await hero.getByRole("button", { name: "Объект №22", exact: true }).click();
  await demo.getByAltText("Кадр из отчёта с разметкой объекта №22").waitFor();
  await demo.getByLabel("Объект из отчёта").selectOption("7");
  await p.locator("#survey").getByAltText("Кадр из отчёта с разметкой объекта №7").waitFor();
  await demo.getByRole("button", { name: "Приблизить" }).click();
  if (!(await demo.locator(".survey-map-content").getAttribute("style")).includes("scale(1.25)"))
    throw Error("Zoom did not scale the report map");
  await demo.getByRole("button", { name: "Сбросить масштаб" }).click();
  await demo.getByRole("button", { name: "Дороги, здания и лес" }).click();
  if (await demo.locator(".survey-layer-roads").count()) throw Error("Layer toggle did not hide roads");
  await demo.getByRole("button", { name: "Дороги, здания и лес" }).click();
  await demo.getByRole("button", { name: "Точки обследования" }).click();
  if (await demo.locator(".survey-pin").count()) throw Error("Report markers did not hide");
  await demo.getByRole("button", { name: "Точки обследования" }).click();
  await demo.getByRole("tab", { name: "Съёмка" }).click();
  if (await demo.locator(".survey-pin").count()) throw Error("Filming stage shows report markers before analysis");
  await demo.getByRole("tab", { name: "Результат" }).click();
  const [reportCsv] = await Promise.all([
    p.waitForEvent("download"),
    demo.getByRole("button", { name: "Скачать данные отчёта (CSV)" }).click(),
  ]);
  const csv = fs.readFileSync(await reportCsv.path(), "utf8").trim().split("\n");
  if (csv.length !== 23 || !csv[1].includes("46.7722583;142.4938747;A") ||
      !csv[22].includes("46.782232;142.4868631;C"))
    throw Error("Demonstration CSV did not contain the report points");
  await p.getByLabel("Заметка к фрагменту").fill("Заметка участка A");
  const route = p.getByRole("group", { name: "Контрольные точки облёта" });
  await route.getByRole("button", { name: /Обзор излучины/ }).click();
  if (await p.getByLabel("Заметка к фрагменту").inputValue())
    throw Error("Note leaked A to B");
  await p.getByLabel("Заметка к фрагменту").fill("Заметка участка B");
  await route.getByRole("button", { name: /Начало облёта/ }).click();
  if (
    (await p.getByLabel("Заметка к фрагменту").inputValue()) !==
    "Заметка участка A"
  )
    throw Error("Draft A lost");
  if (await p.locator(".spotter-panel,.spotter-gallery").count())
    throw Error("Removed photo exercise still present");
  const tracking = p.locator("#tracking-demo");
  await tracking.getByRole("tab", { name: /Связать между кадрами/ }).click();
  if ((await tracking.locator(".tracking-frames .track-focus").count()) !== 3)
    throw Error("Tracking highlights missing");
  await tracking.getByRole("button", { name: "Открыть кадр 00:01" }).click();
  await p.getByRole("dialog", { name: "Кадр 00:01" }).waitFor();
  await p.keyboard.press("Escape");
  await tracking
    .getByRole("button", { name: "Следующий шаг", exact: true })
    .click();
  await tracking
    .locator(".merge-output")
    .getByText("T-01", { exact: true })
    .waitFor();
  const mission = p.locator("#video");
  await route.getByRole("button", { name: /Обзор излучины/ }).click();
  const video = mission.getByLabel("Видео обследования реки");
  await p.waitForFunction(() => {
    const player = document.querySelector("#video video");
    return player?.readyState >= 1 && Math.abs(player.currentTime - 9) < 0.15;
  });
  if (!(await video.locator("source").getAttribute("src")).endsWith("survey-segmentation.mp4"))
    throw Error("Contour mode did not use the new source");
  await mission.getByRole("button", { name: "Детекция рамками" }).click();
  await p.waitForFunction(() => {
    const player = document.querySelector("#video video");
    return player?.readyState >= 1 && Math.abs(player.currentTime - 24) < 0.15;
  });
  const surveyMap = p.locator("#survey-map-panel");
  await surveyMap.locator(".survey-layer-water path").first().waitFor();
  await surveyMap.locator(".survey-layer-roads path").first().waitFor();
  await surveyMap.locator(".survey-layer-buildings path").first().waitFor();
  await surveyMap.getByRole("button", { name: "Объект №22" }).click();
  await p.locator("#survey .survey-photo-link").getByAltText("Кадр из отчёта с разметкой объекта №22").waitFor();
  await p.locator("#survey").getByRole("button", { name: "Участок C в план" }).click();
  const planner = p.locator("#planner");
  const northern = planner.getByRole("button", { name: /Северо-западный участок/ }).filter({ hasText: "Северо-западный участок" });
  const southernPin = planner.getByRole("button", { name: /Участок A на карте/ });
  if (await northern.getAttribute("aria-pressed") !== "true") throw Error("Report reach was not added");
  await southernPin.click();
  if (await planner.locator(".survey-pin.is-in-plan").count() !== 15) throw Error("Planning map highlights the wrong report points");
  await planner.getByLabel("Дата выезда").fill("2026-12-01");
  await planner.locator("summary").click();
  await planner.getByLabel("Заметка участка C").fill("Проверить доступ к берегу");
  await planner.getByRole("button", { name: "Сохранить план" }).click();
  await planner.getByRole("button", { name: "План сохранён" }).waitFor();
  await planner.getByRole("button", { name: "Печатный план / PDF" }).click();
  const paper = p.getByRole("dialog", { name: "План выезда" });
  await paper.getByText("8 объектов из отчёта · № 15–22").waitFor();
  await paper.getByText("Проверить доступ к берегу").waitFor();
  await p.keyboard.press("Escape");
  const [download] = await Promise.all([
    p.waitForEvent("download"),
    planner.getByRole("button", { name: "Скачать план JSON" }).click(),
  ]);
  const plan = JSON.parse(fs.readFileSync(await download.path(), "utf8"));
  if (plan.route.map((row) => row.section_id).join() !== "A,C" ||
      plan.route[1].report_objects.map((point) => point.id).join() !== "15,16,17,18,19,20,21,22")
    throw Error("JSON export did not match the selected report sections");
  await p.reload();
  if (await planner.locator(".reach-card.selected").count() !== 2) throw Error("Saved survey sections did not restore");
  await p.getByRole("button", { name: "Смотреть автопоказ · 90 сек." }).click();
  const show = p.getByRole("dialog", { name: /RIVER.*AIJ-2026/ });
  const playhead = show.getByRole("slider", { name: "Позиция автопоказа" });
  await playhead.fill("42");
  await show.getByRole("heading", { name: "Объект № 7" }).waitFor();
  await playhead.fill("53");
  await show.getByRole("heading", { name: "Объект № 19" }).waitFor();
  await playhead.fill("65");
  await show.getByText("Учебный пример", { exact: true }).waitFor();
  await playhead.fill("89.7");
  await show.getByRole("button", { name: "Воспроизвести" }).click();
  await show.getByRole("heading", { name: "RIVER", exact: true }).waitFor();
  await show.getByRole("button", { name: "Пауза" }).waitFor();
  await show.getByRole("button", { name: "К карте" }).click();
  await show.waitFor({ state: "detached" });
  if ((await p.evaluate(() => document.activeElement.id)) !== "survey-map-panel")
    throw Error("Autoplay did not return focus to the survey map");
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
    "PASS: stored data, independent drafts, report-to-plan selection/print/JSON, autoplay, links, images, responsive layouts, no JS errors",
  );
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
