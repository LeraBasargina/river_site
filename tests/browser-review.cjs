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
  const stand = p.locator("#survey");
  const surveyMap = stand.locator("#survey-map-panel");
  const registry = stand.getByRole("region", { name: /Объекты из отчёта/ });
  if (await p.locator("main .survey-map").count() !== 1)
    throw Error("The page must use a single survey map");
  if (await stand.getByRole("tablist").count()) throw Error("Legacy processing tabs are still visible");
  if (await surveyMap.getByRole("button", { name: /Объект №/ }).count() !== 22 ||
      await registry.locator("tbody tr").count() !== 22)
    throw Error("The survey map and registry must contain all 22 report objects");
  await surveyMap.getByRole("button", { name: "Объект №22", exact: true }).click();
  await stand.getByAltText("Кадр из отчёта с разметкой объекта №22").waitFor();
  if (await registry.getByRole("button", { name: "Показать объект №22 на карте" }).getAttribute("aria-pressed") !== "true")
    throw Error("The clicked map point did not select its registry row");
  if (!(await registry.evaluate((list) => {
    const row = list.querySelector("tbody tr.is-selected").getBoundingClientRect();
    const header = list.querySelector("thead th").getBoundingClientRect();
    return row.top >= header.bottom - 1 && row.bottom <= list.getBoundingClientRect().bottom;
  }))) throw Error("The registry must scroll its selected row into view");
  await registry.getByRole("button", { name: "Показать объект №7 на карте" }).click();
  await stand.getByAltText("Кадр из отчёта с разметкой объекта №7").waitFor();
  if (await surveyMap.getByRole("button", { name: "Объект №7", exact: true }).getAttribute("aria-pressed") !== "true")
    throw Error("The registry did not select its map point");
  await stand.getByRole("button", { name: "Приблизить" }).click();
  if (!(await surveyMap.locator(".survey-map-content").getAttribute("style")).includes("scale(1.25)"))
    throw Error("Zoom did not scale the report map");
  await stand.getByRole("button", { name: "Сбросить масштаб" }).click();
  await stand.getByRole("button", { name: "Дороги, здания и лес" }).click();
  if (await surveyMap.locator(".survey-layer-roads").count()) throw Error("Layer toggle did not hide roads");
  await stand.getByRole("button", { name: "Дороги, здания и лес" }).click();
  await stand.getByRole("button", { name: "Точки обследования" }).click();
  if (await surveyMap.locator(".survey-pin").count()) throw Error("Report markers did not hide");
  await stand.getByRole("button", { name: "Точки обследования" }).click();
  if ((await surveyMap.locator(".survey-pin.is-on-bank").count()) !== 3)
    throw Error("Report markers did not distinguish bank and water detections");
  const demoFlight = surveyMap.locator(".survey-demo-flight");
  const demoDrone = demoFlight.locator(".survey-demo-drone");
  const initialPosition = await demoDrone.evaluate((drone) => drone.getCTM().e);
  await p.waitForFunction((x) =>
    Math.abs(document.querySelector(".survey-demo-drone").getCTM().e - x) > 1,
    initialPosition
  );
  await stand.getByRole("button", { name: "Пауза пролёта" }).click();
  if (!(await demoFlight.evaluate((map) => map.animationsPaused())))
    throw Error("Drone flight did not pause");
  await stand.getByRole("button", { name: "Продолжить пролёт" }).click();
  if (await demoFlight.evaluate((map) => map.animationsPaused()))
    throw Error("Drone flight did not resume");
  await stand.getByRole("button", { name: "Повторить пролёт с начала" }).click();
  if (await demoFlight.evaluate((map) => map.getCurrentTime()) > 0.5)
    throw Error("Drone flight did not restart");
  await stand.getByRole("button", { name: "Маршрут БПЛА" }).click();
  if (await demoFlight.count()) throw Error("Flight toggle did not hide the route");
  await stand.getByRole("button", { name: "Маршрут БПЛА" }).click();
  await demoFlight.waitFor();
  const [reportCsv] = await Promise.all([
    p.waitForEvent("download"),
    stand.getByRole("button", { name: "Скачать данные отчёта (CSV)" }).click(),
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
  await surveyMap.locator(".survey-layer-water path").first().waitFor();
  await surveyMap.locator(".survey-layer-roads path").first().waitFor();
  await surveyMap.locator(".survey-layer-buildings path").first().waitFor();
  await surveyMap.getByRole("button", { name: "Объект №22" }).click();
  await p.locator("#survey .survey-photo-link").getByAltText("Кадр из отчёта с разметкой объекта №22").waitFor();
  await p.locator("#survey").getByRole("button", { name: "Участок C в план" }).click();
  const planner = p.locator("#planner");
  const northern = planner.getByRole("button", { name: /Северо-западный участок/ }).filter({ hasText: "Северо-западный участок" });
  const southernPin = surveyMap.getByRole("button", { name: /Участок A на карте/ });
  if (await northern.getAttribute("aria-pressed") !== "true") throw Error("Report reach was not added");
  await southernPin.click();
  if (await surveyMap.locator(".survey-pin.is-in-plan").count() !== 15) throw Error("Planning map highlights the wrong report points");
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
  const presentation = p.getByRole("dialog", { name: "Автопрезентация обследования" });
  const watchPresentation = p.getByRole("button", { name: "Автопрезентация · 90 сек." });
  await watchPresentation.click();
  await presentation.waitFor();
  await p.waitForFunction(() => {
    const video = document.querySelector(".survey-presentation[open] video");
    return video?.loop && Math.abs(video.duration - 90) < 0.1 && video.currentTime > 0;
  });
  if (await p.getByRole("region", { name: "Управление автопрезентацией" }).count())
    throw Error("The survey video started site scrolling");
  await presentation.getByRole("button", { name: "К карте" }).click();
  await presentation.waitFor({ state: "hidden" });
  await p.waitForFunction(() => document.querySelector(".survey-presentation video")?.paused);
  await watchPresentation.click();
  await presentation.waitFor();
  await p.keyboard.press("Escape");
  await presentation.waitFor({ state: "hidden" });
  await p.emulateMedia({ reducedMotion: "reduce" });
  await p.clock.install();
  await p.getByRole("button", { name: "Запустить автопрезентацию сайта" }).click();
  const show = p.getByRole("region", { name: "Управление автопрезентацией" });
  await show.getByText("RIVER", { exact: true }).waitFor();
  await p.clock.fastForward(7200);
  await show.getByText("О проекте", { exact: true }).waitFor();
  await show.getByRole("button", { name: "Пауза автопрезентации" }).click();
  await p.clock.fastForward(20000);
  await show.getByText("О проекте", { exact: true }).waitFor({ timeout: 1000 });
  const next = show.getByRole("button", { name: "Следующий экран" });
  await next.click();
  await next.click();
  await p.locator("#survey-footage[open]").waitFor();
  await next.click();
  await show.getByText("Дефектовка и реестр", { exact: true }).waitFor();
  await p.waitForFunction(() => document.querySelector("#survey-map-panel").getBoundingClientRect().top < 175);
  await next.click();
  await show.getByText("План выезда", { exact: true }).waitFor();
  for (let i = 0; i < 4; i += 1) await next.click();
  await show.getByText("RIVER", { exact: true }).waitFor();
  await p.keyboard.press("Escape");
  await show.waitFor({ state: "detached" });
  if (await p.locator("#survey-footage[open]").count()) throw Error("Autoplay did not restore footage disclosure");
  if (await planner.locator(".reach-card.selected").count() !== 2) throw Error("Autoplay changed the user's plan");
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
