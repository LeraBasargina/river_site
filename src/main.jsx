import React, { useState, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
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

import Mission from "./Mission";
import Survey from "./Survey";
import AutoShow from "./AutoShow";
import TrackingDemo from "./TrackingDemo";
const stages = [
  {
    name: "Съёмка",
    text: "Видео с беспилотника и файл SRT с полётной телеметрией — исходные данные для обследования реки.",
    icon: Video,
  },
  {
    name: "Распознавание",
    text: "Нейросеть выделяет древесные завалы в кадре. Трекинг сопровождает объекты и помогает отфильтровать нестабильные обнаружения.",
    icon: ScanLine,
  },
  {
    name: "Геопривязка",
    text: "Положение БПЛА, высота и углы камеры используются для расчёта координат. Повторные наблюдения объединяются в один объект.",
    icon: MapPin,
  },
  {
    name: "Результат",
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
  const [showOpen, setShowOpen] = useState(false);
  const closeShow = useCallback(() => setShowOpen(false), []);
  const [menu, setMenu] = useState(false);
  const [faq, setFaq] = useState(null);
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
            ["#video", "Видео"],
            ["#survey", "Обследование"],
            ["#planner", "План устранения"],
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
        <button className="header-cta start-presentation" type="button" onClick={() => setShowOpen(true)}
          aria-label="Запустить автопрезентацию сайта" aria-pressed={showOpen}>
          <Play size={16} /> <span>Автопрезентация</span>
        </button>
        <button
          className="menu-toggle"
          onClick={() => setMenu(!menu)}
          aria-label={menu ? "Закрыть меню" : "Открыть меню"}
        >
          {menu ? <X /> : <Menu />}
        </button>
      </header>
      <main>
        <section id="intro" className="hero">
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
              <a className="button primary" href="#video">
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
            <a className="hero-photo" href="#survey" aria-label="Перейти к карте обследования Лютоги">
              <img src="/media/survey-intro-poster.jpg" alt="Речной участок с высоты полёта беспилотника" />
            </a>
            <div className="visual-caption">
              <span>СЪЁМКА С БЕСПИЛОТНИКА</span>
              <a href="#survey" aria-label="Открыть материалы обследования">
                <ArrowUpRight size={16} />
              </a>
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
                href={["#video", "#tracking-demo", "#survey-map-panel", "#survey"][i]}
                key={s.name}
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
        <Mission />
        <TrackingDemo />
        <Survey onPresentationOpen={closeShow} />
        <section id="results" className="results section">
          <div className="section-kicker">04 / РЕЗУЛЬТАТЫ ОБРАБОТКИ</div>
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
          <div className="section-kicker">05 / ПЕРСПЕКТИВЫ</div>
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
        <section id="closing" className="closing">
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
      {showOpen && <AutoShow close={closeShow} />}
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
createRoot(document.getElementById("root")).render(<App />);
