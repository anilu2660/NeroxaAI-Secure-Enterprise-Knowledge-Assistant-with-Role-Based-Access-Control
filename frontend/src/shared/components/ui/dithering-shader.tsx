import { useEffect, useRef } from "react";
import { cn } from "@/shared/utils/utils";

/**
 * Animated WebGL dithering shader field (ordered 8x8 Bayer dither over a
 * slow-moving fbm/sphere-like field). Purely decorative background.
 */
const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec3 u_color;

float bayer(vec2 c){
  int x = int(mod(c.x, 8.0));
  int y = int(mod(c.y, 8.0));
  int i = y * 8 + x;
  float m[64];
  m[0]=0.;m[1]=32.;m[2]=8.;m[3]=40.;m[4]=2.;m[5]=34.;m[6]=10.;m[7]=42.;
  m[8]=48.;m[9]=16.;m[10]=56.;m[11]=24.;m[12]=50.;m[13]=18.;m[14]=58.;m[15]=26.;
  m[16]=12.;m[17]=44.;m[18]=4.;m[19]=36.;m[20]=14.;m[21]=46.;m[22]=6.;m[23]=38.;
  m[24]=60.;m[25]=28.;m[26]=52.;m[27]=20.;m[28]=62.;m[29]=30.;m[30]=54.;m[31]=22.;
  m[32]=3.;m[33]=35.;m[34]=11.;m[35]=43.;m[36]=1.;m[37]=33.;m[38]=9.;m[39]=41.;
  m[40]=51.;m[41]=19.;m[42]=59.;m[43]=27.;m[44]=49.;m[45]=17.;m[46]=57.;m[47]=25.;
  m[48]=15.;m[49]=47.;m[50]=7.;m[51]=39.;m[52]=13.;m[53]=45.;m[54]=5.;m[55]=37.;
  m[56]=63.;m[57]=31.;m[58]=55.;m[59]=23.;m[60]=61.;m[61]=29.;m[62]=53.;m[63]=21.;
  float v = 0.0;
  for (int k = 0; k < 64; k++) { if (k == i) v = m[k]; }
  return v / 64.0;
}

float hash(vec2 v){ return fract(sin(dot(v, vec2(127.1, 311.7))) * 43758.5453); }

float noise(vec2 v){
  vec2 i = floor(v), f = fract(v);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x),
             mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), u.x), u.y);
}

float fbm(vec2 v){
  float s = 0.0, a = 0.5;
  for (int k = 0; k < 5; k++) { s += a * noise(v); v *= 2.02; a *= 0.5; }
  return s;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / max(u_res.x, u_res.y);
  float t = u_time * 0.05;

  // soft sphere-like core
  float r = length(uv * vec2(1.15, 1.0));
  float sphere = smoothstep(0.62, 0.0, r);
  float field = fbm(uv * 3.2 + vec2(t, -t * 0.6)) * 0.85 + sphere * 0.75;
  field *= smoothstep(1.05, 0.15, r);

  float d = step(bayer(gl_FragCoord.xy), clamp(field, 0.0, 1.0));
  vec3 col = u_color * d * (0.55 + 0.45 * field);
  gl_FragColor = vec4(col, d * 0.55);
}
`;

export function DitheringShader({
  className,
  color = [0.23, 0.51, 0.96],
}: {
  className?: string;
  color?: [number, number, number];
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: true, antialias: false });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    gl.uniform3f(gl.getUniformLocation(prog, "u_color"), color[0], color[1], color[2]);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    let raf = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(canvas.clientWidth * dpr);
      canvas.height = Math.floor(canvas.clientHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const start = performance.now();
    const loop = () => {
      gl.uniform1f(uTime, (performance.now() - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [color]);

  return <canvas ref={ref} aria-hidden className={cn("size-full", className)} />;
}
