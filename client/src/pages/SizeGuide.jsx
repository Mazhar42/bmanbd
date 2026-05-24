import { useState } from "react";
import { Ruler, Info } from "lucide-react";
import { motion } from "framer-motion";

// ─── Data ────────────────────────────────────────────────────────────────────

const SHIRT_SIZES = [
  { size: "S", chest: '36"', shoulders: '15.5"', length: '27"', waist: '32"' },
  { size: "M", chest: '38"', shoulders: '16.5"', length: '28"', waist: '34"' },
  { size: "L", chest: '40"', shoulders: '17.5"', length: '29"', waist: '36"' },
  { size: "XL", chest: '42"', shoulders: '18.5"', length: '30"', waist: '38"' },
  {
    size: "XXL",
    chest: '44"',
    shoulders: '19.5"',
    length: '31"',
    waist: '40"',
  },
];

// Waist options (inches) × Inseam options (inches)
const WAIST_SIZES = [28, 30, 32, 34, 36, 38];
const INSEAM_SIZES = [28, 30, 32];

// Measurement guide for waist sizes
const WAIST_MEASUREMENTS = {
  28: '28"',
  30: '30"',
  32: '32"',
  34: '34"',
  36: '36"',
  38: '38"',
};

// ─── Component ───────────────────────────────────────────────────────────────

const HowToCard = ({ step, title, desc }) => (
  <div className="flex gap-4">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm font-bold">
      {step}
    </div>
    <div>
      <p className="font-medium text-gray-900 dark:text-white text-sm">
        {title}
      </p>
      <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{desc}</p>
    </div>
  </div>
);

export default function SizeGuide() {
  const [activeTab, setActiveTab] = useState("shirts");
  const [unit, setUnit] = useState("in"); // "in" | "cm"

  const toUnit = (val) => {
    if (unit === "cm") {
      const num = parseFloat(val);
      return `${Math.round(num * 2.54)} cm`;
    }
    return val;
  };

  const tabs = [
    { key: "shirts", label: "Shirts / T-Shirts" },
    { key: "pants", label: "Pants / Denim" },
    { key: "measure", label: "How to Measure" },
  ];

  return (
    <div className="container-custom py-12 max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent/10 mb-4">
          <Ruler size={22} className="text-accent" />
        </div>
        <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Size Guide
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
          All measurements are of the garment, not the body. We recommend sizing
          up if you&apos;re between sizes.
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl mb-8">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all ${
              activeTab === t.key
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Unit toggle */}
      {activeTab !== "measure" && (
        <div className="flex justify-end mb-4">
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs">
            {["in", "cm"].map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  unit === u
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {u === "in" ? "Inches" : "CM"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Shirts tab ──────────────────────────────────────────────────────── */}
      {activeTab === "shirts" && (
        <motion.div
          key="shirts"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-x-auto"
        >
          <div className="mb-3 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            <Info size={13} />
            Applies to: Shirts, T-Shirts, Polo, Panjabi
          </div>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-brand/5 dark:bg-white/5">
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 rounded-tl-xl">
                  Size
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  Chest
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  Shoulders
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  Length
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 rounded-tr-xl">
                  Waist
                </th>
              </tr>
            </thead>
            <tbody>
              {SHIRT_SIZES.map((row, i) => (
                <tr
                  key={row.size}
                  className={`border-t border-gray-100 dark:border-gray-800 ${
                    i % 2 === 0 ? "" : "bg-gray-50 dark:bg-gray-800/40"
                  }`}
                >
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-brand dark:bg-white text-white dark:text-brand text-xs font-bold">
                      {row.size}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">
                    {toUnit(row.chest)}
                  </td>
                  <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">
                    {toUnit(row.shoulders)}
                  </td>
                  <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">
                    {toUnit(row.length)}
                  </td>
                  <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">
                    {toUnit(row.waist)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* ── Pants tab ───────────────────────────────────────────────────────── */}
      {activeTab === "pants" && (
        <motion.div
          key="pants"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-3 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            <Info size={13} />
            Applies to: Denim, Chino, Cargo, Shorts — size format is{" "}
            <code className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">
              W28_L30
            </code>{" "}
            (Waist_Inseam)
          </div>

          {/* Waist reference */}
          <div className="mb-6 overflow-x-auto">
            <p className="text-xs font-semibold tracking-widest uppercase text-gray-500 dark:text-gray-400 mb-3">
              Waist Reference
            </p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-brand/5 dark:bg-white/5">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 rounded-tl-xl">
                    Waist Code
                  </th>
                  {WAIST_SIZES.map((w) => (
                    <th
                      key={w}
                      className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 last:rounded-tr-xl"
                    >
                      W{w}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">
                    Actual Waist
                  </td>
                  {WAIST_SIZES.map((w) => (
                    <td
                      key={w}
                      className="py-3 px-4 text-center text-gray-700 dark:text-gray-300"
                    >
                      {toUnit(WAIST_MEASUREMENTS[w])}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Inseam reference */}
          <div className="overflow-x-auto">
            <p className="text-xs font-semibold tracking-widest uppercase text-gray-500 dark:text-gray-400 mb-3">
              Inseam (Length) Reference
            </p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-brand/5 dark:bg-white/5">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 rounded-tl-xl">
                    Inseam Code
                  </th>
                  {INSEAM_SIZES.map((l) => (
                    <th
                      key={l}
                      className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 last:rounded-tr-xl"
                    >
                      L{l}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">
                    Inseam Length
                  </td>
                  {INSEAM_SIZES.map((l) => (
                    <td
                      key={l}
                      className="py-3 px-4 text-center text-gray-700 dark:text-gray-300"
                    >
                      {toUnit(`${l}"`)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Example callout */}
          <div className="mt-6 p-4 bg-accent/5 border border-accent/20 rounded-2xl text-sm text-gray-700 dark:text-gray-300">
            <span className="font-semibold text-accent">Example:</span>{" "}
            <code className="font-mono bg-white/60 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs">
              W32_L30
            </code>{" "}
            means a 32&quot; waist with a 30&quot; inseam.
          </div>
        </motion.div>
      )}

      {/* ── How to Measure tab ──────────────────────────────────────────────── */}
      {activeTab === "measure" && (
        <motion.div
          key="measure"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-2 gap-8"
        >
          {/* Shirts */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-brand dark:bg-white text-white dark:text-brand flex items-center justify-center text-xs font-bold">
                S
              </span>
              Shirts &amp; Tops
            </h3>
            <div className="space-y-4">
              <HowToCard
                step="1"
                title="Chest"
                desc="Measure around the fullest part of your chest, keeping the tape horizontal."
              />
              <HowToCard
                step="2"
                title="Shoulders"
                desc="Measure straight across the back from shoulder seam to shoulder seam."
              />
              <HowToCard
                step="3"
                title="Length"
                desc="Measure from the top of the shoulder (at the seam) down to the hem."
              />
              <HowToCard
                step="4"
                title="Waist"
                desc="Measure around your natural waistline, keeping one finger under the tape for comfort."
              />
            </div>
          </div>

          {/* Pants */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-brand dark:bg-white text-white dark:text-brand flex items-center justify-center text-xs font-bold">
                P
              </span>
              Pants &amp; Denim
            </h3>
            <div className="space-y-4">
              <HowToCard
                step="1"
                title="Waist (W)"
                desc="Measure around your natural waistline where you like to wear your pants."
              />
              <HowToCard
                step="2"
                title="Inseam / Length (L)"
                desc="Measure from the crotch seam down to the bottom of the leg along the inner seam."
              />
              <HowToCard
                step="3"
                title="Hip"
                desc="Measure around the fullest part of your hips, usually 8–9 inches below the waistline."
              />
              <HowToCard
                step="4"
                title="Tip"
                desc='The size label W32_L30 means 32" waist and 30" inseam. Pick the waist first, then your preferred length.'
              />
            </div>
          </div>

          {/* General tips */}
          <div className="md:col-span-2 p-5 bg-gray-50 dark:bg-gray-800/60 rounded-2xl text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p className="font-semibold text-gray-900 dark:text-white mb-1">
              General Tips
            </p>
            <p>
              • Use a flexible measuring tape and measure over light clothing or
              your undergarments.
            </p>
            <p>
              • Keep the tape snug but not tight — you should be able to slide
              one finger underneath.
            </p>
            <p>
              • If you&apos;re between sizes, size up for a more relaxed fit or
              size down for a slimmer fit.
            </p>
            <p>
              • All BMAN garments are measured flat — double the chest/waist
              measurements if comparing to body measurements.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
