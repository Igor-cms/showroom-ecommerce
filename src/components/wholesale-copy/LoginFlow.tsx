import { useState } from "react";
import PurchaseHistoryStep from "./PurchaseHistoryStep";
import EmailLookupStep from "./EmailLookupStep";
import NoAccountStep from "./NoAccountStep";

type Step = "purchase" | "email" | "no-account";

const LoginFlow = () => {
  const [step, setStep] = useState<Step>("purchase");

  if (step === "purchase") {
    return (
      <PurchaseHistoryStep
        onAnswer={(yes) => setStep(yes ? "email" : "no-account")}
      />
    );
  }

  if (step === "no-account") {
    return <NoAccountStep onBack={() => setStep("purchase")} />;
  }

  return <EmailLookupStep onBack={() => setStep("purchase")} />;
};

export default LoginFlow;
