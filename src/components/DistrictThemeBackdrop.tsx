import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { getDistrictScene, getDistrictTheme, type DistrictTheme } from "@/lib/district-themes";

function AmbientPattern({ theme }: { theme: DistrictTheme }) {
  const { ambientAnimationType: type, ambientAnimationParams: params } = theme;
  const items = Array.from({ length: params.density }, (_, index) => index);
  return (
    <div className={`district-ambient district-ambient-${type}`} aria-hidden="true">
      {items.map((index) => <i key={index} style={{ "--ambient-index": index } as CSSProperties} />)}
    </div>
  );
}

function IllustratedScene({ districtId }: { districtId: string }) {
  const scene = getDistrictScene(districtId);
  return (
    <div className={`district-scene is-${scene.landscape} composition-${scene.composition}`} aria-hidden="true">
      <div className="district-sky"><i className="district-sun" /><i className="district-cloud cloud-one" /><i className="district-cloud cloud-two" /></div>
      <div className="district-horizon horizon-far" />
      <div className="district-horizon horizon-near" />
      <div className="district-land-detail">
        {Array.from({ length: 7 }, (_, index) => <i key={index} style={{ "--detail-index": index } as CSSProperties} />)}
      </div>
      <div className="district-water-lines"><i /><i /><i /></div>
      <div className="district-foreground"><i /><i /><i /></div>
    </div>
  );
}

function ThemeLayer({ districtId, ambient = false, leaving = false }: { districtId: string; ambient?: boolean; leaving?: boolean }) {
  const theme = getDistrictTheme(districtId);
  const scene = getDistrictScene(districtId);
  const style = {
    "--district-color-a": theme.gradientColors[0],
    "--district-color-b": theme.gradientColors[1],
    "--district-color-c": theme.gradientColors[2],
    "--district-ambient-speed": `${theme.ambientAnimationParams.speed}s`,
    "--district-ambient-opacity": theme.ambientAnimationParams.opacity,
    "--district-ambient-angle": `${theme.ambientAnimationParams.angle}deg`,
    "--district-horizon": `${scene.horizon}%`,
    "--district-sun-x": `${scene.sunPosition}%`,
    "--district-scene-scale": `${scene.foregroundScale / 100}`,
  } as CSSProperties;
  return <div className={`district-theme-layer ${leaving ? "is-leaving" : "is-entering"}`} style={style} aria-hidden="true"><IllustratedScene districtId={districtId} />{ambient ? <AmbientPattern theme={theme} /> : null}<div className="district-scene-shade" /></div>;
}

export function DistrictThemeBackdrop({ districtId, children }: { districtId: string; children: ReactNode }) {
  const lastDistrict = useRef(districtId);
  const [previousDistrict, setPreviousDistrict] = useState<string | null>(null);
  useEffect(() => {
    if (lastDistrict.current === districtId) return;
    setPreviousDistrict(lastDistrict.current);
    lastDistrict.current = districtId;
    const timer = window.setTimeout(() => setPreviousDistrict(null), 520);
    return () => window.clearTimeout(timer);
  }, [districtId]);
  return (
    <div className="kids-theme-shell">
      {previousDistrict ? <ThemeLayer districtId={previousDistrict} leaving /> : null}
      <ThemeLayer key={districtId} districtId={districtId} ambient />
      <div className="kids-theme-content">{children}</div>
    </div>
  );
}
