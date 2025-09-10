import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar,
  TrendingUp,
  FileText,
  Fuel,
  DollarSign,
  Users,
  Bot
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from "date-fns";

interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  task_type: string;
  category: string;
  required_fields: any;
  validation_rules: any;
}

interface TaskCompletion {
  id: string;
  task_template_id: string;
  period_start: string;
  period_end: string;
  status: string;
  completion_data: any;
  validation_result: any;
  completed_at: string | null;
  validated_at: string | null;
  task_templates: TaskTemplate;
}

const TaskDashboard = () => {
  const [weeklyTasks, setWeeklyTasks] = useState<TaskCompletion[]>([]);
  const [monthlyTasks, setMonthlyTasks] = useState<TaskCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      
      // Get current periods
      const now = new Date();
      const currentWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 0 }); // Previous week (Sunday start)
      const currentWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });
      const currentMonthStart = startOfMonth(subMonths(now, 1)); // Previous month
      const currentMonthEnd = endOfMonth(subMonths(now, 1));

      // Fetch weekly tasks
      const { data: weeklyData, error: weeklyError } = await supabase
        .from('task_completions')
        .select(`
          *,
          task_templates (*)
        `)
        .eq('task_templates.task_type', 'weekly')
        .gte('period_start', format(currentWeekStart, 'yyyy-MM-dd'))
        .lte('period_end', format(currentWeekEnd, 'yyyy-MM-dd'));

      if (weeklyError) throw weeklyError;

      // Fetch monthly tasks
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('task_completions')
        .select(`
          *,
          task_templates (*)
        `)
        .eq('task_templates.task_type', 'monthly')
        .gte('period_start', format(currentMonthStart, 'yyyy-MM-dd'))
        .lte('period_end', format(currentMonthEnd, 'yyyy-MM-dd'));

      if (monthlyError) throw monthlyError;

      // Create missing task completions if needed
      await createMissingTasks(currentWeekStart, currentWeekEnd, currentMonthStart, currentMonthEnd);
      
      setWeeklyTasks(weeklyData || []);
      setMonthlyTasks(monthlyData || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error loading tasks",
        description: "Could not load task dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createMissingTasks = async (weekStart: Date, weekEnd: Date, monthStart: Date, monthEnd: Date) => {
    try {
      // Get all task templates
      const { data: templates, error } = await supabase
        .from('task_templates')
        .select('*');

      if (error) throw error;

      const insertPromises = [];

      for (const template of templates || []) {
        const periodStart = template.task_type === 'weekly' ? weekStart : monthStart;
        const periodEnd = template.task_type === 'weekly' ? weekEnd : monthEnd;
        
        // Check if completion already exists
        const { data: existing } = await supabase
          .from('task_completions')
          .select('id')
          .eq('task_template_id', template.id)
          .eq('period_start', format(periodStart, 'yyyy-MM-dd'))
          .eq('period_end', format(periodEnd, 'yyyy-MM-dd'))
          .maybeSingle();

        if (!existing) {
          insertPromises.push(
            supabase
              .from('task_completions')
              .insert({
                task_template_id: template.id,
                period_start: format(periodStart, 'yyyy-MM-dd'),
                period_end: format(periodEnd, 'yyyy-MM-dd'),
                status: 'pending'
              })
          );
        }
      }

      await Promise.all(insertPromises);
    } catch (error) {
      console.error('Error creating missing tasks:', error);
    }
  };

  const getTaskIcon = (category: string) => {
    switch (category) {
      case 'payroll': return DollarSign;
      case 'fuel': return Fuel;
      case 'expenses': return FileText;
      default: return Clock;
    }
  };

  const getStatusIcon = (status: string, validationResult?: any) => {
    switch (status) {
      case 'validated':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'completed':
        if (validationResult?.passed === false) {
          return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
        }
        return <CheckCircle2 className="h-5 w-5 text-blue-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-orange-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string, validationResult?: any) => {
    switch (status) {
      case 'validated':
        return <Badge className="bg-green-100 text-green-800">✓ Validated</Badge>;
      case 'completed':
        if (validationResult?.passed === false) {
          return <Badge variant="destructive">⚠ Needs Review</Badge>;
        }
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-orange-100 text-orange-800">In Progress</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const handleTaskAction = async (task: TaskCompletion) => {
    const category = task.task_templates.category;
    
    // Navigate to appropriate page based on category
    switch (category) {
      case 'payroll':
        window.location.href = '/payroll';
        break;
      case 'fuel':
        window.location.href = '/fuel';
        break;
      case 'expenses':
        // Navigate to expenses page when available
        toast({
          title: "Feature Coming Soon",
          description: "Expense management will be available soon",
        });
        break;
      default:
        toast({
          title: "Task Selected",
          description: `Working on ${task.task_templates.name}`,
        });
    }
  };

  const validateTask = async (task: TaskCompletion) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('validate-tasks', {
        body: {
          taskCompletionId: task.id,
          validationType: task.task_templates.category,
          data: task.completion_data
        }
      });

      if (error) throw error;

      toast({
        title: "Validation Complete",
        description: data.passed ? "Task validated successfully!" : "Validation found issues that need attention",
        variant: data.passed ? "default" : "destructive"
      });

      fetchTasks(); // Refresh data
    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: "Validation Failed",
        description: "Could not validate task",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletionRate = (tasks: TaskCompletion[]) => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'completed' || t.status === 'validated').length;
    return Math.round((completed / tasks.length) * 100);
  };

  const weeklyCompletionRate = calculateCompletionRate(weeklyTasks);
  const monthlyCompletionRate = calculateCompletionRate(monthlyTasks);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium">Weekly Tasks</p>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{weeklyTasks.length}</div>
            <Progress value={weeklyCompletionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {weeklyCompletionRate}% complete
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium">Monthly Tasks</p>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{monthlyTasks.length}</div>
            <Progress value={monthlyCompletionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {monthlyCompletionRate}% complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium">AI Validated</p>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {[...weeklyTasks, ...monthlyTasks].filter(t => t.status === 'validated').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium">Needs Attention</p>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {[...weeklyTasks, ...monthlyTasks].filter(t => 
                t.status === 'pending' || (t.validation_result?.passed === false)
              ).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Tasks - Previous Week
          </CardTitle>
          <CardDescription>
            Tasks that need to be completed for the previous work week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {weeklyTasks.map((task) => {
              const IconComponent = getTaskIcon(task.task_templates.category);
              return (
                <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <IconComponent className="h-8 w-8 text-primary" />
                    <div>
                      <h4 className="font-medium">{task.task_templates.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {task.task_templates.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(task.period_start), 'MMM dd')} - {format(new Date(task.period_end), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusIcon(task.status, task.validation_result)}
                    {getStatusBadge(task.status, task.validation_result)}
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleTaskAction(task)}
                        disabled={task.status === 'validated'}
                      >
                        {task.status === 'pending' ? 'Start' : 'Continue'}
                      </Button>
                      {task.status === 'completed' && !task.validation_result && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => validateTask(task)}
                        >
                          <Bot className="h-4 w-4 mr-1" />
                          Validate
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Monthly Tasks - Previous Month
          </CardTitle>
          <CardDescription>
            Tasks that need to be completed for the previous month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyTasks.map((task) => {
              const IconComponent = getTaskIcon(task.task_templates.category);
              return (
                <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <IconComponent className="h-8 w-8 text-primary" />
                    <div>
                      <h4 className="font-medium">{task.task_templates.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {task.task_templates.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(task.period_start), 'MMM dd')} - {format(new Date(task.period_end), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusIcon(task.status, task.validation_result)}
                    {getStatusBadge(task.status, task.validation_result)}
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleTaskAction(task)}
                        disabled={task.status === 'validated'}
                      >
                        {task.status === 'pending' ? 'Start' : 'Continue'}
                      </Button>
                      {task.status === 'completed' && !task.validation_result && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => validateTask(task)}
                        >
                          <Bot className="h-4 w-4 mr-1" />
                          Validate
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskDashboard;