import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Users, 
  BookOpen, 
  Brain, 
  Trophy, 
  TrendingUp, 
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Download,
  Upload,
  MessageCircle,
  Clock,
  Target,
  Star
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface AdminStats {
  totalUsers: number;
  premiumUsers: number;
  totalQuestions: number;
  totalSubjects: number;
  totalQuizSessions: number;
  averageScore: number;
  activeUsersToday: number;
  completionRate: number;
}

export default function ComprehensiveAdminDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const queryClient = useQueryClient();

  // Fetch admin statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/stats');
      return await response.json() as AdminStats;
    },
  });

  // Fetch all users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/users');
      return await response.json();
    },
  });

  // Fetch all questions
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['/api/admin/questions'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/questions');
      return await response.json();
    },
  });

  // Fetch subjects
  const { data: subjects } = useQuery({
    queryKey: ['/api/subjects'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/subjects');
      return await response.json();
    },
  });

  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      const response = await apiRequest('DELETE', `/api/admin/questions/${questionId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/questions'] });
      toast({
        title: "Success",
        description: "Question deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive",
      });
    },
  });

  const StatCard = ({ title, value, icon: Icon, subtitle, trend }: any) => (
    <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-300">{title}</CardTitle>
        <Icon className="h-4 w-4 text-blue-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
        {subtitle && (
          <p className="text-xs text-gray-500 flex items-center mt-1">
            {trend && (
              <TrendingUp className={`h-3 w-3 mr-1 ${trend > 0 ? 'text-green-400' : 'text-red-400'}`} />
            )}
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6" data-testid="admin-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">Comprehensive platform management</p>
        </div>
        <Badge variant="destructive" className="px-3 py-1">
          ADMIN MODE
        </Badge>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={Users}
          subtitle={`${stats?.premiumUsers || 0} Premium`}
          trend={5}
        />
        <StatCard
          title="Total Questions"
          value={stats?.totalQuestions || 0}
          icon={BookOpen}
          subtitle={`${stats?.totalSubjects || 0} Subjects`}
        />
        <StatCard
          title="Quiz Sessions"
          value={stats?.totalQuizSessions || 0}
          icon={Brain}
          subtitle={`${stats?.averageScore || 0}% Avg Score`}
          trend={3}
        />
        <StatCard
          title="Active Today"
          value={stats?.activeUsersToday || 0}
          icon={Trophy}
          subtitle={`${stats?.completionRate || 0}% Completion`}
          trend={8}
        />
      </div>

      {/* Main Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 bg-gray-800">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-blue-600">
            Users
          </TabsTrigger>
          <TabsTrigger value="questions" className="data-[state=active]:bg-blue-600">
            Questions
          </TabsTrigger>
          <TabsTrigger value="subjects" className="data-[state=active]:bg-blue-600">
            Subjects
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-600">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600">
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <div>
                    <p className="font-medium">New user registration</p>
                    <p className="text-sm text-gray-400">John Doe joined the platform</p>
                  </div>
                  <span className="text-xs text-gray-500">2 min ago</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <div>
                    <p className="font-medium">Premium activation</p>
                    <p className="text-sm text-gray-400">User activated via WhatsApp code</p>
                  </div>
                  <span className="text-xs text-gray-500">5 min ago</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <div>
                    <p className="font-medium">Quiz completed</p>
                    <p className="text-sm text-gray-400">Mathematics quiz - 85% score</p>
                  </div>
                  <span className="text-xs text-gray-500">8 min ago</span>
                </div>
              </CardContent>
            </Card>

            {/* Platform Health */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Platform Health</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Server Performance</span>
                    <span className="text-green-400">98%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-green-400 h-2 rounded-full" style={{width: '98%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Database Health</span>
                    <span className="text-green-400">95%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-green-400 h-2 rounded-full" style={{width: '95%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>API Response Time</span>
                    <span className="text-yellow-400">250ms</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-yellow-400 h-2 rounded-full" style={{width: '75%'}}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-700 border-gray-600"
                />
                <Button variant="outline" size="sm">
                  <Search className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tests Completed</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.slice(0, 10).map((user: any) => (
                    <TableRow key={user.id} className="border-gray-700">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                            {user.nickname?.charAt(0).toUpperCase()}
                          </div>
                          <span>{user.nickname}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.isPremium ? "default" : "secondary"}>
                          {user.isPremium ? 'Premium' : 'Free'}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.testsCompleted || 0}</TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Questions Tab */}
        <TabsContent value="questions" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Question Management</CardTitle>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Search questions..."
                    className="bg-gray-700 border-gray-600"
                  />
                  <Button variant="outline" size="sm">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead>Question</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Topic</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions?.slice(0, 10).map((question: any) => (
                    <TableRow key={question.id} className="border-gray-700">
                      <TableCell className="max-w-md truncate">
                        {question.question}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {subjects?.find((s: any) => s.id === question.subjectId)?.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={question.difficulty === 'hard' ? 'destructive' : 
                                   question.difficulty === 'medium' ? 'secondary' : 'default'}
                        >
                          {question.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell>{question.topic || 'General'}</TableCell>
                      <TableCell>{new Date(question.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => deleteQuestionMutation.mutate(question.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subjects Tab */}
        <TabsContent value="subjects" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects?.map((subject: any) => (
              <Card key={subject.id} className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span className="text-2xl">{subject.emoji}</span>
                    <span>{subject.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 mb-4">{subject.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">
                      {subject.totalQuestions || 0} Questions
                    </Badge>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Analytics Chart Placeholder
                  <br />
                  (Integration with chart library needed)
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Subject Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subjects?.slice(0, 5).map((subject: any) => (
                    <div key={subject.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span>{subject.emoji}</span>
                        <span>{subject.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-400 h-2 rounded-full" 
                            style={{width: `${Math.random() * 100}%`}}
                          ></div>
                        </div>
                        <span className="text-sm">{Math.floor(Math.random() * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>WhatsApp Unlock Codes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gray-700 rounded">
                  <h4 className="font-medium mb-2">Active Codes:</h4>
                  <div className="space-y-2">
                    <Badge variant="default">0814880</Badge>
                    <Badge variant="default">0901918</Badge>
                    <Badge variant="default">0803988</Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  Users need to message you on WhatsApp to get these unlock codes for premium access.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Quiz Time Limit (seconds)</label>
                  <Input type="number" defaultValue={30} className="bg-gray-700 border-gray-600" />
                </div>
                <div>
                  <label className="text-sm font-medium">Default Questions per Quiz</label>
                  <Input type="number" defaultValue={20} className="bg-gray-700 border-gray-600" />
                </div>
                <div>
                  <label className="text-sm font-medium">Maintenance Message</label>
                  <Textarea 
                    placeholder="Enter maintenance message..." 
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}