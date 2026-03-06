import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden text-white"
      style={{ backgroundColor: "#7a0f12" }}
    >
      {/* Deep red base */}
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(circle at 50% 40%, #b51c21 0%, #7a0f12 45%, #3a0204 100%)" }}
      />

      {/* Cloud light patches */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[28%] w-[700px] h-[700px]"
          style={{
            background: "radial-gradient(circle, rgba(255,235,225,0.28) 0%, rgba(255,235,225,0.18) 30%, transparent 70%)",
            filter: "blur(90px)",
          }}
        />
        <div className="absolute top-[10%] right-[22%] w-[720px] h-[720px]"
          style={{
            background: "radial-gradient(circle, rgba(255,225,210,0.22) 0%, rgba(255,225,210,0.14) 30%, transparent 70%)",
            filter: "blur(110px)",
          }}
        />
      </div>

      {/* Subtle fabric depth */}
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(circle at 50% 120%, rgba(0,0,0,0.35), transparent 60%)" }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6">

        <h1 className="font-semibold tracking-tight mb-6"
          style={{
            fontSize: "clamp(70px, 12vw, 180px)",
            color: "#f5f2f1",
            filter: "drop-shadow(0 18px 35px rgba(0,0,0,0.55))",
          }}
        >
          Ragents
        </h1>
        <p className="text-white/80 mb-12"
          style={{ fontSize: "clamp(18px, 2vw, 26px)" }}
        >
          Agents for every task.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-10 py-4 rounded-full font-medium hover:-translate-y-0.5 transition-all duration-300"
          style={{
            backgroundColor: "#f5f2f1",
            color: "black",
            boxShadow: "0 10px 40px rgba(255,255,255,0.45)",
          }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 15px 55px rgba(255,255,255,0.65)"}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 10px 40px rgba(255,255,255,0.45)"}
        >
          Try it
        </button>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 z-10 flex flex-col items-center gap-1 text-sm text-white/50">
        <p>
          By{" "}
          <a href="https://raufjatoi.vercel.app/" target="_blank" rel="noopener noreferrer" className="font-semibold text-white/70 underline underline-offset-2 hover:text-white">
            Abdul Rauf Jatoi
          </a>
        </p>
        <p className="flex items-center gap-1.5">
          Founder of{" "}
          <img src="/rypto-logo.png" alt="Rypto" className="inline h-4 w-4" />
          <a href="https://rypto-beta.vercel.app/" target="_blank" rel="noopener noreferrer" className="font-semibold text-white/70 underline underline-offset-2 hover:text-white">
            Rypto
          </a>
        </p>
      </footer>
    </section>
  );
};

export default Index;
