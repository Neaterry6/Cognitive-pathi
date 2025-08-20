import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  Menu,
  BookOpen,
  Brain,
  Trophy,
  Zap,
  Users,
  Star,
  ArrowRight,
  CheckCircle,
  Clock,
  Target,
} from 'lucide-react';
import MovingAds from '@/components/MovingAds';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToSignup: () => void;
}

export default function LandingPage({ onNavigateToLogin, onNavigateToSignup }: LandingPageProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [notificationCount, setNotificationCount] = useState(3);

  // Use Catbox URLs directly
  const images = [
    'https://files.catbox.moe/boiqvi.jpg',
    'https://files.catbox.moe/sfh1ii.jpg',
    'https://files.catbox.moe/y3kwnd.jpg',
  ];

  // Auto-scroll images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <BookOpen className="h-8 w-8" />,
      title: "Comprehensive Study Materials",
      description: "Access thousands of past questions from JAMB, WAEC, NECO, and POST-UTME examinations from 2001-2020.",
    },
    {
      icon: <Brain className="h-8 w-8" />,
      title: "AI-Powered Explanations",
      description: "Get detailed explanations for every question powered by advanced AI technology including GPT and Gemini.",
    },
    {
      icon: <Trophy className="h-8 w-8" />,
      title: "CBT Exam Simulation",
      description: "Experience real CBT environment with 2-hour timed exams, exactly like the actual UTME examination.",
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Instant Results & Analytics",
      description: "Get immediate feedback with detailed performance analytics to track your preparation progress.",
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Study Community",
      description: "Connect with thousands of students, compete on leaderboards, and share study strategies.",
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: "Personalized Study Plans",
      description: "AI-generated study schedules tailored to your strengths, weaknesses, and exam timeline.",
    },
  ];

  const testimonials = [
    {
      name: "Adunni Okafor",
      score: "346/400",
      course: "Medicine and Surgery",
      text: "CognitivePath helped me achieve my dream JAMB score! The CBT practice was exactly like the real exam.",
      avatar: "AO",
    },
    {
      name: "Emeka Johnson",
      score: "298/400",
      course: "Engineering",
      text: "The AI explanations made complex physics and mathematics topics so much easier to understand.",
      avatar: "EJ",
    },
    {
      name: "Fatima Aliyu",
      score: "312/400",
      course: "Law",
      text: "Best UTME prep platform! The study scheduler kept me organized throughout my preparation.",
      avatar: "FA",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Moving Ads Component */}
      <MovingAds showOnlyOnFirstPage={true} />

      {/* Navigation Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">CognitivePath</span>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              Features
            </Button>
            <Button variant="ghost" className="text-white hover:bg-white/10">
              About
            </Button>
            <Button variant="ghost" className="text-white hover:bg-white/10">
              Contact
            </Button>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 bg-red-500 hover:bg-red-500 text-white text-xs">
                    {notificationCount}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Auth Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <Menu className="h-4 w-4 mr-2" />
                  Get Started
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuItem onClick={onNavigateToLogin}>
                  Sign In
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onNavigateToSignup}>
                  Create Account
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 grid lg:grid-cols-2 gap-12 items-center">
        <div className="text-white space-y-8">
          <div className="space-y-4">
            <Badge className="bg-purple-500/20 text-purple-200 hover:bg-purple-500/30">
              🚀 #1 POST-UTME Platform in Nigeria
            </Badge>
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              Master Your
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                {" "}JAMB & POST-UTME{" "}
              </span>
              Preparation
            </h1>
            <p className="text-xl text-gray-200 leading-relaxed">
              Join thousands of successful students using AI-powered learning, authentic past questions, and comprehensive CBT simulation to achieve their university admission dreams.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8 py-6 text-lg"
              onClick={onNavigateToSignup}
              data-testid="button-signup-hero"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg"
              onClick={onNavigateToLogin}
              data-testid="button-login-hero"
            >
              Sign In
            </Button>
          </div>

          <div className="flex items-center space-x-6 text-sm text-gray-300">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Free 3 Practice Exams</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-400" />
              <span>2001-2020 Questions</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-yellow-400" />
              <span>AI Explanations</span>
            </div>
          </div>
        </div>

        {/* Auto-scrolling Images */}
        <div className="relative">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="relative h-96 rounded-lg overflow-hidden">
              {images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`App screenshot ${index + 1}`}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                    index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                  }`}
                  data-testid={`img-screenshot-${index + 1}`}
                />
              ))}
            </div>

            {/* Image indicators */}
            <div className="flex justify-center space-x-2 mt-4">
              {images.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/30'
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                  data-testid={`button-indicator-${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features-section" className="bg-white/5 backdrop-blur-sm py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-200 max-w-2xl mx-auto">
              Our comprehensive platform provides all the tools and resources needed for JAMB and POST-UTME success.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-md border-white/20 p-6 hover:bg-white/15 transition-all" data-testid={`card-feature-${index + 1}`}>
                <div className="text-purple-400 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-300">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Success Stories
            </h2>
            <p className="text-xl text-gray-200">
              Join thousands of students who achieved their dreams with CognitivePath
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-md border-white/20 p-6" data-testid={`card-testimonial-${index + 1}`}>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{testimonial.name}</div>
                    <div className="text-green-400 text-sm font-semibold">{testimonial.score}</div>
                    <div className="text-gray-400 text-xs">{testimonial.course}</div>
                  </div>
                </div>
                <p className="text-gray-200 italic">
                  "{testimonial.text}"
                </p>
                <div className="flex text-yellow-400 mt-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white threemb-4">
            Ready to Start Your Success Journey?
          </h2>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Join over 50,000 students who trust CognitivePath for their JAMB and POST-UTME preparation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-12 py-6 text-lg"
              onClick={onNavigateToSignup}
              data-testid="button-signup-cta"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/20 text-white hover:bg-white/10 px-12 py-6 text-lg"
              onClick={onNavigateToLogin}
              data-testid="button-login-cta"
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-sm py-8 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">CognitivePath</span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2024 CognitivePath. Empowering Nigerian students to achieve academic excellence.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}