import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import HowItWorks from "@/components/home/HowItWorks";
import StatsSection from "@/components/home/StatsSection";
import RecentReports from "@/components/home/RecentReports";

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <StatsSection />
        <HowItWorks />
        <RecentReports />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
