import WebcamFeed from "@/components/WebcamFeed";

const Index = () => {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto">
        <h1 className="text-5xl md:text-6xl font-bold text-center mb-12 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-in fade-in slide-in-from-top duration-700">
          ACM FORGE CAM
        </h1>
        <WebcamFeed />
      </div>
    </div>
  );
};

export default Index;
