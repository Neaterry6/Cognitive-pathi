import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { 
  Calendar, Clock, Target, Brain, CheckCircle, XCircle, 
  Play, Pause, SkipForward, RotateCcw, TrendingUp, 
  Zap, AlertCircle, Star, ArrowRight, Plus, Settings
} from "lucide-react";
import type { StudyScheduler, Subject, StudyInsights } from "@shared/schema";

const createTaskSchema = z.object({
  subjectId: z.string().min(1, "Subject is required"),
  scheduledDate: z.string().min(1, "Date is required"),
  scheduledTime: z.string().min(1, "Time is required"),
  duration: z.number().min(300, "Minimum 5 minutes").max(7200, "Maximum 2 hours"),
  taskType: z.enum(["quiz", "review", "notes", "practice"]),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium")
});

type CreateTaskForm = z.infer<typeof createTaskSchema>;

export default function AdaptiveScheduler() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<StudyScheduler | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const form = useForm<CreateTaskForm>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      subjectId: "",
      scheduledDate: selectedDate,
      scheduledTime: "",
      duration: 1800, // 30 minutes
      taskType: "quiz",
      priority: "medium",
      difficulty: "medium"
    }
  });

  // Fetch subjects
  const { data: subjects } = useQuery({
    queryKey: ["/api/subjects"],
    enabled: !!user
  });

  // Fetch today's schedule
  const { data: todaySchedule, isLoading } = useQuery({
    queryKey: ["/api/scheduler/today", selectedDate],
    enabled: !!user
  });

  // Fetch upcoming tasks
  const { data: upcomingTasks } = useQuery({
    queryKey: ["/api/scheduler/upcoming"],
    enabled: !!user
  });

  // Fetch study insights
  const { data: insights } = useQuery({
    queryKey: ["/api/insights/weekly"],
    enabled: !!user
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (data: CreateTaskForm) => apiRequest("/api/scheduler/tasks", {
      method: "POST",
      body: JSON.stringify({ 
        ...data, 
        userId: user?.id,
        scheduledDate: new Date(data.scheduledDate + 'T' + data.scheduledTime),
        adaptiveScore: 5 // Default score, will be adjusted based on performance
      })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scheduler"] });
      setIsCreateDialogOpen(false);
      form.reset();
    }
  });

  // Start task mutation
  const startTaskMutation = useMutation({
    mutationFn: (taskId: string) => apiRequest(`/api/scheduler/tasks/${taskId}/start`, {
      method: "POST"
    }),
    onSuccess: (task) => {
      setActiveTask(task);
      setTimeRemaining(task.duration);
      setIsRunning(true);
      queryClient.invalidateQueries({ queryKey: ["/api/scheduler"] });
    }
  });

  // Complete task mutation
  const completeTaskMutation = useMutation({
    mutationFn: (data: { taskId: string; performance: any }) => 
      apiRequest(`/api/scheduler/tasks/${data.taskId}/complete`, {
        method: "POST",
        body: JSON.stringify(data.performance)
      }),
    onSuccess: () => {
      setActiveTask(null);
      setIsRunning(false);
      setTimeRemaining(0);
      queryClient.invalidateQueries({ queryKey: ["/api/scheduler"] });
    }
  });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            // Auto-complete task when time runs out
            if (activeTask) {
              completeTaskMutation.mutate({
                taskId: activeTask.id,
                performance: {
                  timeEfficiency: 100,
                  completed: true
                }
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeRemaining, activeTask]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "high": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getTaskTypeIcon = (taskType: string) => {
    switch (taskType) {
      case "quiz": return <Target className="w-4 h-4" />;
      case "review": return <RotateCcw className="w-4 h-4" />;
      case "notes": return <Brain className="w-4 h-4" />;
      case "practice": return <Play className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const getAdaptiveRecommendations = () => {
    if (!insights) return [];
    
    const recommendations = [];
    
    // Check if user has low focus scores
    if (insights.averageFocusScore < 70) {
      recommendations.push({
        type: "focus",
        message: "Consider shorter study sessions to improve focus",
        action: "Reduce session duration to 25 minutes"
      });
    }
    
    // Check productive hours
    if (insights.productiveHours?.length > 0) {
      const mostProductive = insights.productiveHours.reduce((max, current) => 
        current.productivity > max.productivity ? current : max
      );
      recommendations.push({
        type: "timing",
        message: `You're most productive at ${mostProductive.hour}:00`,
        action: `Schedule important tasks around ${mostProductive.hour}:00`
      });
    }
    
    // Check subject performance
    if (insights.subjectPerformance?.length > 0) {
      const weakSubject = insights.subjectPerformance.reduce((min, current) => 
        current.averageScore < min.averageScore ? current : min
      );
      recommendations.push({
        type: "subject",
        message: `${weakSubject.subject} needs more attention`,
        action: `Increase study time for ${weakSubject.subject}`
      });
    }
    
    return recommendations;
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to access Adaptive Scheduler</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="text-purple-600" />
              Adaptive Study Scheduler
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              AI-powered study planning that adapts to your performance and learning patterns
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Schedule Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule New Study Task</DialogTitle>
                <DialogDescription>
                  Create a new study task and let AI optimize your schedule
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => createTaskMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="subjectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subjects?.map((subject: Subject) => (
                              <SelectItem key={subject.id} value={subject.id}>
                                {subject.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="scheduledDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="scheduledTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes)</FormLabel>
                        <Select onValueChange={(value) => field.onChange(Number(value) * 60)} defaultValue={(field.value / 60).toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="25">25 minutes (Pomodoro)</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="45">45 minutes</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                            <SelectItem value="90">1.5 hours</SelectItem>
                            <SelectItem value="120">2 hours</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="taskType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Task Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="quiz">Quiz Practice</SelectItem>
                              <SelectItem value="review">Review Session</SelectItem>
                              <SelectItem value="notes">Note Taking</SelectItem>
                              <SelectItem value="practice">Practice Questions</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button type="submit" disabled={createTaskMutation.isPending} className="flex-1">
                      {createTaskMutation.isPending ? "Scheduling..." : "Schedule Task"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Active Task Timer */}
        {activeTask && (
          <Card className="mb-6 border-l-4 border-l-purple-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Current Task: {activeTask.subjectName}</CardTitle>
                  <CardDescription>
                    {activeTask.taskType.charAt(0).toUpperCase() + activeTask.taskType.slice(1)} Session
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-mono font-bold text-purple-600">
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {Math.round((1 - timeRemaining / activeTask.duration) * 100)}% complete
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsRunning(!isRunning)}
                  variant={isRunning ? "outline" : "default"}
                  size="sm"
                >
                  {isRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {isRunning ? "Pause" : "Resume"}
                </Button>
                <Button
                  onClick={() => completeTaskMutation.mutate({
                    taskId: activeTask.id,
                    performance: { 
                      timeEfficiency: Math.round((1 - timeRemaining / activeTask.duration) * 100),
                      completed: true 
                    }
                  })}
                  variant="outline"
                  size="sm"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Recommendations */}
        {getAdaptiveRecommendations().length > 0 && (
          <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="text-purple-600" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getAdaptiveRecommendations().map((rec, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <Zap className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{rec.message}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{rec.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Today's Schedule</CardTitle>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-auto"
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : todaySchedule?.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No tasks scheduled for this date</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todaySchedule?.map((task: StudyScheduler) => (
                    <div key={task.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="flex-shrink-0">
                        {getTaskTypeIcon(task.taskType)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{task.subjectName}</h3>
                          <Badge className={getPriorityColor(task.priority)} variant="secondary">
                            {task.priority}
                          </Badge>
                          <Badge variant="outline">
                            {task.taskType}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.scheduledTime}
                          </span>
                          <span>{Math.round(task.duration / 60)} min</span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Score: {task.adaptiveScore}/10
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {task.status === "pending" && !activeTask && (
                          <Button
                            onClick={() => startTaskMutation.mutate(task.id)}
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                        {task.status === "completed" && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                        {task.status === "skipped" && (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingTasks?.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No upcoming tasks</p>
              ) : (
                <div className="space-y-3">
                  {upcomingTasks?.slice(0, 5).map((task: StudyScheduler) => (
                    <div key={task.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium text-sm">{task.subjectName}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(task.scheduledDate).toLocaleDateString()} at {task.scheduledTime}
                        </p>
                      </div>
                      <Badge className={getPriorityColor(task.priority)} variant="secondary">
                        {task.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Study Insights */}
          {insights && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">This Week's Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Focus Score</span>
                    <span className="font-medium">{insights.averageFocusScore || 0}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${insights.averageFocusScore || 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Study Time</span>
                    <span className="font-medium">{Math.round((insights.totalStudyTime || 0) / 3600)}h</span>
                  </div>
                </div>
                
                {insights.preferredStudyTime && (
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Best Time</span>
                      <span className="font-medium capitalize">{insights.preferredStudyTime}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}