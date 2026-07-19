import React from "react";

const Mission = () => {
  return (
    /* UPDATED: Background to Pure Black, Text to Light Gray */
    <section className="bg-black py-32 px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
        {/* Text Section */}
        <div className="space-y-6">
          <h3 className="text-xs uppercase tracking-[0.4em] text-orange-500 font-black">
            Our Purpose
          </h3>
          <h2 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tighter">
            Mission & <br /> Core Values
          </h2>
          <p className="text-gray-400 text-xl leading-relaxed font-light">
            Southern Tales is built on the pillars of uncompromised
            authenticity, coastal fire, and the warmth of ancestral hospitality.
            Every dish is a manuscript—crafted with generational wisdom.
          </p>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
            {[
              "Premium Organic Ingredients",
              "Hand-Ground Spice Blends",
              "Ancestral Slow-Fire Cooking",
              "Ethical & Local Sourcing",
            ].map((value, index) => (
              <li
                key={index}
                className="flex items-center gap-3 text-gray-300 font-medium"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                {value}
              </li>
            ))}
          </ul>
        </div>

        {/* Accent Card - Using Glassmorphism for a Noir Look */}
        <div className="relative group">
          {/* Subtle Glow behind card */}
          <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 to-transparent rounded-[2.5rem] blur-2xl transition-opacity group-hover:opacity-100 opacity-50" />

          <div className="relative bg-[#0A0A0A] rounded-[2.5rem] shadow-2xl p-12 border border-white/5 backdrop-blur-sm">
            <h4 className="text-2xl font-black text-white mb-6 tracking-tight">
              What Drives Us
            </h4>
            <div className="h-1 w-12 bg-orange-500 mb-8" />
            <p className="text-gray-400 leading-relaxed font-light text-lg">
              We believe the table is a sacred space for connection. Our
              relentless pursuit is to create an environment where heritage is
              honored, senses are awakened, and every gathering becomes a
              lasting memory etched in flavor.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Mission;
