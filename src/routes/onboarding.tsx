import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { ShieldCheck, Heart, Users, ArrowRight } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Welcome to HeriRide" },
      { name: "description", content: "Learn about HeriRide safety features." },
    ],
  }),
  component: Onboarding,
});

const steps = [
  {
    title: "Safety First",
    description: "Every driver and rider on our platform is background-checked and verified as a woman. Your safety is our only priority.",
    icon: ShieldCheck,
    color: "bg-primary-glow",
  },
  {
    title: "Trusted Contacts",
    description: "Add your loved ones to your Trusted Contacts. They'll get a live tracking link automatically every time you start a ride.",
    icon: Users,
    color: "bg-gradient-pink",
  },
  {
    title: "Always Protected",
    description: "Our 24/7 SOS response team monitors every trip. If you ever feel uncomfortable, we're just one tap away.",
    icon: Heart,
    color: "bg-primary",
  },
];

function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate({ to: "/home" });
    }
  };

  const step = steps[currentStep];

  return (
    <PhoneFrame>
      <div className="relative h-full flex flex-col bg-noir overflow-hidden">
        {/* Progress bar */}
        <div className="flex gap-1.5 p-6 pb-0">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                i <= currentStep ? "bg-primary" : "bg-white/10"
              }`}
            />
          ))}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              className="w-full"
            >
              <div className={`w-24 h-24 rounded-[2rem] ${step.color} mx-auto flex items-center justify-center text-noir shadow-glow mb-8`}>
                <step.icon className="w-12 h-12" />
              </div>
              <h1 className="font-display text-3xl font-semibold mb-4">{step.title}</h1>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="p-6">
          <button
            onClick={next}
            className="w-full py-4 rounded-full bg-primary text-primary-foreground font-semibold shadow-glow flex items-center justify-center gap-2 group"
          >
            {currentStep === steps.length - 1 ? "Get Started" : "Continue"}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <Link
            to="/home"
            className="block text-center text-xs text-muted-foreground mt-4 font-medium"
          >
            Skip for now
          </Link>
        </div>

        {/* Background blobs */}
        <div className="absolute top-1/4 -right-20 w-64 h-64 bg-primary-glow/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-1/4 -left-20 w-64 h-64 bg-primary/10 blur-[100px] rounded-full" />
      </div>
    </PhoneFrame>
  );
}
