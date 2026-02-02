import { Camera, MapPin, ClipboardCheck, Wrench, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: Camera,
    title: "Capture & Report",
    description: "Take a photo of the road damage and submit with location details",
  },
  {
    icon: MapPin,
    title: "Auto-Location",
    description: "GPS automatically tags your report with precise coordinates",
  },
  {
    icon: ClipboardCheck,
    title: "Verification",
    description: "SMC officials verify and prioritize the reported issue",
  },
  {
    icon: Wrench,
    title: "Repair Work",
    description: "Assigned contractor dispatched for repair work",
  },
  {
    icon: CheckCircle,
    title: "Resolution",
    description: "Issue resolved and you receive confirmation",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 bg-secondary/30">
      <div className="container">
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Simple 5-step process from reporting to resolution
          </p>
        </div>

        <div className="relative">
          {/* Connection Line */}
          <div className="absolute top-12 left-0 right-0 h-0.5 bg-border hidden lg:block" />

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="relative flex flex-col items-center text-center animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Step Number */}
                <div className="relative z-10 mb-4">
                  <div className="w-24 h-24 rounded-2xl bg-card shadow-card flex items-center justify-center border border-border group hover:shadow-card-hover hover:border-primary/30 transition-all duration-300">
                    <step.icon className="h-10 w-10 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shadow-md">
                    {index + 1}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
