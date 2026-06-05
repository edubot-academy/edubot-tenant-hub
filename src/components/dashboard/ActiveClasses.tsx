import { ClassCard } from "./ClassCard";
import { Link } from "@tanstack/react-router";
import coverPsych from "@/assets/cover-psych.jpg";
import coverChem from "@/assets/cover-chem.jpg";
import a1 from "@/assets/avatar-1.jpg";
import a2 from "@/assets/avatar-2.jpg";
import a3 from "@/assets/avatar-3.jpg";

export function ActiveClasses() {
  return (
    <section className="col-span-12 lg:col-span-8 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black">Active Classes</h3>
        <Link to="/classes" className="text-sm font-bold text-primary hover:underline">
          View all
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ClassCard
          cover={coverPsych}
          title="Cognitive Psychology"
          students={45}
          xp={12400}
          xpGoal={20000}
          avgStreak="4.2d"
          accent="primary"
          delay={300}
          avatars={[a1, a2, a3]}
        />
        <ClassCard
          cover={coverChem}
          title="Organic Chemistry II"
          students={32}
          xp={8100}
          xpGoal={15000}
          avgStreak="2.1d"
          accent="secondary"
          delay={400}
          avatars={[a2, a3]}
        />
      </div>
    </section>
  );
}
