import { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';

// Import the generated images
import studentsImage from '@assets/generated_images/Nigerian_JAMB_students_studying_97f99c18.png';
import cbtCenterImage from '@assets/generated_images/Nigerian_CBT_exam_center_e7c2462b.png';
import successImage from '@assets/generated_images/Nigerian_university_admission_success_472aace3.png';
import appInterfaceImage from '@assets/generated_images/Educational_app_interface_design_2693b7a2.png';

const AD_IMAGES = [
  studentsImage,
  cbtCenterImage, 
  successImage,
  appInterfaceImage
];

const AD_CONTENT = [
  {
    title: "JAMB Preparation",
    subtitle: "Join thousands of successful candidates",
    description: "Premium study materials & practice tests"
  },
  {
    title: "CBT Practice",
    subtitle: "Real exam experience",
    description: "Authentic CBT simulation environment"
  },
  {
    title: "Success Stories",
    subtitle: "Join our successful students",
    description: "Achieve your university dreams"
  },
  {
    title: "Premium Access",
    subtitle: "Unlock your potential",
    description: "Advanced features & detailed analytics"
  }
];

interface MovingAdsProps {
  showOnlyOnFirstPage?: boolean;
  className?: string;
}

export default function MovingAds({ showOnlyOnFirstPage = true, className = '' }: MovingAdsProps) {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(() => {
    // Only show ads on first page after login if specified
    if (showOnlyOnFirstPage) {
      const hasSeenAds = localStorage.getItem('hasSeenAdsToday');
      const today = new Date().toDateString();
      const lastAdDate = localStorage.getItem('lastAdDate');
      return lastAdDate !== today;
    }
    return true;
  });
  const [position, setPosition] = useState({ x: 20, y: 100 });

  useEffect(() => {
    // Rotate through ads every 10 seconds
    const adRotationInterval = setInterval(() => {
      setCurrentAdIndex((prevIndex) => (prevIndex + 1) % AD_IMAGES.length);
    }, 10000);

    // Scroll the ad banner horizontally instead of moving randomly
    const moveInterval = setInterval(() => {
      setPosition(prev => ({
        x: prev.x + 100 > window.innerWidth - 320 ? 0 : prev.x + 100,
        y: prev.y // Keep y position fixed
      }));
    }, 3000); // Slower, smoother scrolling

    return () => {
      clearInterval(adRotationInterval);
      clearInterval(moveInterval);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className="fixed z-40 transition-all duration-1000 ease-in-out bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-xl shadow-2xl border-2 border-white/20 backdrop-blur-lg"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '320px',
        height: '180px',
      }}
      data-testid="moving-ad-banner"
    >
      {/* Close button */}
      <button
        onClick={() => {
          setIsVisible(false);
          // Mark ads as seen for today
          localStorage.setItem('hasSeenAdsToday', 'true');
          localStorage.setItem('lastAdDate', new Date().toDateString());
        }}
        className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white z-10 transition-colors"
        data-testid="close-ad-button"
      >
        <X className="h-3 w-3" />
      </button>

      {/* Ad content */}
      <div className="relative w-full h-full overflow-hidden rounded-xl">
        {/* Background image */}
        <img
          src={AD_IMAGES[currentAdIndex]}
          alt="Advertisement"
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
        
        {/* Overlay content */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-4">
          <div className="text-white">
            <h3 className="text-sm font-bold mb-1">{AD_CONTENT[currentAdIndex].title}</h3>
            <p className="text-xs opacity-90 mb-2">{AD_CONTENT[currentAdIndex].description}</p>
            <button
              onClick={() => {
                // Scroll to features or trigger action
                const element = document.getElementById('features-section');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="inline-flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-full text-xs font-medium transition-colors"
              data-testid="learn-more-button"
            >
              <span>Learn More</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Animated border */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 opacity-50 animate-pulse pointer-events-none"></div>
      </div>

      {/* Ad indicator dots */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
        {AD_IMAGES.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentAdIndex ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}