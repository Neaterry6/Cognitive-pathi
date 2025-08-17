import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Plus, BookOpen, Edit3, Bookmark, Clock, Brain, Search, Star, Target, Lightbulb } from "lucide-react";
import type { ShortNote, Subject } from "@shared/schema";

const createNoteSchema = z.object({
  subjectId: z.string().min(1, "Subject is required"),
  topic: z.string().min(1, "Topic is required"),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  keyPoints: z.array(z.string()).default([]),
  formulas: z.array(z.object({
    formula: z.string(),
    description: z.string()
  })).default([]),
  examples: z.array(z.string()).default([]),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  examRelevance: z.number().min(1).max(10).default(5),
  tags: z.array(z.string()).default([])
});

type CreateNoteForm = z.infer<typeof createNoteSchema>;

export default function ShortNotes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [keyPointInput, setKeyPointInput] = useState("");
  const [formulaInput, setFormulaInput] = useState({ formula: "", description: "" });
  const [exampleInput, setExampleInput] = useState("");
  const [tagInput, setTagInput] = useState("");

  const form = useForm<CreateNoteForm>({
    resolver: zodResolver(createNoteSchema),
    defaultValues: {
      subjectId: "",
      topic: "",
      title: "",
      content: "",
      keyPoints: [],
      formulas: [],
      examples: [],
      difficulty: "medium",
      examRelevance: 5,
      tags: []
    }
  });

  // Fetch subjects
  const { data: subjects } = useQuery({
    queryKey: ["/api/subjects"],
    enabled: !!user
  });

  // Fetch short notes
  const { data: notes, isLoading } = useQuery({
    queryKey: ["/api/notes/short", selectedSubject, selectedDifficulty, searchTerm],
    enabled: !!user
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: (data: CreateNoteForm) => apiRequest("/api/notes/short", {
      method: "POST",
      body: JSON.stringify({ ...data, userId: user?.id })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes/short"] });
      setIsCreateDialogOpen(false);
      form.reset();
    }
  });

  // Bookmark note mutation
  const bookmarkMutation = useMutation({
    mutationFn: (noteId: string) => apiRequest(`/api/notes/short/${noteId}/bookmark`, {
      method: "POST"
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes/short"] });
    }
  });

  const filteredNotes = notes?.filter((note: ShortNote) => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === "all" || note.subjectId === selectedSubject;
    const matchesDifficulty = selectedDifficulty === "all" || note.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesSubject && matchesDifficulty;
  }) || [];

  const addKeyPoint = () => {
    if (keyPointInput.trim()) {
      const currentPoints = form.getValues("keyPoints");
      form.setValue("keyPoints", [...currentPoints, keyPointInput.trim()]);
      setKeyPointInput("");
    }
  };

  const addFormula = () => {
    if (formulaInput.formula.trim() && formulaInput.description.trim()) {
      const currentFormulas = form.getValues("formulas");
      form.setValue("formulas", [...currentFormulas, formulaInput]);
      setFormulaInput({ formula: "", description: "" });
    }
  };

  const addExample = () => {
    if (exampleInput.trim()) {
      const currentExamples = form.getValues("examples");
      form.setValue("examples", [...currentExamples, exampleInput.trim()]);
      setExampleInput("");
    }
  };

  const addTag = () => {
    if (tagInput.trim()) {
      const currentTags = form.getValues("tags");
      form.setValue("tags", [...currentTags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "hard": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getRelevanceStars = (relevance: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-3 h-3 ${i < relevance / 2 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
    ));
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to access Short Notes</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen className="text-blue-600" />
              JAMB Short Notes
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Quick revision notes on important topics for exam preparation
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Note
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Short Note</DialogTitle>
                <DialogDescription>
                  Create a concise note for quick revision of important JAMB topics
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => createNoteMutation.mutate(data))} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    
                    <FormField
                      control={form.control}
                      name="topic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Topic</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Quadratic Equations" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Brief descriptive title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Write your note content here..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Key Points */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Key Points</label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="Add a key point..."
                        value={keyPointInput}
                        onChange={(e) => setKeyPointInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyPoint())}
                      />
                      <Button type="button" onClick={addKeyPoint} size="sm">Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {form.watch("keyPoints").map((point, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {point}
                          <button 
                            type="button"
                            onClick={() => {
                              const points = form.getValues("keyPoints");
                              form.setValue("keyPoints", points.filter((_, i) => i !== index));
                            }}
                            className="ml-1 text-red-500"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Formulas */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Formulas</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                      <Input
                        placeholder="Formula (e.g., x = -b ± √(b²-4ac)/2a)"
                        value={formulaInput.formula}
                        onChange={(e) => setFormulaInput(prev => ({ ...prev, formula: e.target.value }))}
                      />
                      <div className="flex gap-2">
                        <Input
                          placeholder="Description"
                          value={formulaInput.description}
                          onChange={(e) => setFormulaInput(prev => ({ ...prev, description: e.target.value }))}
                        />
                        <Button type="button" onClick={addFormula} size="sm">Add</Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {form.watch("formulas").map((formula, index) => (
                        <div key={index} className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded flex justify-between">
                          <span><strong>{formula.formula}</strong> - {formula.description}</span>
                          <button 
                            type="button"
                            onClick={() => {
                              const formulas = form.getValues("formulas");
                              form.setValue("formulas", formulas.filter((_, i) => i !== index));
                            }}
                            className="text-red-500"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="difficulty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Difficulty</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select difficulty" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="examRelevance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exam Relevance (1-10)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              max="10" 
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tags</label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="Add a tag..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      />
                      <Button type="button" onClick={addTag} size="sm">Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {form.watch("tags").map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          #{tag}
                          <button 
                            type="button"
                            onClick={() => {
                              const tags = form.getValues("tags");
                              form.setValue("tags", tags.filter((_, i) => i !== index));
                            }}
                            className="ml-1 text-red-500"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button type="submit" disabled={createNoteMutation.isPending} className="flex-1">
                      {createNoteMutation.isPending ? "Creating..." : "Create Note"}
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

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
          
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects?.map((subject: Subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notes Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No notes found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm || selectedSubject !== "all" || selectedDifficulty !== "all" 
              ? "Try adjusting your filters or search terms"
              : "Create your first short note to get started"}
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Note
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note: ShortNote) => (
            <Card key={note.id} className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-blue-500">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {note.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                      {note.subjectName} • {note.topic}
                    </CardDescription>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => bookmarkMutation.mutate(note.id)}
                    className="flex-shrink-0"
                  >
                    <Bookmark className={`w-4 h-4 ${note.isBookmarked ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                  </Button>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <Badge className={getDifficultyColor(note.difficulty)} variant="secondary">
                    {note.difficulty}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {getRelevanceStars(note.examRelevance)}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Target className="w-3 h-3" />
                    {note.examRelevance}/10
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                  {note.content}
                </div>

                {note.keyPoints && note.keyPoints.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3" />
                      Key Points
                    </h4>
                    <div className="space-y-1">
                      {note.keyPoints.slice(0, 3).map((point, index) => (
                        <div key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1">
                          <span className="text-blue-500 font-bold">•</span>
                          {point}
                        </div>
                      ))}
                      {note.keyPoints.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{note.keyPoints.length - 3} more points
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {note.formulas && note.formulas.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-900 dark:text-white mb-2">Formulas</h4>
                    <div className="space-y-1">
                      {note.formulas.slice(0, 2).map((formula, index) => (
                        <div key={index} className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded">
                          <div className="font-mono text-blue-600 dark:text-blue-400">{formula.formula}</div>
                          <div className="text-gray-600 dark:text-gray-400 mt-1">{formula.description}</div>
                        </div>
                      ))}
                      {note.formulas.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{note.formulas.length - 2} more formulas
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {note.tags.slice(0, 4).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                    {note.tags.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{note.tags.length - 4}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {note.lastReviewed ? 
                      `Reviewed ${new Date(note.lastReviewed).toLocaleDateString()}` :
                      "Never reviewed"
                    }
                  </div>
                  <div className="flex items-center gap-1">
                    <Edit3 className="w-3 h-3" />
                    {note.reviewCount} reviews
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}