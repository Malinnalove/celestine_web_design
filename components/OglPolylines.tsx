"use client";

import { useEffect, useMemo, useRef } from "react";

type OglModule = typeof import("ogl");

type OglPolylinesProps = {
  variant?: "calm" | "beast";
  fullScreen?: boolean;
  hideChrome?: boolean;
  className?: string;
};

export default function OglPolylines({
  variant = "calm",
  fullScreen = false,
  hideChrome = false,
  className = "",
}: OglPolylinesProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const palette = useMemo(
    () =>
      variant === "beast"
        ? [
            "#ff5c00", // searing orange
            "#ff1f3d", // punch red
            "#ff8a00", // vivid amber
            "#ff2ec4", // neon pink
            "#0c0c0c", // anchor black
          ]
        : ["#e09f7d", "#ef5d60", "#ec4067", "#a01a7d", "#311847"],
    [variant],
  );
      const paletteKey = palette.join(",");

      useEffect(() => {
        let stop = false;
        let frame: number | null = null;
        let ogl: OglModule | null = null;
    let renderer: any = null;
    const lines: any[] = [];

    const init = async () => {
      if (!containerRef.current) return;

      ogl = await import("ogl");
      const { Renderer, Transform, Vec3, Color, Polyline } = ogl;

      renderer = new Renderer({ dpr: Math.min(2, window.devicePixelRatio || 1) });
      const gl = renderer.gl;
      gl.clearColor(0.96, 0.95, 0.93, 1);

      const scene = new Transform();
      containerRef.current.appendChild(gl.canvas);

      const resize = () => {
        if (!containerRef.current) return;
        const { width, height } = containerRef.current.getBoundingClientRect();
        renderer.setSize(width, height);
        lines.forEach((line) => line.polyline.resize());
      };
      window.addEventListener("resize", resize);
      resize();

      const mouse = new Vec3();
      const tmp = new Vec3();

      const updateMouse = (e: MouseEvent | TouchEvent) => {
        const point = "changedTouches" in e && e.changedTouches?.length ? e.changedTouches[0] : (e as MouseEvent);
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = point.clientX - rect.left;
        const y = point.clientY - rect.top;
        mouse.set((x / rect.width) * 2 - 1, (y / rect.height) * -2 + 1, 0);
      };

      if ("ontouchstart" in window) {
        window.addEventListener("touchstart", updateMouse, { passive: true });
        window.addEventListener("touchmove", updateMouse, { passive: true });
      } else {
        window.addEventListener("mousemove", updateMouse);
      }

      const makeRandom = (a: number, b: number) => a + Math.random() * (b - a);
      const thicknessScale = typeof window !== "undefined" && window.innerWidth < 768 ? 0.5 : 1;

      // Beast gets deliberately exaggerated spread per line; calm stays closer to the original feel.
      const springRange = variant === "beast" ? [0.015, 0.12] : [0.02, 0.08];
      const frictionRange = variant === "beast" ? [0.5, 0.98] : [0.72, 0.94];
      // How far lines stray from the cursor; lower to keep them closer.
      const offsetAmplitudeBase = variant === "beast" ? 0.012 : 0.02;
      const thicknessRange = variant === "beast" ? [18, 56] : [18, 44];

      palette.forEach((color) => {
        const line: any = {
          spring: makeRandom(springRange[0], springRange[1]),
          friction: makeRandom(frictionRange[0], frictionRange[1]),
          mouseVelocity: new Vec3(),
          mouseOffset: new Vec3(
            makeRandom(-1, 1) * (variant === "beast" ? makeRandom(0.005, 0.04) : offsetAmplitudeBase),
            makeRandom(-1, 1) * (variant === "beast" ? makeRandom(0.005, 0.04) : offsetAmplitudeBase),
            0,
          ),
          lerpFactor: variant === "beast" ? makeRandom(0.65, 0.95) : 0.9,
        };

        const count = variant === "beast" ? Math.floor(makeRandom(16, 28)) : 20;
        const points: InstanceType<typeof Vec3>[] = (line.points = []);
        for (let i = 0; i < count; i++) points.push(new Vec3());

        const thicknessBase = makeRandom(thicknessRange[0], thicknessRange[1]);
        const thicknessJitter = variant === "beast" ? makeRandom(0.6, 1.6) : 1;

        line.polyline = new Polyline(gl, {
          points,
          vertex: /* glsl */ `
            precision highp float;
            attribute vec3 position;
            attribute vec3 next;
            attribute vec3 prev;
            attribute vec2 uv;
            attribute float side;
            uniform vec2 uResolution;
            uniform float uDPR;
            uniform float uThickness;
            vec4 getPosition() {
              vec4 current = vec4(position, 1.0);
              vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
              vec2 nextScreen = next.xy * aspect;
              vec2 prevScreen = prev.xy * aspect;
              vec2 tangent = normalize(nextScreen - prevScreen);
              vec2 normal = vec2(-tangent.y, tangent.x);
              normal /= aspect;
              normal *= mix(1.0, 0.1, pow(abs(uv.y - 0.5) * 2.0, 2.0));
              float dist = length(nextScreen - prevScreen);
              normal *= smoothstep(0.0, 0.02, dist);
              float pixelWidthRatio = 1.0 / (uResolution.y / uDPR);
              float pixelWidth = current.w * pixelWidthRatio;
              normal *= pixelWidth * uThickness;
              current.xy -= normal * side;
              return current;
            }
            void main() {
              gl_Position = getPosition();
            }
          `,
          uniforms: {
            uColor: { value: new Color(color) },
            uThickness: {
              value: thicknessBase * thicknessJitter * thicknessScale,
            },
          },
        });

        line.polyline.mesh.setParent(scene);
        lines.push(line);
      });

      const update = () => {
        if (stop) return;
        frame = requestAnimationFrame(update);

        lines.forEach((line) => {
          for (let i = line.points.length - 1; i >= 0; i--) {
            if (i === 0) {
              tmp.copy(mouse).add(line.mouseOffset).sub(line.points[i]).multiply(line.spring);
              line.mouseVelocity.add(tmp).multiply(line.friction);
              line.points[i].add(line.mouseVelocity);
            } else {
              line.points[i].lerp(line.points[i - 1], line.lerpFactor);
            }
          }
          line.polyline.updateGeometry();
        });

        renderer.render({ scene });
      };

      update();

      return () => {
        stop = true;
        if (frame) cancelAnimationFrame(frame);
        window.removeEventListener("resize", resize);
        if ("ontouchstart" in window) {
          window.removeEventListener("touchstart", updateMouse);
          window.removeEventListener("touchmove", updateMouse);
        } else {
          window.removeEventListener("mousemove", updateMouse);
        }
        const container = containerRef.current;
        if (gl && gl.canvas && container && gl.canvas.parentNode === container) {
          container.removeChild(gl.canvas);
        }
        const loseContext = gl?.getExtension?.("WEBGL_lose_context");
        loseContext?.loseContext();
      };
    };

    const cleanupPromise = init();

    return () => {
      stop = true;
      if (frame) cancelAnimationFrame(frame);
      cleanupPromise?.then((cleanup) => {
        if (typeof cleanup === "function") cleanup();
      });
    };
  }, [variant, paletteKey]);

  const wrapperClasses = fullScreen
    ? `relative h-full w-full pointer-events-none ${className}`
    : `relative overflow-hidden rounded-3xl border border-ink/10 bg-gradient-to-br from-sand via-white to-petal/30 shadow-soft ${className}`;

  return (
    <div className={wrapperClasses}>
      {!hideChrome && (
        <div className="absolute left-4 top-3 z-10 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-ink shadow-sm">
          OGL Lines · Move your mouse
        </div>
      )}
      <div ref={containerRef} className={fullScreen ? "absolute inset-0" : "h-[60vh] w-full"} />
    </div>
  );
}
