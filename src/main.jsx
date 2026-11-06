import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  ArrowRight,
  Waves,
  Play,
  ScanLine,
  MapPin,
  Layers,
  Navigation,
  FileDown,
  Plus,
  Minus,
  Menu,
  X,
  MoveUpRight,
  Video,
  Mountain,
  Leaf,
  Sun,
  Moon,
} from "lucide-react";
import "./style.css";
import "./styles/scene.css";
import "./styles/mission.css";
import "./styles/presentation.css";
import "./styles/tracking-demo.css";

import Planner from "./Planner";
import Mission from "./Mission";
import TrackingDemo from "./TrackingDemo";
import RiverMap from "./RiverScene";

const objects = [
  {
    id: "01",
    x: 47,
    y: 37,
    lat: "47.02684",
    lon: "142.73512",
    name: "Древесный завал",
    type: "Скопление древесины в русле",
    score: 94,
  },
  {
    id: "02",
    x: 59,
    y: 60,
    lat: "47.02416",
    lon: "142.73908",
    name: "Древесный завал",
    type: "Скопление на отмели",
    score: 89,
  },
  {
    id: "03",
    x: 36,
    y: 77,
    lat: "47.02152",
    lon: "142.73164",
    name: "Древесный завал",
    type: "Скопление в прибрежной зоне",
    score: 91,
  },
];
const stages = [
  {
    name: "Съёмка",
    title: "Всё начинается с полёта",
    text: "Видео с беспилотника и файл SRT с полётной телеметрией — исходные данные для обследования реки.",
    icon: Video,
  },
  {
    name: "Распознавание",
    title: "Заметить то, что легко пропустить",
    text: "Нейросеть выделяет древесные завалы в кадре. Трекинг сопровождает объекты и помогает отфильтровать нестабильные обнаружения.",
    icon: ScanLine,
  },
  {
    name: "Геопривязка",
    title: "У каждого объекта — своё место",
    text: "Положение БПЛА, высота и углы камеры используются для расчёта координат. Повторные наблюдения объединяются в один объект.",
    icon: MapPin,
  },
  {
    name: "Результат",
    title: "От наблюдений к понятной картине",
    text: "Интерактивная карта, фотографии, видео с контурами и таблица объектов собираются в единый пакет результатов.",
    icon: Layers,
  },
];
function App() {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("river-theme");
      return (
        (["light", "dark"].includes(saved) ? saved : null) ||
        (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      );
    } catch {
      return "light";
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("river-theme", theme);
    } catch {}
  }, [theme]);
  const [planRequest, setPlanRequest] = useState(null);
  const [stage, setStage] = useState(3),
    [selected, setSelected] = useState(0),
    [menu, setMenu] = useState(false),
    [faq, setFaq] = useState(null);
  const item = objects[selected];
  function download() {
    const csv =
      "\uFEFFID;Объект;Широта;Долгота;Данные\n" +
      objects
        .map((o) => `${o.id};${o.name};${o.lat};${o.lon};Синтетический пример`)
        .join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "RIVER_demo.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      <header>
        <a href="#" className="logo" aria-label="RIVER — на главную">
          <Waves />
          <span>RIVER</span>
        </a>
        <nav className={menu ? "open" : ""}>
          {[
            ["#about", "О проекте"],
            ["#tracking-demo", "Наблюдения"],
            ["#demo", "Демонстрация"],
            ["#planner", "Планирование"],
          ].map(([href, label]) => (
            <a key={href} href={href} onClick={() => setMenu(false)}>
              {label}
            </a>
          ))}
        </nav>
        <button
          className="theme-toggle"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label={
            theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему"
          }
          title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <a className="header-cta" href="#demo">
          Исследовать проект <ArrowUpRight size={16} />
        </a>
        <button
          className="menu-toggle"
          onClick={() => setMenu(!menu)}
          aria-label={menu ? "Закрыть меню" : "Открыть меню"}
        >
          {menu ? <X /> : <Menu />}
        </button>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="status-dot" /> ТЕХНОЛОГИИ НА СЛУЖБЕ ПРИРОДЫ
            </div>
            <h1>
              Видеть реку.
              <br />
              Понимать <span>больше.</span>
            </h1>
            <p>
              От видео с беспилотника — к карте древесных завалов. RIVER
              помогает исследовать реки с помощью компьютерного зрения.
            </p>
            <div className="hero-actions">
              <a className="button primary" href="#demo">
                Посмотреть в действии <ArrowUpRight size={18} />
              </a>
              <a className="text-link" href="#planner">
                <span className="play-icon">
                  <Play size={12} fill="currentColor" />
                </span>
                Спланировать выезд
              </a>
            </div>
            <div className="hero-note">
              <span>Сахалинский центр ИИ</span>
              <span>Исследовательский проект · 2026</span>
            </div>
          </div>
          <div className="hero-visual">
            <RiverMap />
            <div className="visual-caption">
              <span>01 / НОВЫЙ ВЗГЛЯД НА РЕЧНЫЕ СИСТЕМЫ</span>
              <MoveUpRight size={16} />
            </div>
          </div>
        </section>
        <div className="capability-strip">
          <span>
            <ScanLine size={19} /> Нейросетевое обнаружение
          </span>
          <span>
            <Navigation size={19} /> Пространственный анализ
          </span>
          <span>
            <Layers size={19} /> Интерактивная карта
          </span>
          <span>
            <FileDown size={19} /> Готовые отчёты
          </span>
        </div>
        <section id="about" className="about section">
          <div className="section-kicker">01 / О ПРОЕКТЕ</div>
          <div className="about-grid">
            <h2>
              Большая река.
              <br />
              Каждая деталь
              <br />
              <span>имеет значение.</span>
            </h2>
            <div>
              <p className="large-copy">
                Древесные завалы — часть жизни реки. Чтобы изучать их влияние и
                планировать обследования, нужно знать, где они находятся.
              </p>
              <p>
                Ручной просмотр съёмки требует внимания к тысячам кадров. RIVER
                автоматизирует обнаружение и пространственный анализ: связывает
                наблюдения между собой и превращает видео в структурированные
                данные.
              </p>
              <a className="underlined" href="#workflow">
                Познакомиться с технологией <ArrowUpRight size={17} />
              </a>
            </div>
          </div>
          <div className="about-facts">
            <div>
              <strong>Видео + SRT</strong>
              <span>Исходные данные с БПЛА</span>
            </div>
            <div>
              <strong>Один объект</strong>
              <span>Вместо повторных наблюдений</span>
            </div>
            <div>
              <strong>Карта и отчёт</strong>
              <span>Результаты для дальнейшей работы</span>
            </div>
          </div>
        </section>
        <section id="workflow" className="workflow section">
          <div className="section-kicker">02 / ПРИНЦИП РАБОТЫ</div>
          <div className="section-heading">
            <h2>
              От полёта
              <br />
              до полной картины.
            </h2>
            <p>
              Четыре этапа превращают исходную съёмку
              <br className="desktop" /> в данные, с которыми можно работать.
            </p>
          </div>
          <div className="steps">
            {stages.map((s, i) => (
              <a
                className="step"
                href="#demo"
                key={s.name}
                onClick={() => setStage(i)}
              >
                <div className="step-top">
                  <span>0{i + 1}</span>
                  <s.icon size={25} />
                </div>
                <h3>{s.name}</h3>
                <p>{s.text}</p>
                <ArrowUpRight className="step-arrow" size={19} />
              </a>
            ))}
          </div>
        </section>
        <section id="demo" className="demo section">
          <div className="section-kicker">
            <span>03 / ИНТЕРАКТИВНАЯ ДЕМОНСТРАЦИЯ</span>
            <span className="demo-badge">
              <i /> МОЖНО ПОПРОБОВАТЬ
            </span>
          </div>
          <div className="section-heading">
            <h2>
              Проследите путь
              <br />
              <span>одного наблюдения.</span>
            </h2>
            <p>
              Переключайте этапы и выбирайте объекты на карте.
              <br />
              Так видео становится понятной историей реки.
            </p>
          </div>
          <div className="demo-workspace">
            <div
              className="demo-tabs"
              role="tablist"
              aria-label="Этапы обработки"
            >
              {stages.map((s, i) => (
                <button
                  key={s.name}
                  role="tab"
                  aria-selected={stage === i}
                  onClick={() => setStage(i)}
                >
                  <span>0{i + 1}</span>
                  {s.name}
                  {stage === i && <ArrowUpRight size={16} />}
                </button>
              ))}
            </div>
            <div className="demo-body">
              <RiverMap
                interactive
                stage={stage}
                selected={selected}
                onSelect={setSelected}
              />
              <aside>
                <div className="aside-eyebrow">
                  <span>ЭТАП 0{stage + 1}</span>
                </div>
                <h3>{stages[stage].title}</h3>
                <p>{stages[stage].text}</p>
                {stage > 0 ? (
                  <div className="object-card">
                    <div className="object-title">
                      <span className="object-number">{item.id}</span>
                      <div>
                        <strong>{item.name}</strong>
                        <small>{item.type}</small>
                      </div>
                    </div>
                    <div className="object-data">
                      <span>Координаты WGS84</span>
                      <strong>
                        {item.lat}° N<br />
                        {item.lon}° E
                      </strong>
                    </div>
                    <div className="confidence">
                      <span>
                        Уверенность модели <b>{item.score}%</b>
                      </span>
                      <div>
                        <i style={{ width: item.score + "%" }} />
                      </div>
                    </div>
                    <small className="synthetic-note">
                      Синтетические данные для демонстрации интерфейса, не
                      результаты измерений.
                    </small>
                  </div>
                ) : (
                  <div className="input-card">
                    <Video />
                    <strong>Видеосъёмка + телеметрия</strong>
                    <span>Координаты БПЛА · высота · углы камеры</span>
                  </div>
                )}
                <div className="aside-bottom">
                  {stage === 3 ? (
                    <button onClick={download}>
                      <FileDown size={16} /> Скачать пример CSV{" "}
                      <ArrowDownIcon />
                    </button>
                  ) : (
                    <button onClick={() => setStage(stage + 1)}>
                      Следующий этап <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </aside>
            </div>
            <div className="demo-footer">
              <span>
                <span className="status-dot" /> Демонстрационный сценарий
              </span>
              <span>
                Схема условная. Анализ видео в браузере не выполняется.
              </span>
            </div>
          </div>
        </section>
        <TrackingDemo />
        <Mission onPlan={setPlanRequest} />
        <Planner request={planRequest} />
        <section className="results section">
          <div className="section-kicker">05 / РЕЗУЛЬТАТЫ ОБРАБОТКИ</div>
          <div className="section-heading">
            <h2>
              Не просто обнаружить.
              <br />
              Сделать данные полезными.
            </h2>
            <p>
              Результаты одного обследования —<br />в нескольких удобных
              форматах.
            </p>
          </div>
          <div className="result-grid">
            {[
              {
                icon: MapPin,
                title: "Карта объектов",
                text: "Географическое положение завалов и фотографии для пространственного анализа.",
                tag: "ИНТЕРАКТИВНАЯ КАРТА",
              },
              {
                icon: Video,
                title: "Видео с контурами",
                text: "Обнаруженные объекты с масками, идентификаторами и уверенностью модели.",
                tag: "АННОТИРОВАННОЕ ВИДЕО",
              },
              {
                icon: FileDown,
                title: "Данные и отчёты",
                text: "Таблицы объектов и пакет материалов для дальнейшего изучения и документирования.",
                tag: "CSV / XLSX / ZIP",
              },
            ].map((r, i) => (
              <article key={r.title}>
                <div className="result-icon">
                  <r.icon size={28} />
                  <span>0{i + 1}</span>
                </div>
                <h3>{r.title}</h3>
                <p>{r.text}</p>
                <span className="result-tag">{r.tag}</span>
              </article>
            ))}
          </div>
        </section>
        <section id="future" className="future section">
          <div className="section-kicker">06 / ПЕРСПЕКТИВЫ</div>
          <div className="future-grid">
            <div>
              <h2>
                Технология сегодня.
                <br />
                <span>Возможности завтра.</span>
              </h2>
              <p>
                RIVER создаёт основу для системного наблюдения за речными
                территориями. Следующий шаг — развитие технологии и её проверка
                в новых условиях.
              </p>
              <span className="future-note">НАПРАВЛЕНИЯ РАЗВИТИЯ ПРОЕКТА</span>
            </div>
            <div className="future-list">
              {[
                {
                  icon: Waves,
                  title: "Мониторинг в динамике",
                  text: "Сопоставление повторных обследований для изучения изменений русла и древесных скоплений.",
                },
                {
                  icon: Mountain,
                  title: "Новые территории",
                  text: "Проверка моделей на реках с разной геометрией, растительностью и условиями съёмки.",
                },
                {
                  icon: Leaf,
                  title: "Поддержка исследований",
                  text: "Использование структурированных данных в экологических и гидрологических исследованиях.",
                },
              ].map((r) => (
                <article key={r.title}>
                  <r.icon size={25} />
                  <div>
                    <h3>{r.title}</h3>
                    <p>{r.text}</p>
                  </div>
                  <ArrowUpRight size={18} />
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="faq section">
          <div className="section-kicker">ПОЛЕЗНО ЗНАТЬ</div>
          <div className="faq-grid">
            <h2>
              Чуть больше
              <br />о технологии.
            </h2>
            <div>
              {[
                {
                  q: "RIVER обнаруживает ледовые заторы?",
                  a: "В представленной версии проект ориентирован на древесные завалы. Обнаружение ледовых заторов в документации не заявлено.",
                },
                {
                  q: "Насколько точны координаты объектов?",
                  a: "Координаты рассчитываются по телеметрии и геометрии камеры. Точность зависит от качества исходных данных, высоты над поверхностью и калибровки камеры. Подтверждённая численная оценка точности в предоставленных материалах отсутствует.",
                },
                {
                  q: "Можно ли загрузить своё видео на этом сайте?",
                  a: "Этот сайт знакомит с проектом и показывает условный сценарий. Реальная обработка видео выполняется в отдельном приложении RIVER; загрузка файлов и нейросетевой анализ на лендинге не предусмотрены.",
                },
              ].map((r, i) => (
                <div className="faq-item" key={r.q}>
                  <button
                    aria-expanded={faq === i}
                    onClick={() => setFaq(faq === i ? null : i)}
                  >
                    {r.q}
                    {faq === i ? <Minus size={18} /> : <Plus size={18} />}
                  </button>
                  {faq === i && <p>{r.a}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="closing">
          <Waves size={37} />
          <h2>
            Понимание реки
            <br />
            начинается с наблюдения.
          </h2>
          <a className="button primary" href="#demo">
            Исследовать RIVER <ArrowUpRight size={18} />
          </a>
          <span>КОМПЬЮТЕРНОЕ ЗРЕНИЕ. ПРИРОДНЫЕ СИСТЕМЫ. НОВЫЙ ВЗГЛЯД.</span>
        </section>
      </main>
      <footer>
        <div className="footer-top">
          <a href="#" className="logo">
            <Waves />
            <span>RIVER</span>
          </a>
          <span>
            Автоматизированное выявление и пространственный
            <br />
            анализ древесных завалов на реках.
          </span>
          <a href="#">Наверх ↑</a>
        </div>
        <div className="credits">
          <span>© 2026 Сахалинский центр ИИ</span>
          <span>
            Авторы: Л. В. Шумилова · М. Ш. Галиулин · А. П. Каменев · В. С.
            Басаргина
          </span>
        </div>
      </footer>
    </>
  );
}
function ArrowDownIcon() {
  return <ArrowUpRight size={16} />;
}
createRoot(document.getElementById("root")).render(<App />);
