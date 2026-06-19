// ponytail: static decorative clutter, no animation, no JS work. Pure CSS pos.
// Sits behind content (-z-5) but above DotField (-z-10). select-none + pointer-events-none.

const FORMULAS = [
  { t: "E = mc²",                    top: "8%",  left: "3%",   rot: -8,  size: "text-3xl" },
  { t: "F = G·m₁m₂/r²",              top: "22%", right: "2%",  rot: 6,   size: "text-2xl" },
  { t: "∇·E = ρ/ε₀",                 top: "38%", left: "2%",   rot: -4,  size: "text-2xl" },
  { t: "ψ = A·eⁱ⁽ᵏˣ⁻ωᵗ⁾",            top: "55%", right: "3%",  rot: 10,  size: "text-xl"  },
  { t: "p = mv",                     top: "70%", left: "3%",   rot: 3,   size: "text-3xl" },
  { t: "v_esc = √(2GM/r)",           top: "82%", right: "2%",  rot: -6,  size: "text-xl"  },
  { t: "λ = h/p",                    top: "5%",  right: "12%", rot: 12,  size: "text-2xl" },
  { t: "S = k·ln(W)",                top: "92%", left: "10%",  rot: -3,  size: "text-2xl" },
  { t: "L = Iω",                     top: "48%", left: "6%",   rot: 8,   size: "text-xl"  },
  { t: "E_n = -13.6/n² eV",          top: "30%", right: "8%",  rot: -10, size: "text-xl"  },
  { t: "∂ψ/∂t = -iĤψ/ℏ",             top: "62%", left: "1%",   rot: 5,   size: "text-xl"  },
  { t: "R_μν - ½g_μν R = 8πG T_μν",  top: "15%", left: "12%",  rot: -5,  size: "text-base" },
];

export default function PhysicsClutter() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-[5] overflow-hidden select-none">
      {FORMULAS.map((f, i) => (
        <span
          key={i}
          className={`absolute font-mono text-ink/[0.05] whitespace-nowrap ${f.size}`}
          style={{
            top: f.top,
            left: f.left,
            right: f.right,
            transform: `rotate(${f.rot}deg)`,
          }}
        >
          {f.t}
        </span>
      ))}
    </div>
  );
}
