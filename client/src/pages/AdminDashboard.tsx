import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Plus, 
  Upload, 
  Edit, 
  Trash2, 
  Users, 
  BookOpen, 
  BarChart3,
  FileText,
  Settings,
  Eye,
  Save
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';

interface AdminDashboardProps {
  user: any;
  onBack: () => void;
}

export default function AdminDashboard({ user, onBack }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Question form state
  const [questionForm, setQuestionForm] = useState({
    subjectId: '',
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: '',
    explanation: '',
    difficulty: 'medium',
    topic: '',
  });

  // Subject form state
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    emoji: '',
    description: '',
  });

  // Fetch data
  const { data: stats } = useQuery<{
    totalUsers: number;
    totalQuestions: number;
    totalSubjects: number;
    premiumUsers: number;
  }>({
    queryKey: ['/api/admin/stats'],
  });

  const { data: subjects } = useQuery<Array<{
    id: string;
    name: string;
    emoji: string;
    description?: string;
    totalQuestions: number;
  }>>({
    queryKey: ['/api/subjects'],
  });

  const { data: users } = useQuery<Array<any>>({
    queryKey: ['/api/admin/users'],
  });

  const { data: questions } = useQuery<Array<any>>({
    queryKey: ['/api/admin/questions'],
  });

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const options = [
        { label: 'A', text: questionForm.optionA },
        { label: 'B', text: questionForm.optionB },
        { label: 'C', text: questionForm.optionC },
        { label: 'D', text: questionForm.optionD },
      ];

      await apiRequest('POST', '/api/admin/questions', {
        subjectId: questionForm.subjectId,
        question: questionForm.question,
        options,
        correctAnswer: questionForm.correctAnswer,
        explanation: questionForm.explanation,
        difficulty: questionForm.difficulty,
        topic: questionForm.topic,
      });

      setQuestionForm({
        subjectId: '',
        question: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctAnswer: '',
        explanation: '',
        difficulty: 'medium',
        topic: '',
      });

      toast({
        title: "Question Added!",
        description: "The question has been successfully added to the database",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add question",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await apiRequest('POST', '/api/admin/subjects', subjectForm);

      setSubjectForm({
        name: '',
        emoji: '',
        description: '',
      });

      toast({
        title: "Subject Added!",
        description: "The subject has been successfully added",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add subject",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'questions', label: 'Questions', icon: <FileText className="h-4 w-4" /> },
    { id: 'subjects', label: 'Subjects', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'users', label: 'Users', icon: <Users className="h-4 w-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-purple-200">Manage your CBT platform</p>
            </div>
          </div>
          <Button
            onClick={onBack}
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10"
          >
            ← Back to App
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-white/10 backdrop-blur-lg rounded-lg p-1 mb-8 overflow-x-auto">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              variant={activeTab === tab.id ? "default" : "ghost"}
              className={`flex items-center space-x-2 whitespace-nowrap ${
                activeTab === tab.id 
                  ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white" 
                  : "text-purple-200 hover:text-white hover:bg-white/10"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </Button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-purple-200 text-sm">Total Users</p>
                      <p className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-purple-200 text-sm">Total Questions</p>
                      <p className="text-2xl font-bold text-white">{stats?.totalQuestions || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-purple-200 text-sm">Subjects</p>
                      <p className="text-2xl font-bold text-white">{stats?.totalSubjects || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-purple-200 text-sm">Premium Users</p>
                      <p className="text-2xl font-bold text-white">{stats?.premiumUsers || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="space-y-6">
            {/* Add Question Form */}
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Add New Question</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleQuestionSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-white">Subject</Label>
                      <Select value={questionForm.subjectId} onValueChange={(value) => 
                        setQuestionForm(prev => ({ ...prev, subjectId: value }))}>
                        <SelectTrigger className="bg-white/20 border-white/30 text-white">
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects?.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.emoji} {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="topic" className="text-white">Topic</Label>
                      <Input
                        id="topic"
                        value={questionForm.topic}
                        onChange={(e) => setQuestionForm(prev => ({ ...prev, topic: e.target.value }))}
                        className="bg-white/20 border-white/30 text-white placeholder:text-purple-200"
                        placeholder="Enter topic"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="question" className="text-white">Question</Label>
                    <Textarea
                      id="question"
                      value={questionForm.question}
                      onChange={(e) => setQuestionForm(prev => ({ ...prev, question: e.target.value }))}
                      className="bg-white/20 border-white/30 text-white placeholder:text-purple-200 min-h-[100px]"
                      placeholder="Enter the question"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="optionA" className="text-white">Option A</Label>
                      <Input
                        id="optionA"
                        value={questionForm.optionA}
                        onChange={(e) => setQuestionForm(prev => ({ ...prev, optionA: e.target.value }))}
                        className="bg-white/20 border-white/30 text-white placeholder:text-purple-200"
                        placeholder="Option A"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="optionB" className="text-white">Option B</Label>
                      <Input
                        id="optionB"
                        value={questionForm.optionB}
                        onChange={(e) => setQuestionForm(prev => ({ ...prev, optionB: e.target.value }))}
                        className="bg-white/20 border-white/30 text-white placeholder:text-purple-200"
                        placeholder="Option B"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="optionC" className="text-white">Option C</Label>
                      <Input
                        id="optionC"
                        value={questionForm.optionC}
                        onChange={(e) => setQuestionForm(prev => ({ ...prev, optionC: e.target.value }))}
                        className="bg-white/20 border-white/30 text-white placeholder:text-purple-200"
                        placeholder="Option C"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="optionD" className="text-white">Option D</Label>
                      <Input
                        id="optionD"
                        value={questionForm.optionD}
                        onChange={(e) => setQuestionForm(prev => ({ ...prev, optionD: e.target.value }))}
                        className="bg-white/20 border-white/30 text-white placeholder:text-purple-200"
                        placeholder="Option D"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="correctAnswer" className="text-white">Correct Answer</Label>
                      <Select value={questionForm.correctAnswer} onValueChange={(value) => 
                        setQuestionForm(prev => ({ ...prev, correctAnswer: value }))}>
                        <SelectTrigger className="bg-white/20 border-white/30 text-white">
                          <SelectValue placeholder="Select correct answer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                          <SelectItem value="C">C</SelectItem>
                          <SelectItem value="D">D</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="difficulty" className="text-white">Difficulty</Label>
                      <Select value={questionForm.difficulty} onValueChange={(value) => 
                        setQuestionForm(prev => ({ ...prev, difficulty: value }))}>
                        <SelectTrigger className="bg-white/20 border-white/30 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="explanation" className="text-white">Explanation (Optional)</Label>
                    <Textarea
                      id="explanation"
                      value={questionForm.explanation}
                      onChange={(e) => setQuestionForm(prev => ({ ...prev, explanation: e.target.value }))}
                      className="bg-white/20 border-white/30 text-white placeholder:text-purple-200"
                      placeholder="Explain why this is the correct answer"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-3"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Adding Question...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Save className="h-5 w-5 mr-2" />
                        Add Question
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'subjects' && (
          <div className="space-y-6">
            {/* Add Subject Form */}
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Add New Subject</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubjectSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subjectName" className="text-white">Subject Name</Label>
                      <Input
                        id="subjectName"
                        value={subjectForm.name}
                        onChange={(e) => setSubjectForm(prev => ({ ...prev, name: e.target.value }))}
                        className="bg-white/20 border-white/30 text-white placeholder:text-purple-200"
                        placeholder="e.g., Mathematics"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emoji" className="text-white">Emoji</Label>
                      <Input
                        id="emoji"
                        value={subjectForm.emoji}
                        onChange={(e) => setSubjectForm(prev => ({ ...prev, emoji: e.target.value }))}
                        className="bg-white/20 border-white/30 text-white placeholder:text-purple-200"
                        placeholder="📚"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-white">Description</Label>
                    <Textarea
                      id="description"
                      value={subjectForm.description}
                      onChange={(e) => setSubjectForm(prev => ({ ...prev, description: e.target.value }))}
                      className="bg-white/20 border-white/30 text-white placeholder:text-purple-200"
                      placeholder="Brief description of the subject"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-3"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Adding Subject...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Save className="h-5 w-5 mr-2" />
                        Add Subject
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Existing Subjects */}
            {subjects && subjects.length > 0 && (
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Existing Subjects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subjects.map((subject) => (
                      <div key={subject.id} className="bg-white/10 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">{subject.emoji}</span>
                            <h4 className="font-semibold text-white">{subject.name}</h4>
                          </div>
                          <Badge variant="secondary" className="bg-purple-500/20 text-purple-200">
                            {subject.totalQuestions || 0} questions
                          </Badge>
                        </div>
                        {subject.description && (
                          <p className="text-purple-200 text-sm">{subject.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}