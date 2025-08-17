import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, ExternalLink, Heart, Code, BookOpen, Trophy, Users, Lightbulb } from "lucide-react";

export default function FAQ() {
  const faqs = [
    {
      category: "App Features",
      icon: <BookOpen className="w-5 h-5" />,
      questions: [
        {
          q: "What is CBT Learning Platform?",
          a: "CBT Learning Platform is a comprehensive Computer-Based Test learning platform designed specifically for POST-UTME exam preparation. It provides interactive quiz sessions, AI-powered study plans, Wikipedia integration for research, and premium features to help students excel in their university entrance exams."
        },
        {
          q: "What subjects are available?",
          a: "We offer 8 core subjects: English Language, Mathematics, Biology, Physics, Chemistry, Economics, Government, and Literature. Each subject contains over 50+ carefully curated questions with detailed explanations."
        },
        {
          q: "How does the AI explanation feature work?",
          a: "Our platform integrates with advanced AI models (OpenAI GPT-4) to provide intelligent, context-aware explanations for each question. The AI can break down complex concepts, provide step-by-step solutions, and offer additional learning resources."
        },
        {
          q: "What makes this platform different?",
          a: "Unlike other CBT platforms, we combine real-time quiz functionality, AI-powered explanations, Wikipedia integration for research, detailed performance analytics, and a comprehensive study plan system all in one unified platform."
        }
      ]
    },
    {
      category: "Getting Started",
      icon: <Users className="w-5 h-5" />,
      questions: [
        {
          q: "How do I register?",
          a: "Simply click 'Sign Up' and provide your email, password, nickname, and name. You'll get instant access to the platform with basic features. Premium features can be unlocked with activation codes."
        },
        {
          q: "Is there a free version?",
          a: "Yes! We offer free access to basic quiz functionality with limited questions. Premium users get access to unlimited questions, AI explanations, detailed analytics, and advanced study plans."
        },
        {
          q: "How do I take a quiz?",
          a: "Select your subject from the dashboard, choose a quiz year/type, and start your test. Each quiz is timed and provides instant feedback with explanations."
        }
      ]
    },
    {
      category: "Technical",
      icon: <Code className="w-5 h-5" />,
      questions: [
        {
          q: "What technology powers this platform?",
          a: "Built with modern web technologies: React/TypeScript frontend, Node.js/Express backend, MongoDB database, and integrated with OpenAI for AI features. Deployed on Replit with plans for Vercel deployment."
        },
        {
          q: "Is my data secure?",
          a: "Yes, we implement industry-standard security practices including encrypted passwords, secure session management, and data validation. Your personal information and quiz results are kept private and secure."
        },
        {
          q: "Can I use this on mobile?",
          a: "Absolutely! The platform is fully responsive and works seamlessly on mobile devices, tablets, and desktop computers."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-4">
      {/* Header */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg mb-6">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-white hover:bg-opacity-20"
                data-testid="button-back-dashboard"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">FAQ & About</h1>
              <p className="text-white text-opacity-70">Learn more about the platform and its creator</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Creator Section */}
        <Card className="bg-white bg-opacity-10 border-white border-opacity-20 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl font-bold text-white">BV</span>
            </div>
            <CardTitle className="text-2xl text-white mb-2">
              Meet the Creator: Broken Vzn
            </CardTitle>
            <CardDescription className="text-white text-opacity-80 max-w-2xl mx-auto">
              A passionate developer with expertise in modern web technologies who also writes captivating stories and poetry, 
              blending creativity with logic to craft experiences that inspire.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-white font-semibold flex items-center space-x-2">
                  <Code className="w-5 h-5" />
                  <span>Technical Expertise</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    'React', 'TypeScript', 'Node.js', 'MongoDB', 
                    'Express.js', 'AI Integration', 'Full-Stack Development'
                  ].map((tech) => (
                    <Badge key={tech} variant="secondary" className="bg-blue-600 text-white">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-white font-semibold flex items-center space-x-2">
                  <Heart className="w-5 h-5" />
                  <span>Creative Work</span>
                </h3>
                <p className="text-white text-opacity-80 text-sm">
                  Beyond coding, Broken Vzn writes stories and poems that inspire and engage readers. 
                  This unique blend of technical skills and creative expression brings a special touch to every project.
                </p>
              </div>
            </div>

            <div className="border-t border-white border-opacity-20 pt-6">
              <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
                <ExternalLink className="w-5 h-5" />
                <span>Connect & Explore</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <a 
                  href="https://portfolio-neaterry6s-projects.vercel.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-lg flex items-center space-x-2 hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Portfolio</span>
                </a>
                <a 
                  href="https://streame-id.vercel.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-3 rounded-lg flex items-center space-x-2 hover:from-green-700 hover:to-blue-700 transition-all"
                >
                  <Lightbulb className="w-4 h-4" />
                  <span>Streame ID</span>
                </a>
                <a 
                  href="https://github.com/Neaterry6" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-gray-800 text-white p-3 rounded-lg flex items-center space-x-2 hover:bg-gray-700 transition-all"
                >
                  <Code className="w-4 h-4" />
                  <span>GitHub</span>
                </a>
                <a 
                  href="https://whatsapp.com/channel/0029Vb63QCJ9Gv7Q5ec5rt3e" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white p-3 rounded-lg flex items-center space-x-2 hover:from-green-600 hover:to-green-700 transition-all"
                >
                  <Users className="w-4 h-4" />
                  <span>Channel</span>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Sections */}
        {faqs.map((section, sectionIndex) => (
          <Card key={sectionIndex} className="bg-white bg-opacity-10 border-white border-opacity-20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  {section.icon}
                </div>
                <span>{section.category}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {section.questions.map((faq, index) => (
                <div key={index} className="border-b border-white border-opacity-10 last:border-b-0 pb-4 last:pb-0">
                  <h3 className="text-white font-semibold mb-2 text-lg">
                    {faq.q}
                  </h3>
                  <p className="text-white text-opacity-80 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {/* Contact Section */}
        <Card className="bg-gradient-to-r from-purple-600 to-pink-600 border-0">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Need More Help?</h3>
            <p className="text-white text-opacity-90 mb-6 max-w-2xl mx-auto">
              Have questions not covered here? Want to connect with the creator or contribute to the platform? 
              We'd love to hear from you!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href="https://wa.me/2348039896597" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                WhatsApp Support
              </a>
              <a 
                href="https://t.me/Heartbreak798453" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white bg-opacity-20 text-white px-6 py-3 rounded-lg font-semibold hover:bg-opacity-30 transition-colors border border-white border-opacity-30"
              >
                Telegram
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}