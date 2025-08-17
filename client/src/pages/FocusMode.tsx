import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { 
  Shield, Clock, Play, Pause, Square, RotateCcw, 
  Target, AlertCircle, CheckCircle, Focus, Timer,
  Volume2, VolumeX, Coffee, Brain, Zap, Settings,
  TrendingUp, Award, Star, Eye, EyeOff
} from "lucide-react";
import type { FocusSession } from "@shared/schema";

const createSessionSchema = z.object({
  sessionName: z.string().min(1, "Session name is required"),
  sessionType: z.enum(["deep_focus", "pomodoro", "timed_review", "exam_prep"]),
  duration: z.number().min(300, "Minimum 5 minutes").max(14400, "Maximum 4 hours"),
  breakDuration: z.number().min(300, "Minimum 5 minutes").max(1800, "Maximum 30 minutes"),
  totalCycles: z.number().min(1).max(10),
  allowedActions: z.object({
    quiz: z.boolean(),
    notes: z.boolean(),
    calculator: z.boolean(),
    wiki: z.boolean()
  })
});

type CreateSessionForm = z.infer<typeof createSessionSchema>;

export default function FocusMode() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreakTime, setIsBreakTime] = useState(false);
  const [showDistractionWarning, setShowDistractionWarning] = useState(false);
  const [distractionCount, setDistractionCount] = useState(0);
  const [focusScore, setFocusScore] = useState(100);
  const [blockedAttempts, setBlockedAttempts] = useState<string[]>([]);

  const form = useForm<CreateSessionForm>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      sessionName: "",
      sessionType: "deep_focus",
      duration: 1500, // 25 minutes (Pomodoro default)
      breakDuration: 300, // 5 minutes
      totalCycles: 1,
      allowedActions: {
        quiz: true,
        notes: true,
        calculator: false,
        wiki: false
      }
    }
  });

  // Fetch active session
  const { data: currentSession } = useQuery({
    queryKey: ["/api/focus/active"],
    enabled: !!user,
    refetchInterval: 5000 // Check every 5 seconds
  });

  // Fetch focus history
  const { data: focusHistory } = useQuery({
    queryKey: ["/api/focus/history"],
    enabled: !!user
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: (data: CreateSessionForm) => apiRequest("/api/focus/sessions", {
      method: "POST",
      body: JSON.stringify({ ...data, userId: user?.id })
    }),
    onSuccess: (session) => {
      setActiveSession(session);
      setTimeRemaining(session.duration);
      setIsRunning(false);
      setIsBreakTime(false);
      setDistractionCount(0);
      setFocusScore(100);
      queryClient.invalidateQueries({ queryKey: ["/api/focus"] });
      setIsCreateDialogOpen(false);
      form.reset();
    }
  });

  // Start session mutation
  const startSessionMutation = useMutation({
    mutationFn: (sessionId: string) => apiRequest(`/api/focus/sessions/${sessionId}/start`, {
      method: "POST"
    }),
    onSuccess: () => {
      setIsRunning(true);
      queryClient.invalidateQueries({ queryKey: ["/api/focus"] });
    }
  });

  // Pause session mutation
  const pauseSessionMutation = useMutation({
    mutationFn: (sessionId: string) => apiRequest(`/api/focus/sessions/${sessionId}/pause`, {
      method: "POST"
    }),
    onSuccess: () => {
      setIsRunning(false);
      queryClient.invalidateQueries({ queryKey: ["/api/focus"] });
    }
  });

  // Complete session mutation
  const completeSessionMutation = useMutation({
    mutationFn: (data: { sessionId: string; focusScore: number; distractionCount: number }) =>
      apiRequest(`/api/focus/sessions/${data.sessionId}/complete`, {
        method: "POST",
        body: JSON.stringify({
          focusScore: data.focusScore,
          distractionCount: data.distractionCount
        })
      }),
    onSuccess: () => {
      setActiveSession(null);
      setIsRunning(false);
      setTimeRemaining(0);
      setIsBreakTime(false);
      queryClient.invalidateQueries({ queryKey: ["/api/focus"] });
    }
  });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            if (activeSession) {
              if (isBreakTime) {
                // Break time ended, start next cycle or complete session
                const nextCycle = activeSession.cyclesCompleted + 1;
                if (nextCycle < activeSession.totalCycles) {
                  setTimeRemaining(activeSession.duration);
                  setIsBreakTime(false);
                } else {
                  // Session completed
                  completeSessionMutation.mutate({
                    sessionId: activeSession.id,
                    focusScore,
                    distractionCount
                  });
                }
              } else {
                // Study time ended, start break
                setTimeRemaining(activeSession.breakDuration);
                setIsBreakTime(true);
              }
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeRemaining, activeSession, isBreakTime, focusScore, distractionCount]);

  // Focus tracking effect - simulate detecting distractions
  useEffect(() => {
    if (activeSession && isRunning && !isBreakTime) {
      const distractionDetector = setInterval(() => {
        // Simulate random distraction detection (in real app, this would be actual monitoring)
        if (Math.random() < 0.05) { // 5% chance every 10 seconds
          handleDistraction("Random distraction detected");
        }
      }, 10000);

      return () => clearInterval(distractionDetector);
    }
  }, [activeSession, isRunning, isBreakTime]);

  const handleDistraction = (source: string) => {
    if (activeSession && isRunning && !isBreakTime) {
      const newCount = distractionCount + 1;
      const newScore = Math.max(0, focusScore - 5);
      
      setDistractionCount(newCount);
      setFocusScore(newScore);
      setBlockedAttempts(prev => [...prev, source]);
      setShowDistractionWarning(true);
      
      // Hide warning after 3 seconds
      setTimeout(() => setShowDistractionWarning(false), 3000);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case "deep_focus": return <Brain className="w-5 h-5" />;
      case "pomodoro": return <Timer className="w-5 h-5" />;
      case "timed_review": return <RotateCcw className="w-5 h-5" />;
      case "exam_prep": return <Target className="w-5 h-5" />;
      default: return <Focus className="w-5 h-5" />;
    }
  };

  const getSessionTypeDescription = (type: string) => {
    switch (type) {
      case "deep_focus": return "Extended focus session with minimal breaks";
      case "pomodoro": return "25-minute work sessions with 5-minute breaks";
      case "timed_review": return "Structured review sessions for retention";
      case "exam_prep": return "Intensive preparation sessions";
      default: return "Custom focus session";
    }
  };

  const getFocusScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to access Focus Mode</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Distraction Warning Overlay */}
      {showDistractionWarning && (
        <div className="fixed inset-0 bg-red-500/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="max-w-md mx-4 border-red-500 border-2">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-red-800 mb-2">Distraction Detected!</h3>
              <p className="text-red-600">Stay focused on your study session.</p>
              <p className="text-sm text-gray-600 mt-2">Focus Score: {focusScore}/100</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="text-green-600" />
              Focus Mode (DND)
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Distraction-free study sessions with smart blocking and progress tracking
            </p>
          </div>
          
          {!activeSession && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Focus className="w-4 h-4 mr-2" />
                  Start Focus Session
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Focus Session</DialogTitle>
                  <DialogDescription>
                    Set up a distraction-free study environment
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => createSessionMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="sessionName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Session Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Morning Math Review" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sessionType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Session Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select session type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="deep_focus">Deep Focus</SelectItem>
                              <SelectItem value="pomodoro">Pomodoro (25min)</SelectItem>
                              <SelectItem value="timed_review">Timed Review</SelectItem>
                              <SelectItem value="exam_prep">Exam Preparation</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Session Duration</FormLabel>
                            <Select 
                              onValueChange={(value) => field.onChange(Number(value))} 
                              defaultValue={field.value.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Duration" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="900">15 minutes</SelectItem>
                                <SelectItem value="1500">25 minutes</SelectItem>
                                <SelectItem value="1800">30 minutes</SelectItem>
                                <SelectItem value="2700">45 minutes</SelectItem>
                                <SelectItem value="3600">1 hour</SelectItem>
                                <SelectItem value="5400">1.5 hours</SelectItem>
                                <SelectItem value="7200">2 hours</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="breakDuration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Break Duration</FormLabel>
                            <Select 
                              onValueChange={(value) => field.onChange(Number(value))} 
                              defaultValue={field.value.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Break" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="300">5 minutes</SelectItem>
                                <SelectItem value="600">10 minutes</SelectItem>
                                <SelectItem value="900">15 minutes</SelectItem>
                                <SelectItem value="1200">20 minutes</SelectItem>
                                <SelectItem value="1800">30 minutes</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="totalCycles"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Cycles</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(Number(value))} 
                            defaultValue={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Cycles" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">1 cycle</SelectItem>
                              <SelectItem value="2">2 cycles</SelectItem>
                              <SelectItem value="3">3 cycles</SelectItem>
                              <SelectItem value="4">4 cycles</SelectItem>
                              <SelectItem value="6">6 cycles</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Allowed Actions */}
                    <div className="space-y-3">
                      <FormLabel>Allowed Actions During Session</FormLabel>
                      
                      <FormField
                        control={form.control}
                        name="allowedActions.quiz"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <FormLabel className="text-sm font-normal">Quiz Practice</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="allowedActions.notes"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <FormLabel className="text-sm font-normal">Note Taking</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="allowedActions.calculator"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <FormLabel className="text-sm font-normal">Calculator</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="allowedActions.wiki"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <FormLabel className="text-sm font-normal">Wikipedia Research</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button type="submit" disabled={createSessionMutation.isPending} className="flex-1">
                        {createSessionMutation.isPending ? "Creating..." : "Start Session"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Active Session */}
      {activeSession && (
        <div className="mb-8">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getSessionTypeIcon(activeSession.sessionType)}
                  <div>
                    <CardTitle className="text-xl">{activeSession.sessionName}</CardTitle>
                    <CardDescription>
                      {isBreakTime ? "Break Time" : "Focus Time"} • 
                      Cycle {activeSession.cyclesCompleted + 1} of {activeSession.totalCycles}
                    </CardDescription>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-3xl font-mono font-bold ${isBreakTime ? 'text-blue-600' : 'text-green-600'}`}>
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {isBreakTime ? "Break" : "Focus"} • {Math.round((1 - timeRemaining / (isBreakTime ? activeSession.breakDuration : activeSession.duration)) * 100)}%
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    <span className={`font-bold ${getFocusScoreColor(focusScore)}`}>
                      Focus: {focusScore}/100
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span>Distractions: {distractionCount}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (isRunning) {
                        pauseSessionMutation.mutate(activeSession.id);
                      } else {
                        startSessionMutation.mutate(activeSession.id);
                      }
                    }}
                    variant={isRunning ? "outline" : "default"}
                    size="sm"
                  >
                    {isRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                    {isRunning ? "Pause" : "Resume"}
                  </Button>
                  
                  <Button
                    onClick={() => completeSessionMutation.mutate({
                      sessionId: activeSession.id,
                      focusScore,
                      distractionCount
                    })}
                    variant="outline"
                    size="sm"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    End Session
                  </Button>
                </div>
              </div>
              
              {/* Focus Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Focus Score</span>
                  <span className={getFocusScoreColor(focusScore)}>{focusScore}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      focusScore >= 80 ? 'bg-green-500' : 
                      focusScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${focusScore}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Allowed Actions */}
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Available Actions:</p>
                <div className="flex gap-2">
                  {activeSession.allowedActions.quiz && (
                    <Badge variant="outline" className="text-green-600">Quiz</Badge>
                  )}
                  {activeSession.allowedActions.notes && (
                    <Badge variant="outline" className="text-green-600">Notes</Badge>
                  )}
                  {activeSession.allowedActions.calculator && (
                    <Badge variant="outline" className="text-green-600">Calculator</Badge>
                  )}
                  {activeSession.allowedActions.wiki && (
                    <Badge variant="outline" className="text-green-600">Wiki</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Blocked Attempts */}
          {blockedAttempts.length > 0 && (
            <Card className="mt-4 border-red-200">
              <CardHeader>
                <CardTitle className="text-lg text-red-600 flex items-center gap-2">
                  <EyeOff className="w-5 h-5" />
                  Blocked Distractions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {blockedAttempts.slice(-5).map((attempt, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
                      <span className="text-sm">{attempt}</span>
                      <span className="text-xs text-gray-500">
                        {new Date().toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Focus History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Focus Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {focusHistory?.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No focus sessions yet</p>
              <p className="text-sm text-gray-500">Start your first session to track your focus progress</p>
            </div>
          ) : (
            <div className="space-y-4">
              {focusHistory?.slice(0, 10).map((session: FocusSession) => (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getSessionTypeIcon(session.sessionType)}
                    <div>
                      <h3 className="font-medium">{session.sessionName}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(session.startedAt!).toLocaleDateString()} • 
                        {Math.round((session.completedAt! - session.startedAt!) / 60000)} minutes
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`font-bold ${getFocusScoreColor(session.focusScore)}`}>
                        {session.focusScore}/100
                      </div>
                      <div className="text-xs text-gray-500">
                        {session.distractionCount} distractions
                      </div>
                    </div>
                    
                    {session.isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}