import { motion } from "framer-motion";
import { useRideRequestStore } from "@/store/ride-request.store";
import { RIDE_PREFERENCES } from "../../data/preferences";
import { PreferenceList } from "../../components/PreferenceList";
import { NotesField } from "../../components/NotesField";
import { StepHeader } from "../../components/StepHeader";
import { BottomActionBar } from "../../components/BottomActionBar";
import { ConfirmButton } from "../../components/ConfirmButton";

export function PreferencesStep() {
  const preferences = useRideRequestStore((s) => s.preferences);
  const togglePreference = useRideRequestStore((s) => s.togglePreference);
  const note = useRideRequestStore((s) => s.note);
  const noteMax = useRideRequestStore((s) => s.noteMax);
  const setNote = useRideRequestStore((s) => s.setNote);
  const next = useRideRequestStore((s) => s.next);

  return (
    <motion.div className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <StepHeader
        title="Ride preferences"
        subtitle="Personalise your experience — we honour every request."
      />
      <PreferenceList
        preferences={RIDE_PREFERENCES}
        selected={preferences}
        onToggle={togglePreference}
      />
      <NotesField value={note} max={noteMax} onChange={setNote} />
      <BottomActionBar>
        <ConfirmButton onClick={next}>Continue</ConfirmButton>
      </BottomActionBar>
    </motion.div>
  );
}
