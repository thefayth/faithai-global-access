import { lazy, Suspense, useState } from "react";
import { TerminalWalkthrough } from "./TerminalWalkthrough.jsx";
import { experienceForHostname } from "./experience-lane.js";

const ClassicApp = lazy(() => import("./ClassicApp.jsx").then((module) => ({ default: module.ClassicApp })));

function terminalIsDefault() {
  return String(import.meta.env.VITE_FAITHAI_WALKTHROUGH_DEFAULT ?? "true").toLowerCase() !== "false";
}

function ClassicLoading() {
  return <main className="terminal-loading" role="status"><pre>FAITHAI\n\nLOADING CLASSIC VIEW...\n\n_</pre></main>;
}

export function App() {
  const [surface, setSurface] = useState(() => ({ mode: terminalIsDefault() ? "terminal" : "classic", view: null }));
  const [experience, setExperience] = useState(() => experienceForHostname(window.location.hostname));
  const [sessionVersion, setSessionVersion] = useState(0);
  const adsDisabled = experience === "binet" || experienceForHostname(window.location.hostname) === "binet" || import.meta.env.VITE_EXPERIENCE === "binet";
  return (
    <>
      <div hidden={surface.mode !== "terminal"}>
      <TerminalWalkthrough
        key={sessionVersion}
        active={surface.mode === "terminal"}
        onExperienceChange={setExperience}
        onClassic={() => setSurface({ mode: "classic", view: null })}
        onOpenClassic={(view) => setSurface({ mode: "classic", view })}
      />
      </div>
      {surface.mode === "classic" ?
    <Suspense fallback={<ClassicLoading />}>
      <ClassicApp initialView={surface.view} adsDisabled={adsDisabled} forcedLocale={experience === "binet" ? "en" : null} onLocalCleared={() => setSessionVersion((value) => value + 1)} onTerminal={() => setSurface({ mode: "terminal", view: null })} />
    </Suspense>
      : null}
    </>
  );
}
