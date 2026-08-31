import { useState } from "react";
import { Lock, FileText, Search, CheckCircle, Key } from "lucide-react";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";

const VAULT_STEPS = [
  { icon: FileText, label: "Apply" },
  { icon: Search, label: "Review" },
  { icon: CheckCircle, label: "Approved" },
  { icon: Key, label: "Unlock" },
];
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";

const TheVaultSection = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    cell: "",
    email: "",
    shop: "",
    instagram: "",
    priceRangeMin: "",
    priceRangeMax: "",
    lotSize: "",
    sensoryProfile: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };


  const resetForm = () => {
    setFormData({
      name: "",
      cell: "",
      email: "",
      shop: "",
      instagram: "",
      priceRangeMin: "",
      priceRangeMax: "",
      lotSize: "",
      sensoryProfile: "",
    });
    setCurrentStep(1);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const validateStep1 = () => {
    if (!formData.name.trim() || !formData.cell.trim() || !formData.email.trim()) {
      toast.error("Please fill in all required fields");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async () => {
    // Validation for step 2
    if (
      !formData.shop.trim() ||
      !formData.priceRangeMin.trim() ||
      !formData.priceRangeMax.trim() ||
      !formData.lotSize.trim() ||
      !formData.sensoryProfile.trim()
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.from('vault_applications').insert({
        name: formData.name,
        cell: formData.cell,
        email: formData.email,
        shop: formData.shop,
        instagram: formData.instagram || null,
        price_range_min: parseFloat(formData.priceRangeMin),
        price_range_max: parseFloat(formData.priceRangeMax),
        lot_size: formData.lotSize,
        sensory_profile: [formData.sensoryProfile],
      });

      if (error) throw error;
      
      toast.success("Application submitted! We'll be in touch soon.");
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* The Vault Section - Matching Essentials Collection Style */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="border-2 border-black rounded-lg p-8 bg-[#ece7d0] shadow-wholesale">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left Column - Title & Description */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              {/* Section Title with Lock Icon */}
              <div className="flex items-center gap-2 mb-6">
                <Lock className="w-5 h-5 text-wholesale-primary" strokeWidth={2.5} />
                <h2 className="text-2xl font-bold text-wholesale-primary">THE VAULT</h2>
                <span className="text-lg text-wholesale-secondary">EXCLUSIVE ACCESS</span>
              </div>

              {/* Content Block */}
              <div className="flex flex-col gap-1">
                <p 
                  className="text-wholesale-secondary text-[10px] uppercase leading-relaxed max-w-md"
                  style={{ letterSpacing: '-0.1px' }}
                >
                  Our most exceptional micro-lots, reserved for partners who share our passion for extraordinary coffee. Limited availability. By application only.
                </p>
              </div>
            </div>

            {/* Right Column - Steps & CTA */}
            <div className="flex flex-col items-center gap-6">
              {/* Step-by-Step Process */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-0">
                {VAULT_STEPS.map((step, index) => (
                  <div key={step.label} className="flex items-center">
                    {/* Step Circle + Label */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-8 h-8 rounded-full border border-wholesale-primary/40 bg-wholesale-bg flex items-center justify-center">
                        <step.icon className="w-3.5 h-3.5 text-wholesale-primary" strokeWidth={2} />
                      </div>
                      <span 
                        className="text-[8px] uppercase text-wholesale-secondary font-medium"
                        style={{ letterSpacing: '0.3px' }}
                      >
                        {step.label}
                      </span>
                    </div>
                    
                    {/* Connector Line (not after last step) */}
                    {index < VAULT_STEPS.length - 1 && (
                      <>
                        {/* Desktop: horizontal dashed line */}
                        <div className="hidden md:block w-8 h-px border-t border-dashed border-wholesale-primary/30 mx-2" />
                        {/* Mobile: vertical dashed line */}
                        <div className="block md:hidden h-4 w-px border-l border-dashed border-wholesale-primary/30 my-1" />
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button
                onClick={() => setIsDialogOpen(true)}
                className="bg-wholesale-primary text-white text-[10px] font-medium uppercase px-6 py-2.5 rounded-full hover:bg-wholesale-primary/90 transition-colors"
                style={{ letterSpacing: '-0.1px' }}
              >
                Apply for Access
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Application Dialog - Multi-Step Wizard */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[500px] bg-[#e8e2cc] max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#e8e2cc] [&::-webkit-scrollbar-thumb]:bg-wholesale-primary/30 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-wholesale-primary/50">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-wholesale-primary">
              Apply for Vault Access
            </DialogTitle>
            <DialogDescription className="text-wholesale-muted">
              {currentStep === 1 
                ? "Let's start with your contact information." 
                : "Tell us about your business and preferences."}
            </DialogDescription>
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <div className={`w-2 h-2 rounded-full transition-colors ${currentStep === 1 ? 'bg-wholesale-primary' : 'bg-wholesale-primary/30'}`} />
              <div className="w-4 h-px bg-wholesale-primary/30" />
              <div className={`w-2 h-2 rounded-full transition-colors ${currentStep === 2 ? 'bg-wholesale-primary' : 'bg-wholesale-primary/30'}`} />
              <span className="text-[10px] text-wholesale-muted ml-2">Step {currentStep} of 2</span>
            </div>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {currentStep === 1 ? (
              <>
                {/* Step 1: Personal Information */}
                {/* Name */}
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-wholesale-primary">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="border-wholesale-primary/20 focus:border-wholesale-accent"
                  />
                </div>

                {/* Cell */}
                <div className="grid gap-2">
                  <Label htmlFor="cell" className="text-wholesale-primary">
                    Cell <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="cell"
                    placeholder="+1 (555) 123-4567"
                    value={formData.cell}
                    onChange={(e) => handleInputChange("cell", e.target.value)}
                    className="border-wholesale-primary/20 focus:border-wholesale-accent"
                  />
                </div>

                {/* Email */}
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-wholesale-primary">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="border-wholesale-primary/20 focus:border-wholesale-accent"
                  />
                </div>
              </>
            ) : (
              <>
                {/* Step 2: Company Information */}
                {/* Shop */}
                <div className="grid gap-2">
                  <Label htmlFor="shop" className="text-wholesale-primary">
                    Shop <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="shop"
                    placeholder="Your shop or company name"
                    value={formData.shop}
                    onChange={(e) => handleInputChange("shop", e.target.value)}
                    className="border-wholesale-primary/20 focus:border-wholesale-accent"
                  />
                </div>

                {/* Instagram */}
                <div className="grid gap-2">
                  <Label htmlFor="instagram" className="text-wholesale-primary">
                    Instagram
                  </Label>
                  <Input
                    id="instagram"
                    placeholder="@yourhandle"
                    value={formData.instagram}
                    onChange={(e) => handleInputChange("instagram", e.target.value)}
                    className="border-wholesale-primary/20 focus:border-wholesale-accent"
                  />
                </div>

                {/* Price Range */}
                <div className="grid gap-2">
                  <Label className="text-wholesale-primary">
                    Price Range ($/kg) <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={formData.priceRangeMin}
                      onChange={(e) => handleInputChange("priceRangeMin", e.target.value)}
                      className="border-wholesale-primary/20 focus:border-wholesale-accent"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={formData.priceRangeMax}
                      onChange={(e) => handleInputChange("priceRangeMax", e.target.value)}
                      className="border-wholesale-primary/20 focus:border-wholesale-accent"
                    />
                  </div>
                </div>

                {/* Lot Size */}
                <div className="grid gap-2">
                  <Label htmlFor="lotSize" className="text-wholesale-primary">
                    Lot Size <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lotSize"
                    placeholder="e.g., 10kg, 25kg, 50kg"
                    value={formData.lotSize}
                    onChange={(e) => handleInputChange("lotSize", e.target.value)}
                    className="border-wholesale-primary/20 focus:border-wholesale-accent"
                  />
                </div>

                {/* Describe Your Ideal Coffee */}
                <div className="grid gap-2">
                  <Label htmlFor="sensoryProfile" className="text-wholesale-primary">
                    Describe Your Ideal Coffee <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-xs text-wholesale-muted -mt-1">
                    Include any of the following if applicable: Sensory Notes, Processing Type, Origin preferences, etc.
                  </p>
                  <Textarea
                    id="sensoryProfile"
                    placeholder="e.g., Fruit-forward naturals with berry notes, or clean washed coffees with chocolate and caramel..."
                    value={formData.sensoryProfile}
                    onChange={(e) => handleInputChange("sensoryProfile", e.target.value)}
                    className="border-wholesale-primary/20 focus:border-wholesale-accent min-h-[100px] resize-none"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            {currentStep === 1 ? (
              <Button
                onClick={handleNext}
                className="w-full bg-[#101213] text-white hover:bg-[#101213]/90 font-medium tracking-wide rounded-full"
              >
                Next →
              </Button>
            ) : (
              <div className="flex w-full gap-2">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="flex-1 border-wholesale-primary/20 text-wholesale-primary hover:bg-wholesale-primary/5 rounded-full"
                >
                  ← Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-[#101213] text-white hover:bg-[#101213]/90 font-medium tracking-wide rounded-full"
                >
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TheVaultSection;
